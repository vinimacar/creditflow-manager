# Implementação de Módulos Financeiros Avançados

## ✅ IMPLEMENTADO (Parte 1/3)

### 1. Fluxo de Caixa ✅
**Arquivo:** `src/pages/FluxoCaixa.tsx`
**Funcionalidades:**
- Projeção de 6 meses (passado + futuro)
- Entradas previstas vs realizadas
- Saídas previstas vs realizadas  
- Saldo projetado com alertas de saldo negativo
- Cards resumo: Saldo Atual, Entradas, Saídas, Saldo Previsto
- Navegação por mês
- Cálculo automático baseado em:
  * Comissões dos fornecedores (entradas)
  * Despesas operacionais (saídas)
  * Folhas de pagamento (saídas)
  * Comissões dos agentes (saídas)

### 2. Comissões a Receber ✅
**Arquivo:** `src/pages/ComissoesReceber.tsx`
**Funcionalidades:**
- Listagem de todas as comissões pendentes de fornecedores
- Criação automática de comissões ao aprovar venda
- Registro de recebimento (data, forma pagamento, comprovante)
- Status: Pendente / Recebido / Atrasado
- Cards resumo por status
- Filtro por status
- Vencimento automático (30 dias após venda)

### 3. Tipos TypeScript ✅
**Arquivo:** `src/types/financeiro.ts`
**Interfaces criadas:**
- `ComissaoReceber` - Comissões a receber dos fornecedores
- `ComissaoPagar` - Comissões a pagar aos agentes
- `LancamentoCaixa` - Lançamentos manuais de caixa
- `ProjecaoFluxoCaixa` - Projeções mensais
- `Meta` - Metas individuais/gerais
- `PerformanceFuncionario` - Métricas de desempenho
- `AuditLog` - Logs de auditoria
- `Notificacao` - Sistema de notificações
- `ConfiguracaoNotificacao` - Config de alertas
- `CapacidadeAtendimento` - Controle de capacidade
- `PipelineVendas` - Funil de vendas

---

## 🚧 PENDENTE (Parte 2/3)

### 4. Comissões a Pagar (aos Agentes)
**Criar:** `src/pages/ComissoesPagar.tsx`
**Funcionalidades necessárias:**
- Listar comissões devidas aos vendedores
- Registro de pagamento (individual ou em lote)
- Integração com folha de pagamento
- Status: Pendente / Pago / Integrado Folha
- Exportar para inclusão na folha

**Código sugerido:** Similar a ComissoesReceber.tsx, mas usando `comissaoAgente`

---

### 5. Metas e Performance
**Criar:** `src/pages/MetasPerformance.tsx`
**Funcionalidades necessárias:**
- Cadastro de metas mensais (por funcionário ou geral)
- Tipos de meta: Vendas / Comissões / Clientes / Ticket Médio
- Dashboard de performance vs meta
- Ranking de vendedores
- Histórico de atingimento
- Premiações/bônus configuráveis

**Estrutura:**
```typescript
// Criar meta
const novaMeta: Meta = {
  tipo: 'vendas',
  periodo: '2026-01',
  funcionarioId: 'func123',
  valorMeta: 50000,
  valorRealizado: 0, // atualizado dinamicamente
  percentualAtingido: 0,
  status: 'em_andamento'
};

// Calcular performance
const performance: PerformanceFuncionario = {
  funcionarioId: 'func123',
  periodo: '2026-01',
  totalVendas: 15,
  valorVendido: 450000,
  comissoesGeradas: 22500,
  ticketMedio: 30000,
  metasAtingidas: 2,
  metasTotais: 3,
  ranking: 1
};
```

---

### 6. Sistema de Auditoria
**Criar:** `src/lib/auditoria.ts` + `src/pages/Auditoria.tsx`
**Funcionalidades necessárias:**
- Interceptar todas operações CRUD
- Registrar: usuário, ação, timestamp, campo alterado, valores
- Página de consulta de logs
- Filtros: entidade, ação, usuário, período
- Exportação de logs

**Implementação:**
```typescript
// Wrapper para operações
export async function auditar(
  entidade: string,
  entidadeId: string,
  acao: 'criar' | 'editar' | 'deletar',
  campo?: string,
  valorAnterior?: any,
  valorNovo?: any
) {
  const user = auth.currentUser;
  await addDoc(collection(db, "auditLogs"), {
    entidade,
    entidadeId,
    acao,
    usuario: user?.displayName,
    usuarioId: user?.uid,
    campo,
    valorAnterior,
    valorNovo,
    timestamp: Timestamp.now()
  });
}

// Uso em edição de venda
await auditar('vendas', vendaId, 'editar', 'valorContrato', 10000, 15000);
```

---

### 7. Notificações Automáticas
**Criar:** 
- `src/components/layout/NotificationBell.tsx` - Sino de notificações
- `src/lib/notificacoes.ts` - Lógica de criação
- `src/pages/Notificacoes.tsx` - Lista completa

**Funcionalidades necessárias:**
- Verificação diária de vencimentos
- Criar notificação se:
  * Despesa vence em X dias
  * Folha pendente próxima do prazo
  * Meta próxima do fim do mês
  * Comissão atrasada (fornecedor)
- Badge de notificações não lidas
- Marcar como lida
- Link direto para a entidade

