// Tipos para integração e notificações Mobile/WhatsApp

export type CanalNotificacao = 'whatsapp' | 'sms' | 'push' | 'email';

export interface Notificacao {
  id: string;
  usuarioId: string;
  canal: CanalNotificacao;
  mensagem: string;
  data: Date;
  status: 'enviada' | 'pendente' | 'erro';
}

export interface WhatsAppMensagem {
  id: string;
  usuarioId: string;
  numero: string;
  mensagem: string;
  data: Date;
  status: 'enviada' | 'pendente' | 'erro';
}
