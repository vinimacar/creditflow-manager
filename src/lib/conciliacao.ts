import type { DadosExcel } from "@/components/conciliacao/ImportarExcel";

export interface Divergencia {
  id: string;
  contratoInterno: string;
  contratoFornecedor: string;
  cliente: string;
  fornecedor: string;
  funcionario: string;
  valorComissaoInterno: number;
  valorComissaoFornecedor: number;
  valorProdutoInterno: number;
  valorProdutoFornecedor: number;
  dataVenda: Date;
  status: "ok" | "divergente" | "nao_encontrado_fornecedor" | "nao_encontrado_interno";
  tiposDivergencia: string[];
  diferencaComissao: number;
  diferencaProduto: number;
  criterioMatch?: string; // Critério usado para fazer o match (debug)
  validacaoInteligente?: {
    taxaAplicadaInterno: number;
    taxaAplicadaFornecedor: number;
    taxaEsperada?: number;
    taxaDivergente: boolean;
    valorPagoCorreto: boolean;
    observacoes: string[];
  };
}

/**
 * Valida\u00e7\u00e3o inteligente de taxas e valores pagos
 * Verifica se as taxas aplicadas est\u00e3o consistentes e se os valores foram pagos corretamente
 */
export function validarTaxasEValoresPagos(
  valorProduto: number,
  valorComissao: number,
  valorProdutoFornecedor?: number,
  valorComissaoFornecedor?: number
): Divergencia["validacaoInteligente"] {
  const observacoes: string[] = [];
  
  // Calcular taxa aplicada internamente (percentual da comiss\u00e3o sobre o produto)
  const taxaAplicadaInterno = valorProduto > 0 ? (valorComissao / valorProduto) * 100 : 0;
  
  // Calcular taxa aplicada pelo fornecedor
  const taxaAplicadaFornecedor = valorProdutoFornecedor && valorProdutoFornecedor > 0 && valorComissaoFornecedor
    ? (valorComissaoFornecedor / valorProdutoFornecedor) * 100
    : 0;
  
  // Taxas comuns no mercado (cr\u00e9dito consignado geralmente entre 1% e 6%)
  const taxaMinEsperada = 0.5; // 0.5%
  const taxaMaxEsperada = 8; // 8%
  const toleranciaTaxa = 0.1; // 0.1% de tolerância
  
  let taxaDivergente = false;
  let valorPagoCorreto = true;
  
  // Verificar se a taxa interna está dentro do esperado
  if (taxaAplicadaInterno < taxaMinEsperada) {
    observacoes.push(`⚠️ Taxa muito baixa: ${taxaAplicadaInterno.toFixed(2)}% (esperado: ${taxaMinEsperada}% - ${taxaMaxEsperada}%)`);
    taxaDivergente = true;
  } else if (taxaAplicadaInterno > taxaMaxEsperada) {
    observacoes.push(`⚠️ Taxa muito alta: ${taxaAplicadaInterno.toFixed(2)}% (esperado: ${taxaMinEsperada}% - ${taxaMaxEsperada}%)`);
    taxaDivergente = true;
  }
  
  // Comparar taxas entre interno e fornecedor
  if (taxaAplicadaFornecedor > 0) {
    const diferencaTaxa = Math.abs(taxaAplicadaInterno - taxaAplicadaFornecedor);
    
    if (diferencaTaxa > toleranciaTaxa) {
      observacoes.push(
        `⚠️ Divergência de taxa: Interno ${taxaAplicadaInterno.toFixed(2)}% vs Fornecedor ${taxaAplicadaFornecedor.toFixed(2)}%`
      );
      taxaDivergente = true;
    }
    
    // Verificar se o valor pago está correto baseado na taxa do fornecedor
    const valorEsperado = (valorProdutoFornecedor || 0) * (taxaAplicadaFornecedor / 100);
    const diferencaValor = Math.abs(valorEsperado - (valorComissaoFornecedor || 0));
    
    if (diferencaValor > 0.50) { // Tolerância de R$ 0,50
      observacoes.push(
        `❌ Valor pago incorreto: R$ ${(valorComissaoFornecedor || 0).toFixed(2)} (esperado: R$ ${valorEsperado.toFixed(2)})`
      );
      valorPagoCorreto = false;
    }
  }
  
  // Verificar se o cálculo interno está correto
  const valorComissaoEsperado = valorProduto * (taxaAplicadaInterno / 100);
  const diferencaCalculo = Math.abs(valorComissaoEsperado - valorComissao);
  
  if (diferencaCalculo > 0.50) {
    observacoes.push(
      `❌ Cálculo interno incorreto: R$ ${valorComissao.toFixed(2)} (esperado: R$ ${valorComissaoEsperado.toFixed(2)} com taxa de ${taxaAplicadaInterno.toFixed(2)}%)`
    );
    valorPagoCorreto = false;
  }
  
  // Adicionar observação positiva se tudo estiver OK
  if (observacoes.length === 0) {
    observacoes.push(`✓ Taxa e valores estão corretos (${taxaAplicadaInterno.toFixed(2)}%)`);
  }
  
  return {
    taxaAplicadaInterno,
    taxaAplicadaFornecedor,
    taxaDivergente,
    valorPagoCorreto,
    observacoes,
  };
}

