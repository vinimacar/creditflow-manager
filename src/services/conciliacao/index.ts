/**
 * Motor de Conciliação de Comissões Bancárias
 * Arquivo de Exportação Principal
 * 
 * @module services/conciliacao
 */

// Tipos
export type {
  ContratoInterno,
  PagamentoBanco,
  ProdutoBancario,
  StatusConciliacao,
  ResultadoMatching,
  Divergencia,
  ContratoConciliado,
  RelatorioConciliacao,
  ConfiguracaoMotor,
  ResultadoProcessamento,
} from "@/types/conciliacao";

// Normalizador
export {
  normalizarCPF,
  validarCPF,
  normalizarData,
  normalizarValor,
  arredondarValor,
  normalizarProduto,
  normalizarContratoInterno,
  normalizarPagamentoBanco,
  normalizarContratosLote,
  normalizarPagamentosLote,
  dentroJanelaDias,
} from "./normalizador";

// Matcher
export {
  encontrarCorrespondencia,
  processarMatchingLote,
  identificarPagamentosOrfaos,
  detectarDuplicidades,
  calcularEstatisticasMatching,
} from "./matcher";

// Classificador
export {
  classificarStatus,
  identificarDivergencias,
  gerarObservacoesAutomaticas,
  criarContratoConciliado,
  classificarLote,
  marcarDuplicidades,
} from "./classificador";

// Calculadora
export {
  calcularEstatisticasGerais,
  calcularTotalizadoresFinanceiros,
  analisarDivergencias,
  gerarRecomendacoes,
  gerarRankingBancos,
  gerarRankingProdutos,
  exportarParaCSV,
} from "./calculadora";

// Motor Principal
export {
  processarConciliacao,
  gerarResumoExecutivo,
  gerarRelatorioPorBanco,
  gerarRelatorioPorProduto,
  default as MotorConciliacao,
} from "./motor";
