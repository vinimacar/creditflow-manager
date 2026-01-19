# 🎯 PADRONIZAÇÃO DE CÁLCULO DE COMISSÕES

## 📋 Problema Identificado

O sistema apresentava **divergências nos valores de comissões** exibidos nas abas:
- Dashboard
- Relatórios  
- Conciliação

Cada aba calculava as comissões de forma independente, resultando em valores diferentes e comprometendo a confiabilidade do sistema.

## ✅ Solução Implementada

### Arquivo Centralizado: `calculos-comissoes.ts`

Criamos um arquivo único que centraliza **TODA** a lógica de cálculo de comissões:

**Localização:** `src/lib/calculos-comissoes.ts`

### Funções Disponíveis

```typescript
// Calcula todas as comissões (agente + fornecedor)
calcularComissoes(venda: Venda, produto?: Produto): ComissoesCalculadas

// Atalho para calcular apenas comissão do fornecedor
calcularComissaoFornecedor(venda: Venda, produto?: Produto): number

// Atalho para calcular apenas comissão do agente
calcularComissaoAgente(venda: Venda, produto?: Produto): number

// Calcula total de comissões do fornecedor para múltiplas vendas
calcularTotalComissoesFornecedor(vendas: Venda[], produtos?: Produto[]): number

// Calcula total de comissões do agente para múltiplas vendas
calcularTotalComissoesAgente(vendas: Venda[], produtos?: Produto[]): number
```

### Lógica de Priorização

A função segue uma **ordem de prioridade** para garantir precisão:

#### Para Comissão do Fornecedor:
1. **Valor salvo na venda** (`comissaoFornecedor`) - SEMPRE PRIORIDADE
2. Percentual salvo na venda (`comissaoFornecedorPercentual`)
3. Percentual do produto (`produto.comissaoFornecedor`)

#### Para Comissão do Agente:
1. **Valor salvo na venda** (`comissaoAgente` ou `comissao`)
2. Percentual salvo na venda (`comissaoAgentePercentual` ou `comissaoPercentual`)
3. Tabela de faixas do produto (`produto.comissoes[]`)
4. Percentual fixo do produto (`produto.comissaoAgente` ou `produto.comissao`)

## 🔧 Implementação nas Páginas

### Dashboard (`Dashboard.tsx`)
```typescript
import { calcularTotalComissoesFornecedor } from "@/lib/calculos-comissoes";

// Antes:
const comissoesMes = vendasMesAtual.reduce((sum, v) => sum + (v.comissaoFornecedor || 0), 0);

// Agora:
const comissoesMes = calcularTotalComissoesFornecedor(vendasMesAtual);
```

### Relatórios (`Relatorios.tsx`)
```typescript
import { calcularComissoes } from "@/lib/calculos-comissoes";

// Antes: cálculo manual complexo com múltiplas verificações

// Agora:
const comissoesCalculadas = calcularComissoes(venda, produto);
```

### Conciliação (`Conciliacao.tsx`)
```typescript
import { calcularComissoes } from "@/lib/calculos-comissoes";

// Antes: cálculo manual com lógica diferente

// Agora:
const comissoesCalculadas = calcularComissoes(venda, produto);
const valorComissao = comissoesCalculadas.comissaoAgente;
```

## 🎓 Benefícios

✅ **Consistência Total**: Todas as abas usam a mesma lógica  
✅ **Manutenção Simplificada**: Alterações em um único lugar  
✅ **Confiabilidade**: Valores sempre idênticos entre abas  
✅ **Código Limpo**: Menos duplicação de código  
✅ **Documentação Clara**: Lógica bem documentada  
✅ **Testável**: Funções isoladas facilitam testes

## 📊 Validação

Para validar se os valores estão corretos em todas as abas:

1. Acesse **Dashboard** e veja o valor de "Receita (Comissão Fornecedores)"
2. Acesse **Relatórios** e compare com os valores de comissão
3. Acesse **Conciliação** e verifique os valores de comissão

**Os valores devem ser IDÊNTICOS para o mesmo período!**

## 🔒 Regra de Ouro

> **NUNCA calcule comissões diretamente nos componentes.**  
> **SEMPRE use as funções de `calculos-comissoes.ts`**

## 🚀 Uso Recomendado

Quando precisar calcular comissões em qualquer parte do sistema:

```typescript
import { calcularComissoes, calcularComissaoFornecedor } from "@/lib/calculos-comissoes";

// Para uma venda
const comissoes = calcularComissoes(venda, produto);
console.log(comissoes.comissaoFornecedor); // R$ 1500.00
console.log(comissoes.comissaoAgente);     // R$ 500.00

// Para múltiplas vendas
const totalFornecedor = calcularTotalComissoesFornecedor(vendas, produtos);
const totalAgente = calcularTotalComissoesAgente(vendas, produtos);
```

## 📝 Observações Importantes

- Os valores são **arredondados para 2 casas decimais**
- A função **sempre retorna um número** (nunca undefined/null)
- Se não houver dados suficientes, retorna **0** (zero)
- O parâmetro `produto` é opcional mas recomendado para maior precisão

---

**Data de Implementação:** 19/01/2026  
**Versão:** 1.0  
**Status:** ✅ Implementado e Testado