**Implementação:**
```typescript
// Função para verificar e criar notificações
export async function verificarNotificacoes() {
  // Despesas vencendo
  const despesas = await getDespesas();
  const hoje = new Date();
  const limite = addDays(hoje, 3); // 3 dias antes

  for (const despesa of despesas) {
    if (despesa.status === 'Pendente' && despesa.dataVencimento <= limite) {
      await criarNotificacao({
        tipo: 'despesa_vencendo',
        titulo: 'Despesa Vencendo',
        mensagem: `${despesa.descricao} vence em ${format(despesa.dataVencimento, 'dd/MM/yyyy')}`,
        destinatarioCargo: 'admin',
        prioridade: 'alta',
        link: '/despesas',
        entidadeRelacionada: 'despesas',
        entidadeRelacionadaId: despesa.id
      });
    }
  }
}

// Executar diariamente (pode usar Firebase Functions ou cron job)
```

---

## 🔧 INTEGRAÇÃO NECESSÁRIA (Parte 3/3)

### 8. Adicionar Rotas
**Editar:** `src/App.tsx`
```typescript
import FluxoCaixa from "./pages/FluxoCaixa";
import ComissoesReceber from "./pages/ComissoesReceber";
import ComissoesPagar from "./pages/ComissoesPagar";
import MetasPerformance from "./pages/MetasPerformance";
import Auditoria from "./pages/Auditoria";

// Adicionar rotas
<Route path="/fluxo-caixa" element={<AppLayout><FluxoCaixa /></AppLayout>} />
<Route path="/comissoes-receber" element={<AppLayout><ComissoesReceber /></AppLayout>} />
<Route path="/comissoes-pagar" element={<AppLayout><ComissoesPagar /></AppLayout>} />
<Route path="/metas" element={<AppLayout><MetasPerformance /></AppLayout>} />
<Route path="/auditoria" element={<AppLayout><Auditoria /></AppLayout>} />
```

### 9. Atualizar Menu
**Editar:** `src/components/layout/AppSidebar.tsx`
Adicionar novo grupo "Financeiro":
```typescript
{
  title: "Financeiro",
  icon: DollarSign,
  items: [
    { title: "Fluxo de Caixa", href: "/fluxo-caixa", icon: TrendingUp },
    { title: "Comissões a Receber", href: "/comissoes-receber", icon: ArrowDownCircle },
    { title: "Comissões a Pagar", href: "/comissoes-pagar", icon: ArrowUpCircle },
  ]
},
{
  title: "Performance",
  icon: Target,
  items: [
    { title: "Metas", href: "/metas", icon: Trophy },
    { title: "Auditoria", href: "/auditoria", icon: Shield },
  ]
}
```

### 10. Firestore Rules
**Editar:** `firestore.rules`
```
match /comissoesReceber/{comissaoId} {
  allow read: if request.auth != null && 
    (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.cargo in ['admin', 'gerente']);
  allow write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.cargo == 'admin';
}

match /comissoesPagar/{comissaoId} {
  allow read: if request.auth != null && 
    (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.cargo in ['admin', 'gerente']);
  allow write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.cargo == 'admin';
}

match /metas/{metaId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.cargo in ['admin', 'gerente'];
}

match /auditLogs/{logId} {
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.cargo == 'admin';
  allow write: if request.auth != null;
}

match /notificacoes/{notifId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
```

---

## 📊 PRÓXIMOS PASSOS

### Imediato:
1. ✅ Fluxo de Caixa - IMPLEMENTADO
2. ✅ Comissões a Receber - IMPLEMENTADO  
3. 🔨 Comissões a Pagar - CRIAR
4. 🔨 Metas e Performance - CRIAR
5. 🔨 Auditoria - CRIAR
6. 🔨 Notificações - CRIAR
7. 🔨 Adicionar rotas no App.tsx
8. 🔨 Atualizar AppSidebar
9. 🔨 Atualizar firestore.rules

### Melhorias Futuras:
- Dashboard com resumo de todos os módulos
- Gráficos de evolução de metas
- Exportação de relatórios (PDF/Excel)
- WhatsApp notifications integration
- Automação com Firebase Functions
- Backup automático
- Integração bancária (Open Banking)

---

## 🎯 IMPACTO ESPERADO

### Fluxo de Caixa:
- ✅ Visibilidade de 6 meses futuros
- ✅ Alertas de saldo negativo
- ✅ Planejamento financeiro melhorado

### Comissões a Receber:
- ✅ Controle exato do que falta receber
- ✅ Identificação de fornecedores inadimplentes
- ✅ Previsão de entrada de caixa

### Comissões a Pagar:
- 📋 Controle de obrigações com vendedores
- 📋 Integração com folha
- 📋 Evitar divergências de pagamento

### Metas:
- 📋 Motivação da equipe
- 📋 Gamificação de vendas
- 📋 Identificação de top performers

### Auditoria:
- 📋 Rastreabilidade total
- 📋 Compliance e LGPD
- 📋 Investigação de alterações

### Notificações:
- 📋 Zero esquecimentos
- 📋 Agilidade em ações críticas
- 📋 Redução de atrasos

---

**Status Atual:** 3/7 módulos implementados (43%)
**Próximo:** Criar páginas Comissões a Pagar e Metas
