/**
 * Motor de Conciliação de Comissões Bancárias
 * Algoritmo de Matching Inteligente
 * 
 * @module services/conciliacao/matcher
 * @description Responsável por encontrar correspondências entre contratos e pagamentos
 */

import type { 
  ContratoInterno, 
  PagamentoBanco, 
  ResultadoMatching 
} from "@/types/conciliacao";
import { normalizarCPF, arredondarValor, dentroJanelaDias } from "./normalizador";

// ============================================================================
// CONFIGURAÇÃO DE MATCHING
// ============================================================================

interface ConfiguracaoMatching {
  /** Tolerância para diferença de valores (em R$) */
  toleranciaValor: number;
  
  /** Janela de dias para considerar datas próximas */
  janelaDias: number;
}

const CONFIG_PADRAO: ConfiguracaoMatching = {
  toleranciaValor: 1.0, // R$ 1,00
  janelaDias: 15, // 15 dias
};

// ============================================================================
// ESTRATÉGIAS DE MATCHING
// ============================================================================

/**
 * Estratégia 1: Match por CPF + Número do Contrato
 * Prioridade: ALTA (mais confiável)
 * 
 * @param contrato - Contrato interno
 * @param pagamentos - Lista de pagamentos disponíveis
 * @returns Pagamento correspondente ou null
 */
function matchPorCPFEContrato(
  contrato: ContratoInterno,
  pagamentos: PagamentoBanco[]
): ResultadoMatching | null {
  const cpfNormalizado = normalizarCPF(contrato.cpf);
  const contratoNormalizado = contrato.numeroContratoBanco.trim().toUpperCase();
  
  const pagamento = pagamentos.find(p => {
    const cpfPagamento = normalizarCPF(p.cpf);
    const contratoPagamento = p.numeroContratoBanco.trim().toUpperCase();
    
    return cpfPagamento === cpfNormalizado && contratoPagamento === contratoNormalizado;
  });
  
  if (pagamento) {
    return {
      contrato,
      pagamento,
      confianca: 95,
      metodoMatch: "CPF_CONTRATO",
      detalhesMatch: "Match exato por CPF e número do contrato",
    };
  }
  
  return null;
}

/**
 * Estratégia 2: Match por CPF + Valor + Janela de Datas
 * Prioridade: MÉDIA
 * 
 * @param contrato - Contrato interno
 * @param pagamentos - Lista de pagamentos disponíveis
 * @param config - Configuração de matching
 * @returns Pagamento correspondente ou null
 */
function matchPorCPFValorData(
  contrato: ContratoInterno,
  pagamentos: PagamentoBanco[],
  config: ConfiguracaoMatching
): ResultadoMatching | null {
  const cpfNormalizado = normalizarCPF(contrato.cpf);
  
  const candidatos = pagamentos.filter(p => {
    const cpfPagamento = normalizarCPF(p.cpf);
    
    // Verifica CPF
    if (cpfPagamento !== cpfNormalizado) return false;
    
    // Verifica valor com tolerância
    const diferencaValor = Math.abs(p.valorPago - contrato.valorComissaoEsperada);
    if (diferencaValor > config.toleranciaValor) return false;
    
    // Verifica data dentro da janela
    if (!dentroJanelaDias(p.dataPagamento, contrato.dataPrevistaPagamento, config.janelaDias)) {
      return false;
    }
    
    return true;
  });
  
  if (candidatos.length === 1) {
    const pagamento = candidatos[0];
    const diferencaValor = Math.abs(pagamento.valorPago - contrato.valorComissaoEsperada);
    
    // Calcula confiança baseada na precisão do valor
    const confianca = Math.max(60, 85 - Math.floor(diferencaValor * 10));
    
    return {
      contrato,
      pagamento,
      confianca,
      metodoMatch: "CPF_VALOR_DATA",
      detalhesMatch: `Match por CPF, valor (±R$ ${diferencaValor.toFixed(2)}) e data próxima`,
    };
  }
  
  if (candidatos.length > 1) {
    // Múltiplos candidatos - escolhe o mais próximo em valor
    const melhorCandidato = candidatos.reduce((melhor, atual) => {
      const diffAtual = Math.abs(atual.valorPago - contrato.valorComissaoEsperada);
      const diffMelhor = Math.abs(melhor.valorPago - contrato.valorComissaoEsperada);
      return diffAtual < diffMelhor ? atual : melhor;
    });
    
    const diferencaValor = Math.abs(melhorCandidato.valorPago - contrato.valorComissaoEsperada);
    
    return {
      contrato,
      pagamento: melhorCandidato,
      confianca: 70,
      metodoMatch: "CPF_VALOR_DATA",
      detalhesMatch: `Match por CPF, valor (±R$ ${diferencaValor.toFixed(2)}) e data próxima (múltiplos candidatos)`,
    };
  }
  
  return null;
}

