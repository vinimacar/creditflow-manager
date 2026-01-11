/**
 * Motor de Conciliação de Comissões Bancárias
 * Motor Principal (Orquestrador)
 * 
 * @module services/conciliacao/motor
 * @description Orquestra todo o processo de conciliação
 */

import type {
  ContratoInterno,
  PagamentoBanco,
  RelatorioConciliacao,
  ResultadoProcessamento,
  ConfiguracaoMotor,
} from "@/types/conciliacao";

import { 
  normalizarContratosLote, 
  normalizarPagamentosLote 
} from "./normalizador";

import { 
  processarMatchingLote, 
  identificarPagamentosOrfaos,
  detectarDuplicidades,
  calcularEstatisticasMatching,
} from "./matcher";

import { 
  classificarLote,
  marcarDuplicidades,
} from "./classificador";

import {
  calcularEstatisticasGerais,
  calcularTotalizadoresFinanceiros,
  gerarRecomendacoes,
  gerarRankingBancos,
  gerarRankingProdutos,
} from "./calculadora";

// ============================================================================
// CONFIGURAÇÃO PADRÃO
// ============================================================================

const CONFIG_PADRAO: ConfiguracaoMotor = {
  toleranciaValor: 0.50,
  janelaDiasPagamento: 15,
  validacaoAvancada: true,
  percentuaisEsperados: {
    CONSIGNADO: { min: 1.0, max: 6.0 },
    PORTABILIDADE: { min: 0.5, max: 4.0 },
    REFIN: { min: 1.0, max: 5.0 },
    CARTAO: { min: 2.0, max: 8.0 },
    PESSOAL: { min: 3.0, max: 10.0 },
  },
};

// ============================================================================
// MOTOR PRINCIPAL DE CONCILIAÇÃO
// ============================================================================

/**
 * Processa conciliação completa de contratos e pagamentos
 * 
 * @param contratosRaw - Contratos internos (dados brutos)
 * @param pagamentosRaw - Pagamentos do banco (dados brutos)
 * @param config - Configuração personalizada (opcional)
 * @returns Resultado do processamento
 */
