// Tipos para Folha de Pagamento - Regras Brasileiras 2026

export interface FolhaPagamento {
  id: string;
  funcionarioId: string;
  mesReferencia: string; // formato: "YYYY-MM"
  salarioBruto: number;
  descontos: Descontos;
  proventos: Proventos;
  encargos: EncargosPatronais;
  salarioLiquido: number;
  fgts: number; // FGTS não é desconto do salário, mas deve ser calculado e registrado
  status: 'rascunho' | 'processada' | 'paga';
  dataPagamento?: Date;
  criadoEm: Date;
  atualizadoEm: Date;
  // Dados para eSocial
  numeroDependentes?: number;
  diasTrabalhados?: number;
  diasFaltas?: number;
  horasExtras50?: number;
  horasExtras100?: number;
  horasAdicionalNoturno?: number;
  observacoes?: string;
}

export interface Descontos {
  inss: number;
  irrf: number;
  valeTransporte: number;
  valeRefeicao: number;
  planoDeSaude: number;
  faltas: number;
  outros: number;
  total: number;
}

export interface Proventos {
  salarioBase: number;
  horasExtras50: number;
  horasExtras100: number;
  adicionalNoturno: number;
  dsr: number; // Descanso Semanal Remunerado sobre horas extras e adicionais
  comissoes: number;
  bonus: number;
  insalubridade: number;
  periculosidade: number;
  salarioFamilia: number; // Salário família conforme legislação brasileira
  outros: number;
  total: number;
}

export interface EncargosPatronais {
  fgts: number; // 8%
  provisaoFerias: number; // 1/12 do salário + 1/3
  provisao13Salario: number; // 1/12 do salário
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
  horasMensais: number; // padrão 220 horas
  horasDiarias: number; // padrão 8 horas
}

// Tabelas INSS 2026 - Alíquotas Progressivas (CLT)
// Fonte: Portaria Interministerial MPS/MF nº 26/2026
export const TABELA_INSS_2026 = [
  { ate: 1518.00, aliquota: 0.075 },  // até R$ 1.518,00 - 7,5%
  { ate: 2793.88, aliquota: 0.09 },   // de R$ 1.518,01 até R$ 2.793,88 - 9%
  { ate: 4190.83, aliquota: 0.12 },   // de R$ 2.793,89 até R$ 4.190,83 - 12%
  { ate: 8157.41, aliquota: 0.14 },   // acima de R$ 4.190,84 - 14%
];

// Teto máximo de contribuição INSS 2026
export const TETO_INSS_2026 = 8157.41;

// Tabelas IRRF 2026 - Imposto de Renda Retido na Fonte
// Fonte: Lei nº 14.848/2024 (atualização da tabela)
export const TABELA_IRRF_2026 = [
  { ate: 2259.20, aliquota: 0, deducao: 0 },          // Isento
  { ate: 2826.65, aliquota: 0.075, deducao: 169.44 }, // 7,5%
  { ate: 3751.05, aliquota: 0.15, deducao: 381.44 },  // 15%
  { ate: 4664.68, aliquota: 0.225, deducao: 662.77 }, // 22,5%
  { ate: Infinity, aliquota: 0.275, deducao: 896.00 }, // 27,5%
];

// Dedução por dependente - IRRF 2026
export const DEDUCAO_POR_DEPENDENTE_2026 = 189.59;

// Salário mínimo 2026
export const SALARIO_MINIMO_2026 = 1518.00;

// Salário Família 2026 - Portaria Interministerial MPS/MF
// Benefício pago aos trabalhadores com filhos de até 14 anos ou inválidos
export const TABELA_SALARIO_FAMILIA_2026 = [
  { ate: 1819.26, valorPorFilho: 62.04 },  // Até R$ 1.819,26 - R$ 62,04 por filho
  // Acima de R$ 1.819,26 não tem direito ao salário família
];

// ============================================
// FUNÇÕES DE CÁLCULO - FOLHA DE PAGAMENTO 2026
// ============================================

/**
 * Calcula o Salário Família conforme legislação brasileira 2026
 * Benefício devido ao segurado com salário até R$ 1.819,26
 * @param salarioBruto Salário bruto do funcionário
 * @param numeroFilhos Número de filhos de até 14 anos ou inválidos
 * @returns Valor do salário família
 */
export function calcularSalarioFamilia(
  salarioBruto: number,
  numeroFilhos: number = 0
): number {
  if (numeroFilhos <= 0) return 0;
  
  // Verifica se o salário está dentro do limite
  const faixa = TABELA_SALARIO_FAMILIA_2026.find(f => salarioBruto <= f.ate);
  
  if (!faixa) return 0; // Acima do limite não tem direito
  
  const valorTotal = faixa.valorPorFilho * numeroFilhos;
  return Number(valorTotal.toFixed(2));
}

