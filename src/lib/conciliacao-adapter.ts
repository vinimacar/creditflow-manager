/**
 * Adaptador para integrar o Motor de Conciliação com a interface existente
 * @module lib/conciliacao-adapter
 */

import type { DadosExcel } from "@/components/conciliacao/ImportarExcel";
import type { Divergencia as DivergenciaLegacy } from "@/lib/conciliacao";
import type {
  ContratoInterno,
  PagamentoBanco,
  ContratoConciliado,
  StatusConciliacao,
  RelatorioConciliacao,
  ProdutoBancario,
} from "@/types/conciliacao";
import { processarConciliacao } from "@/services/conciliacao";

// ============================================================================
// ADAPTADORES DE DADOS
// ============================================================================

/**
 * Converte DadosExcel (formato antigo) para ContratoInterno (novo motor)
 */
export function converterParaContratoInterno(dado: DadosExcel): Partial<ContratoInterno> {
  return {
    idContrato: dado.contrato,
    cpf: dado.cpfCliente || "",
    cliente: dado.cliente,
    banco: dado.fornecedor, // Fornecedor = Banco
    produto: mapearProduto(dado.produto),
    numeroContratoBanco: dado.contrato,
    valorLiberado: dado.valorProduto,
    percentualComissao: calcularPercentual(dado.valorComissao, dado.valorProduto),
    valorComissaoEsperada: dado.valorComissao,
    dataPrevistaPagamento: dado.dataPagamento || dado.dataVenda,
    dataCriacao: dado.dataVenda,
    observacoes: dado.observacoes,
  };
}

/**
 * Converte DadosExcel (formato antigo) para PagamentoBanco (novo motor)
 */
export function converterParaPagamentoBanco(dado: DadosExcel): Partial<PagamentoBanco> {
  return {
    cpf: dado.cpfCliente || "",
    numeroContratoBanco: dado.contrato,
    produto: dado.produto,
    valorPago: dado.valorComissao,
    dataPagamento: dado.dataPagamento || dado.dataVenda,
    banco: dado.fornecedor,
  };
}

/**
 * Converte ContratoConciliado (novo motor) para Divergencia (formato antigo)
 */
export function converterParaDivergenciaLegacy(
  conciliado: ContratoConciliado
): DivergenciaLegacy {
  const { contratoInterno, pagamentoBanco, status, divergencias } = conciliado;
  
  return {
    id: conciliado.id,
    contratoInterno: contratoInterno.idContrato,
    contratoFornecedor: pagamentoBanco?.numeroContratoBanco || "",
    cliente: contratoInterno.cliente,
    fornecedor: contratoInterno.banco,
    funcionario: "", // Não disponível no novo formato
    valorComissaoInterno: conciliado.valorEsperado,
    valorComissaoFornecedor: conciliado.valorPago,
    valorProdutoInterno: contratoInterno.valorLiberado,
    valorProdutoFornecedor: contratoInterno.valorLiberado,
    dataVenda: contratoInterno.dataCriacao || contratoInterno.dataPrevistaPagamento,
    status: mapearStatusLegacy(status),
    tiposDivergencia: divergencias.map(d => d.descricao),
    diferencaComissao: Math.abs(conciliado.diferencaFinanceira),
    diferencaProduto: 0,
    validacaoInteligente: {
      taxaAplicadaInterno: contratoInterno.percentualComissao,
      taxaAplicadaFornecedor: pagamentoBanco 
        ? (conciliado.valorPago / contratoInterno.valorLiberado) * 100 
        : 0,
      taxaDivergente: divergencias.some(d => d.tipo === "DIVERGENCIA_PERCENTUAL"),
      valorPagoCorreto: status === "PAGO_CORRETAMENTE",
      observacoes: conciliado.observacoesAutomaticas,
    },
  };
}

// ============================================================================
// FUNÇÃO PRINCIPAL DE CONCILIAÇÃO
// ============================================================================

/**
 * Processa conciliação usando o novo motor e retorna no formato antigo
 * @param dadosInternos - Dados internos no formato DadosExcel
 * @param dadosFornecedor - Dados do fornecedor no formato DadosExcel
 * @returns Array de divergências no formato antigo
 */
