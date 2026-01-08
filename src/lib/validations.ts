/**
 * Validações e máscaras para documentos brasileiros
 */

/**
 * Remove caracteres não numéricos de uma string
 */
export function removeNonNumeric(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Valida CPF (Cadastro de Pessoa Física)
 */
export function validarCPF(cpf: string): boolean {
  const numeros = removeNonNumeric(cpf);
  
  if (numeros.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(numeros)) return false;
  
  // Valida primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(numeros.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  const digitoVerificador1 = resto === 10 || resto === 11 ? 0 : resto;
  
  if (digitoVerificador1 !== parseInt(numeros.charAt(9))) return false;
  
  // Valida segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(numeros.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  const digitoVerificador2 = resto === 10 || resto === 11 ? 0 : resto;
  
  return digitoVerificador2 === parseInt(numeros.charAt(10));
}

/**
 * Valida CNPJ (Cadastro Nacional de Pessoa Jurídica)
 */
export function validarCNPJ(cnpj: string): boolean {
  const numeros = removeNonNumeric(cnpj);
  
  if (numeros.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(numeros)) return false;
  
  // Valida primeiro dígito verificador
  let tamanho = numeros.length - 2;
  let numeros_validacao = numeros.substring(0, tamanho);
  const digitos = numeros.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros_validacao.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;
  
  // Valida segundo dígito verificador
  tamanho = tamanho + 1;
  numeros_validacao = numeros.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros_validacao.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado === parseInt(digitos.charAt(1));
}

/**
 * Valida telefone brasileiro (celular ou fixo)
 */
export function validarTelefone(telefone: string): boolean {
  const numeros = removeNonNumeric(telefone);
  
  // Telefone fixo: (XX) XXXX-XXXX = 10 dígitos
  // Celular: (XX) XXXXX-XXXX = 11 dígitos
  if (numeros.length !== 10 && numeros.length !== 11) return false;
  
  // Verifica se o DDD é válido (10 a 99)
  const ddd = parseInt(numeros.substring(0, 2));
  if (ddd < 10 || ddd > 99) return false;
  
  // Para celular, o terceiro dígito deve ser 9
  if (numeros.length === 11) {
    const terceiroDigito = parseInt(numeros.charAt(2));
    if (terceiroDigito !== 9) return false;
  }
  
  return true;
}

/**
 * Aplica máscara de CPF
 */
export function mascaraCPF(value: string): string {
  const numeros = removeNonNumeric(value);
  return numeros
    .substring(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/**
 * Aplica máscara de CNPJ
 */
export function mascaraCNPJ(value: string): string {
  const numeros = removeNonNumeric(value);
  return numeros
    .substring(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/**
 * Aplica máscara de telefone
 */
export function mascaraTelefone(value: string): string {
  const numeros = removeNonNumeric(value);
  
  if (numeros.length <= 10) {
    // Telefone fixo: (XX) XXXX-XXXX
    return numeros
      .substring(0, 10)
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  } else {
    // Celular: (XX) XXXXX-XXXX
    return numeros
      .substring(0, 11)
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
  }
}

/**
 * Aplica máscara de CEP
 */
export function mascaraCEP(value: string): string {
  const numeros = removeNonNumeric(value);
  return numeros
    .substring(0, 8)
    .replace(/(\d{5})(\d{1,3})$/, '$1-$2');
}

/**
 * Interface para resposta da API ViaCEP
 */
export interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

/**
 * Busca endereço por CEP usando a API ViaCEP
 */
export async function buscarCEP(cep: string): Promise<ViaCEPResponse | null> {
  const numeros = removeNonNumeric(cep);
  
  if (numeros.length !== 8) {
    throw new Error('CEP inválido');
  }
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${numeros}/json/`);
    
    if (!response.ok) {
      throw new Error('Erro ao buscar CEP');
    }
    
    const data: ViaCEPResponse = await response.json();
    
    if (data.erro) {
      throw new Error('CEP não encontrado');
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    throw error;
  }
}
