/**
 * Motor de Conciliação de Comissões Bancárias
 * Calculadora Financeira
 * 
 * @module services/conciliacao/calculadora
 * @description Responsável por cálculos financeiros e estatísticas
 */

import type {
  ContratoConciliado,
  ProdutoBancario,
  RelatorioConciliacao,
} from "@/types/conciliacao";
import { arredondarValor } from "./normalizador";

// ============================================================================
// TOTALIZADORES GERAIS
// ============================================================================

/**
 * Calcula estatísticas gerais de conciliação
 * 
 * @param contratos - Lista de contratos conciliados
 * @returns Estatísticas gerais
 */
export function calcularEstatisticasGerais(contratos: ContratoConciliado[]): RelatorioConciliacao["estatisticas"] {
  const total = contratos.length;
  
  const pagoCorretamente = contratos.filter(c => c.status === "PAGO_CORRETAMENTE").length;
  const pagoComDivergencia = contratos.filter(c => c.status === "PAGO_COM_DIVERGENCIA_VALOR").length;
  const pagoForaPeriodo = contratos.filter(c => c.status === "PAGO_FORA_DO_PERIODO").length;
  const naoPagos = contratos.filter(c => c.status === "NAO_PAGO").length;
  const dadosInconsistentes = contratos.filter(c => c.status === "DADOS_INCONSISTENTES").length;
  const duplicidades = contratos.filter(c => c.status === "DUPLICIDADE_DE_PAGAMENTO").length;
  
  // Percentual de acurácia = (pagos corretamente / total) * 100
  const percentualAcuracia = total > 0 
    ? arredondarValor((pagoCorretamente / total) * 100)
    : 0;
  
  return {
    pagoCorretamente,
    pagoComDivergencia,
    pagoForaPeriodo,
    naoPagos,
    dadosInconsistentes,
    duplicidades,
    percentualAcuracia,
  };
}

// ============================================================================
// TOTALIZADORES FINANCEIROS
// ============================================================================

/**
 * Calcula totalizadores financeiros
 * 
 * @param contratos - Lista de contratos conciliados
 * @returns Totalizadores financeiros
 */
export function calcularTotalizadoresFinanceiros(
  contratos: ContratoConciliado[]
): RelatorioConciliacao["financeiro"] {
  const totalEsperado = contratos.reduce((sum, c) => sum + c.valorEsperado, 0);
  const totalPago = contratos.reduce((sum, c) => sum + c.valorPago, 0);
  const diferencaTotal = arredondarValor(totalEsperado - totalPago);
  
  // Agregar por banco
  const porBanco = new Map<string, { totalEsperado: number; totalPago: number; diferenca: number }>();
  
  contratos.forEach(contrato => {
    const banco = contrato.contratoInterno.banco;
    const atual = porBanco.get(banco) || { totalEsperado: 0, totalPago: 0, diferenca: 0 };
    
    atual.totalEsperado = arredondarValor(atual.totalEsperado + contrato.valorEsperado);
    atual.totalPago = arredondarValor(atual.totalPago + contrato.valorPago);
    atual.diferenca = arredondarValor(atual.totalEsperado - atual.totalPago);
    
    porBanco.set(banco, atual);
  });
  
  // Agregar por produto
  const porProduto = new Map<ProdutoBancario, { totalEsperado: number; totalPago: number; diferenca: number }>();
  
  contratos.forEach(contrato => {
    const produto = contrato.contratoInterno.produto;
    const atual = porProduto.get(produto) || { totalEsperado: 0, totalPago: 0, diferenca: 0 };
    
    atual.totalEsperado = arredondarValor(atual.totalEsperado + contrato.valorEsperado);
    atual.totalPago = arredondarValor(atual.totalPago + contrato.valorPago);
    atual.diferenca = arredondarValor(atual.totalEsperado - atual.totalPago);
    
    porProduto.set(produto, atual);
  });
  
  return {
    totalEsperado: arredondarValor(totalEsperado),
    totalPago: arredondarValor(totalPago),
    diferencaTotal,
    porBanco,
    porProduto,
  };
}

