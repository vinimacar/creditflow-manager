import type { DadosExcel } from "./ImportarExcel";

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
}

export function analisarConciliacao(
  dadosInternos: DadosExcel[],
  dadosFornecedor: DadosExcel[]
): Divergencia[] {
  const divergencias: Divergencia[] = [];
  const contratosFornecedor = new Set(dadosFornecedor.map(d => d.contrato.trim().toUpperCase()));
  const contratosInternos = new Set(dadosInternos.map(d => d.contrato.trim().toUpperCase()));

  // Analisar dados internos
  dadosInternos.forEach((interno, index) => {
    const contratoNormalizado = interno.contrato.trim().toUpperCase();
    const fornecedor = dadosFornecedor.find(
      f => f.contrato.trim().toUpperCase() === contratoNormalizado
    );

    const tiposDivergencia: string[] = [];
    let status: Divergencia["status"] = "ok";

    if (!fornecedor) {
      status = "nao_encontrado_fornecedor";
      tiposDivergencia.push("Contrato não encontrado no relatório do fornecedor");
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
        status = "divergente";
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
  };
}
