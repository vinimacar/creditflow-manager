// Tipos para Gestão Financeira Avançada

// ==========================================
// COMISSÕES A RECEBER (dos fornecedores)
// ==========================================
export interface ComissaoReceber {
  id?: string;
  vendaId: string;
  fornecedorId: string;
  funcionarioId: string; // Vendedor que gerou a comissão
  produtoId: string;
  valorComissao: number;
  percentualComissao: number;
  dataVenda: Date;
  dataVencimento: Date; // Quando deveria receber
  dataRecebimento?: Date; // Quando efetivamente recebeu
  status: 'pendente' | 'recebido' | 'atrasado' | 'cancelado';
  formaPagamento?: 'pix' | 'transferencia' | 'boleto' | 'dinheiro' | 'outros';
  comprovante?: string; // URL do comprovante
  observacoes?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

// ==========================================
// COMISSÕES A PAGAR (aos agentes/vendedores)
// ==========================================
export interface ComissaoPagar {
  id?: string;
  vendaId: string;
  funcionarioId: string;
  produtoId: string;
  valorComissao: number;
  percentualComissao: number;
  dataVenda: Date;
  dataVencimento: Date; // Quando deveria pagar
  dataPagamento?: Date; // Quando efetivamente pagou
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado';
  formaPagamento?: 'folha' | 'pix' | 'transferencia' | 'dinheiro' | 'outros';
  comprovante?: string;
  observacoes?: string;
  integradoFolha?: boolean; // Se foi incluído na folha de pagamento
  folhaPagamentoId?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

// ==========================================
// FLUXO DE CAIXA
// ==========================================
export interface LancamentoCaixa {
  id?: string;
  tipo: 'entrada' | 'saida';
  categoria: 'comissao_recebida' | 'comissao_paga' | 'despesa' | 'folha' | 'outros';
  descricao: string;
  valor: number;
  dataVencimento: Date;
  dataPagamento?: Date;
  status: 'previsto' | 'realizado' | 'atrasado' | 'cancelado';
  origem?: string; // ID da origem (venda, despesa, folha, etc)
  origemTipo?: 'venda' | 'despesa' | 'folha' | 'manual';
  formaPagamento?: string;
  observacoes?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface ProjecaoFluxoCaixa {
  periodo: string; // "2026-01" formato ano-mês
  entradasPrevistas: number;
  entradasRealizadas: number;
  saidasPrevistas: number;
  saidasRealizadas: number;
  saldoPrevisto: number;
  saldoRealizado: number;
  saldoAcumulado: number;
}

// ==========================================
// METAS E PERFORMANCE
// ==========================================
export interface Meta {
  id?: string;
  tipo: 'vendas' | 'comissoes' | 'clientes' | 'ticket_medio';
  periodo: string; // "2026-01" formato ano-mês
  funcionarioId?: string; // null = meta geral da empresa
  valorMeta: number;
  valorRealizado: number;
  percentualAtingido: number;
  status: 'em_andamento' | 'atingida' | 'nao_atingida' | 'superada';
  premiacao?: number; // Valor de bônus se atingir
  observacoes?: string;
  criadoEm: Date;
  atualizadoEm: Date;
  criadoPor: string;
}

export interface PerformanceFuncionario {
  funcionarioId: string;
  funcionarioNome: string;
  periodo: string;
  totalVendas: number;
  valorVendido: number;
  comissoesGeradas: number;
  comissoesRecebidas: number;
  ticketMedio: number;
  taxaConversao: number;
  metasAtingidas: number;
  metasTotais: number;
  ranking: number;
}

// ==========================================
// AUDITORIA
// ==========================================
export interface AuditLog {
  id?: string;
  entidade: string; // "vendas", "despesas", "funcionarios", etc
  entidadeId: string;
  acao: 'criar' | 'editar' | 'deletar';
  usuario: string;
  usuarioId: string;
  campo?: string;
  valorAnterior?: any;
  valorNovo?: any;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
}

// ==========================================
// NOTIFICAÇÕES
// ==========================================
export interface Notificacao {
  id?: string;
  tipo: 'despesa_vencendo' | 'folha_pendente' | 'meta_proxima' | 'comissao_atrasada' | 'alerta_sistema';
  titulo: string;
  mensagem: string;
  destinatarioId?: string; // null = todos
  destinatarioCargo?: string; // "admin", "gerente", etc
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  lida: boolean;
  dataLeitura?: Date;
  link?: string; // Link para a tela relevante
  entidadeRelacionada?: string;
  entidadeRelacionadaId?: string;
  criadoEm: Date;
}

export interface ConfiguracaoNotificacao {
  id?: string;
  tipo: 'despesa_vencendo' | 'folha_pendente' | 'meta_proxima' | 'comissao_atrasada';
  ativo: boolean;
  diasAntecedencia: number; // Quantos dias antes avisar
  cargosNotificados: string[]; // ["admin", "gerente"]
  email: boolean;
  sistema: boolean;
  whatsapp?: boolean;
}

// ==========================================
// CAPACIDADE E PIPELINE
// ==========================================
export interface CapacidadeAtendimento {
  id?: string;
  funcionarioId?: string; // null = capacidade total da empresa
  periodo: string; // "2026-01"
  capacidadeMaxima: number; // Número máximo de atendimentos
  atendimentosRealizados: number;
  atendimentosEmAndamento: number;
  percentualOcupacao: number;
  status: 'disponivel' | 'medio' | 'sobrecarregado';
}

export interface PipelineVendas {
  id?: string;
  clienteId: string;
  funcionarioId: string;
  produtoId: string;
  estagio: 'lead' | 'contato' | 'proposta' | 'negociacao' | 'fechamento' | 'ganho' | 'perdido';
  valorEstimado: number;
  probabilidade: number; // 0-100
  dataInicio: Date;
  dataPrevisaoFechamento: Date;
  dataFechamento?: Date;
  motivoPerdido?: string;
  observacoes?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}