export async function processarConciliacaoComNovoMotor(
  dadosInternos: DadosExcel[],
  dadosFornecedor: DadosExcel[]
): Promise<{
  divergencias: DivergenciaLegacy[];
  relatorio: RelatorioConciliacao | null;
  logs: string[];
}> {
  // Converter dados para o novo formato
  const contratos = dadosInternos.map(converterParaContratoInterno);
  const pagamentos = dadosFornecedor.map(converterParaPagamentoBanco);
  
  // Processar com o novo motor
  const resultado = await processarConciliacao(contratos, pagamentos);
  
  if (!resultado.sucesso || !resultado.relatorio) {
    return {
      divergencias: [],
      relatorio: null,
      logs: resultado.logs,
    };
  }
  
  // Converter resultados para o formato antigo
  const divergencias = resultado.relatorio.contratosConciliados.map(
    converterParaDivergenciaLegacy
  );
  
  return {
    divergencias,
    relatorio: resultado.relatorio,
    logs: resultado.logs,
  };
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Mapeia nome do produto para o enum ProdutoBancario
 */
function mapearProduto(produto: string): ProdutoBancario {
  const produtoUpper = produto.toUpperCase();
  
  if (produtoUpper.includes("CONSIGNADO")) return "CONSIGNADO";
  if (produtoUpper.includes("PORTABILIDADE") || produtoUpper.includes("PORT")) return "PORTABILIDADE";
  if (produtoUpper.includes("REFIN") || produtoUpper.includes("REFINANCIAMENTO")) return "REFIN";
  if (produtoUpper.includes("CARTAO") || produtoUpper.includes("CARTÃO")) return "CARTAO";
  if (produtoUpper.includes("PESSOAL")) return "PESSOAL";
  
  return produto as ProdutoBancario;
}

/**
 * Calcula percentual de comissão
 */
function calcularPercentual(comissao: number, valorProduto: number): number {
  if (valorProduto <= 0) return 0;
  return (comissao / valorProduto) * 100;
}

/**
 * Mapeia status novo para status antigo
 */
function mapearStatusLegacy(status: StatusConciliacao): DivergenciaLegacy["status"] {
  switch (status) {
    case "PAGO_CORRETAMENTE":
    case "PAGO_FORA_DO_PERIODO":
      return "ok";
    case "PAGO_COM_DIVERGENCIA_VALOR":
    case "DUPLICIDADE_DE_PAGAMENTO":
      return "divergente";
    case "NAO_PAGO":
      return "nao_encontrado_fornecedor";
    case "DADOS_INCONSISTENTES":
      return "divergente";
    default:
      return "divergente";
  }
}

// ============================================================================
// ESTATÍSTICAS
// ============================================================================

/**
 * Calcula estatísticas no formato antigo a partir do relatório novo
 */
export function calcularEstatisticasLegacy(relatorio: RelatorioConciliacao) {
  return {
    total: relatorio.totalContratos,
    conciliados: relatorio.estatisticas.pagoCorretamente,
    divergentes: relatorio.estatisticas.pagoComDivergencia + relatorio.estatisticas.duplicidades,
    naoEncontrados: relatorio.estatisticas.naoPagos + relatorio.estatisticas.dadosInconsistentes,
    percentualConciliado: relatorio.estatisticas.percentualAcuracia,
    totalDiferencaComissao: Math.abs(relatorio.financeiro.diferencaTotal),
    totalDiferencaProduto: 0,
    totalComissaoInterno: relatorio.financeiro.totalEsperado,
    totalComissaoFornecedor: relatorio.financeiro.totalPago,
    diferencaTotalComissao: relatorio.financeiro.diferencaTotal,
    totalDivergencias: relatorio.estatisticas.pagoComDivergencia,
    totalDiferencas: Math.abs(relatorio.financeiro.diferencaTotal),
    totalContratos: relatorio.totalContratos,
  };
}

// ============================================================================
// EXPORTAÇÃO PARA ANÁLISE AVANÇADA
// ============================================================================

/**
 * Extrai insights avançados do relatório
 */
export function extrairInsights(relatorio: RelatorioConciliacao) {
  return {
    // Contratos críticos (não pagos ou com divergência alta)
    contratosCriticos: relatorio.contratosConciliados.filter(
      c => c.status === "NAO_PAGO" || 
           c.divergencias.some(d => d.severidade === "CRITICA")
    ),
    
    // Valor total a recuperar
    valorRecuperavel: relatorio.contratosConciliados
      .filter(c => c.diferencaFinanceira > 0)
      .reduce((sum, c) => sum + c.diferencaFinanceira, 0),
    
    // Bancos com mais problemas
    bancosProblematicos: Array.from(relatorio.financeiro.porBanco.entries())
      .filter(([_, valores]) => valores.diferenca > 100 || valores.diferenca < -100)
      .map(([banco, valores]) => ({
        banco,
        diferenca: valores.diferenca,
        percentual: ((valores.diferenca / valores.totalEsperado) * 100).toFixed(1),
      }))
      .sort((a, b) => Math.abs(b.diferenca) - Math.abs(a.diferenca)),
    
    // Taxa de sucesso por banco
    sucessoPorBanco: calcularSucessoPorBanco(relatorio),
    
    // Recomendações priorizadas
    recomendacoesPriorizadas: priorizarRecomendacoes(relatorio.recomendacoes),
  };
}

function calcularSucessoPorBanco(relatorio: RelatorioConciliacao) {
  const porBanco = new Map<string, { total: number; sucesso: number }>();
  
  relatorio.contratosConciliados.forEach(c => {
    const banco = c.contratoInterno.banco;
    const dados = porBanco.get(banco) || { total: 0, sucesso: 0 };
    
    dados.total++;
    if (c.status === "PAGO_CORRETAMENTE") {
      dados.sucesso++;
    }
    
    porBanco.set(banco, dados);
  });
  
  return Array.from(porBanco.entries())
    .map(([banco, dados]) => ({
      banco,
      taxaSucesso: (dados.sucesso / dados.total) * 100,
      total: dados.total,
      sucesso: dados.sucesso,
    }))
    .sort((a, b) => b.taxaSucesso - a.taxaSucesso);
}

function priorizarRecomendacoes(recomendacoes: string[]) {
  const prioridades = {
    "🚨": 1,  // Crítico
    "💰": 2,  // Financeiro
    "⚠️": 3,  // Atenção
    "📊": 4,  // Informativo
    "✅": 5,  // Positivo
  };
  
  return recomendacoes.sort((a, b) => {
    const prioA = Object.entries(prioridades).find(([emoji]) => a.startsWith(emoji))?.[1] || 99;
    const prioB = Object.entries(prioridades).find(([emoji]) => b.startsWith(emoji))?.[1] || 99;
    return prioA - prioB;
  });
}