// ============================================================================
// ANÁLISE DE DIVERGÊNCIAS
// ============================================================================

/**
 * Analisa divergências por severidade
 * 
 * @param contratos - Lista de contratos conciliados
 * @returns Análise de divergências
 */
export function analisarDivergencias(contratos: ContratoConciliado[]): {
  totalDivergencias: number;
  criticas: number;
  altas: number;
  medias: number;
  baixas: number;
  valorTotalDivergencias: number;
  valorRecuperavel: number;
} {
  let totalDivergencias = 0;
  let criticas = 0;
  let altas = 0;
  let medias = 0;
  let baixas = 0;
  let valorTotalDivergencias = 0;
  let valorRecuperavel = 0;
  
  contratos.forEach(contrato => {
    totalDivergencias += contrato.divergencias.length;
    
    contrato.divergencias.forEach(div => {
      switch (div.severidade) {
        case "CRITICA":
          criticas++;
          break;
        case "ALTA":
          altas++;
          break;
        case "MEDIA":
          medias++;
          break;
        case "BAIXA":
          baixas++;
          break;
      }
      
      // Soma valores de divergências
      if (div.tipo === "DIVERGENCIA_VALOR") {
        valorTotalDivergencias += Math.abs(div.valorDiferenca);
        
        // Valor recuperável = diferenças a favor da empresa
        if (div.valorDiferenca > 0) {
          valorRecuperavel += div.valorDiferenca;
        }
      }
    });
  });
  
  return {
    totalDivergencias,
    criticas,
    altas,
    medias,
    baixas,
    valorTotalDivergencias: arredondarValor(valorTotalDivergencias),
    valorRecuperavel: arredondarValor(valorRecuperavel),
  };
}

// ============================================================================
// RECOMENDAÇÕES AUTOMÁTICAS
// ============================================================================

/**
 * Gera recomendações automáticas baseadas na análise
 * 
 * @param contratos - Lista de contratos conciliados
 * @param estatisticas - Estatísticas gerais
 * @param financeiro - Totalizadores financeiros
 * @returns Lista de recomendações
 */
