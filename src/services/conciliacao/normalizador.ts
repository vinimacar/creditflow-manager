/**
 * Motor de Conciliação de Comissões Bancárias
 * Serviço de Normalização de Dados
 * 
 * @module services/conciliacao/normalizador
 * @description Responsável por normalizar e sanitizar dados de entrada
 */

import type { ContratoInterno, PagamentoBanco, ProdutoBancario } from "@/types/conciliacao";

// ============================================================================
// NORMALIZAÇÃO DE CPF
// ============================================================================

/**
 * Remove formatação do CPF e retorna apenas números
 * @param cpf - CPF com ou sem formatação
 * @returns CPF normalizado (apenas números)
 */
export function normalizarCPF(cpf: string): string {
  if (!cpf) return "";
  
  // Remove tudo que não é número
  return cpf.replace(/\D/g, "");
}

/**
 * Valida se um CPF é válido
 * @param cpf - CPF a ser validado
 * @returns true se válido
 */
export function validarCPF(cpf: string): boolean {
  const cpfLimpo = normalizarCPF(cpf);
  
  // Verifica se tem 11 dígitos
  if (cpfLimpo.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;
  
  // Validação dos dígitos verificadores
  let soma = 0;
  let resto;
  
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
  }
  
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(9, 10))) return false;
  
  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
  }
  
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(10, 11))) return false;
  
  return true;
}

// ============================================================================
// NORMALIZAÇÃO DE DATAS
// ============================================================================

/**
 * Normaliza uma data para o formato ISO
 * @param data - Data em diversos formatos possíveis
 * @returns Data normalizada ou null se inválida
 */
export function normalizarData(data: string | Date | number | null | undefined): Date | null {
  if (!data) return null;
  
  // Se já é um objeto Date válido
  if (data instanceof Date && !isNaN(data.getTime())) {
    return data;
  }
  
  // Se é timestamp numérico
  if (typeof data === "number") {
    const date = new Date(data);
    return !isNaN(date.getTime()) ? date : null;
  }
  
  // Se é string
  if (typeof data === "string") {
    // Tenta converter diretamente
    let date = new Date(data);
    if (!isNaN(date.getTime())) return date;
    
    // Tenta formatos brasileiros: DD/MM/YYYY ou DD-MM-YYYY
    const brDateMatch = data.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
    if (brDateMatch) {
      const [, dia, mes, ano] = brDateMatch;
      date = new Date(`${ano}-${mes}-${dia}`);
      if (!isNaN(date.getTime())) return date;
    }
    
    // Tenta formato YYYY-MM-DD
    const isoMatch = data.match(/^(\d{4})[/-](\d{2})[/-](\d{2})$/);
    if (isoMatch) {
      date = new Date(data);
      if (!isNaN(date.getTime())) return date;
    }
  }
  
  return null;
}

/**
 * Verifica se uma data está dentro de uma janela de dias
 * @param data - Data a verificar
 * @param dataReferencia - Data de referência
 * @param janelaDias - Número de dias de tolerância
 * @returns true se está dentro da janela
 */
export function dentroJanelaDias(
  data: Date,
  dataReferencia: Date,
  janelaDias: number
): boolean {
  const diffMs = Math.abs(data.getTime() - dataReferencia.getTime());
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDias <= janelaDias;
}

// ============================================================================
// NORMALIZAÇÃO DE VALORES MONETÁRIOS
// ============================================================================

/**
 * Normaliza valores monetários removendo formatação
 * @param valor - Valor em diversos formatos
 * @returns Número normalizado
 */
export function normalizarValor(valor: string | number | null | undefined): number {
  if (valor === null || valor === undefined) return 0;
  
  // Se já é número
  if (typeof valor === "number") {
    return isNaN(valor) ? 0 : valor;
  }
  
  // Se é string
  if (typeof valor === "string") {
    // Remove símbolos de moeda, espaços e pontos de milhar
    const valorLimpo = valor
      .replace(/[R$\s]/g, "")
      .replace(/\./g, "")
      .replace(/,/g, ".");
    
    const numero = parseFloat(valorLimpo);
    return isNaN(numero) ? 0 : numero;
  }
  
  return 0;
}

