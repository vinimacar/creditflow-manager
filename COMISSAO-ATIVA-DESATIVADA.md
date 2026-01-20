# Controle de Comissões Ativas/Desativadas por Produto

## 📋 Visão Geral

Sistema que permite ativar ou desativar o pagamento de comissões para funcionários em produtos específicos. Quando desativado, o produto não gera comissão ao vendedor (adequado para funcionários com salário fixo).

## ✅ Funcionalidades Implementadas

### 1. Novo Campo no Produto
- **Campo**: `comissaoAtiva: boolean`
- **Padrão**: `true` (ativa)
- **Localização**: Interface `Produto` em `src/lib/firestore.ts`

### 2. Interface de Usuário

#### Página de Produtos
- ✅ Coluna "Comissão Funcionário" mostra status:
  - **Ativa**: Exibe percentual em verde (ex: "3.5%")
  - **Desativada**: Exibe "Desativada" em vermelho

#### Formulário de Cadastro (NovoProdutoForm)
- ✅ Campo de comissão desabilitado quando `comissaoAtiva = false`
- ✅ Switch de ativar/desativar comissão:
  - **Ativo**: "✓ Comissão Ativa" (verde)
  - **Desativado**: "✗ Comissão Desativada" (vermelho)
- ✅ Mensagem explicativa:
  - Ativa: "Vendas deste produto pagarão comissão ao funcionário"
  - Desativada: "⚠️ Vendas deste produto NÃO pagarão comissão (salário fixo)"

#### Formulário de Edição (ProdutoForm)
- ✅ Mesma funcionalidade do formulário de cadastro
- ✅ Carrega valor atual do produto

### 3. Lógica de Cálculo

#### calcularComissoes() - `src/lib/calculos-comissoes.ts`
```typescript
// VERIFICAÇÃO: Se produto.comissaoAtiva === false, retorna 0
if (produto && produto.comissaoAtiva === false) {
  comissaoAgente = 0;
  comissaoAgentePercentual = 0;
}
```

**Prioridade de verificação**:
1. ✅ Verifica se `produto.comissaoAtiva === false` → retorna 0
2. Verifica comissão salva na venda
3. Calcula baseado no percentual do produto
4. Calcula baseado em faixas de comissão

### 4. Impacto nas Vendas

**Vendas existentes**: Mantêm comissão salva (não afetadas)
**Vendas novas**: 
- Se `comissaoAtiva = false` → comissão = 0
- Se `comissaoAtiva = true` → calcula normalmente

### 5. Páginas Afetadas

✅ **Produtos** - Exibição e edição
✅ **Dashboard** - Usa `calcularComissoes()`
✅ **Relatórios** - Usa `calcularComissoes()`
✅ **Comissões a Pagar** - Usa `calcularComissoes()`
✅ **Fluxo de Caixa** - Usa `calcularComissoes()`
✅ **Análise de Rentabilidade** - Usa `calcularComissoes()`

## 🎯 Casos de Uso

### Caso 1: Funcionário com Salário Fixo
```
Produto: Consignado INSS - Sal. Fixo
comissaoAtiva: false
comissaoAgente: 0%
Resultado: Funcionário não recebe comissão nas vendas
```

### Caso 2: Funcionário com Comissão
```
Produto: Consignado INSS - Comissionado
comissaoAtiva: true
comissaoAgente: 3.5%
Resultado: Funcionário recebe 3.5% sobre venda
```

### Caso 3: Migração de Produto
```
Estado Anterior: comissaoAtiva: true, comissaoAgente: 3%
Vendas antigas: Mantêm 3% de comissão
Estado Atual: comissaoAtiva: false
Vendas novas: Não receberão comissão
```

## 📊 Compatibilidade

### Produtos Antigos
- **Sem campo `comissaoAtiva`**: Tratado como `true` (default)
- **Migração automática**: `comissaoAtiva !== false` → considera ativo

### Vendas Antigas
- **Comissão já salva**: Preservada independente do status do produto
- **Sem comissão salva**: Recalcula respeitando `comissaoAtiva`

## 🔧 Como Usar

### 1. Cadastrar Produto sem Comissão
1. Acesse **Produtos** → **Novo Produto**
2. Preencha dados do produto
3. **Desative** o switch "Comissão Ativa"
4. O campo de percentual ficará desabilitado
5. Salve o produto

### 2. Editar Status de Comissão
1. Acesse **Produtos**
2. Clique em **Editar** no produto desejado
3. Ative/Desative o switch "Comissão Ativa"
4. Ajuste o percentual se necessário
5. Salve as alterações

### 3. Visualizar Status
- Na tabela de produtos, a coluna "Comissão Funcionário" mostra:
  - **Verde**: Comissão ativa com percentual
  - **Vermelho**: "Desativada"

## 📝 Observações Importantes

1. **Vendas Antigas**: Não são afetadas pela mudança
2. **Relatórios**: Refletem corretamente o status atual
3. **Dashboard**: Calcula apenas comissões de produtos ativos
4. **Fluxo de Caixa**: Projeções consideram apenas produtos com comissão ativa
5. **Auditoria**: Mudanças podem ser rastreadas pelo histórico de edições

## 🚀 Migração de Dados

Produtos existentes sem o campo `comissaoAtiva` são automaticamente tratados como **ativos** para manter compatibilidade retroativa.

Para migração manual se necessário:
```typescript
// Ativar comissão em todos os produtos
await updateProduto(produtoId, { comissaoAtiva: true });

// Desativar comissão em produto específico
await updateProduto(produtoId, { comissaoAtiva: false });
```

## 📈 Próximos Passos

- [ ] Adicionar filtro na página de Produtos por status de comissão
- [ ] Relatório comparativo: produtos com/sem comissão
- [ ] Histórico de mudanças no status de comissão
- [ ] Notificação ao desativar comissão em produto ativo
