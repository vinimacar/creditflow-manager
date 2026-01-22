// Tipos para CRM Básico

export type ClienteStatus = 'ativo' | 'inativo' | 'prospect' | 'em negociação' | 'perdido';

export interface InteracaoCRM {
  id: string;
  clienteId: string;
  data: Date;
  tipo: 'ligacao' | 'email' | 'reuniao' | 'whatsapp' | 'outro';
  descricao: string;
  responsavel: string;
}

export interface FollowUpCRM {
  id: string;
  clienteId: string;
  data: Date;
  descricao: string;
  responsavel: string;
  status: 'pendente' | 'concluido';
}

export interface ClienteCRM {
  id: string;
  nome: string;
  status: ClienteStatus;
  interacoes: InteracaoCRM[];
  followUps: FollowUpCRM[];
  criadoEm: Date;
  atualizadoEm: Date;
}