export async function processarConciliacao(
  contratosRaw: Partial<ContratoInterno>[],
  pagamentosRaw: Partial<PagamentoBanco>[],
  config: ConfiguracaoMotor = CONFIG_PADRAO
): Promise<ResultadoProcessamento> {
  const inicio = Date.now();
  const logs: string[] = [];
  
  try {
    logs.push(`[${new Date().toISOString()}] Iniciando processamento de conciliação`);
    logs.push(`Contratos recebidos: ${contratosRaw.length}`);
    logs.push(`Pagamentos recebidos: ${pagamentosRaw.length}`);
    
    // ========================================================================
    // ETAPA 1: NORMALIZAÇÃO
    // ========================================================================
    
    logs.push("\n=== ETAPA 1: Normalização de Dados ===");
    
    const contratos = normalizarContratosLote(contratosRaw);
    const pagamentos = normalizarPagamentosLote(pagamentosRaw);
    
    logs.push(`Contratos normalizados: ${contratos.length} (${contratosRaw.length - contratos.length} inválidos removidos)`);
    logs.push(`Pagamentos normalizados: ${pagamentos.length} (${pagamentosRaw.length - pagamentos.length} inválidos removidos)`);
    
    if (contratos.length === 0) {
      throw new Error("Nenhum contrato válido para processar");
    }
    
    // ========================================================================
    // ETAPA 2: MATCHING
    // ========================================================================
    
    logs.push("\n=== ETAPA 2: Matching Inteligente ===");
    
    const matchings = processarMatchingLote(contratos, pagamentos, {
      toleranciaValor: config.toleranciaValor,
      janelaDias: config.janelaDiasPagamento,
    });
    const estatisticasMatching = calcularEstatisticasMatching(matchings);
    
    logs.push(`Total de contratos processados: ${estatisticasMatching.total}`);
    logs.push(`Matches encontrados: ${estatisticasMatching.matchados} (${estatisticasMatching.taxaSucesso.toFixed(1)}%)`);
    logs.push(`  - Alta confiança: ${estatisticasMatching.altaConfianca}`);
    logs.push(`  - Média confiança: ${estatisticasMatching.mediaConfianca}`);
    logs.push(`  - Baixa confiança: ${estatisticasMatching.baixaConfianca}`);
    logs.push(`Não matchados: ${estatisticasMatching.naoMatchados}`);
    
    // ========================================================================
    // ETAPA 3: DETECÇÃO DE DUPLICIDADES
    // ========================================================================
    
    logs.push("\n=== ETAPA 3: Detecção de Duplicidades ===");
    
    const duplicidades = detectarDuplicidades(matchings);
    logs.push(`Duplicidades encontradas: ${duplicidades.length}`);
    
    if (duplicidades.length > 0) {
      duplicidades.forEach((dup, idx) => {
        logs.push(`  Dup ${idx + 1}: ${dup.contratos.length} contratos vinculados ao mesmo pagamento`);
      });
    }
    
    // ========================================================================
    // ETAPA 4: CLASSIFICAÇÃO
    // ========================================================================
    
    logs.push("\n=== ETAPA 4: Classificação de Contratos ===");
    
    let contratosConciliados = classificarLote(matchings, config);
    
    // Marcar duplicidades
    if (duplicidades.length > 0) {
      contratosConciliados = marcarDuplicidades(contratosConciliados, duplicidades);
    }
    
    logs.push(`Contratos classificados: ${contratosConciliados.length}`);
    
    // ========================================================================
    // ETAPA 5: CÁLCULOS FINANCEIROS
    // ========================================================================
    
    logs.push("\n=== ETAPA 5: Cálculos Financeiros ===");
    
    const estatisticas = calcularEstatisticasGerais(contratosConciliados);
    const financeiro = calcularTotalizadoresFinanceiros(contratosConciliados);
    
    logs.push(`Total esperado: R$ ${financeiro.totalEsperado.toFixed(2)}`);
    logs.push(`Total pago: R$ ${financeiro.totalPago.toFixed(2)}`);
    logs.push(`Diferença total: R$ ${financeiro.diferencaTotal.toFixed(2)}`);
    logs.push(`Acurácia: ${estatisticas.percentualAcuracia.toFixed(1)}%`);
    
    // ========================================================================
    // ETAPA 6: IDENTIFICAÇÃO DE PAGAMENTOS ÓRFÃOS
    // ========================================================================
    
    logs.push("\n=== ETAPA 6: Pagamentos Órfãos ===");
    
    const pagamentosOrfaos = identificarPagamentosOrfaos(pagamentos, matchings);
    logs.push(`Pagamentos sem contrato correspondente: ${pagamentosOrfaos.length}`);
    
    // ========================================================================
    // ETAPA 7: CONTRATOS NÃO ENCONTRADOS
    // ========================================================================
    
    logs.push("\n=== ETAPA 7: Contratos Não Encontrados ===");
    
    const contratosNaoEncontrados = contratosConciliados
      .filter(c => c.status === "NAO_PAGO")
      .map(c => c.contratoInterno);
    
    logs.push(`Contratos sem pagamento: ${contratosNaoEncontrados.length}`);
    
    // ========================================================================
    // ETAPA 8: RECOMENDAÇÕES
    // ========================================================================
    
    logs.push("\n=== ETAPA 8: Geração de Recomendações ===");
    
    const recomendacoes = gerarRecomendacoes(contratosConciliados, estatisticas, financeiro);
    logs.push(`Recomendações geradas: ${recomendacoes.length}`);
    
    // ========================================================================
    // GERAÇÃO DO RELATÓRIO FINAL
    // ========================================================================
    
    logs.push("\n=== Gerando Relatório Final ===");
    
    // Calcular período de análise
    const datasCriacao = contratos
      .map(c => c.dataCriacao || c.dataPrevistaPagamento)
      .filter((d): d is Date => d !== undefined)
      .sort((a, b) => a.getTime() - b.getTime());
    
    const periodoAnalise = {
      inicio: datasCriacao[0] || new Date(),
      fim: datasCriacao[datasCriacao.length - 1] || new Date(),
    };
    
    const relatorio: RelatorioConciliacao = {
      id: `relatorio-${Date.now()}`,
      dataGeracao: new Date(),
      periodoAnalise,
      totalContratos: contratos.length,
      contratosConciliados,
      estatisticas,
      financeiro,
      contratosNaoEncontrados,
      pagamentosSemContrato: pagamentosOrfaos,
      recomendacoes,
    };
    
    const tempoProcessamento = Date.now() - inicio;
    logs.push(`\n✓ Processamento concluído com sucesso em ${tempoProcessamento}ms`);
    
    return {
      sucesso: true,
      relatorio,
      tempoProcessamento,
      logs,
    };
    
  } catch (error) {
    const tempoProcessamento = Date.now() - inicio;
    const mensagemErro = error instanceof Error ? error.message : "Erro desconhecido";
    
    logs.push(`\n❌ Erro durante processamento: ${mensagemErro}`);
    
    return {
      sucesso: false,
      erro: mensagemErro,
      tempoProcessamento,
      logs,
    };
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES PARA ANÁLISE
// ============================================================================

/**
 * Gera resumo executivo do relatório
 * 
 * @param relatorio - Relatório de conciliação
 * @returns Resumo executivo em texto
 */
export function gerarResumoExecutivo(relatorio: RelatorioConciliacao): string {
  const { estatisticas, financeiro, totalContratos, recomendacoes } = relatorio;
  
  const linhas = [
    "=" .repeat(80),
    "RESUMO EXECUTIVO - CONCILIAÇÃO DE COMISSÕES BANCÁRIAS",
    "=" .repeat(80),
    "",
    `Data do Relatório: ${relatorio.dataGeracao.toLocaleString("pt-BR")}`,
    `Período Analisado: ${relatorio.periodoAnalise.inicio.toLocaleDateString("pt-BR")} a ${relatorio.periodoAnalise.fim.toLocaleDateString("pt-BR")}`,
    `Total de Contratos: ${totalContratos}`,
    "",
    "-" .repeat(80),
    "ESTATÍSTICAS",
    "-" .repeat(80),
    `Pagos Corretamente: ${estatisticas.pagoCorretamente} (${((estatisticas.pagoCorretamente / totalContratos) * 100).toFixed(1)}%)`,
    `Pago com Divergência: ${estatisticas.pagoComDivergencia}`,
    `Pago Fora do Período: ${estatisticas.pagoForaPeriodo}`,
    `Não Pagos: ${estatisticas.naoPagos}`,
    `Dados Inconsistentes: ${estatisticas.dadosInconsistentes}`,
    `Duplicidades: ${estatisticas.duplicidades}`,
    `Taxa de Acurácia: ${estatisticas.percentualAcuracia.toFixed(1)}%`,
    "",
    "-" .repeat(80),
    "FINANCEIRO",
    "-" .repeat(80),
    `Total Esperado: R$ ${financeiro.totalEsperado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    `Total Pago: R$ ${financeiro.totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    `Diferença: R$ ${financeiro.diferencaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    "",
    "-" .repeat(80),
    "RECOMENDAÇÕES",
    "-" .repeat(80),
  ];
  
  recomendacoes.forEach((rec, idx) => {
    linhas.push(`${idx + 1}. ${rec}`);
  });
  
  linhas.push("");
  linhas.push("=" .repeat(80));
  
  return linhas.join("\n");
}

/**
 * Gera relatório detalhado por banco
 * 
 * @param relatorio - Relatório de conciliação
 * @returns Relatório por banco
 */
export function gerarRelatorioPorBanco(relatorio: RelatorioConciliacao): string {
  const ranking = gerarRankingBancos(relatorio.contratosConciliados);
  
  const linhas = [
    "=" .repeat(80),
    "ANÁLISE POR BANCO",
    "=" .repeat(80),
    "",
  ];
  
  ranking.forEach((banco, idx) => {
    linhas.push(`${idx + 1}. ${banco.banco}`);
    linhas.push(`   Total de Contratos: ${banco.totalContratos}`);
    linhas.push(`   Pagos Corretamente: ${banco.pagoCorretamente} (${banco.percentualAcuracia.toFixed(1)}%)`);
    linhas.push(`   Diferença Total: R$ ${banco.diferencaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
    linhas.push("");
  });
  
  return linhas.join("\n");
}

/**
 * Gera relatório detalhado por produto
 * 
 * @param relatorio - Relatório de conciliação
 * @returns Relatório por produto
 */
export function gerarRelatorioPorProduto(relatorio: RelatorioConciliacao): string {
  const ranking = gerarRankingProdutos(relatorio.contratosConciliados);
  
  const linhas = [
    "=" .repeat(80),
    "ANÁLISE POR PRODUTO",
    "=" .repeat(80),
    "",
  ];
  
  ranking.forEach((produto, idx) => {
    linhas.push(`${idx + 1}. ${produto.produto}`);
    linhas.push(`   Total de Contratos: ${produto.totalContratos}`);
    linhas.push(`   Pagos Corretamente: ${produto.pagoCorretamente} (${produto.percentualAcuracia.toFixed(1)}%)`);
    linhas.push(`   Valor Médio Esperado: R$ ${produto.valorMedioEsperado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
    linhas.push(`   Valor Médio Pago: R$ ${produto.valorMedioPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
    linhas.push("");
  });
  
  return linhas.join("\n");
}

// Exportar motor principal como padrão
export default {
  processarConciliacao,
  gerarResumoExecutivo,
  gerarRelatorioPorBanco,
  gerarRelatorioPorProduto,
};
