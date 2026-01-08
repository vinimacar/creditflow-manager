import { z } from 'zod';
import { validarCPF, validarCNPJ, validarTelefone, removeNonNumeric } from './validations';

/**
 * Validações customizadas do Zod para documentos brasileiros
 */

export const cpfValidation = z
  .string()
  .min(1, 'CPF é obrigatório')
  .refine((val) => validarCPF(val), {
    message: 'CPF inválido',
  });

export const cnpjValidation = z
  .string()
  .min(1, 'CNPJ é obrigatório')
  .refine((val) => validarCNPJ(val), {
    message: 'CNPJ inválido',
  });

export const telefoneValidation = z
  .string()
  .min(1, 'Telefone é obrigatório')
  .refine((val) => validarTelefone(val), {
    message: 'Telefone inválido',
  });

export const cepValidation = z
  .string()
  .refine((val) => {
    if (!val) return true; // Opcional
    const numeros = removeNonNumeric(val);
    return numeros.length === 8;
  }, {
    message: 'CEP inválido',
  });

export const cepRequiredValidation = z
  .string()
  .min(1, 'CEP é obrigatório')
  .refine((val) => {
    const numeros = removeNonNumeric(val);
    return numeros.length === 8;
  }, {
    message: 'CEP deve ter 8 dígitos',
  });