/**
 * Calcula o INSS com base nas alíquotas progressivas de 2026
 * @param salarioBruto Salário bruto do funcionário
 * @returns Valor do desconto de INSS
 */
export function calcularINSS(salarioBruto: number): number {
  let inss = 0;
  let salarioRestante = salarioBruto;
  let faixaAnterior = 0;

  for (const faixa of TABELA_INSS_2026) {
    if (salarioRestante <= 0) break;

    const baseCalculo = Math.min(salarioRestante, faixa.ate - faixaAnterior);
    inss += baseCalculo * faixa.aliquota;

    salarioRestante -= baseCalculo;
    faixaAnterior = faixa.ate;
  }

  return Number(inss.toFixed(2));
}

/**
 * Calcula o IRRF com base na tabela progressiva de 2026
 * @param salarioBruto Salário bruto do funcionário
 * @param inss Valor do desconto de INSS
 * @param numeroDependentes Número de dependentes para dedução
 * @returns Valor do desconto de IRRF
 */
export function calcularIRRF(
  salarioBruto: number,
  inss: number,
  numeroDependentes: number = 0
): number {
  const deducaoDependentes = numeroDependentes * DEDUCAO_POR_DEPENDENTE_2026;
  const baseCalculo = salarioBruto - inss - deducaoDependentes;

  if (baseCalculo <= 0) return 0;

  let faixaAplicavel = TABELA_IRRF_2026[0];
  for (const faixa of TABELA_IRRF_2026) {
    if (baseCalculo <= faixa.ate) {
      faixaAplicavel = faixa;
      break;
    }
  }

  const irrf = (baseCalculo * faixaAplicavel.aliquota) - faixaAplicavel.deducao;
  return Math.max(0, Number(irrf.toFixed(2)));
}

/**
 * Calcula o Vale Transporte (6% do salário, limitado ao custo do VT)
 * @param salarioBruto Salário bruto do funcionário
 * @param custoVT Custo mensal do vale transporte
 * @param optouPorVT Se o funcionário optou por receber VT
 * @returns Valor do desconto de Vale Transporte
 */
export function calcularValeTransporte(
  salarioBruto: number,
  custoVT: number,
  optouPorVT: boolean
): number {
  if (!optouPorVT) return 0;
  const desconto = salarioBruto * 0.06;
  return Number(Math.min(desconto, custoVT).toFixed(2));
}

/**
 * Calcula o FGTS (8% sobre o salário bruto)
 * @param salarioBruto Salário bruto do funcionário
 * @returns Valor do FGTS (encargo patronal)
 */
export function calcularFGTS(salarioBruto: number): number {
  return Number((salarioBruto * 0.08).toFixed(2));
}

/**
 * Calcula horas extras com adicional de 50%
 * @param salarioBase Salário base do funcionário
 * @param horasExtras Quantidade de horas extras
 * @param horasMensais Carga horária mensal (padrão: 220h)
 * @returns Valor das horas extras 50%
 */
export function calcularHorasExtras50(
  salarioBase: number,
  horasExtras: number,
  horasMensais: number = 220
): number {
  const valorHora = salarioBase / horasMensais;
  const valorHoraExtra = valorHora * 1.5;
  return Number((horasExtras * valorHoraExtra).toFixed(2));
}

/**
 * Calcula horas extras com adicional de 100% (domingos e feriados)
 * @param salarioBase Salário base do funcionário
 * @param horasExtras Quantidade de horas extras
 * @param horasMensais Carga horária mensal (padrão: 220h)
 * @returns Valor das horas extras 100%
 */
export function calcularHorasExtras100(
  salarioBase: number,
  horasExtras: number,
  horasMensais: number = 220
): number {
  const valorHora = salarioBase / horasMensais;
  const valorHoraExtra = valorHora * 2.0;
  return Number((horasExtras * valorHoraExtra).toFixed(2));
}

/**
 * Calcula adicional noturno (20% sobre a hora normal)
 * @param salarioBase Salário base do funcionário
 * @param horasNoturnas Quantidade de horas noturnas (22h às 5h)
 * @param horasMensais Carga horária mensal (padrão: 220h)
 * @returns Valor do adicional noturno
 */
export function calcularAdicionalNoturno(
  salarioBase: number,
  horasNoturnas: number,
  horasMensais: number = 220
): number {
  const valorHora = salarioBase / horasMensais;
  // Hora noturna reduzida: 52min30s (7/8 da hora normal)
  const horasNoturnasReduzidas = horasNoturnas * (60 / 52.5);
  const valorAdicional = valorHora * 0.20 * horasNoturnasReduzidas;
  return Number(valorAdicional.toFixed(2));
}

