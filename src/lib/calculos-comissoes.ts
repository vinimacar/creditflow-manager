import type { Venda, Produto } from "./firestore";

/**
 * FONTE ÚNICA DE VERDADE PARA CÁLCULO DE COMISSÕES
 * 
 * Este arquivo centraliza toda a lógica de cálculo de comissões para garantir
 * consistência entre Dashboard, Relatórios e Conciliação.
 * 
 * NOMENCLATURA:
 * - comissaoAgente = Comissão do Funcionário (paga pela empresa ao vendedor)
 * - comissaoFornecedor = Comissão da Empresa (recebida do fornecedor)
 */

export interface ComissoesCalculadas {
  comissaoAgente: number;              // Valor pago ao funcionário/vendedor
  comissaoAgentePercentual: number;    // % pago ao funcionário/vendedor
  comissaoFornecedor: number;          // Valor recebido pela empresa do fornecedor
  comissaoFornecedorPercentual: number; // % recebido pela empresa do fornecedor
}

/**
 * Calcula as comissões do funcionário e da empresa de forma unificada
 * 
 * REGRA: Sempre priorizar valores salvos na venda (são os valores reais negociados)
 * Se não houver valores salvos, calcular baseado no produto
 * 
 * OTIMIZAÇÃO: Se a comissão no produto for 0, retorna 0 direto (não calcula)
 * 
 * NOMENCLATURA:
 * - comissaoAgente = Comissão do Funcionário (pode ser 0 para salário fixo)
 * - comissaoFornecedor = Comissão da Empresa (recebida do fornecedor)
 * 
 * @param venda - Dados da venda (parcial para compatibilidade)
 * @param produto - Dados do produto (opcional, usado apenas se a venda não tiver comissões salvas)
 * @returns Objeto com todas as comissões calculadas
 */
