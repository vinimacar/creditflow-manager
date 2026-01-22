// Funções iniciais para CRM Básico
import { ClienteCRM, InteracaoCRM, FollowUpCRM, ClienteStatus } from '../types/crm';

// Mock: banco de dados em memória (substituir por Firestore depois)
const clientes: ClienteCRM[] = [];

export function criarCliente(cliente: Omit<ClienteCRM, 'id' | 'criadoEm' | 'atualizadoEm' | 'interacoes' | 'followUps'>): ClienteCRM {
  const novo: ClienteCRM = {
    ...cliente,
    id: Math.random().toString(36).slice(2),
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    interacoes: [],
    followUps: [],
  };
  clientes.push(novo);
  return novo;
}

export function registrarInteracao(clienteId: string, interacao: Omit<InteracaoCRM, 'id' | 'clienteId'>): InteracaoCRM | null {
  const cliente = clientes.find(c => c.id === clienteId);
  if (!cliente) return null;
  const nova: InteracaoCRM = {
    ...interacao,
    id: Math.random().toString(36).slice(2),
    clienteId,
  };
  cliente.interacoes.push(nova);
  cliente.atualizadoEm = new Date();
  return nova;
}

export function agendarFollowUp(clienteId: string, followUp: Omit<FollowUpCRM, 'id' | 'clienteId' | 'status'>): FollowUpCRM | null {
  const cliente = clientes.find(c => c.id === clienteId);
  if (!cliente) return null;
  const novo: FollowUpCRM = {
    ...followUp,
    id: Math.random().toString(36).slice(2),
    clienteId,
    status: 'pendente',
  };
  cliente.followUps.push(novo);
  cliente.atualizadoEm = new Date();
  return novo;
}

export function atualizarStatusCliente(clienteId: string, status: ClienteStatus): boolean {
  const cliente = clientes.find(c => c.id === clienteId);
  if (!cliente) return false;
  cliente.status = status;
  cliente.atualizadoEm = new Date();
  return true;
}

export function listarClientes(): ClienteCRM[] {
  return clientes;
}