/**
 * Calcula o DSR (Descanso Semanal Remunerado) sobre horas extras e adicionais
 * @param totalHorasExtrasEAdicionais Soma das horas extras e adicionais noturnos
 * @param diasUteis Dias úteis no mês
 * @param diasDSR Dias de descanso no mês (domingos e feriados)
 * @returns Valor do DSR
 */
export function calcularDSR(
  totalHorasExtrasEAdicionais: number,
  diasUteis: number,
  diasDSR: number
): number {
  if (diasUteis === 0) return 0;
  const dsr = (totalHorasExtrasEAdicionais / diasUteis) * diasDSR;
  return Number(dsr.toFixed(2));
}

/**
 * Calcula desconto por faltas injustificadas
 * @param salarioBase Salário base do funcionário
 * @param diasFaltas Quantidade de dias de faltas
 * @param diasUteis Dias úteis no mês
 * @returns Valor do desconto por faltas
 */
export function calcularDescontoFaltas(
  salarioBase: number,
  diasFaltas: number,
  diasUteis: number
): number {
  if (diasUteis === 0 || diasFaltas === 0) return 0;
  const valorDia = salarioBase / diasUteis;
  return Number((valorDia * diasFaltas).toFixed(2));
}

/**
 * Calcula a provisão de férias (1/12 do salário + 1/3 constitucional)
 * @param salarioBruto Salário bruto do funcionário
 * @returns Valor da provisão mensal de férias
 */
export function calcularProvisaoFerias(salarioBruto: number): number {
  const provisaoMensal = (salarioBruto / 12) * (1 + 1/3);
  return Number(provisaoMensal.toFixed(2));
}

/**
 * Calcula a provisão do 13º salário (1/12 do salário)
 * @param salarioBruto Salário bruto do funcionário
 * @returns Valor da provisão mensal do 13º salário
 */
export function calcularProvisao13Salario(salarioBruto: number): number {
  const provisaoMensal = salarioBruto / 12;
  return Number(provisaoMensal.toFixed(2));
}

/**
 * Calcula os encargos patronais totais
 * @param salarioBruto Salário bruto do funcionário
 * @returns Objeto com FGTS, provisão de férias, 13º e total
 */
export function calcularEncargosPatronais(salarioBruto: number): EncargosPatronais {
  const fgts = calcularFGTS(salarioBruto);
  const provisaoFerias = calcularProvisaoFerias(salarioBruto);
  const provisao13Salario = calcularProvisao13Salario(salarioBruto);
  const total = fgts + provisaoFerias + provisao13Salario;

  return {
    fgts,
    provisaoFerias,
    provisao13Salario,
    total: Number(total.toFixed(2)),
  };
}

/**
 * Calcula o salário líquido
 * @param proventos Objeto com todos os proventos
 * @param descontos Objeto com todos os descontos
 * @returns Valor do salário líquido
 */
export function calcularSalarioLiquido(
  proventos: Proventos,
  descontos: Descontos
): number {
  return Number((proventos.total - descontos.total).toFixed(2));
}

/**
 * Calcula a folha de pagamento completa de um funcionário
 * @param params Parâmetros para cálculo da folha
 * @returns Objeto FolhaPagamento completo
 */
export interface CalculoFolhaParams {
  funcionarioId: string;
  mesReferencia: string;
  salarioBase: number;
  horasExtras50?: number;
  horasExtras100?: number;
  horasAdicionalNoturno?: number;
  comissoes?: number;
  bonus?: number;
  insalubridade?: number;
  periculosidade?: number;
  outrosProventos?: number;
  valeRefeicao?: number;
  planoDeSaude?: number;
  outrosDescontos?: number;
  optouVT?: boolean;
  custoVT?: number;
  numeroDependentes?: number;
  numeroFilhos?: number; // Para cálculo do salário família
  diasFaltas?: number;
  diasUteis?: number;
  diasDSR?: number;
  horasMensais?: number;
}

