// Tipos para Gestão de Contratos

export type ContratoStatus = 'ativo' | 'inativo' | 'em renovação' | 'cancelado' | 'expirado';

export interface AssinaturaContrato {
  id: string;
  contratoId: string;
  data: Date;
  signatario: string;
  tipo: 'eletrônica' | 'manual';
}

export interface AditivoContrato {
  id: string;
  contratoId: string;
  data: Date;
  descricao: string;
}

export interface Contrato {
  id: string;
  clienteId: string;
  status: ContratoStatus;
  dataInicio: Date;
  dataFim: Date;
  assinaturas: AssinaturaContrato[];
  aditivos: AditivoContrato[];
  criadoEm: Date;
  atualizadoEm: Date;
}