export function gerarRecomendacoes(
  contratos: ContratoConciliado[],
  estatisticas: RelatorioConciliacao["estatisticas"],
  financeiro: RelatorioConciliacao["financeiro"]
): string[] {
  const recomendacoes: string[] = [];
  const analise = analisarDivergencias(contratos);
  
  // Recomendações baseadas em taxa de acurácia
  if (estatisticas.percentualAcuracia < 50) {
    recomendacoes.push(
      "🚨 CRÍTICO: Taxa de acurácia muito baixa (" + estatisticas.percentualAcuracia.toFixed(1) + "%). " +
      "Revisar processos de lançamento de contratos e qualidade dos dados."
    );
  } else if (estatisticas.percentualAcuracia < 70) {
    recomendacoes.push(
      "⚠️ ATENÇÃO: Taxa de acurácia abaixo do ideal (" + estatisticas.percentualAcuracia.toFixed(1) + "%). " +
      "Melhorias nos processos podem aumentar a eficiência."
    );
  } else if (estatisticas.percentualAcuracia >= 95) {
    recomendacoes.push(
      "✅ EXCELENTE: Taxa de acurácia muito boa (" + estatisticas.percentualAcuracia.toFixed(1) + "%). " +
      "Processos estão bem alinhados."
    );
  }
  
  // Recomendações sobre contratos não pagos
  if (estatisticas.naoPagos > 0) {
    const percentualNaoPagos = (estatisticas.naoPagos / contratos.length) * 100;
    recomendacoes.push(
      `💰 ${estatisticas.naoPagos} contrato(s) não pago(s) (${percentualNaoPagos.toFixed(1)}%). ` +
      "Entrar em contato com os bancos para cobrar comissões pendentes."
    );
  }
  
  // Recomendações sobre divergências críticas
  if (analise.criticas > 0) {
    recomendacoes.push(
      `🚨 ${analise.criticas} divergência(s) crítica(s) identificada(s). ` +
      "Revisar urgentemente para evitar perdas financeiras."
    );
  }
  
  // Recomendações sobre valor recuperável
  if (analise.valorRecuperavel > 0) {
    recomendacoes.push(
      `💵 Valor potencial a recuperar: R$ ${analise.valorRecuperavel.toFixed(2)}. ` +
      "Analisar contratos com divergência de valor para cobrança."
    );
  }
  
  // Recomendações sobre diferença total
  if (financeiro.diferencaTotal > 0) {
    recomendacoes.push(
      `📊 Diferença total: R$ ${financeiro.diferencaTotal.toFixed(2)} a favor da empresa. ` +
      "Considerar negociação com bancos para regularização."
    );
  } else if (financeiro.diferencaTotal < 0) {
    recomendacoes.push(
      `📊 Diferença total: R$ ${Math.abs(financeiro.diferencaTotal).toFixed(2)} pago a mais pelos bancos. ` +
      "Verificar se houve pagamentos duplicados ou valores incorretos."
    );
  }
  
  // Recomendações sobre duplicidades
  if (estatisticas.duplicidades > 0) {
    recomendacoes.push(
      `⚠️ ${estatisticas.duplicidades} possível(is) duplicidade(s) de pagamento. ` +
      "Revisar contratos para evitar recebimento indevido."
    );
  }
  
  // Recomendações sobre dados inconsistentes
  if (estatisticas.dadosInconsistentes > 0) {
    const percentualInconsistente = (estatisticas.dadosInconsistentes / contratos.length) * 100;
    recomendacoes.push(
      `⚠️ ${estatisticas.dadosInconsistentes} contrato(s) com dados inconsistentes (${percentualInconsistente.toFixed(1)}%). ` +
      "Revisar qualidade dos dados para melhorar matching automático."
    );
  }
  
  // Recomendações sobre pagamentos fora do período
  if (estatisticas.pagoForaPeriodo > 0) {
    recomendacoes.push(
      `📅 ${estatisticas.pagoForaPeriodo} pagamento(s) fora do período esperado. ` +
      "Verificar acordos de prazo com os bancos."
    );
  }
  
  // Análise por banco
  const bancosComProblemas: string[] = [];
  financeiro.porBanco.forEach((valores, banco) => {
    if (valores.diferenca > 100) { // Diferença acima de R$ 100
      bancosComProblemas.push(`${banco} (R$ ${valores.diferenca.toFixed(2)})`);
    }
  });
  
  if (bancosComProblemas.length > 0) {
    recomendacoes.push(
      `🏦 Bancos com maiores divergências: ${bancosComProblemas.join(", ")}. ` +
      "Priorizar revisão com essas instituições."
    );
  }
  
  return recomendacoes;
}

// ============================================================================
// RANKING DE PERFORMANCE
// ============================================================================

/**
 * Gera ranking de bancos por acurácia de pagamento
 * 
 * @param contratos - Lista de contratos conciliados
 * @returns Ranking de bancos
 */
export function gerarRankingBancos(contratos: ContratoConciliado[]): Array<{
  banco: string;
  totalContratos: number;
  pagoCorretamente: number;
  percentualAcuracia: number;
  diferencaTotal: number;
}> {
  const dadosPorBanco = new Map<string, {
    totalContratos: number;
    pagoCorretamente: number;
    diferencaTotal: number;
  }>();
  
  contratos.forEach(contrato => {
    const banco = contrato.contratoInterno.banco;
    const dados = dadosPorBanco.get(banco) || { totalContratos: 0, pagoCorretamente: 0, diferencaTotal: 0 };
    
    dados.totalContratos++;
    if (contrato.status === "PAGO_CORRETAMENTE") {
      dados.pagoCorretamente++;
    }
    dados.diferencaTotal = arredondarValor(dados.diferencaTotal + contrato.diferencaFinanceira);
    
    dadosPorBanco.set(banco, dados);
  });
  
  const ranking = Array.from(dadosPorBanco.entries()).map(([banco, dados]) => ({
    banco,
    totalContratos: dados.totalContratos,
    pagoCorretamente: dados.pagoCorretamente,
    percentualAcuracia: arredondarValor((dados.pagoCorretamente / dados.totalContratos) * 100),
    diferencaTotal: dados.diferencaTotal,
  }));
  
  // Ordena por percentual de acurácia (decrescente)
  ranking.sort((a, b) => b.percentualAcuracia - a.percentualAcuracia);
  
  return ranking;
}

