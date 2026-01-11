# Motor de Conciliação de Comissões Bancárias

## 📋 Visão Geral

Sistema completo e robusto para conciliação automática de comissões bancárias, desenvolvido para intermediadoras de negócios bancários. O motor compara contratos internos com pagamentos recebidos dos bancos e identifica divergências financeiras e operacionais.

## 🏗️ Arquitetura

### Estrutura de Pastas

```
src/
├── types/
│   └── conciliacao.ts          # Tipos e interfaces TypeScript
└── services/
    └── conciliacao/
        ├── index.ts            # Exportações principais
        ├── normalizador.ts     # Normalização e validação de dados
        ├── matcher.ts          # Algoritmo de matching inteligente
        ├── classificador.ts    # Classificação de status e divergências
        ├── calculadora.ts      # Cálculos financeiros e estatísticas
        └── motor.ts            # Orquestrador principal
```

### Módulos

#### 1. **Normalizador** (`normalizador.ts`)
- Sanitiza e padroniza dados de entrada
- Valida CPF, datas, valores monetários
- Filtra registros inválidos
- Garante consistência dos dados

#### 2. **Matcher** (`matcher.ts`)
- Encontra correspondências entre contratos e pagamentos
- Estratégias de matching em ordem de prioridade:
  1. **CPF + Número do Contrato** (95% confiança)
  2. **CPF + Valor + Data** (60-85% confiança)
  3. **CPF + Produto + Banco** (≤60% confiança - fallback)
- Detecta duplicidades
- Identifica pagamentos órfãos

#### 3. **Classificador** (`classificador.ts`)
- Classifica contratos em 6 status:
  - `PAGO_CORRETAMENTE`
  - `PAGO_COM_DIVERGENCIA_VALOR`
  - `PAGO_FORA_DO_PERIODO`
  - `NAO_PAGO`
  - `DADOS_INCONSISTENTES`
  - `DUPLICIDADE_DE_PAGAMENTO`
- Identifica divergências com severidade (CRÍTICA, ALTA, MÉDIA, BAIXA)
- Gera observações automáticas

#### 4. **Calculadora** (`calculadora.ts`)
- Calcula estatísticas gerais e financeiras
- Gera rankings de bancos e produtos
- Analisa divergências por severidade
- Produz recomendações automáticas
- Exporta dados para CSV

#### 5. **Motor Principal** (`motor.ts`)
- Orquestra todo o processo de conciliação
- Executa 8 etapas sequenciais
- Gera relatórios executivos
- Fornece logs detalhados

## 🚀 Uso Básico

### Importação

```typescript
import { 
  processarConciliacao, 
  type ContratoInterno, 
  type PagamentoBanco 
} from "@/services/conciliacao";
```

### Exemplo Simples

```typescript
// Dados de exemplo
const contratos: Partial<ContratoInterno>[] = [
  {
    idContrato: "CT001",
    cpf: "123.456.789-00",
    cliente: "João Silva",
    banco: "BANCO DO BRASIL",
    produto: "CONSIGNADO",
    numeroContratoBanco: "BB-12345",
    valorLiberado: 10000,
    percentualComissao: 3.5,
    valorComissaoEsperada: 350,
    dataPrevistaPagamento: new Date("2026-02-15"),
  },
  // ... mais contratos
];

const pagamentos: Partial<PagamentoBanco>[] = [
  {
    cpf: "12345678900",
    numeroContratoBanco: "BB-12345",
    produto: "CONSIGNADO",
    valorPago: 350,
    dataPagamento: new Date("2026-02-14"),
    banco: "BANCO DO BRASIL",
  },
  // ... mais pagamentos
];

// Processar conciliação
const resultado = await processarConciliacao(contratos, pagamentos);

if (resultado.sucesso && resultado.relatorio) {
  console.log("Conciliação concluída!");
  console.log(`Acurácia: ${resultado.relatorio.estatisticas.percentualAcuracia}%`);
  console.log(`Diferença total: R$ ${resultado.relatorio.financeiro.diferencaTotal}`);
  
  // Exibir recomendações
  resultado.relatorio.recomendacoes.forEach(rec => console.log(rec));
} else {
  console.error("Erro:", resultado.erro);
}
```

### Exemplo Avançado com Configuração