export function analisarConciliacao(
  dadosInternos: DadosExcel[],
  dadosFornecedor: DadosExcel[]
): Divergencia[] {
  const divergencias: Divergencia[] = [];
  const contratosFornecedor = new Set(dadosFornecedor.map(d => d.contrato.trim().toUpperCase()));
  const contratosInternos = new Set(dadosInternos.map(d => d.contrato.trim().toUpperCase()));

  // Função auxiliar para normalizar CPF
  const normalizarCPF = (cpf: string | undefined): string => {
    if (!cpf) return "";
    return cpf.replace(/\D/g, ""); // Remove tudo que não é dígito
  };

  // Função auxiliar para encontrar match por múltiplos critérios
  const encontrarMatch = (interno: DadosExcel): { match?: DadosExcel; criterio?: string } => {
    const contratoNormalizado = interno.contrato.trim().toUpperCase();
    const cpfClienteNormalizado = normalizarCPF(interno.cpfCliente);
    const cpfFuncionarioNormalizado = normalizarCPF(interno.cpfFuncionario);
    
    // Tentar encontrar por contrato (primeira prioridade)
    let match = dadosFornecedor.find(
      f => f.contrato.trim().toUpperCase() === contratoNormalizado
    );
    if (match) return { match, criterio: "Contrato exato" };
    
    // Se não encontrou por contrato, tentar por CPF do cliente + valor (segunda prioridade)
    if (cpfClienteNormalizado) {
      match = dadosFornecedor.find(f => {
        const cpfFornecedor = normalizarCPF(f.cpfCliente);
        const diferencaValor = Math.abs(interno.valorProduto - f.valorProduto);
        return cpfFornecedor === cpfClienteNormalizado && diferencaValor < 1.0; // Tolerância de R$ 1
      });
      if (match) return { match, criterio: "CPF Cliente + Valor" };
    }
    
    // Se não encontrou, tentar por nome do cliente + valor aproximado (terceira prioridade)
    if (interno.cliente) {
      const nomeClienteNormalizado = interno.cliente.trim().toUpperCase();
      match = dadosFornecedor.find(f => {
        const nomeFornecedor = (f.cliente || "").trim().toUpperCase();
        const diferencaValor = Math.abs(interno.valorProduto - f.valorProduto);
        const nomesSimilares = nomeFornecedor === nomeClienteNormalizado || 
                               nomeFornecedor.includes(nomeClienteNormalizado) ||
                               nomeClienteNormalizado.includes(nomeFornecedor);
        return nomesSimilares && diferencaValor < 1.0;
      });
      if (match) return { match, criterio: "Nome Cliente + Valor" };
    }
    
    // Se não encontrou, tentar por CPF do funcionário + valor (quarta prioridade)
    if (cpfFuncionarioNormalizado) {
      match = dadosFornecedor.find(f => {
        const cpfFornecedor = normalizarCPF(f.cpfFuncionario);
        const diferencaValor = Math.abs(interno.valorProduto - f.valorProduto);
        return cpfFornecedor === cpfFuncionarioNormalizado && diferencaValor < 5.0; // Tolerância maior
      });
      if (match) return { match, criterio: "CPF Funcionário + Valor" };
    }
    
    return { match: undefined, criterio: undefined };
  };

  // Analisar dados internos
  dadosInternos.forEach((interno, index) => {
    const { match: fornecedor, criterio } = encontrarMatch(interno);

    const tiposDivergencia: string[] = [];
    let status: Divergencia["status"] = "ok";

    // Executar validação inteligente
    const validacaoInteligente = validarTaxasEValoresPagos(
      interno.valorProduto,
      interno.valorComissao,
      fornecedor?.valorProduto,
      fornecedor?.valorComissao
    );

    // Adicionar observações da validação inteligente aos tipos de divergência
    if (validacaoInteligente.taxaDivergente || !validacaoInteligente.valorPagoCorreto) {
      tiposDivergencia.push(...validacaoInteligente.observacoes.filter(obs => obs.includes('⚠️') || obs.includes('❌')));
      status = "divergente";
    }

    if (!fornecedor) {
      status = "nao_encontrado_fornecedor";
      tiposDivergencia.push("Pagamento não encontrado no extrato bancário");
    } else {
      // Verificar divergências de valores
      const diferencaComissao = Math.abs(interno.valorComissao - fornecedor.valorComissao);
      const diferencaProduto = Math.abs(interno.valorProduto - fornecedor.valorProduto);
      
      const tolerancia = 0.01; // Tolerância de 1 centavo para erros de arredondamento

      if (diferencaComissao > tolerancia) {
        tiposDivergencia.push(
          `Divergência na comissão: R$ ${diferencaComissao.toFixed(2)}`
        );
        status = "divergente";
      }

      if (diferencaProduto > tolerancia) {
        tiposDivergencia.push(
          `Divergência no valor do produto: R$ ${diferencaProduto.toFixed(2)}`
        );
        status = "divergente";
      }

      // Verificar divergências de cliente
      if (fornecedor.cliente && interno.cliente !== fornecedor.cliente) {
        tiposDivergencia.push("Nome do cliente divergente");
        // Não marca como divergente se for apenas diferença no nome
      }
    }

    divergencias.push({
      id: `div-${index}`,
      contratoInterno: interno.contrato,
      contratoFornecedor: fornecedor?.contrato || "",
      cliente: interno.cliente,
      fornecedor: interno.fornecedor,
      funcionario: interno.funcionario,
      valorComissaoInterno: interno.valorComissao,
      valorComissaoFornecedor: fornecedor?.valorComissao || 0,
      valorProdutoInterno: interno.valorProduto,
      valorProdutoFornecedor: fornecedor?.valorProduto || 0,
      dataVenda: interno.dataVenda,
      status,
      tiposDivergencia,
      diferencaComissao: fornecedor ? Math.abs(interno.valorComissao - fornecedor.valorComissao) : interno.valorComissao,
      diferencaProduto: fornecedor ? Math.abs(interno.valorProduto - fornecedor.valorProduto) : interno.valorProduto,
      criterioMatch: criterio, // Adicionar critério de match para debug
      validacaoInteligente,
    });
  });

  // Verificar contratos do fornecedor que não estão nos dados internos
  dadosFornecedor.forEach((fornecedor, index) => {
    const contratoNormalizado = fornecedor.contrato.trim().toUpperCase();
    
    if (!contratosInternos.has(contratoNormalizado)) {
      divergencias.push({
        id: `div-forn-${index}`,
        contratoInterno: "",
        contratoFornecedor: fornecedor.contrato,
        cliente: fornecedor.cliente,
        fornecedor: fornecedor.fornecedor,
        funcionario: fornecedor.funcionario,
        valorComissaoInterno: 0,
        valorComissaoFornecedor: fornecedor.valorComissao,
        valorProdutoInterno: 0,
        valorProdutoFornecedor: fornecedor.valorProduto,
        dataVenda: fornecedor.dataVenda,
        status: "nao_encontrado_interno",
        tiposDivergencia: ["Contrato não encontrado nos dados internos"],
        diferencaComissao: fornecedor.valorComissao,
        diferencaProduto: fornecedor.valorProduto,
      });
    }
  });

  return divergencias;
}

