// Tipos e funções para cálculos financeiros (juros, taxas, simulação de empréstimos)

export type TipoEmprestimo = 'consignado' | 'pessoal';

export interface SimulacaoEmprestimo {
  tipo: TipoEmprestimo;
  valorSolicitado: number;
  taxaJurosAnual: number; // Ex: 18.5 para 18,5% a.a.
  prazoMeses: number;
  valorParcela: number;
  valorTotal: number;
  custoEfetivoTotal: number;
  tabela: Array<{ mes: number; saldoDevedor: number; juros: number; amortizacao: number; parcela: number; }>
}

// Juros simples
export function calcularJurosSimples(valor: number, taxaAnual: number, meses: number): number {
  const taxaMensal = taxaAnual / 12 / 100;
  return valor * taxaMensal * meses;
}

// Juros compostos
export function calcularJurosCompostos(valor: number, taxaAnual: number, meses: number): number {
  const taxaMensal = taxaAnual / 12 / 100;
  return valor * (Math.pow(1 + taxaMensal, meses) - 1);
}

// Cálculo de parcela de empréstimo (Tabela Price)
export function calcularParcelaPrice(valor: number, taxaAnual: number, meses: number): number {
  const taxaMensal = taxaAnual / 12 / 100;
  if (taxaMensal === 0) return valor / meses;
  return valor * (taxaMensal * Math.pow(1 + taxaMensal, meses)) / (Math.pow(1 + taxaMensal, meses) - 1);
}

// Simulação de empréstimo consignado ou pessoal
export function simularEmprestimo(tipo: TipoEmprestimo, valor: number, taxaAnual: number, meses: number): SimulacaoEmprestimo {
  const valorParcela = calcularParcelaPrice(valor, taxaAnual, meses);
  let saldoDevedor = valor;
  const tabela = [];
  let valorTotal = 0;
  for (let mes = 1; mes <= meses; mes++) {
    const juros = saldoDevedor * (taxaAnual / 12 / 100);
    const amortizacao = valorParcela - juros;
    tabela.push({ mes, saldoDevedor: Math.max(saldoDevedor, 0), juros, amortizacao, parcela: valorParcela });
    saldoDevedor -= amortizacao;
    valorTotal += valorParcela;
  }
  // CET (Custo Efetivo Total) pode incluir taxas administrativas, seguros, etc. Aqui só juros.
  return {
    tipo,
    valorSolicitado: valor,
    taxaJurosAnual: taxaAnual,
    prazoMeses: meses,
    valorParcela,
    valorTotal,
    custoEfetivoTotal: valorTotal,
    tabela,
  };
}
