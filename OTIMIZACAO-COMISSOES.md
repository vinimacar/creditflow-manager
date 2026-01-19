# Otimização do Sistema de Comissões

## Nomenclatura Atualizada

**IMPORTANTE:** A nomenclatura foi atualizada para maior clareza:

- **Comissão da Empresa** (antes: Comissão Fornecedor) = Valor que a empresa **RECEBE** do fornecedor
- **Comissão do Funcionário** (antes: Comissão Agente) = Valor que a empresa **PAGA** ao vendedor

## Problema Identificado
O sistema estava calculando e criando registros de comissões mesmo quando os produtos tinham comissão zerada no cadastro, gerando dados desnecessários no banco.

## Solução Implementada

### 1. Otimização no Cálculo Base (`calculos-comissoes.ts`)

**Antes:**
```typescript
comissaoAgente = valorContrato * (comissaoAgentePercentual / 100);
```

**Depois:**
```typescript
// Otimização: Se comissão for 0, não calcular
if (comissaoAgentePercentual > 0) {
  comissaoAgente = valorContrato * (comissaoAgentePercentual / 100);
}
```

**Benefícios:**
- Evita multiplicações desnecessárias quando comissão = 0
- Reduz processamento CPU
- Mantém valores zerados explícitos (não calcula 0 * valor)

### 2. Validação em Comissões a Receber (`ComissoesReceber.tsx`)

```typescript
// OTIMIZAÇÃO: Não criar comissão se o valor for zero
// (produto sem comissão cadastrada)
if (comissoes.comissaoFornecedor === 0 && comissoes.comissaoFornecedorPercentual === 0) {
  continue; // Pula para próxima venda
}
```

**Benefícios:**
- Não cria documentos no Firestore para comissões zeradas
- Reduz custo de reads/writes no banco
- Interface mais limpa (não exibe linhas com R$ 0,00)

### 3. Validação em Comissões a Pagar (`ComissoesPagar.tsx`)

```typescript
// OTIMIZAÇÃO: Não criar comissão se o valor for zero
// (produto sem comissão cadastrada ou funcionário com salário fixo)
if (comissoes.comissaoAgente === 0 && comissoes.comissaoAgentePercentual === 0) {
  continue; // Pula para próxima venda
}
```

**Benefícios:**
- Ideal para funcionários com salário fixo (sem comissão)
- Não gera registros de pagamento desnecessários
- Reduz trabalho de conciliação

## Casos de Uso

### Caso 1: Produto sem Comissão
```typescript
// Cadastro do Produto
{
  nome: "Produto X",
  comissaoAgente: 0,      // Sem comissão para o funcionário (salário fixo)
  comissaoFornecedor: 2.5, // Empresa recebe 2.5% do fornecedor
}

// Resultado: 
// ✅ Comissão a Receber: Criada (2.5% para a empresa)
// ❌ Comissão a Pagar: NÃO criada (funcionário não recebe comissão)
```

### Caso 2: Funcionário Salário Fixo
```typescript
// Funcionário não tem comissão variável
// Produto tem comissaoAgente = 0

// Resultado: ✅ Venda contabilizada, mas sem comissão a pagar ao funcionário
```

### Caso 3: Apenas uma Comissão Zerada
```typescript
// Produto
{
  comissaoAgente: 0,        // Funcionário sem comissão
  comissaoFornecedor: 2.5,  // Empresa recebe 2.5%
}

// Resultado:
// ✅ Comissão a Receber: Criada (2.5% para empresa)
// ❌ Comissão a Pagar: NÃO criada (0% para funcionário)
```

## Performance

### Antes da Otimização
- 100 vendas/mês
- 50 produtos sem comissão
- **Resultado:** 200 registros criados (100 a pagar + 100 a receber)

### Depois da Otimização
- 100 vendas/mês
- 50 produtos sem comissão
- **Resultado:** 100 registros criados (apenas dos 50 produtos com comissão)

**Economia:**
- ✅ 50% menos documentos no Firestore
- ✅ 50% menos writes no banco
- ✅ 50% menos leituras nas listagens
- ✅ Interface mais limpa e rápida

## Compatibilidade

A otimização é **100% retrocompatível**:
- ✅ Vendas antigas com comissões salvas: mantidas
- ✅ Cálculos existentes: não afetados
- ✅ Relatórios: continuam funcionando
- ✅ Conciliação: não impactada

## Regras de Negócio

1. **Comissão zerada no produto** → Não gera registro de comissão
2. **Comissão maior que zero** → Gera registro norm
5. **Comissão da Empresa (Fornecedor)** → Valor que a empresa RECEBE
6. **Comissão do Funcionário (Agente)** → Valor que a empresa PAGA ao vendedoralmente
3. **Comissão já salva na venda** → Sempre respeitada (mesmo se zero)
4. **Prioridade:** Venda > Produto > Cálculo padrão

## Monitoramento

Para verificar o impacto da otimização:

```typescript
// No console do Firebase
db.collection("comissoesPagar")
  .where("valorComissao", "==", 0)
  .get()
  .then(snap => console.log("Comissões zeradas:", snap.size));
```

## Próximos Passos (Opcional)

1. **Limpeza de dados antigos:** Remover comissões zeradas criadas antes da otimização
2. **Alerta no cadastro:** Avisar quando produto tem comissão = 0
3. **Relatório:** Mostrar produtos sem comissão configurada
4. **Dashboard:** KPI de % produtos com/sem comissão

---

**Data da Implementação:** 19/01/2026  
**Arquivos Modificados:**
- `src/lib/calculos-comissoes.ts`
- `src/pages/ComissoesReceber.tsx`
- `src/pages/ComissoesPagar.tsx`
