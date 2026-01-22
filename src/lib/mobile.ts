// Funções mock para integração e notificações Mobile/WhatsApp
import { Notificacao, WhatsAppMensagem, CanalNotificacao } from '../types/mobile';

// Mock: notificações em memória (substituir por integração real depois)
let notificacoes: Notificacao[] = [];
let mensagensWhatsApp: WhatsAppMensagem[] = [];

export function enviarNotificacao(notificacao: Omit<Notificacao, 'id' | 'data' | 'status'>): Notificacao {
  const nova: Notificacao = {
    ...notificacao,
    id: Math.random().toString(36).slice(2),
    data: new Date(),
    status: 'enviada',
  };
  notificacoes.push(nova);
  return nova;
}

export function enviarWhatsApp(mensagem: Omit<WhatsAppMensagem, 'id' | 'data' | 'status'>): WhatsAppMensagem {
  const nova: WhatsAppMensagem = {
    ...mensagem,
    id: Math.random().toString(36).slice(2),
    data: new Date(),
    status: 'enviada',
  };
  mensagensWhatsApp.push(nova);
  return nova;
}

export function listarNotificacoes(): Notificacao[] {
  return notificacoes;
}

export function listarMensagensWhatsApp(): WhatsAppMensagem[] {
  return mensagensWhatsApp;
}
