// Funções para personalização avançada de temas
import { Personalizacao, ConfiguracaoTema, TemaNome, PaletaCores } from '../types/personalizacao';

// Mock: configuração em memória (substituir por persistência depois)
let personalizacao: Personalizacao = {
  temaAtual: 'claro',
  temasDisponiveis: [
    {
      nome: 'claro',
      paleta: {
        primaria: '#2563eb',
        secundaria: '#fbbf24',
        fundo: '#ffffff',
        texto: '#111827',
      },
    },
    {
      nome: 'escuro',
      paleta: {
        primaria: '#2563eb',
        secundaria: '#fbbf24',
        fundo: '#111827',
        texto: '#ffffff',
      },
    },
  ],
  logoUrl: '',
};

export function definirTema(nome: TemaNome) {
  personalizacao.temaAtual = nome;
}

export function atualizarPaleta(tema: TemaNome, paleta: PaletaCores) {
  const t = personalizacao.temasDisponiveis.find(t => t.nome === tema);
  if (t) t.paleta = paleta;
}

export function exportarConfiguracao(): Personalizacao {
  return JSON.parse(JSON.stringify(personalizacao));
}

export function importarConfiguracao(config: Personalizacao) {
  personalizacao = JSON.parse(JSON.stringify(config));
}

export function definirLogo(url: string) {
  personalizacao.logoUrl = url;
}

export function obterPersonalizacao(): Personalizacao {
  return personalizacao;
}
