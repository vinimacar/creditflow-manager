/**
 * Exemplos de testes para as funções de validação
 * Execute no console do navegador ou em testes unitários
 */

import { 
  validarCPF, 
  validarCNPJ, 
  validarTelefone,
  mascaraCPF,
  mascaraCNPJ,
  mascaraTelefone,
  mascaraCEP,
  buscarCEP
} from './validations';

// ===== TESTES DE CPF =====
console.group('📄 Testes de CPF');

// CPFs válidos
console.log('CPF válido (111.444.777-35):', validarCPF('111.444.777-35')); // true
console.log('CPF válido (123.456.789-09):', validarCPF('123.456.789-09')); // true
console.log('CPF válido sem máscara (12345678909):', validarCPF('12345678909')); // true

// CPFs inválidos
console.log('CPF inválido (111.111.111-11):', validarCPF('111.111.111-11')); // false
console.log('CPF inválido (123.456.789-00):', validarCPF('123.456.789-00')); // false
console.log('CPF com tamanho errado:', validarCPF('123.456.789')); // false

// Máscaras de CPF
console.log('Máscara CPF:', mascaraCPF('12345678909')); // 123.456.789-09
console.log('Máscara CPF parcial:', mascaraCPF('123456')); // 123.456

console.groupEnd();

// ===== TESTES DE CNPJ =====
console.group('🏢 Testes de CNPJ');

// CNPJs válidos
console.log('CNPJ válido (11.222.333/0001-81):', validarCNPJ('11.222.333/0001-81')); // true
console.log('CNPJ válido (61.186.680/0001-74):', validarCNPJ('61.186.680/0001-74')); // true (Banco BMG)
console.log('CNPJ válido sem máscara:', validarCNPJ('61186680000174')); // true

// CNPJs inválidos
console.log('CNPJ inválido (11.111.111/1111-11):', validarCNPJ('11.111.111/1111-11')); // false
console.log('CNPJ inválido (11.222.333/0001-82):', validarCNPJ('11.222.333/0001-82')); // false
console.log('CNPJ com tamanho errado:', validarCNPJ('11.222.333')); // false

// Máscaras de CNPJ
console.log('Máscara CNPJ:', mascaraCNPJ('11222333000181')); // 11.222.333/0001-81
console.log('Máscara CNPJ parcial:', mascaraCNPJ('112223')); // 11.222.3

console.groupEnd();

// ===== TESTES DE TELEFONE =====
console.group('📱 Testes de Telefone');

// Telefones válidos
console.log('Celular válido (11) 99999-9999:', validarTelefone('(11) 99999-9999')); // true
console.log('Celular válido sem máscara:', validarTelefone('11999999999')); // true
console.log('Fixo válido (11) 3333-4444:', validarTelefone('(11) 3333-4444')); // true
console.log('Fixo válido sem máscara:', validarTelefone('1133334444')); // true

// Telefones inválidos
console.log('Celular inválido (terceiro dígito não é 9):', validarTelefone('(11) 89999-9999')); // false
console.log('DDD inválido:', validarTelefone('(99) 99999-9999')); // false
console.log('Telefone muito curto:', validarTelefone('999999')); // false
console.log('Telefone muito longo:', validarTelefone('119999999999')); // false

// Máscaras de telefone
console.log('Máscara celular:', mascaraTelefone('11999999999')); // (11) 99999-9999
console.log('Máscara fixo:', mascaraTelefone('1133334444')); // (11) 3333-4444
console.log('Máscara parcial:', mascaraTelefone('11999')); // (11) 999

console.groupEnd();

// ===== TESTES DE CEP =====
console.group('📍 Testes de CEP');

// Máscaras de CEP
console.log('Máscara CEP:', mascaraCEP('01310100')); // 01310-100
console.log('Máscara CEP parcial:', mascaraCEP('01310')); // 01310

// Busca de CEP (assíncrono)
console.log('Buscando CEP 01310-100 (Av. Paulista, São Paulo)...');
buscarCEP('01310-100')
  .then(dados => {
    console.log('CEP encontrado:', dados);
    console.log('Logradouro:', dados?.logradouro);
    console.log('Bairro:', dados?.bairro);
    console.log('Cidade:', dados?.localidade);
    console.log('UF:', dados?.uf);
  })
  .catch(error => console.error('Erro ao buscar CEP:', error));

console.log('Buscando CEP 20040-020 (Centro, Rio de Janeiro)...');
buscarCEP('20040-020')
  .then(dados => {
    console.log('CEP encontrado:', dados);
    console.log('Logradouro:', dados?.logradouro);
    console.log('Cidade:', dados?.localidade);
    console.log('UF:', dados?.uf);
  })
  .catch(error => console.error('Erro ao buscar CEP:', error));

console.log('Testando CEP inválido (99999-999)...');
buscarCEP('99999-999')
  .then(dados => console.log('CEP encontrado:', dados))
  .catch(error => console.error('Erro esperado - CEP não encontrado:', error.message));

console.groupEnd();

// ===== SUITE DE TESTES COMPLETA =====
export function runAllValidationTests() {
  console.group('🧪 SUITE COMPLETA DE TESTES DE VALIDAÇÃO');
  
  const tests = {
    cpf: [
      { value: '111.444.777-35', expected: true, description: 'CPF válido com máscara' },
      { value: '12345678909', expected: true, description: 'CPF válido sem máscara' },
      { value: '111.111.111-11', expected: false, description: 'CPF com dígitos iguais' },
      { value: '123.456.789-00', expected: false, description: 'CPF com dígito verificador errado' },
    ],
    cnpj: [
      { value: '11.222.333/0001-81', expected: true, description: 'CNPJ válido com máscara' },
      { value: '61186680000174', expected: true, description: 'CNPJ válido sem máscara' },
      { value: '11.111.111/1111-11', expected: false, description: 'CNPJ com dígitos iguais' },
      { value: '11.222.333/0001-82', expected: false, description: 'CNPJ com dígito verificador errado' },
    ],
    telefone: [
      { value: '(11) 99999-9999', expected: true, description: 'Celular válido' },
      { value: '(11) 3333-4444', expected: true, description: 'Fixo válido' },
      { value: '(11) 89999-9999', expected: false, description: 'Celular com terceiro dígito errado' },
      { value: '(99) 99999-9999', expected: false, description: 'DDD inválido' },
    ],
  };

  let passed = 0;
  let failed = 0;

  // Testa CPF
  console.group('CPF');
  tests.cpf.forEach(test => {
    const result = validarCPF(test.value);
    const status = result === test.expected ? '✅' : '❌';
    console.log(`${status} ${test.description}: ${test.value} -> ${result}`);
    if (result === test.expected) passed++; else failed++;
  });
  console.groupEnd();

  // Testa CNPJ
  console.group('CNPJ');
  tests.cnpj.forEach(test => {
    const result = validarCNPJ(test.value);
    const status = result === test.expected ? '✅' : '❌';
    console.log(`${status} ${test.description}: ${test.value} -> ${result}`);
    if (result === test.expected) passed++; else failed++;
  });
  console.groupEnd();

  // Testa Telefone
  console.group('Telefone');
  tests.telefone.forEach(test => {
    const result = validarTelefone(test.value);
    const status = result === test.expected ? '✅' : '❌';
    console.log(`${status} ${test.description}: ${test.value} -> ${result}`);
    if (result === test.expected) passed++; else failed++;
  });
  console.groupEnd();

  console.log(`\n📊 Resultados: ${passed} passaram, ${failed} falharam`);
  console.groupEnd();

  return { passed, failed };
}

// Para executar todos os testes:
// runAllValidationTests();