/**
 * Arredonda valor para 2 casas decimais (padrão monetário)
 * @param valor - Valor a arredondar
 * @returns Valor arredondado
 */
export function arredondarValor(valor: number): number {
  return Math.round(valor * 100) / 100;
}

// ============================================================================
// NORMALIZAÇÃO DE PRODUTO
// ============================================================================

/**
 * Normaliza o nome do produto para o enum ProdutoBancario
 * @param produto - Nome do produto em diversos formatos
 * @returns Produto normalizado ou null
 */
export function normalizarProduto(produto: string): ProdutoBancario | null {
  if (!produto) return null;
  
  const produtoUpper = produto.toUpperCase().trim();
  
  // Mapeamento de variações
  const mapeamento: Record<string, ProdutoBancario> = {
    // Consignado
    "CONSIGNADO": "CONSIGNADO",
    "CREDITO CONSIGNADO": "CONSIGNADO",
    "EMPRESTIMO CONSIGNADO": "CONSIGNADO",
    "CONS": "CONSIGNADO",
    
    // Portabilidade
    "PORTABILIDADE": "PORTABILIDADE",
    "PORT": "PORTABILIDADE",
    "PORTABILIDADE CONSIGNADO": "PORTABILIDADE",
    
    // Refinanciamento
    "REFINANCIAMENTO": "REFIN",
    "REFIN": "REFIN",
    "REFI": "REFIN",
    
    // Cartão
    "CARTAO": "CARTAO",
    "CARTÃO": "CARTAO",
    "CARTAO CONSIGNADO": "CARTAO",
    "CARTÃO CONSIGNADO": "CARTAO",
    "CC": "CARTAO",
    
    // Pessoal
    "PESSOAL": "PESSOAL",
    "EMPRESTIMO PESSOAL": "PESSOAL",
    "CREDITO PESSOAL": "PESSOAL",
    "EP": "PESSOAL",
  };
  
  return mapeamento[produtoUpper] || null;
}

// ============================================================================
// NORMALIZAÇÃO DE CONTRATO INTERNO
// ============================================================================

/**
 * Normaliza um contrato interno completo
 * @param contrato - Contrato com dados brutos
 * @returns Contrato normalizado
 */
export function normalizarContratoInterno(contrato: Partial<ContratoInterno>): ContratoInterno | null {
  try {
    // Validações obrigatórias
    if (!contrato.idContrato || !contrato.cpf || !contrato.numeroContratoBanco) {
      console.warn("Contrato sem campos obrigatórios:", contrato);
      return null;
    }
    
    const cpfNormalizado = normalizarCPF(contrato.cpf);
    if (!validarCPF(cpfNormalizado)) {
      console.warn("CPF inválido:", contrato.cpf);
      return null;
    }
    
    const produto = normalizarProduto(contrato.produto || "");
    if (!produto) {
      console.warn("Produto inválido:", contrato.produto);
      return null;
    }
    
    const dataPrevista = normalizarData(contrato.dataPrevistaPagamento);
    if (!dataPrevista) {
      console.warn("Data prevista inválida:", contrato.dataPrevistaPagamento);
      return null;
    }
    
    const valorLiberado = normalizarValor(contrato.valorLiberado);
    const percentualComissao = normalizarValor(contrato.percentualComissao);
    const valorComissaoEsperada = normalizarValor(contrato.valorComissaoEsperada);
    
    // Se valorComissaoEsperada não foi fornecido, calcula
    const valorComissaoFinal = valorComissaoEsperada > 0 
      ? valorComissaoEsperada 
      : arredondarValor(valorLiberado * (percentualComissao / 100));
    
    return {
      idContrato: contrato.idContrato.trim(),
      cpf: cpfNormalizado,
      cliente: (contrato.cliente || "").trim(),
      banco: (contrato.banco || "").trim().toUpperCase(),
      produto,
      numeroContratoBanco: contrato.numeroContratoBanco.trim(),
      valorLiberado: arredondarValor(valorLiberado),
      percentualComissao: arredondarValor(percentualComissao),
      valorComissaoEsperada: arredondarValor(valorComissaoFinal),
      dataPrevistaPagamento: dataPrevista,
      dataCriacao: normalizarData(contrato.dataCriacao) || undefined,
      observacoes: contrato.observacoes,
    };
  } catch (error) {
    console.error("Erro ao normalizar contrato:", error);
    return null;
  }
}

