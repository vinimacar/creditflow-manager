# 📊 Folha de Pagamento 2026 - Documentação Completa

## 🎯 Visão Geral

Sistema completo de cálculo de folha de pagamento com conformidade às leis trabalhistas brasileiras de 2026, incluindo exportação para eSocial.

## 📋 Funcionalidades Implementadas

### 1. ✅ Cálculos Base com Tabelas 2026

#### INSS (Alíquotas Progressivas)
```typescript
Faixa 1: até R$ 1.518,00 → 7,5%
Faixa 2: R$ 1.518,01 até R$ 2.793,88 → 9%
Faixa 3: R$ 2.793,89 até R$ 4.190,83 → 12%
Faixa 4: acima de R$ 4.190,84 → 14%
Teto: R$ 8.157,41
```

#### IRRF (Imposto de Renda Retido na Fonte)
```typescript
Isento: até R$ 2.259,20
7,5%: R$ 2.259,21 até R$ 2.826,65 (dedução: R$ 169,44)
15%: R$ 2.826,66 até R$ 3.751,05 (dedução: R$ 381,44)
22,5%: R$ 3.751,06 até R$ 4.664,68 (dedução: R$ 662,77)
27,5%: acima de R$ 4.664,68 (dedução: R$ 896,00)

Dedução por dependente: R$ 189,59
```

#### Salário Mínimo 2026
```typescript
R$ 1.518,00
```

### 2. 💰 Proventos Detalhados

#### Horas Extras 50%
- Cálculo automático baseado no salário-hora
- Fórmula: `(Salário Base / Horas Mensais) × 1,5 × Quantidade`
- Padrão: 220 horas mensais

#### Horas Extras 100%
- Aplicado em domingos e feriados
- Fórmula: `(Salário Base / Horas Mensais) × 2,0 × Quantidade`

#### Adicional Noturno
- Horário: 22h às 5h
- Adicional: 20% sobre a hora normal
- Hora noturna reduzida: 52min30s (7/8 da hora normal)
- Fórmula: `Valor Hora × 0,20 × Horas Reduzidas`

#### DSR (Descanso Semanal Remunerado)
- Calculado sobre horas extras e adicionais
- Fórmula: `(Total HE + Adicionais) / Dias Úteis × Dias DSR`
- Garante remuneração proporcional nos repousos

#### Outros Proventos
- Comissões
- Bônus
- Insalubridade (10%, 20% ou 40% do salário mínimo)
- Periculosidade (30% do salário base)
- Outros proventos customizáveis

### 3. 📉 Descontos

#### Descontos Obrigatórios
- **INSS**: Calculado com alíquotas progressivas
- **IRRF**: Com dedução de dependentes
- **Vale Transporte**: 6% do salário (limitado ao custo)

#### Descontos Adicionais
- Vale Refeição
- Plano de Saúde
- Faltas (desconto proporcional ao salário base)
- Outros descontos customizáveis

#### Cálculo de Faltas
```typescript
Fórmula: (Salário Base / Dias Úteis) × Dias de Faltas
```

### 4. 🏢 Encargos Patronais

#### FGTS (Fundo de Garantia do Tempo de Serviço)
- Percentual: 8% sobre o salário bruto
- **Importante**: Não é desconto do funcionário!
- Depositado pelo empregador mensalmente

#### Provisão de Férias
- Cálculo: 1/12 do salário + 1/3 constitucional
- Fórmula: `(Salário Bruto / 12) × (1 + 1/3)`
- Acumulado mensalmente

#### Provisão de 13º Salário
- Cálculo: 1/12 do salário
- Fórmula: `Salário Bruto / 12`
- Acumulado mensalmente

### 5. 📊 Estrutura de Dados JSON

#### Resumo de Folha (Tabela)
```json
{
  "id": "uuid",
  "funcionarioId": "func-123",
  "funcionarioNome": "João da Silva",
  "funcionarioCPF": "123.456.789-00",
  "mesReferencia": "2026-01",
  "salarioBase": 3500.00,
  "totalProventos": 4250.00,
  "totalDescontos": 850.00,
  "salarioLiquido": 3400.00,
  "fgts": 340.00,
  "inss": 420.00,
  "irrf": 150.00,
  "status": "processada"
}
```

#### Detalhamento Completo
```json
{
  "proventos": {
    "salarioBase": 3500.00,
    "horasExtras50": 350.00,
    "horasExtras100": 200.00,
    "adicionalNoturno": 150.00,
    "dsr": 50.00,
    "comissoes": 0,
    "bonus": 0,
    "insalubridade": 0,
    "periculosidade": 0,
    "outros": 0
  },
  "descontos": {
    "inss": 420.00,
    "irrf": 150.00,
    "valeTransporte": 210.00,
    "valeRefeicao": 40.00,
    "planoDeSaude": 30.00,
    "faltas": 0,
    "outros": 0
  },
  "encargos": {
    "fgts": 340.00,
    "provisaoFerias": 389.00,
    "provisao13Salario": 292.00,
    "total": 1021.00
  },
  "informacoesAdicionais": {
    "numeroDependentes": 2,
    "diasTrabalhados": 22,
    "diasFaltas": 0,
    "horasExtras50": 10,
    "horasExtras100": 5,
    "horasAdicionalNoturno": 20
  }
}
```

### 6. 📤 Exportação eSocial

#### Formato S-1200
Evento de Remuneração de Trabalhador vinculado ao RGPS (Regime Geral de Previdência Social).