/**
 * Gera ranking de produtos por performance
 * 
 * @param contratos - Lista de contratos conciliados
 * @returns Ranking de produtos
 */
export function gerarRankingProdutos(contratos: ContratoConciliado[]): Array<{
  produto: ProdutoBancario;
  totalContratos: number;
  pagoCorretamente: number;
  percentualAcuracia: number;
  valorMedioEsperado: number;
  valorMedioPago: number;
}> {
  const dadosPorProduto = new Map<ProdutoBancario, {
    totalContratos: number;
    pagoCorretamente: number;
    somaEsperado: number;
    somaPago: number;
  }>();
  
  contratos.forEach(contrato => {
    const produto = contrato.contratoInterno.produto;
    const dados = dadosPorProduto.get(produto) || { 
      totalContratos: 0, 
      pagoCorretamente: 0, 
      somaEsperado: 0,
      somaPago: 0
    };
    
    dados.totalContratos++;
    if (contrato.status === "PAGO_CORRETAMENTE") {
      dados.pagoCorretamente++;
    }
    dados.somaEsperado += contrato.valorEsperado;
    dados.somaPago += contrato.valorPago;
    
    dadosPorProduto.set(produto, dados);
  });
  
  const ranking = Array.from(dadosPorProduto.entries()).map(([produto, dados]) => ({
    produto,
    totalContratos: dados.totalContratos,
    pagoCorretamente: dados.pagoCorretamente,
    percentualAcuracia: arredondarValor((dados.pagoCorretamente / dados.totalContratos) * 100),
    valorMedioEsperado: arredondarValor(dados.somaEsperado / dados.totalContratos),
    valorMedioPago: arredondarValor(dados.somaPago / dados.totalContratos),
  }));
  
  // Ordena por percentual de acurácia (decrescente)
  ranking.sort((a, b) => b.percentualAcuracia - a.percentualAcuracia);
  
  return ranking;
}

// ============================================================================
// EXPORTAÇÃO DE DADOS PARA ANÁLISE
// ============================================================================

/**
 * Prepara dados para exportação em formato CSV
 * 
 * @param contratos - Lista de contratos conciliados
 * @returns String CSV
 */
export function exportarParaCSV(contratos: ContratoConciliado[]): string {
  const headers = [
    "ID Contrato",
    "CPF",
    "Cliente",
    "Banco",
    "Produto",
    "Num. Contrato Banco",
    "Valor Esperado",
    "Valor Pago",
    "Diferença",
    "% Divergência",
    "Status",
    "Data Prevista",
    "Data Pagamento",
    "Método Match",
    "Confiança Match",
    "Divergências",
  ];
  
  const linhas = contratos.map(c => {
    const divergenciasTexto = c.divergencias
      .map(d => `${d.tipo}: ${d.descricao}`)
      .join("; ");
    
    return [
      c.contratoInterno.idContrato,
      c.contratoInterno.cpf,
      c.contratoInterno.cliente,
      c.contratoInterno.banco,
      c.contratoInterno.produto,
      c.contratoInterno.numeroContratoBanco,
      c.valorEsperado.toFixed(2),
      c.valorPago.toFixed(2),
      c.diferencaFinanceira.toFixed(2),
      c.percentualDivergencia.toFixed(2),
      c.status,
      c.contratoInterno.dataPrevistaPagamento.toISOString().split("T")[0],
      c.pagamentoBanco?.dataPagamento.toISOString().split("T")[0] || "N/A",
      c.matching.metodoMatch,
      c.matching.confianca.toString(),
      divergenciasTexto,
    ].map(v => `"${v}"`).join(",");
  });
  
  return [headers.join(","), ...linhas].join("\n");
}