// ============================================================================
// NORMALIZAÇÃO DE PAGAMENTO DO BANCO
// ============================================================================

/**
 * Normaliza um pagamento do banco
 * @param pagamento - Pagamento com dados brutos
 * @returns Pagamento normalizado
 */
export function normalizarPagamentoBanco(pagamento: Partial<PagamentoBanco>): PagamentoBanco | null {
  try {
    // Validações obrigatórias
    if (!pagamento.cpf || !pagamento.numeroContratoBanco) {
      console.warn("Pagamento sem campos obrigatórios:", pagamento);
      return null;
    }
    
    const cpfNormalizado = normalizarCPF(pagamento.cpf);
    if (!validarCPF(cpfNormalizado)) {
      console.warn("CPF inválido no pagamento:", pagamento.cpf);
      return null;
    }
    
    const dataPagamento = normalizarData(pagamento.dataPagamento);
    if (!dataPagamento) {
      console.warn("Data de pagamento inválida:", pagamento.dataPagamento);
      return null;
    }
    
    const valorPago = normalizarValor(pagamento.valorPago);
    if (valorPago <= 0) {
      console.warn("Valor pago inválido:", pagamento.valorPago);
      return null;
    }
    
    return {
      cpf: cpfNormalizado,
      numeroContratoBanco: pagamento.numeroContratoBanco.trim(),
      produto: (pagamento.produto || "").trim(),
      valorPago: arredondarValor(valorPago),
      dataPagamento,
      banco: (pagamento.banco || "").trim().toUpperCase(),
      ...pagamento, // Preserva campos adicionais
    };
  } catch (error) {
    console.error("Erro ao normalizar pagamento:", error);
    return null;
  }
}

// ============================================================================
// NORMALIZAÇÃO EM LOTE
// ============================================================================

/**
 * Normaliza um array de contratos internos
 * @param contratos - Array de contratos brutos
 * @returns Array de contratos normalizados (contratos inválidos são filtrados)
 */
export function normalizarContratosLote(
  contratos: Partial<ContratoInterno>[]
): ContratoInterno[] {
  const resultados: ContratoInterno[] = [];
  const erros: string[] = [];
  
  contratos.forEach((contrato, index) => {
    const normalizado = normalizarContratoInterno(contrato);
    if (normalizado) {
      resultados.push(normalizado);
    } else {
      erros.push(`Contrato na linha ${index + 1} é inválido`);
    }
  });
  
  if (erros.length > 0) {
    console.warn(`${erros.length} contratos inválidos foram ignorados:`, erros.slice(0, 5));
  }
  
  return resultados;
}

/**
 * Normaliza um array de pagamentos do banco
 * @param pagamentos - Array de pagamentos brutos
 * @returns Array de pagamentos normalizados (pagamentos inválidos são filtrados)
 */
export function normalizarPagamentosLote(
  pagamentos: Partial<PagamentoBanco>[]
): PagamentoBanco[] {
  const resultados: PagamentoBanco[] = [];
  const erros: string[] = [];
  
  pagamentos.forEach((pagamento, index) => {
    const normalizado = normalizarPagamentoBanco(pagamento);
    if (normalizado) {
      resultados.push(normalizado);
    } else {
      erros.push(`Pagamento na linha ${index + 1} é inválido`);
    }
  });
  
  if (erros.length > 0) {
    console.warn(`${erros.length} pagamentos inválidos foram ignorados:`, erros.slice(0, 5));
  }
  
  return resultados;
}
