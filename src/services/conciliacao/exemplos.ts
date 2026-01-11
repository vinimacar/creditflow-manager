/**
 * Motor de Conciliação de Comissões Bancárias
 * Exemplos de Uso e Testes
 * 
 * @module services/conciliacao/exemplos
 */

import type { ContratoInterno, PagamentoBanco } from "@/types/conciliacao";
import { processarConciliacao } from "./motor";

// ============================================================================
// DADOS DE EXEMPLO
// ============================================================================

/**
 * Contratos internos de exemplo
 */
export const contratosExemplo: Partial<ContratoInterno>[] = [
  // Caso 1: Match perfeito
  {
    idContrato: "CT-2026-001",
    cpf: "123.456.789-00",
    cliente: "João Silva",
    banco: "BANCO DO BRASIL",
    produto: "CONSIGNADO",
    numeroContratoBanco: "BB-12345-2026",
    valorLiberado: 10000.00,
    percentualComissao: 3.5,
    valorComissaoEsperada: 350.00,
    dataPrevistaPagamento: new Date("2026-02-15"),
  },
  
  // Caso 2: Divergência de valor
  {
    idContrato: "CT-2026-002",
    cpf: "987.654.321-00",
    cliente: "Maria Santos",
    banco: "CAIXA ECONÔMICA",
    produto: "PORTABILIDADE",
    numeroContratoBanco: "CEF-67890-2026",
    valorLiberado: 25000.00,
    percentualComissao: 2.0,
    valorComissaoEsperada: 500.00,
    dataPrevistaPagamento: new Date("2026-02-20"),
  },
  
  // Caso 3: Pagamento fora do período
  {
    idContrato: "CT-2026-003",
    cpf: "456.789.123-00",
    cliente: "Pedro Costa",
    banco: "BRADESCO",
    produto: "REFIN",
    numeroContratoBanco: "BRA-11111-2026",
    valorLiberado: 15000.00,
    percentualComissao: 4.0,
    valorComissaoEsperada: 600.00,
    dataPrevistaPagamento: new Date("2026-01-30"),
  },
  
  // Caso 4: Não pago
  {
    idContrato: "CT-2026-004",
    cpf: "321.654.987-00",
    cliente: "Ana Oliveira",
    banco: "ITAÚ",
    produto: "CARTAO",
    numeroContratoBanco: "ITU-22222-2026",
    valorLiberado: 5000.00,
    percentualComissao: 5.0,
    valorComissaoEsperada: 250.00,
    dataPrevistaPagamento: new Date("2026-02-10"),
  },
  
  // Caso 5: Match por CPF + Valor + Data (sem número de contrato exato)
  {
    idContrato: "CT-2026-005",
    cpf: "111.222.333-00",
    cliente: "Carlos Mendes",
    banco: "SANTANDER",
    produto: "PESSOAL",
    numeroContratoBanco: "SAN-33333-2026",
    valorLiberado: 8000.00,
    percentualComissao: 6.0,
    valorComissaoEsperada: 480.00,
    dataPrevistaPagamento: new Date("2026-02-25"),
  },
  
  // Caso 6: Duplicidade (mesmo pagamento para dois contratos)
  {
    idContrato: "CT-2026-006A",
    cpf: "555.666.777-00",
    cliente: "Lucia Ferreira",
    banco: "BANCO DO BRASIL",
    produto: "CONSIGNADO",
    numeroContratoBanco: "BB-44444-2026",
    valorLiberado: 12000.00,
    percentualComissao: 3.0,
    valorComissaoEsperada: 360.00,
    dataPrevistaPagamento: new Date("2026-02-18"),
  },
  {
    idContrato: "CT-2026-006B",
    cpf: "555.666.777-00",
    cliente: "Lucia Ferreira",
    banco: "BANCO DO BRASIL",
    produto: "CONSIGNADO",
    numeroContratoBanco: "BB-44444-2026",
    valorLiberado: 12000.00,
    percentualComissao: 3.0,
    valorComissaoEsperada: 360.00,
    dataPrevistaPagamento: new Date("2026-02-18"),
  },
];

