// Tipos para personalização avançada de temas

export type TemaNome = 'claro' | 'escuro' | 'custom';

export interface PaletaCores {
  primaria: string;
  secundaria: string;
  fundo: string;
  texto: string;
  destaque?: string;
}

export interface ConfiguracaoTema {
  nome: TemaNome;
  paleta: PaletaCores;
  logoUrl?: string;
}

export interface Personalizacao {
  temaAtual: TemaNome;
  temasDisponiveis: ConfiguracaoTema[];
  logoUrl?: string;
}