export function calcularComissoes(venda: Partial<Venda> & { valorContrato: number }, produto?: Produto): ComissoesCalculadas {
  const valorContrato = venda.valorContrato || 0;

  // ==========================================
  // COMISSÃO DO FUNCIONÁRIO (Paga pela Empresa)
  // ==========================================
  let comissaoAgente = 0;
  let comissaoAgentePercentual = 0;

  // 1. Prioridade: comissão salva na venda (valor em R$)
  if (venda.comissaoAgente !== undefined && venda.comissaoAgente !== null) {
    comissaoAgente = venda.comissaoAgente;
    comissaoAgentePercentual = valorContrato > 0 ? (comissaoAgente / valorContrato) * 100 : 0;
  }
  // 2. Segunda prioridade: percentual salvo na venda
  else if (venda.comissaoAgentePercentual !== undefined && venda.comissaoAgentePercentual !== null) {
    comissaoAgentePercentual = venda.comissaoAgentePercentual;
    comissaoAgente = valorContrato * (comissaoAgentePercentual / 100);
  }
  // 3. Terceira prioridade: campos legacy (comissao/comissaoPercentual)
  else if (venda.comissao !== undefined && venda.comissao !== null) {
    comissaoAgente = venda.comissao;
    comissaoAgentePercentual = valorContrato > 0 ? (comissaoAgente / valorContrato) * 100 : 0;
  }
  else if (venda.comissaoPercentual !== undefined && venda.comissaoPercentual !== null) {
    comissaoAgentePercentual = venda.comissaoPercentual;
    comissaoAgente = valorContrato * (comissaoAgentePercentual / 100);
  }
  // 4. Última opção: calcular do produto (se disponível)
  else if (produto) {
    // Verificar se produto tem tabela de faixas
    if (produto.comissoes && produto.comissoes.length > 0) {
      const faixaAplicavel = produto.comissoes.find(
        faixa => valorContrato >= faixa.valorMin && valorContrato <= faixa.valorMax
      );
      
      if (faixaAplicavel) {
        comissaoAgentePercentual = faixaAplicavel.percentual;
      } else {
        // Se não encontrou faixa, usar a última (valor máximo)
        const ultimaFaixa = produto.comissoes[produto.comissoes.length - 1];
        comissaoAgentePercentual = ultimaFaixa.percentual;
      }
    } else {
      // Usar percentual fixo do produto
      comissaoAgentePercentual = produto.comissaoAgente || produto.comissao || 0;
    }
    
    // Otimização: Se comissão for 0, não calcular
    if (comissaoAgentePercentual > 0) {
      comissaoAgente = valorContrato * (comissaoAgentePercentual / 100);
    }
  }

  // ==========================================
  // COMISSÃO DA EMPRESA (Recebida do Fornecedor)
  // ==========================================
  let comissaoFornecedor = 0;
  let comissaoFornecedorPercentual = 0;

  // 1. Prioridade: comissão salva na venda (valor em R$)
  if (venda.comissaoFornecedor !== undefined && venda.comissaoFornecedor !== null) {
    comissaoFornecedor = venda.comissaoFornecedor;
    comissaoFornecedorPercentual = valorContrato > 0 ? (comissaoFornecedor / valorContrato) * 100 : 0;
  }
  // 2. Segunda prioridade: percentual salvo na venda
  else if (venda.comissaoFornecedorPercentual !== undefined && venda.comissaoFornecedorPercentual !== null) {
    comissaoFornecedorPercentual = venda.comissaoFornecedorPercentual;
    comissaoFornecedor = valorContrato * (comissaoFornecedorPercentual / 100);
  }
  // 3. Última opção: calcular do produto (se disponível)
  else if (produto && produto.comissaoFornecedor !== undefined && produto.comissaoFornecedor !== null) {
    comissaoFornecedorPercentual = produto.comissaoFornecedor;
    // Otimização: Se comissão for 0, não calcular
    if (comissaoFornecedorPercentual > 0) {
      comissaoFornecedor = valorContrato * (comissaoFornecedorPercentual / 100);
    }
  }

  return {
    comissaoAgente: Math.round(comissaoAgente * 100) / 100, // Arredonda para 2 casas decimais
    comissaoAgentePercentual: Math.round(comissaoAgentePercentual * 100) / 100,
    comissaoFornecedor: Math.round(comissaoFornecedor * 100) / 100,
    comissaoFornecedorPercentual: Math.round(comissaoFornecedorPercentual * 100) / 100,
  };
}

/**
 * Calcula apenas a comissão da empresa (recebida do fornecedor)
 * (atalho para calcularComissoes quando só precisa da comissão da empresa)
 */
export function calcularComissaoFornecedor(venda: Venda, produto?: Produto): number {
  const comissoes = calcularComissoes(venda, produto);
  return comissoes.comissaoFornecedor;
}

/**
 * Calcula apenas a comissão do funcionário (paga pela empresa)
 * (atalho para calcularComissoes quando só precisa da comissão do funcionário)
 */
export function calcularComissaoAgente(venda: Venda, produto?: Produto): number {
  const comissoes = calcularComissoes(venda, produto);
  return comissoes.comissaoAgente;
}

/**
 * Calcula o total de comissões da empresa para um array de vendas
 */
export function calcularTotalComissoesFornecedor(vendas: Venda[], produtos?: Produto[]): number {
  return vendas.reduce((total, venda) => {
    const produto = produtos?.find(p => p.id === venda.produtoId);
    const comissao = calcularComissaoFornecedor(venda, produto);
    return total + comissao;
  }, 0);
}

/**
 * Calcula o total de comissões dos funcionários para um array de vendas
 */
export function calcularTotalComissoesAgente(vendas: Venda[], produtos?: Produto[]): number {
  return vendas.reduce((total, venda) => {
    const produto = produtos?.find(p => p.id === venda.produtoId);
    const comissao = calcularComissaoAgente(venda, produto);
    return total + comissao;
  }, 0);
}
