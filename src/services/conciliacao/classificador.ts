/**
 * Motor de Conciliação de Comissões Bancárias
 * Classificador de Contratos
 * 
 * @module services/conciliacao/classificador
 * @description Responsável por classificar contratos e identificar divergências
 */

import type {
  ContratoInterno,
  PagamentoBanco,
  ResultadoMatching,
  StatusConciliacao,
  Divergencia,
  ContratoConciliado,
  ConfiguracaoMotor,
} from "@/types/conciliacao";
import { arredondarValor, dentroJanelaDias } from "./normalizador";

// ============================================================================
// CONFIGURAÇÃO PADRÃO
// ============================================================================

const CONFIG_PADRAO: ConfiguracaoMotor = {
  toleranciaValor: 0.50, // R$ 0,50
  janelaDiasPagamento: 15, // 15 dias
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
// CLASSIFICAÇÃO DE STATUS
// ============================================================================

/**
 * Classifica o status de um contrato baseado no matching
 * 
 * @param matching - Resultado do matching
 * @param config - Configuração do motor
 * @returns Status da conciliação
 */
export function classificarStatus(
  matching: ResultadoMatching,
  config: ConfiguracaoMotor = CONFIG_PADRAO
): StatusConciliacao {
  const { contrato, pagamento } = matching;
  
  // Caso 1: Contrato não encontrado no banco
  if (!pagamento) {
    return "NAO_PAGO";
  }
  
  // Caso 2: Dados inconsistentes (baixa confiança no matching)
  if (matching.confianca < 50) {
    return "DADOS_INCONSISTENTES";
  }
  
  // Verificar diferença de valor
  const diferencaValor = Math.abs(contrato.valorComissaoEsperada - pagamento.valorPago);
  
  // Verificar se pagamento está dentro do período esperado
  const dentroPeriodo = dentroJanelaDias(
    pagamento.dataPagamento,
    contrato.dataPrevistaPagamento,
    config.janelaDiasPagamento
  );
  
  // Caso 3: Pago corretamente
  if (diferencaValor <= config.toleranciaValor && dentroPeriodo) {
    return "PAGO_CORRETAMENTE";
  }
  
  // Caso 4: Pago fora do período
  if (diferencaValor <= config.toleranciaValor && !dentroPeriodo) {
    return "PAGO_FORA_DO_PERIODO";
  }
  
  // Caso 5: Pago com divergência de valor
  if (diferencaValor > config.toleranciaValor) {
    return "PAGO_COM_DIVERGENCIA_VALOR";
  }
  
  // Fallback
  return "DADOS_INCONSISTENTES";
}

// ============================================================================
// IDENTIFICAÇÃO DE DIVERGÊNCIAS
// ============================================================================

/**
 * Identifica todas as divergências de um contrato
 * 
 * @param contrato - Contrato interno
 * @param pagamento - Pagamento do banco (pode ser null)
 * @param config - Configuração do motor
 * @returns Lista de divergências
 */
export function identificarDivergencias(
  contrato: ContratoInterno,
  pagamento: PagamentoBanco | null,
  config: ConfiguracaoMotor = CONFIG_PADRAO
): Divergencia[] {
  const divergencias: Divergencia[] = [];
  
  // Sem pagamento = divergência crítica
  if (!pagamento) {
    divergencias.push({
      tipo: "PAGAMENTO_NAO_ENCONTRADO",
      valorDiferenca: contrato.valorComissaoEsperada,
      descricao: "Nenhum pagamento correspondente foi encontrado no arquivo do banco",
      severidade: "CRITICA",
    });
    return divergencias;
  }
  
  // Verificar divergência de valor
  const diferencaValor = arredondarValor(contrato.valorComissaoEsperada - pagamento.valorPago);
  
  if (Math.abs(diferencaValor) > config.toleranciaValor) {
    const severidade: Divergencia["severidade"] = 
      Math.abs(diferencaValor) > 100 ? "CRITICA" :
      Math.abs(diferencaValor) > 50 ? "ALTA" :
      Math.abs(diferencaValor) > 10 ? "MEDIA" : "BAIXA";
    
    const descricao = diferencaValor > 0
      ? `Valor pago é R$ ${Math.abs(diferencaValor).toFixed(2)} MENOR que o esperado`
      : `Valor pago é R$ ${Math.abs(diferencaValor).toFixed(2)} MAIOR que o esperado`;
    
    divergencias.push({
      tipo: "DIVERGENCIA_VALOR",
      valorDiferenca: diferencaValor,
      descricao,
      severidade,
    });
  }
  
  // Verificar divergência de período
  const diasDiferenca = Math.abs(
    Math.floor((pagamento.dataPagamento.getTime() - contrato.dataPrevistaPagamento.getTime()) / (1000 * 60 * 60 * 24))
  );
  
  if (diasDiferenca > config.janelaDiasPagamento) {
    const descricao = pagamento.dataPagamento > contrato.dataPrevistaPagamento
      ? `Pagamento atrasado em ${diasDiferenca} dias`
      : `Pagamento antecipado em ${diasDiferenca} dias`;
    
    const severidade: Divergencia["severidade"] = 
      diasDiferenca > 60 ? "ALTA" :
      diasDiferenca > 30 ? "MEDIA" : "BAIXA";
    
    divergencias.push({
      tipo: "DIVERGENCIA_PERIODO",
      valorDiferenca: 0,
      descricao,
      severidade,
    });
  }
  
  // Validação avançada de percentual
  if (config.validacaoAvancada) {
    const percentualEfetivo = arredondarValor((contrato.valorComissaoEsperada / contrato.valorLiberado) * 100);
    const percentualPago = arredondarValor((pagamento.valorPago / contrato.valorLiberado) * 100);
    
    const faixaEsperada = config.percentuaisEsperados?.[contrato.produto];
    
    if (faixaEsperada) {
      // Verifica se o percentual pago está fora da faixa esperada
      if (percentualPago < faixaEsperada.min || percentualPago > faixaEsperada.max) {
        divergencias.push({
          tipo: "PERCENTUAL_FORA_PADRAO",
          valorDiferenca: 0,
          descricao: `Percentual pago (${percentualPago.toFixed(2)}%) está fora da faixa esperada para ${contrato.produto} (${faixaEsperada.min}% - ${faixaEsperada.max}%)`,
          severidade: "MEDIA",
        });
      }
      
      // Verifica se há divergência entre percentual interno e percentual pago
      const diferencaPercentual = Math.abs(percentualEfetivo - percentualPago);
      if (diferencaPercentual > 0.5) { // Tolerância de 0,5%
        divergencias.push({
          tipo: "DIVERGENCIA_PERCENTUAL",
          valorDiferenca: 0,
          descricao: `Percentual calculado internamente (${percentualEfetivo.toFixed(2)}%) difere do percentual pago (${percentualPago.toFixed(2)}%)`,
          severidade: "MEDIA",
        });
      }
    }
  }
  
  return divergencias;
}

// ============================================================================
// GERAÇÃO DE OBSERVAÇÕES AUTOMÁTICAS
// ============================================================================

/**
 * Gera observações automáticas baseadas no status e divergências
 * 
 * @param status - Status da conciliação
 * @param divergencias - Lista de divergências
 * @param matching - Resultado do matching
 * @returns Array de observações
 */
export function gerarObservacoesAutomaticas(
  status: StatusConciliacao,
  divergencias: Divergencia[],
  matching: ResultadoMatching
): string[] {
  const observacoes: string[] = [];
  
  // Observação sobre método de matching
  observacoes.push(`✓ Matching: ${matching.detalhesMatch} (${matching.confianca}% de confiança)`);
  
  // Observações baseadas no status
  switch (status) {
    case "PAGO_CORRETAMENTE":
      observacoes.push("✓ Pagamento conciliado corretamente - valores e prazos dentro do esperado");
      break;
      
    case "PAGO_COM_DIVERGENCIA_VALOR":
      observacoes.push("⚠️ Pagamento identificado mas com divergência de valor - requer análise");
      break;
      
    case "PAGO_FORA_DO_PERIODO":
      observacoes.push("⚠️ Pagamento realizado fora do período esperado");
      break;
      
    case "NAO_PAGO":
      observacoes.push("❌ Nenhum pagamento correspondente encontrado - possível inadimplência do banco");
      break;
      
    case "DADOS_INCONSISTENTES":
      observacoes.push("❌ Dados inconsistentes - matching com baixa confiança, requer revisão manual");
      break;
      
    case "DUPLICIDADE_DE_PAGAMENTO":
      observacoes.push("⚠️ Possível duplicidade de pagamento detectada");
      break;
  }
  
  // Observações sobre divergências críticas
  const divergenciasCriticas = divergencias.filter(d => d.severidade === "CRITICA");
  if (divergenciasCriticas.length > 0) {
    observacoes.push(`🚨 ${divergenciasCriticas.length} divergência(s) crítica(s) identificada(s)`);
  }
  
  // Observação sobre valor recuperável
  const valorRecuperavel = divergencias
    .filter(d => d.tipo === "DIVERGENCIA_VALOR" && d.valorDiferenca > 0)
    .reduce((sum, d) => sum + d.valorDiferenca, 0);
  
  if (valorRecuperavel > 0) {
    observacoes.push(`💰 Valor potencial a recuperar: R$ ${valorRecuperavel.toFixed(2)}`);
  }
  
  return observacoes;
}

// ============================================================================
// CRIAÇÃO DE CONTRATO CONCILIADO
// ============================================================================

/**
 * Cria um objeto ContratoConciliado completo
 * 
 * @param matching - Resultado do matching
 * @param config - Configuração do motor
 * @returns Contrato conciliado
 */
export function criarContratoConciliado(
  matching: ResultadoMatching,
  config: ConfiguracaoMotor = CONFIG_PADRAO
): ContratoConciliado {
  const { contrato, pagamento } = matching;
  
  // Classifica status
  const status = classificarStatus(matching, config);
  
  // Identifica divergências
  const divergencias = identificarDivergencias(contrato, pagamento, config);
  
  // Calcula valores
  const valorEsperado = contrato.valorComissaoEsperada;
  const valorPago = pagamento?.valorPago || 0;
  const diferencaFinanceira = arredondarValor(valorEsperado - valorPago);
  
  const percentualDivergencia = valorEsperado > 0
    ? arredondarValor(Math.abs(diferencaFinanceira / valorEsperado) * 100)
    : 0;
  
  // Gera observações automáticas
  const observacoesAutomaticas = gerarObservacoesAutomaticas(status, divergencias, matching);
  
  return {
    id: `conc-${contrato.idContrato}-${Date.now()}`,
    contratoInterno: contrato,
    pagamentoBanco: pagamento,
    status,
    divergencias,
    valorEsperado,
    valorPago,
    diferencaFinanceira,
    percentualDivergencia,
    observacoesAutomaticas,
    matching,
    dataConciliacao: new Date(),
  };
}

/**
 * Processa classificação em lote
 * 
 * @param matchings - Lista de resultados de matching
 * @param config - Configuração do motor
 * @returns Lista de contratos conciliados
 */
export function classificarLote(
  matchings: ResultadoMatching[],
  config: ConfiguracaoMotor = CONFIG_PADRAO
): ContratoConciliado[] {
  return matchings.map(matching => criarContratoConciliado(matching, config));
}

// ============================================================================
// ANÁLISE DE DUPLICIDADES
// ============================================================================

/**
 * Marca contratos com duplicidade de pagamento
 * 
 * @param contratos - Lista de contratos conciliados
 * @param duplicidades - Grupos de duplicidades identificadas
 * @returns Contratos atualizados com marcação de duplicidade
 */
export function marcarDuplicidades(
  contratos: ContratoConciliado[],
  duplicidades: Array<{ pagamento: PagamentoBanco; contratos: ContratoInterno[] }>
): ContratoConciliado[] {
  const contratosDuplicados = new Set(
    duplicidades.flatMap(d => d.contratos.map(c => c.idContrato))
  );
  
  return contratos.map(contrato => {
    if (contratosDuplicados.has(contrato.contratoInterno.idContrato)) {
      return {
        ...contrato,
        status: "DUPLICIDADE_DE_PAGAMENTO" as StatusConciliacao,
        divergencias: [
          ...contrato.divergencias,
          {
            tipo: "DUPLICIDADE",
            valorDiferenca: 0,
            descricao: "Múltiplos contratos associados ao mesmo pagamento",
            severidade: "ALTA" as const,
          },
        ],
        observacoesAutomaticas: [
          ...contrato.observacoesAutomaticas,
          "⚠️ DUPLICIDADE: Este pagamento está associado a múltiplos contratos",
        ],
      };
    }
    return contrato;
  });
}