/**
 * Estratégia 3: Match por CPF + Produto + Banco (Fallback)
 * Prioridade: BAIXA (menos confiável)
 * 
 * @param contrato - Contrato interno
 * @param pagamentos - Lista de pagamentos disponíveis
 * @returns Pagamento correspondente ou null
 */
function matchPorCPFProdutoBanco(
  contrato: ContratoInterno,
  pagamentos: PagamentoBanco[]
): ResultadoMatching | null {
  const cpfNormalizado = normalizarCPF(contrato.cpf);
  const bancoNormalizado = contrato.banco.trim().toUpperCase();
  const produtoNormalizado = contrato.produto.trim().toUpperCase();
  
  const candidatos = pagamentos.filter(p => {
    const cpfPagamento = normalizarCPF(p.cpf);
    const bancoPagamento = p.banco.trim().toUpperCase();
    const produtoPagamento = p.produto.trim().toUpperCase();
    
    return (
      cpfPagamento === cpfNormalizado &&
      bancoPagamento === bancoNormalizado &&
      produtoPagamento.includes(produtoNormalizado)
    );
  });
  
  if (candidatos.length === 1) {
    const pagamento = candidatos[0];
    const diferencaValor = Math.abs(pagamento.valorPago - contrato.valorComissaoEsperada);
    
    // Confiança baixa por ser fallback
    const confianca = Math.min(55, 60 - Math.floor(diferencaValor / 100));
    
    return {
      contrato,
      pagamento,
      confianca,
      metodoMatch: "CPF_PRODUTO_BANCO",
      detalhesMatch: "Match por CPF, produto e banco (fallback - verificar manualmente)",
    };
  }
  
  return null;
}

// ============================================================================
// MOTOR DE MATCHING PRINCIPAL
// ============================================================================

/**
 * Encontra correspondência para um contrato usando estratégias em ordem de prioridade
 * 
 * @param contrato - Contrato interno
 * @param pagamentos - Lista de pagamentos disponíveis
 * @param config - Configuração de matching
 * @returns Resultado do matching
 */
export function encontrarCorrespondencia(
  contrato: ContratoInterno,
  pagamentos: PagamentoBanco[],
  config: ConfiguracaoMatching = CONFIG_PADRAO
): ResultadoMatching {
  // Estratégia 1: CPF + Contrato (mais confiável)
  let resultado = matchPorCPFEContrato(contrato, pagamentos);
  if (resultado) return resultado;
  
  // Estratégia 2: CPF + Valor + Data (média confiabilidade)
  resultado = matchPorCPFValorData(contrato, pagamentos, config);
  if (resultado) return resultado;
  
  // Estratégia 3: CPF + Produto + Banco (fallback)
  resultado = matchPorCPFProdutoBanco(contrato, pagamentos);
  if (resultado) return resultado;
  
  // Nenhuma correspondência encontrada
  return {
    contrato,
    pagamento: null,
    confianca: 0,
    metodoMatch: "NAO_ENCONTRADO",
    detalhesMatch: "Nenhuma correspondência encontrada nos dados do banco",
  };
}

/**
 * Processa matching em lote para múltiplos contratos
 * 
 * @param contratos - Lista de contratos internos
 * @param pagamentos - Lista de pagamentos do banco
 * @param config - Configuração de matching
 * @returns Array de resultados de matching
 */