export function calcularEstatisticas(divergencias: Divergencia[]) {
  const total = divergencias.length;
  const conciliados = divergencias.filter(d => d.status === "ok").length;
  const divergentes = divergencias.filter(d => d.status === "divergente").length;
  const naoEncontrados = divergencias.filter(
    d => d.status === "nao_encontrado_fornecedor" || d.status === "nao_encontrado_interno"
  ).length;

  const totalDiferencaComissao = divergencias.reduce((sum, d) => sum + d.diferencaComissao, 0);
  const totalDiferencaProduto = divergencias.reduce((sum, d) => sum + d.diferencaProduto, 0);

  const totalComissaoInterno = divergencias.reduce((sum, d) => sum + d.valorComissaoInterno, 0);
  const totalComissaoFornecedor = divergencias.reduce((sum, d) => sum + d.valorComissaoFornecedor, 0);

  return {
    total,
    conciliados,
    divergentes,
    naoEncontrados,
    percentualConciliado: total > 0 ? (conciliados / total) * 100 : 0,
    totalDiferencaComissao,
    totalDiferencaProduto,
    totalComissaoInterno,
    totalComissaoFornecedor,
    diferencaTotalComissao: totalComissaoInterno - totalComissaoFornecedor,
    // Aliases para compatibilidade com a interface Estatisticas
    totalDivergencias: divergentes,
    totalDiferencas: totalDiferencaComissao,
    totalContratos: total,
  };
}
