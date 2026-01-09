// Tipos para Folha de Pagamento - Regras Brasileiras

export interface FolhaPagamento {
  id: string;
  funcionarioId: string;
  mesReferencia: string; // formato: "YYYY-MM"
  salarioBruto: number;
  descontos: Descontos;
  proventos: Proventos;
  salarioLiquido: number;
  fgts: number; // FGTS não é desconto do salário, mas deve ser calculado e registrado
  status: 'rascunho' | 'processada' | 'paga';
  dataPagamento?: Date;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface Descontos {
  inss: number;
  irrf: number;
  valeTransporte: number;
  valeRefeicao: number;
  planoDeSaude: number;
  outros: number;
  total: number;
}

export interface Proventos {
  salarioBase: number;
  horasExtras: number;
  comissoes: number;
  bonus: number;
  adicionalNoturno: number;
  insalubridade: number;
  periculosidade: number;
  outros: number;
  total: number;
}

export interface SalarioVigente {
  id?: string;
  funcionarioId: string;
  salarioBase: number;
  dataVigencia: Date;
  observacao?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface ConfiguracaoFolha {
  valeTransportePercentual: number; // padrão 6%
  valeRefeicaoValor: number;
  planoDeSaudeValor: number;
  fgtsPercentual: number; // padrão 8%
}

// Tabelas INSS 2026 - Alíquotas Progressivas
export const TABELA_INSS = [
  { ate: 1412.00, aliquota: 0.075 },
  { ate: 2666.68, aliquota: 0.09 },
  { ate: 4000.03, aliquota: 0.12 },
  { ate: 7786.02, aliquota: 0.14 },
];

// Tabelas IRRF 2026
export const TABELA_IRRF = [
  { ate: 2259.20, aliquota: 0, deducao: 0 },
  { ate: 2826.65, aliquota: 0.075, deducao: 169.44 },
  { ate: 3751.05, aliquota: 0.15, deducao: 381.44 },
  { ate: 4664.68, aliquota: 0.225, deducao: 662.77 },
  { ate: Infinity, aliquota: 0.275, deducao: 896.00 },
];

export const DEDUCAO_POR_DEPENDENTE = 189.59;

// Função para calcular INSS com alíquotas progressivas
export function calcularINSS(salarioBruto: number): number {
  let inss = 0;
  let salarioRestante = salarioBruto;
  let faixaAnterior = 0;

  for (const faixa of TABELA_INSS) {
    if (salarioRestante <= 0) break;

    const baseCalculo = Math.min(salarioRestante, faixa.ate - faixaAnterior);
    inss += baseCalculo * faixa.aliquota;

    salarioRestante -= baseCalculo;
    faixaAnterior = faixa.ate;
  }

  return Number(inss.toFixed(2));
}

// Função para calcular IRRF
export function calcularIRRF(
  salarioBruto: number,
  inss: number,
  numeroDependentes: number = 0
): number {
  const baseCalculo = salarioBruto - inss - (numeroDependentes * DEDUCAO_POR_DEPENDENTE);

  if (baseCalculo <= 0) return 0;

  let faixaAplicavel = TABELA_IRRF[0];
  for (const faixa of TABELA_IRRF) {
    if (baseCalculo <= faixa.ate) {
      faixaAplicavel = faixa;
      break;
    }
  }

  const irrf = (baseCalculo * faixaAplicavel.aliquota) - faixaAplicavel.deducao;
  return Math.max(0, Number(irrf.toFixed(2)));
}

// Função para calcular Vale Transporte (6% do salário, limitado ao custo do VT)
export function calcularValeTransporte(
  salarioBruto: number,
  custoVT: number,
  optouPorVT: boolean
): number {
  if (!optouPorVT) return 0;
  const desconto = salarioBruto * 0.06;
  return Math.min(desconto, custoVT);
}

// Função para calcular FGTS (8% sobre o salário bruto)
export function calcularFGTS(salarioBruto: number): number {
  return Number((salarioBruto * 0.08).toFixed(2));
}

// Função para calcular o salário líquido
export function calcularSalarioLiquido(
  proventos: Proventos,
  descontos: Descontos
): number {
  return Number((proventos.total - descontos.total).toFixed(2));
}