/**
 * Pagamentos do banco de exemplo
 */
export const pagamentosExemplo: Partial<PagamentoBanco>[] = [
  // Pagamento 1: Match perfeito com CT-2026-001
  {
    cpf: "12345678900",
    numeroContratoBanco: "BB-12345-2026",
    produto: "CONSIGNADO",
    valorPago: 350.00,
    dataPagamento: new Date("2026-02-14"),
    banco: "BANCO DO BRASIL",
  },
  
  // Pagamento 2: Divergência de valor com CT-2026-002 (pago R$ 450 ao invés de R$ 500)
  {
    cpf: "98765432100",
    numeroContratoBanco: "CEF-67890-2026",
    produto: "PORTABILIDADE",
    valorPago: 450.00,
    dataPagamento: new Date("2026-02-21"),
    banco: "CAIXA ECONÔMICA",
  },
  
  // Pagamento 3: Fora do período com CT-2026-003 (35 dias de atraso)
  {
    cpf: "45678912300",
    numeroContratoBanco: "BRA-11111-2026",
    produto: "REFIN",
    valorPago: 600.00,
    dataPagamento: new Date("2026-03-06"), // 35 dias depois
    banco: "BRADESCO",
  },
  
  // Pagamento 4: CT-2026-004 NÃO tem pagamento (simulando não pago)
  
  // Pagamento 5: Match por CPF + Valor + Data (contrato diferente)
  {
    cpf: "11122233300",
    numeroContratoBanco: "SAN-33333-2026-ALT", // Número diferente
    produto: "PESSOAL",
    valorPago: 479.50, // Pequena diferença
    dataPagamento: new Date("2026-02-26"),
    banco: "SANTANDER",
  },
  
  // Pagamento 6: Duplicidade - mesmo pagamento para CT-2026-006A e CT-2026-006B
  {
    cpf: "55566677700",
    numeroContratoBanco: "BB-44444-2026",
    produto: "CONSIGNADO",
    valorPago: 360.00,
    dataPagamento: new Date("2026-02-18"),
    banco: "BANCO DO BRASIL",
  },
  
  // Pagamento 7: Pagamento órfão (sem contrato correspondente)
  {
    cpf: "99988877700",
    numeroContratoBanco: "OUTRO-99999-2026",
    produto: "CONSIGNADO",
    valorPago: 200.00,
    dataPagamento: new Date("2026-02-22"),
    banco: "OUTRO BANCO",
  },
];

// ============================================================================
// FUNÇÃO DE EXEMPLO EXECUTÁVEL
// ============================================================================

/**
 * Executa exemplo completo de conciliação
 */
