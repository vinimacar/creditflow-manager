/**
 * Motor de Conciliação de Comissões Bancárias
 * Tipos e Interfaces do Sistema
 * 
 * @module types/conciliacao
 * @description Define todas as estruturas de dados utilizadas pelo motor de conciliação
 */

// ============================================================================
// TIPOS DE PRODUTOS BANCÁRIOS
// ============================================================================

export type ProdutoBancario = 
  | "CONSIGNADO" 
  | "PORTABILIDADE" 
  | "REFIN" 
  | "CARTAO" 
  | "PESSOAL";

// ============================================================================
// CONTRATO INTERNO
// ============================================================================

export interface ContratoInterno {
  /** Identificador único do contrato no sistema interno */
  idContrato: string;
  
  /** CPF do cliente (sem máscara) */
  cpf: string;
  
  /** Nome completo do cliente */
  cliente: string;
  
  /** Nome do banco/instituição financeira */
  banco: string;
  
  /** Tipo de produto bancário */
  produto: ProdutoBancario;
  
  /** Número do contrato no sistema do banco */
  numeroContratoBanco: string;
  
  /** Valor liberado ao cliente */
  valorLiberado: number;
  
  /** Percentual de comissão acordado (ex: 2.5 para 2,5%) */
  percentualComissao: number;
  
  /** Valor da comissão esperada em R$ */
  valorComissaoEsperada: number;
  
  /** Data prevista para pagamento da comissão */
  dataPrevistaPagamento: Date;
  
  /** Data de criação do contrato */
  dataCriacao?: Date;
  
  /** Observações adicionais */
  observacoes?: string;
}

// ============================================================================
// PAGAMENTO DO BANCO
// ============================================================================

export interface PagamentoBanco {
  /** CPF do cliente (sem máscara) */
  cpf: string;
  
  /** Número do contrato no sistema do banco */
  numeroContratoBanco: string;
  
  /** Tipo de produto */
  produto: string;
  
  /** Valor efetivamente pago pelo banco */
  valorPago: number;
  
  /** Data em que o pagamento foi realizado */
  dataPagamento: Date;
  
  /** Nome do banco */
  banco: string;
  
  /** Dados adicionais do arquivo do banco */
  [key: string]: unknown;
}

// ============================================================================
// CLASSIFICAÇÃO DE STATUS
// ============================================================================

export type StatusConciliacao = 
  | "PAGO_CORRETAMENTE"
  | "PAGO_COM_DIVERGENCIA_VALOR"
  | "PAGO_FORA_DO_PERIODO"
  | "NAO_PAGO"
  | "DADOS_INCONSISTENTES"
  | "DUPLICIDADE_DE_PAGAMENTO";

// ============================================================================
// RESULTADO DO MATCHING
// ============================================================================

export interface ResultadoMatching {
  /** Contrato interno que foi analisado */
  contrato: ContratoInterno;
  
  /** Pagamento correspondente encontrado (se houver) */
  pagamento: PagamentoBanco | null;
  
  /** Nível de confiança do match (0-100) */
  confianca: number;
  
  /** Método utilizado para o match */
  metodoMatch: "CPF_CONTRATO" | "CPF_VALOR_DATA" | "CPF_PRODUTO_BANCO" | "NAO_ENCONTRADO";
  
  /** Detalhes sobre o matching */
  detalhesMatch?: string;
}

// ============================================================================
// DIVERGÊNCIA IDENTIFICADA
// ============================================================================

export interface Divergencia {
  /** Tipo de divergência encontrada */
  tipo: string;
  
  /** Valor da diferença (positivo = a favor da empresa, negativo = a favor do banco) */
  valorDiferenca: number;
  
  /** Descrição detalhada da divergência */
  descricao: string;
  
  /** Nível de severidade */
  severidade: "CRITICA" | "ALTA" | "MEDIA" | "BAIXA";
}

// ============================================================================
// CONTRATO CONCILIADO
// ============================================================================

export interface ContratoConciliado {
  /** Identificador único do resultado */
  id: string;
  