```typescript
import { 
  processarConciliacao, 
  gerarResumoExecutivo,
  exportarParaCSV,
  type ConfiguracaoMotor 
} from "@/services/conciliacao";

// Configuração personalizada
const config: ConfiguracaoMotor = {
  toleranciaValor: 1.00,           // R$ 1,00 de tolerância
  janelaDiasPagamento: 30,         // 30 dias de janela
  validacaoAvancada: true,
  percentuaisEsperados: {
    CONSIGNADO: { min: 1.5, max: 5.0 },
    PORTABILIDADE: { min: 0.8, max: 3.5 },
    // ... outros produtos
  },
};

const resultado = await processarConciliacao(
  contratos, 
  pagamentos, 
  config
);

if (resultado.sucesso && resultado.relatorio) {
  // Gerar resumo executivo
  const resumo = gerarResumoExecutivo(resultado.relatorio);
  console.log(resumo);
  
  // Exportar para CSV
  const csv = exportarParaCSV(resultado.relatorio.contratosConciliados);
  // Salvar CSV...
  
  // Analisar contratos problemáticos
  const problematicos = resultado.relatorio.contratosConciliados.filter(
    c => c.divergencias.some(d => d.severidade === "CRITICA")
  );
  
  console.log(`\nContratos com divergências críticas: ${problematicos.length}`);
}
```

## 📊 Estrutura do Relatório

O relatório gerado contém:

```typescript
interface RelatorioConciliacao {
  id: string;
  dataGeracao: Date;
  periodoAnalise: { inicio: Date; fim: Date };
  totalContratos: number;
  
  // Contratos processados
  contratosConciliados: ContratoConciliado[];
  
  // Estatísticas
  estatisticas: {
    pagoCorretamente: number;
    pagoComDivergencia: number;
    pagoForaPeriodo: number;
    naoPagos: number;
    dadosInconsistentes: number;
    duplicidades: number;
    percentualAcuracia: number;
  };
  
  // Financeiro
  financeiro: {
    totalEsperado: number;
    totalPago: number;
    diferencaTotal: number;
    porBanco: Map<string, {...}>;
    porProduto: Map<ProdutoBancario, {...}>;
  };
  
  // Exceções
  contratosNaoEncontrados: ContratoInterno[];
  pagamentosSemContrato: PagamentoBanco[];
  
  // Recomendações
  recomendacoes: string[];
}
```

## 🎯 Casos de Uso

### 1. Importação de Arquivos Excel/PDF

```typescript
import * as XLSX from "xlsx";
import { processarConciliacao } from "@/services/conciliacao";

// Ler arquivo Excel
const workbook = XLSX.readFile("relatorio_banco.xlsx");
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const dados = XLSX.utils.sheet_to_json(worksheet);

// Mapear para formato esperado
const pagamentos = dados.map(row => ({
  cpf: row["CPF"],
  numeroContratoBanco: row["Contrato"],
  produto: row["Produto"],
  valorPago: parseFloat(row["Valor"]),
  dataPagamento: new Date(row["Data"]),
  banco: row["Banco"],
}));

// Processar
const resultado = await processarConciliacao(contratosInternos, pagamentos);
```

### 2. Análise por Período

```typescript
// Filtrar contratos por período
const inicio = new Date("2026-01-01");
const fim = new Date("2026-01-31");

const contratosPeriodo = contratos.filter(c => {
  const data = c.dataPrevistaPagamento;
  return data >= inicio && data <= fim;
});

const resultado = await processarConciliacao(contratosPeriodo, pagamentos);
```

### 3. Auditoria de Banco Específico

```typescript
// Filtrar por banco
const contratosBanco = contratos.filter(c => c.banco === "CAIXA");
const pagamentosBanco = pagamentos.filter(p => p.banco === "CAIXA");

const resultado = await processarConciliacao(contratosBanco, pagamentosBanco);

if (resultado.sucesso && resultado.relatorio) {
  const relatorio = gerarRelatorioPorBanco(resultado.relatorio);
  console.log(relatorio);
}
```

## ⚙️ Configurações

### Tolerância de Valor
```typescript
config.toleranciaValor = 0.50; // R$ 0,50 - diferenças menores são ignoradas
```

### Janela de Pagamento
```typescript
config.janelaDiasPagamento = 15; // 15 dias antes ou depois da data prevista
```

### Validação Avançada
```typescript
config.validacaoAvancada = true; // Ativa validação de percentuais
```

### Percentuais Esperados por Produto
```typescript
config.percentuaisEsperados = {
  CONSIGNADO: { min: 1.0, max: 6.0 },    // 1% a 6%
  PORTABILIDADE: { min: 0.5, max: 4.0 }, // 0.5% a 4%
  REFIN: { min: 1.0, max: 5.0 },         // 1% a 5%
  CARTAO: { min: 2.0, max: 8.0 },        // 2% a 8%
  PESSOAL: { min: 3.0, max: 10.0 },      // 3% a 10%
};
```

