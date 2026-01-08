# Validações Implementadas no Sistema

Este documento descreve as validações de CPF, CNPJ, telefone e integração com API de CEP implementadas no sistema.

## 📋 Validações Disponíveis

### 1. CPF (Cadastro de Pessoa Física)
- **Validação**: Algoritmo completo de validação de CPF conforme regras da Receita Federal
- **Máscara**: `000.000.000-00`
- **Formato**: 11 dígitos numéricos
- **Verificações**:
  - Comprimento correto (11 dígitos)
  - Dígitos não podem ser todos iguais
  - Validação dos dois dígitos verificadores

### 2. CNPJ (Cadastro Nacional de Pessoa Jurídica)
- **Validação**: Algoritmo completo de validação de CNPJ conforme regras da Receita Federal
- **Máscara**: `00.000.000/0000-00`
- **Formato**: 14 dígitos numéricos
- **Verificações**:
  - Comprimento correto (14 dígitos)
  - Dígitos não podem ser todos iguais
  - Validação dos dois dígitos verificadores

### 3. Telefone
- **Validação**: Aceita telefones fixos e celulares brasileiros
- **Máscaras**: 
  - Fixo: `(00) 0000-0000` (10 dígitos)
  - Celular: `(00) 00000-0000` (11 dígitos)
- **Verificações**:
  - DDD válido (entre 10 e 99)
  - Para celular, o terceiro dígito deve ser 9
  - Comprimento correto (10 ou 11 dígitos)

### 4. CEP
- **Validação**: Formato de CEP brasileiro
- **Máscara**: `00000-000`
- **Formato**: 8 dígitos numéricos
- **Integração**: API ViaCEP para preenchimento automático de endereço

## 🔧 Arquivos de Utilitários

### `src/lib/validations.ts`
Contém as funções de validação e máscaras:

```typescript
// Funções de validação
validarCPF(cpf: string): boolean
validarCNPJ(cnpj: string): boolean
validarTelefone(telefone: string): boolean

// Funções de máscara
mascaraCPF(value: string): string
mascaraCNPJ(value: string): string
mascaraTelefone(value: string): string
mascaraCEP(value: string): string

// API de CEP
buscarCEP(cep: string): Promise<ViaCEPResponse | null>

// Utilitário
removeNonNumeric(value: string): string
```

### `src/lib/zod-validations.ts`
Validações customizadas para uso com React Hook Form + Zod:

```typescript
cpfValidation        // Validação de CPF
cnpjValidation       // Validação de CNPJ
telefoneValidation   // Validação de telefone
cepValidation        // Validação de CEP (opcional)
cepRequiredValidation // Validação de CEP (obrigatório)
```

## 📝 Formulários Atualizados

### ClienteForm
- ✅ Validação de CPF
- ✅ Máscara automática de CPF
- ✅ Validação de telefone
- ✅ Máscara automática de telefone
- ✅ Validação de CEP
- ✅ Máscara automática de CEP
- ✅ Busca automática de endereço via ViaCEP

### FornecedorForm
- ✅ Validação de CNPJ
- ✅ Máscara automática de CNPJ
- ✅ Validação de telefone
- ✅ Máscara automática de telefone

### FuncionarioForm
- ✅ Validação de CPF
- ✅ Máscara automática de CPF
- ✅ Validação de telefone
- ✅ Máscara automática de telefone
- ✅ Validação de CEP
- ✅ Máscara automática de CEP
- ✅ Busca automática de endereço via ViaCEP

## 🌐 Integração com API ViaCEP

A função `buscarCEP()` integra com a API pública do ViaCEP para buscar automaticamente os dados de endereço:

**Endpoint**: `https://viacep.com.br/ws/{cep}/json/`

**Dados retornados**:
- CEP
- Logradouro (rua/avenida)
- Bairro
- Cidade (localidade)
- UF (estado)
- Complemento
- DDD
- Códigos IBGE, GIA e SIAFI

**Preenchimento automático**:
- Quando o usuário digita um CEP válido (8 dígitos)
- Os campos de endereço, cidade e estado são preenchidos automaticamente
- Mensagem de sucesso ou erro é exibida via toast

## 💡 Como Usar

### Exemplo de validação manual:

```typescript
import { validarCPF, validarCNPJ, validarTelefone } from '@/lib/validations';

// Validar CPF
const cpfValido = validarCPF('123.456.789-09'); // true ou false

// Validar CNPJ
const cnpjValido = validarCNPJ('11.222.333/0001-81'); // true ou false

// Validar telefone
const telefoneValido = validarTelefone('(11) 99999-9999'); // true ou false
```

### Exemplo de máscara:

```typescript
import { mascaraCPF, mascaraCNPJ, mascaraTelefone } from '@/lib/validations';

const cpfMascarado = mascaraCPF('12345678909'); 
// Retorna: '123.456.789-09'

const cnpjMascarado = mascaraCNPJ('11222333000181'); 
// Retorna: '11.222.333/0001-81'

const telefoneMascarado = mascaraTelefone('11999999999'); 
// Retorna: '(11) 99999-9999'
```

### Exemplo de busca de CEP:

```typescript
import { buscarCEP } from '@/lib/validations';

try {
  const endereco = await buscarCEP('01310-100');
  console.log(endereco.logradouro); // Av. Paulista
  console.log(endereco.localidade); // São Paulo
  console.log(endereco.uf); // SP
} catch (error) {
  console.error('CEP não encontrado');
}
```

### Exemplo em formulários com Zod:

```typescript
import { z } from 'zod';
import { cpfValidation, telefoneValidation } from '@/lib/zod-validations';

const schema = z.object({
  nome: z.string().min(3),
  cpf: cpfValidation,
  telefone: telefoneValidation,
});
```

## 🎯 Recursos Adicionais

- **Máscaras automáticas**: Aplicadas enquanto o usuário digita
- **Validação em tempo real**: Feedback imediato de erros
- **Mensagens de erro claras**: Indicação específica do problema
- **Limite de caracteres**: Impede que o usuário digite mais que o necessário
- **Auto-preenchimento**: CEP preenche endereço automaticamente
- **Toast notifications**: Feedback visual de sucesso ou erro

## 🔒 Segurança

As validações são feitas tanto no frontend quanto devem ser implementadas no backend:

- ⚠️ **Importante**: As validações de frontend são apenas para UX
- ✅ **Sempre valide novamente no backend** para segurança real
- 🔐 Os dados são enviados apenas após validação completa

## 📚 Referências

- [Algoritmo de validação de CPF](https://www.macoratti.net/alg_cpf.htm)
- [Algoritmo de validação de CNPJ](https://www.macoratti.net/alg_cnpj.htm)
- [API ViaCEP](https://viacep.com.br/)
- [Telefones no Brasil - ANATEL](https://www.anatel.gov.br/)