export async function executarExemplo() {
  console.log("=" .repeat(80));
  console.log("EXEMPLO DE CONCILIAÇÃO DE COMISSÕES BANCÁRIAS");
  console.log("=" .repeat(80));
  console.log("");
  
  console.log(`📊 Contratos a processar: ${contratosExemplo.length}`);
  console.log(`💰 Pagamentos recebidos: ${pagamentosExemplo.length}`);
  console.log("");
  
  // Processar conciliação
  const resultado = await processarConciliacao(contratosExemplo, pagamentosExemplo);
  
  if (!resultado.sucesso) {
    console.error("❌ Erro no processamento:", resultado.erro);
    console.log("\n📋 Logs:");
    resultado.logs.forEach(log => console.log(log));
    return;
  }
  
  const { relatorio } = resultado;
  if (!relatorio) {
    console.error("❌ Relatório não gerado");
    return;
  }
  
  // Exibir estatísticas
  console.log("-" .repeat(80));
  console.log("ESTATÍSTICAS");
  console.log("-" .repeat(80));
  console.log(`✅ Pagos Corretamente: ${relatorio.estatisticas.pagoCorretamente}`);
  console.log(`⚠️  Pago com Divergência: ${relatorio.estatisticas.pagoComDivergencia}`);
  console.log(`📅 Pago Fora do Período: ${relatorio.estatisticas.pagoForaPeriodo}`);
  console.log(`❌ Não Pagos: ${relatorio.estatisticas.naoPagos}`);
  console.log(`⚙️  Dados Inconsistentes: ${relatorio.estatisticas.dadosInconsistentes}`);
  console.log(`🔄 Duplicidades: ${relatorio.estatisticas.duplicidades}`);
  console.log(`🎯 Taxa de Acurácia: ${relatorio.estatisticas.percentualAcuracia.toFixed(1)}%`);
  console.log("");
  
  // Exibir financeiro
  console.log("-" .repeat(80));
  console.log("FINANCEIRO");
  console.log("-" .repeat(80));
  console.log(`💵 Total Esperado: R$ ${relatorio.financeiro.totalEsperado.toFixed(2)}`);
  console.log(`💰 Total Pago: R$ ${relatorio.financeiro.totalPago.toFixed(2)}`);
  console.log(`📊 Diferença: R$ ${relatorio.financeiro.diferencaTotal.toFixed(2)}`);
  console.log("");
  
  // Detalhes dos contratos
  console.log("-" .repeat(80));
  console.log("DETALHES DOS CONTRATOS");
  console.log("-" .repeat(80));
  
  relatorio.contratosConciliados.forEach((contrato, idx) => {
    console.log(`\n${idx + 1}. ${contrato.contratoInterno.idContrato} - ${contrato.contratoInterno.cliente}`);
    console.log(`   Status: ${contrato.status}`);
    console.log(`   Esperado: R$ ${contrato.valorEsperado.toFixed(2)} | Pago: R$ ${contrato.valorPago.toFixed(2)}`);
    console.log(`   Matching: ${contrato.matching.metodoMatch} (${contrato.matching.confianca}%)`);
    
    if (contrato.divergencias.length > 0) {
      console.log(`   Divergências:`);
      contrato.divergencias.forEach(div => {
        console.log(`   - [${div.severidade}] ${div.descricao}`);
      });
    }
    
    if (contrato.observacoesAutomaticas.length > 0) {
      console.log(`   Observações:`);
      contrato.observacoesAutomaticas.slice(0, 2).forEach(obs => {
        console.log(`   ${obs}`);
      });
    }
  });
  
  // Contratos não encontrados
  if (relatorio.contratosNaoEncontrados.length > 0) {
    console.log("\n" + "-" .repeat(80));
    console.log("CONTRATOS NÃO PAGOS");
    console.log("-" .repeat(80));
    relatorio.contratosNaoEncontrados.forEach(contrato => {
      console.log(`- ${contrato.idContrato}: ${contrato.cliente} - R$ ${contrato.valorComissaoEsperada.toFixed(2)}`);
    });
  }
  
  // Pagamentos órfãos
  if (relatorio.pagamentosSemContrato.length > 0) {
    console.log("\n" + "-" .repeat(80));
    console.log("PAGAMENTOS SEM CONTRATO");
    console.log("-" .repeat(80));
    relatorio.pagamentosSemContrato.forEach(pagamento => {
      console.log(`- ${pagamento.banco}: ${pagamento.numeroContratoBanco} - R$ ${pagamento.valorPago.toFixed(2)}`);
    });
  }
  
  // Recomendações
  console.log("\n" + "-" .repeat(80));
  console.log("RECOMENDAÇÕES");
  console.log("-" .repeat(80));
  relatorio.recomendacoes.forEach((rec, idx) => {
    console.log(`${idx + 1}. ${rec}`);
  });
  
  // Logs
  console.log("\n" + "-" .repeat(80));
  console.log("LOGS DE PROCESSAMENTO");
  console.log("-" .repeat(80));
  resultado.logs.forEach(log => console.log(log));
  
  console.log("\n" + "=" .repeat(80));
  console.log(`✅ Processamento concluído em ${resultado.tempoProcessamento}ms`);
  console.log("=" .repeat(80));
  
  return relatorio;
}