export function calcularFolhaPagamentoCompleta(params: CalculoFolhaParams): Partial<FolhaPagamento> {
  const {
    funcionarioId,
    mesReferencia,
    salarioBase,
    horasExtras50 = 0,
    horasExtras100 = 0,
    horasAdicionalNoturno = 0,
    comissoes = 0,
    bonus = 0,
    insalubridade = 0,
    periculosidade = 0,
    outrosProventos = 0,
    valeRefeicao = 0,
    planoDeSaude = 0,
    outrosDescontos = 0,
    optouVT = true,
    custoVT = 0,
    numeroDependentes = 0,
    numeroFilhos = 0,
    diasFaltas = 0,
    diasUteis = 22,
    diasDSR = 8,
    horasMensais = 220,
  } = params;

  // Garantir que todos os valores numéricos sejam válidos
  const salarioBaseNum = Number(salarioBase) || 0;
  const horasExtras50Num = Number(horasExtras50) || 0;
  const horasExtras100Num = Number(horasExtras100) || 0;
  const horasAdicionalNoturnoNum = Number(horasAdicionalNoturno) || 0;
  const comissoesNum = Number(comissoes) || 0;
  const bonusNum = Number(bonus) || 0;
  const insalubridadeNum = Number(insalubridade) || 0;
  const periculosidadeNum = Number(periculosidade) || 0;
  const outrosProventosNum = Number(outrosProventos) || 0;
  const valeRefeicaoNum = Number(valeRefeicao) || 0;
  const planoDeSaudeNum = Number(planoDeSaude) || 0;
  const outrosDescontosNum = Number(outrosDescontos) || 0;
  const custoVTNum = Number(custoVT) || 0;
  const numeroDependentesNum = Number(numeroDependentes) || 0;
  const numeroFilhosNum = Number(numeroFilhos) || 0;
  const diasFaltasNum = Number(diasFaltas) || 0;
  const diasUteisNum = Number(diasUteis) || 22;
  const diasDSRNum = Number(diasDSR) || 8;
  const horasMensaisNum = Number(horasMensais) || 220;

  // Calcular proventos
  const valorHE50 = calcularHorasExtras50(salarioBaseNum, horasExtras50Num, horasMensaisNum);
  const valorHE100 = calcularHorasExtras100(salarioBaseNum, horasExtras100Num, horasMensaisNum);
  const valorAdicNoturno = calcularAdicionalNoturno(salarioBaseNum, horasAdicionalNoturnoNum, horasMensaisNum);
  
  const totalHEeAdicionais = valorHE50 + valorHE100 + valorAdicNoturno;
  const valorDSR = calcularDSR(totalHEeAdicionais, diasUteisNum, diasDSRNum);
  
  // Calcular salário família (baseado no salário base, antes dos adicionais)
  const valorSalarioFamilia = calcularSalarioFamilia(salarioBaseNum, numeroFilhosNum);

  const proventos: Proventos = {
    salarioBase: salarioBaseNum,
    horasExtras50: Number(valorHE50) || 0,
    horasExtras100: Number(valorHE100) || 0,
    adicionalNoturno: Number(valorAdicNoturno) || 0,
    dsr: Number(valorDSR) || 0,
    comissoes: comissoesNum,
    bonus: bonusNum,
    insalubridade: insalubridadeNum,
    periculosidade: periculosidadeNum,
    salarioFamilia: Number(valorSalarioFamilia) || 0,
    outros: outrosProventosNum,
    total: 0,
  };
  
  const totalProventos = 
    salarioBaseNum + 
    (Number(valorHE50) || 0) + 
    (Number(valorHE100) || 0) + 
    (Number(valorAdicNoturno) || 0) + 
    (Number(valorDSR) || 0) +
    comissoesNum + 
    bonusNum + 
    insalubridadeNum + 
    periculosidadeNum + 
    (Number(valorSalarioFamilia) || 0) +
    outrosProventosNum;
  
  proventos.total = Number(totalProventos.toFixed(2));

  // Calcular descontos
  const valorFaltas = calcularDescontoFaltas(salarioBaseNum, diasFaltasNum, diasUteisNum);
  const baseCalculo = proventos.total - (Number(valorFaltas) || 0);
  
  const inss = calcularINSS(baseCalculo);
  const irrf = calcularIRRF(baseCalculo, inss, numeroDependentesNum);
  const valeTransporte = calcularValeTransporte(baseCalculo, custoVTNum, optouVT);

  const descontos: Descontos = {
    inss: Number(inss) || 0,
    irrf: Number(irrf) || 0,
    valeTransporte: Number(valeTransporte) || 0,
    valeRefeicao: valeRefeicaoNum,
    planoDeSaude: planoDeSaudeNum,
    faltas: Number(valorFaltas) || 0,
    outros: outrosDescontosNum,
    total: 0,
  };
  
  const totalDescontos = 
    (Number(inss) || 0) + 
    (Number(irrf) || 0) + 
    (Number(valeTransporte) || 0) + 
    valeRefeicaoNum + 
    planoDeSaudeNum + 
    (Number(valorFaltas) || 0) + 
    outrosDescontosNum;
  
  descontos.total = Number(totalDescontos.toFixed(2));

  // Calcular encargos patronais
  const encargos = calcularEncargosPatronais(proventos.total);

  // Calcular salário líquido
  const salarioLiquido = calcularSalarioLiquido(proventos, descontos);

  return {
    funcionarioId,
    mesReferencia,
    salarioBruto: proventos.total,
    proventos,
    descontos,
    encargos,
    salarioLiquido,
    fgts: encargos.fgts,
    numeroDependentes,
    diasFaltas,
    horasExtras50,
    horasExtras100,
    horasAdicionalNoturno,
    status: 'rascunho',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  };
}