export function processarMatchingLote(
  contratos: ContratoInterno[],
  pagamentos: PagamentoBanco[],
  config: ConfiguracaoMatching = CONFIG_PADRAO
): ResultadoMatching[] {
  const resultados: ResultadoMatching[] = [];
  const pagamentosUsados = new Set<string>();
  
  // Primeiro passa: matches de alta confiança (CPF + Contrato)
  contratos.forEach(contrato => {
    const resultado = matchPorCPFEContrato(contrato, pagamentos);
    
    if (resultado && resultado.pagamento) {
      const key = gerarChavePagamento(resultado.pagamento);
      if (!pagamentosUsados.has(key)) {
        resultados.push(resultado);
        pagamentosUsados.add(key);
      }
    }
  });
  
  // Segunda passa: contratos não matchados - tenta outras estratégias
  const contratosNaoMatchados = contratos.filter(
    c => !resultados.find(r => r.contrato.idContrato === c.idContrato)
  );
  
  const pagamentosDisponiveis = pagamentos.filter(
    p => !pagamentosUsados.has(gerarChavePagamento(p))
  );
  
  contratosNaoMatchados.forEach(contrato => {
    const resultado = encontrarCorrespondencia(contrato, pagamentosDisponiveis, config);
    resultados.push(resultado);
    
    if (resultado.pagamento) {
      const key = gerarChavePagamento(resultado.pagamento);
      pagamentosUsados.add(key);
    }
  });
  
  return resultados;
}

/**
 * Identifica pagamentos sem contrato correspondente
 * 
 * @param pagamentos - Lista de pagamentos do banco
 * @param matchings - Resultados de matching já processados
 * @returns Pagamentos órfãos
 */
export function identificarPagamentosOrfaos(
  pagamentos: PagamentoBanco[],
  matchings: ResultadoMatching[]
): PagamentoBanco[] {
  const pagamentosMatchados = new Set(
    matchings
      .filter(m => m.pagamento !== null)
      .map(m => gerarChavePagamento(m.pagamento!))
  );
  
  return pagamentos.filter(p => !pagamentosMatchados.has(gerarChavePagamento(p)));
}

/**
 * Detecta duplicidades de pagamento
 * 
 * @param matchings - Resultados de matching
 * @returns Array de grupos de contratos com mesmo pagamento
 */
export function detectarDuplicidades(
  matchings: ResultadoMatching[]
): Array<{ pagamento: PagamentoBanco; contratos: ContratoInterno[] }> {
  const pagamentoPorKey = new Map<string, ContratoInterno[]>();
  
  matchings.forEach(m => {
    if (m.pagamento) {
      const key = gerarChavePagamento(m.pagamento);
      const contratos = pagamentoPorKey.get(key) || [];
      contratos.push(m.contrato);
      pagamentoPorKey.set(key, contratos);
    }
  });
  
  const duplicidades: Array<{ pagamento: PagamentoBanco; contratos: ContratoInterno[] }> = [];
  
  matchings.forEach(m => {
    if (m.pagamento) {
      const key = gerarChavePagamento(m.pagamento);
      const contratos = pagamentoPorKey.get(key) || [];
      
      if (contratos.length > 1) {
        // Verifica se já foi adicionado
        const jaAdicionado = duplicidades.find(
          d => gerarChavePagamento(d.pagamento) === key
        );
        
        if (!jaAdicionado) {
          duplicidades.push({
            pagamento: m.pagamento,
            contratos,
          });
        }
      }
    }
  });
  
  return duplicidades;
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Gera chave única para um pagamento
 * 
 * @param pagamento - Pagamento do banco
 * @returns Chave única
 */
function gerarChavePagamento(pagamento: PagamentoBanco): string {
  return `${normalizarCPF(pagamento.cpf)}_${pagamento.numeroContratoBanco.trim().toUpperCase()}_${arredondarValor(pagamento.valorPago)}`;
}

/**
 * Calcula estatísticas de matching
 * 
 * @param matchings - Resultados de matching
 * @returns Estatísticas
 */
export function calcularEstatisticasMatching(matchings: ResultadoMatching[]): {
  total: number;
  matchados: number;
  naoMatchados: number;
  altaConfianca: number;
  mediaConfianca: number;
  baixaConfianca: number;
  taxaSucesso: number;
} {
  const total = matchings.length;
  const matchados = matchings.filter(m => m.pagamento !== null).length;
  const naoMatchados = total - matchados;
  
  const altaConfianca = matchings.filter(m => m.confianca >= 80).length;
  const mediaConfianca = matchings.filter(m => m.confianca >= 60 && m.confianca < 80).length;
  const baixaConfianca = matchings.filter(m => m.confianca > 0 && m.confianca < 60).length;
  
  const taxaSucesso = total > 0 ? (matchados / total) * 100 : 0;
  
  return {
    total,
    matchados,
    naoMatchados,
    altaConfianca,
    mediaConfianca,
    baixaConfianca,
    taxaSucesso,
  };
}