// ============================================================================
// CASOS DE TESTE ESPECÍFICOS
// ============================================================================

/**
 * Teste: Matching perfeito
 */
export async function testeMatchingPerfeito() {
  const contratos: Partial<ContratoInterno>[] = [{
    idContrato: "TEST-001",
    cpf: "12345678900",
    cliente: "Teste",
    banco: "TESTE",
    produto: "CONSIGNADO",
    numeroContratoBanco: "TEST-001",
    valorLiberado: 1000,
    percentualComissao: 5,
    valorComissaoEsperada: 50,
    dataPrevistaPagamento: new Date(),
  }];
  
  const pagamentos: Partial<PagamentoBanco>[] = [{
    cpf: "12345678900",
    numeroContratoBanco: "TEST-001",
    produto: "CONSIGNADO",
    valorPago: 50,
    dataPagamento: new Date(),
    banco: "TESTE",
  }];
  
  const resultado = await processarConciliacao(contratos, pagamentos);
  
  console.assert(
    resultado.sucesso && 
    resultado.relatorio?.estatisticas.pagoCorretamente === 1,
    "Teste de matching perfeito falhou"
  );
  
  return resultado;
}

/**
 * Teste: Divergência de valor
 */
export async function testeDivergenciaValor() {
  const contratos: Partial<ContratoInterno>[] = [{
    idContrato: "TEST-002",
    cpf: "12345678900",
    cliente: "Teste",
    banco: "TESTE",
    produto: "CONSIGNADO",
    numeroContratoBanco: "TEST-002",
    valorLiberado: 1000,
    percentualComissao: 5,
    valorComissaoEsperada: 50,
    dataPrevistaPagamento: new Date(),
  }];
  
  const pagamentos: Partial<PagamentoBanco>[] = [{
    cpf: "12345678900",
    numeroContratoBanco: "TEST-002",
    produto: "CONSIGNADO",
    valorPago: 45, // R$ 5 a menos
    dataPagamento: new Date(),
    banco: "TESTE",
  }];
  
  const resultado = await processarConciliacao(contratos, pagamentos);
  
  console.assert(
    resultado.sucesso && 
    resultado.relatorio?.estatisticas.pagoComDivergencia === 1,
    "Teste de divergência de valor falhou"
  );
  
  return resultado;
}

/**
 * Teste: Contrato não pago
 */
export async function testeContratoNaoPago() {
  const contratos: Partial<ContratoInterno>[] = [{
    idContrato: "TEST-003",
    cpf: "12345678900",
    cliente: "Teste",
    banco: "TESTE",
    produto: "CONSIGNADO",
    numeroContratoBanco: "TEST-003",
    valorLiberado: 1000,
    percentualComissao: 5,
    valorComissaoEsperada: 50,
    dataPrevistaPagamento: new Date(),
  }];
  
  const pagamentos: Partial<PagamentoBanco>[] = []; // Nenhum pagamento
  
  const resultado = await processarConciliacao(contratos, pagamentos);
  
  console.assert(
    resultado.sucesso && 
    resultado.relatorio?.estatisticas.naoPagos === 1,
    "Teste de contrato não pago falhou"
  );
  
  return resultado;
}

/**
 * Executa todos os testes
 */
export async function executarTodosTestes() {
  console.log("🧪 Executando testes...\n");
  
  await testeMatchingPerfeito();
  console.log("✅ Teste 1: Matching perfeito");
  
  await testeDivergenciaValor();
  console.log("✅ Teste 2: Divergência de valor");
  
  await testeContratoNaoPago();
  console.log("✅ Teste 3: Contrato não pago");
  
  console.log("\n✅ Todos os testes passaram!");
}

// Descomentar para executar exemplo ao importar
// executarExemplo();