  /** Dados do contrato interno */
  contratoInterno: ContratoInterno;
  
  /** Dados do pagamento do banco (se encontrado) */
  pagamentoBanco: PagamentoBanco | null;
  
  /** Status da conciliação */
  status: StatusConciliacao;
  
  /** Lista de divergências encontradas */
  divergencias: Divergencia[];
  
  /** Valor esperado de comissão */
  valorEsperado: number;
  
  /** Valor efetivamente pago */
  valorPago: number;
  
  /** Diferença financeira total (esperado - pago) */
  diferencaFinanceira: number;
  
  /** Percentual de divergência (0-100) */
  percentualDivergencia: number;
  
  /** Observações automáticas geradas pelo motor */
  observacoesAutomaticas: string[];
  
  /** Informações do matching */
  matching: ResultadoMatching;
  
  /** Data/hora da conciliação */
  dataConciliacao: Date;
}

// ============================================================================
// RELATÓRIO DE CONCILIAÇÃO
// ============================================================================

export interface RelatorioConciliacao {
  /** Identificador único do relatório */
  id: string;
  
  /** Data/hora de geração do relatório */
  dataGeracao: Date;
  
  /** Período analisado */
  periodoAnalise: {
    inicio: Date;
    fim: Date;
  };
  
  /** Total de contratos analisados */
  totalContratos: number;
  
  /** Contratos conciliados com sucesso */
  contratosConciliados: ContratoConciliado[];
  
  /** Estatísticas gerais */
  estatisticas: {
    /** Contratos pagos corretamente */
    pagoCorretamente: number;
    
    /** Contratos com divergência de valor */
    pagoComDivergencia: number;
    
    /** Contratos pagos fora do período */
    pagoForaPeriodo: number;
    
    /** Contratos não pagos */
    naoPagos: number;
    
    /** Contratos com dados inconsistentes */
    dadosInconsistentes: number;
    
    /** Duplicidades identificadas */
    duplicidades: number;
    
    /** Percentual de acurácia */
    percentualAcuracia: number;
  };
  
  /** Totalizadores financeiros */
  financeiro: {
    /** Total esperado de comissões */
    totalEsperado: number;
    
    /** Total efetivamente pago */
    totalPago: number;
    
    /** Diferença total (positivo = a receber, negativo = pago a mais) */
    diferencaTotal: number;
    
    /** Totais por banco */
    porBanco: Map<string, {
      totalEsperado: number;
      totalPago: number;
      diferenca: number;
    }>;
    
    /** Totais por produto */
    porProduto: Map<ProdutoBancario, {
      totalEsperado: number;
      totalPago: number;
      diferenca: number;
    }>;
  };
  
  /** Contratos que não foram encontrados no arquivo do banco */
  contratosNaoEncontrados: ContratoInterno[];
  
  /** Pagamentos do banco sem contrato correspondente */
  pagamentosSemContrato: PagamentoBanco[];
  
  /** Recomendações e alertas */
  recomendacoes: string[];
}

// ============================================================================
// CONFIGURAÇÕES DO MOTOR
// ============================================================================

export interface ConfiguracaoMotor {
  /** Tolerância para diferenças de valor (em R$) */
  toleranciaValor: number;
  
  /** Janela de dias para considerar pagamento dentro do período */
  janelaDiasPagamento: number;
  
  /** Habilitar validação avançada de taxas */
  validacaoAvancada: boolean;
  
  /** Percentuais esperados por tipo de produto */
  percentuaisEsperados?: Partial<Record<ProdutoBancario, {
    min: number;
    max: number;
  }>>;
}

// ============================================================================
// RESULTADO DO PROCESSAMENTO
// ============================================================================

export interface ResultadoProcessamento {
  /** Sucesso da operação */
  sucesso: boolean;
  
  /** Relatório gerado (se sucesso) */
  relatorio?: RelatorioConciliacao;
  
  /** Mensagem de erro (se falha) */
  erro?: string;
  
  /** Tempo de processamento em ms */
  tempoProcessamento: number;
  
  /** Logs de processamento */
  logs: string[];
}