## 🔍 Algoritmo de Matching

### Ordem de Prioridade

1. **Match Exato** (CPF + Número do Contrato)
   - Confiança: 95%
   - Mais confiável

2. **Match por Valor** (CPF + Valor ± tolerância + Data ± janela)
   - Confiança: 60-85%
   - Baseado em proximidade de valor

3. **Match Contextual** (CPF + Produto + Banco)
   - Confiança: ≤60%
   - Fallback, requer revisão manual

### Detecção de Duplicidades

O motor identifica automaticamente quando:
- Múltiplos contratos apontam para o mesmo pagamento
- Um pagamento foi processado mais de uma vez

## 📈 Estatísticas e Análises

### Rankings

```typescript
import { gerarRankingBancos, gerarRankingProdutos } from "@/services/conciliacao";

// Ranking de bancos por acurácia
const rankingBancos = gerarRankingBancos(relatorio.contratosConciliados);
rankingBancos.forEach(banco => {
  console.log(`${banco.banco}: ${banco.percentualAcuracia}% de acurácia`);
});

// Ranking de produtos
const rankingProdutos = gerarRankingProdutos(relatorio.contratosConciliados);
```

### Análise de Divergências

```typescript
import { analisarDivergencias } from "@/services/conciliacao";

const analise = analisarDivergencias(relatorio.contratosConciliados);

console.log(`Divergências Críticas: ${analise.criticas}`);
console.log(`Valor Recuperável: R$ ${analise.valorRecuperavel}`);
```

## 🛡️ Tratamento de Erros

O motor é tolerante a falhas:

- **Dados inválidos** são filtrados e reportados nos logs
- **CPFs inválidos** são rejeitados
- **Datas mal formatadas** são normalizadas ou descartadas
- **Valores não numéricos** são convertidos ou zerados

```typescript
const resultado = await processarConciliacao(contratos, pagamentos);

// Verificar logs
resultado.logs.forEach(log => console.log(log));

// Verificar sucesso
if (!resultado.sucesso) {
  console.error("Erro:", resultado.erro);
  // Tratar erro...
}
```

## 📤 Exportação

### CSV
```typescript
import { exportarParaCSV } from "@/services/conciliacao";

const csv = exportarParaCSV(relatorio.contratosConciliados);
// Download do arquivo...
```

### Relatórios Textuais
```typescript
import { 
  gerarResumoExecutivo, 
  gerarRelatorioPorBanco,
  gerarRelatorioPorProduto 
} from "@/services/conciliacao";

const resumo = gerarResumoExecutivo(relatorio);
const porBanco = gerarRelatorioPorBanco(relatorio);
const porProduto = gerarRelatorioPorProduto(relatorio);
```

## 🔒 Segurança e Auditoria

### Logs Detalhados
Cada processamento gera logs completos:
```typescript
resultado.logs.forEach(log => {
  // Salvar em sistema de auditoria
  auditLogger.info(log);
});
```

### Rastreabilidade
Cada contrato conciliado contém:
- Método de matching utilizado
- Nível de confiança
- Observações automáticas
- Data/hora da conciliação

### Validação de CPF
Todos os CPFs são validados com algoritmo completo de dígitos verificadores.

## 🚀 Performance

- **Processamento em lote**: Otimizado para grandes volumes
- **Normalização eficiente**: Filtros aplicados antes do matching
- **Matching inteligente**: Estratégias ordenadas por performance
- **Cálculos incrementais**: Agregações feitas em passo único

**Benchmarks estimados**:
- 1.000 contratos: ~100-300ms
- 10.000 contratos: ~1-3s
- 100.000 contratos: ~10-30s

## 📝 Boas Práticas

1. **Sempre validar entrada**: Use os normalizadores antes de processar
2. **Configurar tolerâncias adequadas**: Ajuste para seu negócio
3. **Revisar baixa confiança**: Matches com confiança < 60% precisam de revisão manual
4. **Analisar recomendações**: O motor gera insights automáticos
5. **Salvar logs**: Importante para auditoria e debugging
6. **Tratar divergências críticas**: Prioridade máxima

## 🤝 Integração

O motor é **independente de framework** e pode ser integrado em:
- APIs REST
- Jobs de processamento
- Sistemas batch
- Aplicações web (React, Vue, etc.)
- Servidores Node.js

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs do processamento
2. Revisar configurações
3. Validar formato dos dados de entrada
4. Consultar esta documentação

---

**Desenvolvido com ❤️ para garantir a confiabilidade financeira da sua empresa.**