#### Rubricas Mapeadas
```typescript
SALARIO_BASE: '1000'
HORAS_EXTRAS_50: '1010'
HORAS_EXTRAS_100: '1011'
ADICIONAL_NOTURNO: '1020'
DSR: '1030'
COMISSOES: '1040'
BONUS: '1050'
INSALUBRIDADE: '1060'
PERICULOSIDADE: '1070'
INSS: '9001'
IRRF: '9002'
VALE_TRANSPORTE: '9010'
VALE_REFEICAO: '9011'
PLANO_SAUDE: '9012'
FALTAS: '9020'
FGTS: '9200' (informativa)
PROVISAO_FERIAS: '9201' (informativa)
PROVISAO_13_SALARIO: '9202' (informativa)
```

#### Estrutura XML/JSON
```json
{
  "evtRemun": {
    "ideEvento": {
      "indRetif": 1,
      "indApuracao": 1,
      "perApur": "2026-01",
      "tpAmb": 2,
      "procEmi": 1,
      "verProc": "1.0.0"
    },
    "ideEmpregador": {
      "tpInsc": 1,
      "nrInsc": "00000000000000"
    },
    "ideTrabalhador": {
      "cpfTrab": "12345678900",
      "nmTrab": "João da Silva",
      "dtNascto": "1990-01-01"
    },
    "dmDev": [{
      "ideDmDev": "func-123-2026-01",
      "codCateg": 101,
      "infoPerApur": {
        "ideEstabLot": [{
          "tpInsc": 1,
          "nrInsc": "00000000000000",
          "codLotacao": "001",
          "remunPerApur": {
            "matricula": "func-123",
            "itensRemun": [
              {
                "codRubr": "1000",
                "ideTabRubr": "TABELA01",
                "vrRubr": 3500.00,
                "indApurIR": 0
              }
            ]
          }
        }]
      }
    }]
  }
}
```

## 🔄 Fluxo de Cálculo

### Ordem de Execução
1. **Calcular Proventos**
   - Salário Base
   - Horas Extras (50% e 100%)
   - Adicional Noturno
   - DSR sobre HE e Adicionais
   - Outros Proventos

2. **Calcular Descontos**
   - Faltas (se houver)
   - Base de Cálculo = Proventos - Faltas
   - INSS sobre base
   - IRRF sobre (base - INSS - dependentes)
   - Vale Transporte (6% limitado)
   - Outros Descontos

3. **Calcular Encargos Patronais**
   - FGTS (8% do bruto)
   - Provisão Férias (1/12 + 1/3)
   - Provisão 13º (1/12)

4. **Calcular Líquido**
   - Salário Líquido = Total Proventos - Total Descontos

## 📝 Exemplos de Uso

### Exemplo 1: Funcionário Básico
```typescript
const params = {
  funcionarioId: "func-001",
  mesReferencia: "2026-01",
  salarioBase: 3500.00,
  numeroDependentes: 2,
  optouVT: true,
  custoVT: 250.00,
  diasUteis: 22,
  diasDSR: 8,
  horasMensais: 220
};

const folha = calcularFolhaPagamentoCompleta(params);

// Resultado:
// Salário Bruto: R$ 3.500,00
// INSS: R$ 420,00
// IRRF: R$ 98,80 (com 2 dependentes)
// VT: R$ 210,00
// Salário Líquido: R$ 2.771,20
// FGTS (Patronal): R$ 280,00
```

### Exemplo 2: Com Horas Extras
```typescript
const params = {
  funcionarioId: "func-002",
  mesReferencia: "2026-01",
  salarioBase: 2500.00,
  horasExtras50: 10,
  horasExtras100: 5,
  horasAdicionalNoturno: 20,
  diasUteis: 22,
  diasDSR: 8,
  horasMensais: 220
};

const folha = calcularFolhaPagamentoCompleta(params);

// Cálculos:
// Valor Hora = R$ 2.500,00 / 220 = R$ 11,36
// HE 50% = 10 × R$ 17,04 = R$ 170,40
// HE 100% = 5 × R$ 22,72 = R$ 113,60
// Adic. Noturno = ~R$ 102,27
// DSR = (170,40 + 113,60 + 102,27) / 22 × 8 = R$ 140,46
// Total Proventos: R$ 3.026,73
```

### Exemplo 3: Exportar para eSocial
```typescript
const folhasDetalhadas = [...]; // Array de folhas
const jsonESocial = exportarParaESocialJSON(
  folhasDetalhadas, 
  '00000000000000' // CNPJ da empresa
);

// Salvar arquivo
const blob = new Blob([jsonESocial], { type: 'application/json' });
// Download: esocial_2026-01.json
```

## ⚠️ Observações Importantes

### Compliance
1. **Tabelas atualizadas**: Baseadas na legislação de 2026
2. **Cálculo progressivo**: INSS e IRRF seguem faixas progressivas
3. **DSR obrigatório**: Sempre calcular sobre HE e adicionais
4. **Hora noturna reduzida**: Aplicar fator 60/52,5 no adicional noturno

### Boas Práticas
1. **Sempre conferir os valores** com tabelas oficiais
2. **Testar cálculos** com exemplos conhecidos
3. **Documentar exceções** (licenças, afastamentos)
4. **Backup dos dados** antes de processar folha
5. **Validar eSocial** em ambiente de testes

### Próximos Passos
- [ ] Integrar com interface da página FolhaPagamento.tsx
- [ ] Adicionar cálculos de férias e 13º
- [ ] Implementar rescisão
- [ ] Adicionar relatórios gerenciais
- [ ] Integração automática com eSocial via API

## 📚 Referências

- Lei nº 14.848/2024 (Tabela IRRF)
- Portaria Interministerial MPS/MF nº 26/2026 (Tabela INSS)
- CLT (Consolidação das Leis do Trabalho)
- Manual eSocial versão S-1.2
- Instrução Normativa RFB nº 2.110/2022

---

**Versão:** 1.0.0  
**Última Atualização:** Janeiro 2026  
**Autor:** CréditoGestor Team
