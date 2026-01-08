import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Divergencia } from "./conciliacao";
import type { ChartConfiguration } from "chart.js";

export async function gerarRelatorioPDF(
  divergencias: Divergencia[],
  estatisticas: any,
  filtros: any
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Cabeçalho
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Conciliação", pageWidth / 2, yPosition, { align: "center" });
  
  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, yPosition, { align: "center" });

  // Filtros aplicados
  yPosition += 15;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Filtros Aplicados:", 14, yPosition);
  
  yPosition += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  if (filtros.periodo) {
    doc.text(
      `Período: ${format(filtros.periodo.inicio, "dd/MM/yyyy", { locale: ptBR })} a ${format(filtros.periodo.fim, "dd/MM/yyyy", { locale: ptBR })}`,
      14,
      yPosition
    );
    yPosition += 5;
  }
  
  if (filtros.fornecedor) {
    doc.text(`Fornecedor: ${filtros.fornecedor}`, 14, yPosition);
    yPosition += 5;
  }
  
  if (filtros.funcionario) {
    doc.text(`Funcionário: ${filtros.funcionario}`, 14, yPosition);
    yPosition += 5;
  }

  // Resumo Executivo
  yPosition += 10;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo Executivo", 14, yPosition);
  
  yPosition += 10;
  
  // Tabela de resumo
  autoTable(doc, {
    startY: yPosition,
    head: [["Métrica", "Valor"]],
    body: [
      ["Total de Registros", estatisticas.total.toString()],
      ["Conciliados", `${estatisticas.conciliados} (${estatisticas.percentualConciliado.toFixed(1)}%)`],
      ["Divergentes", estatisticas.divergentes.toString()],
      ["Não Encontrados", estatisticas.naoEncontrados.toString()],
      ["Total Comissão Interno", `R$ ${estatisticas.totalComissaoInterno.toFixed(2)}`],
      ["Total Comissão Fornecedor", `R$ ${estatisticas.totalComissaoFornecedor.toFixed(2)}`],
      ["Diferença Total", `R$ ${estatisticas.diferencaTotalComissao.toFixed(2)}`],
    ],
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
  });

  // Nova página para gráficos
  doc.addPage();
  yPosition = 20;
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Análise Gráfica", 14, yPosition);

  // Aqui você pode adicionar gráficos usando canvas2image
  // Por simplicidade, vou adicionar texto descritivo
  yPosition += 15;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const percentualConciliado = estatisticas.percentualConciliado.toFixed(1);
  const percentualDivergente = ((estatisticas.divergentes / estatisticas.total) * 100).toFixed(1);
  const percentualNaoEncontrado = ((estatisticas.naoEncontrados / estatisticas.total) * 100).toFixed(1);

  doc.text(`✓ Conciliados: ${percentualConciliado}%`, 14, yPosition);
  yPosition += 7;
  doc.text(`⚠ Divergentes: ${percentualDivergente}%`, 14, yPosition);
  yPosition += 7;
  doc.text(`✗ Não Encontrados: ${percentualNaoEncontrado}%`, 14, yPosition);

  // Detalhamento das Divergências
  if (divergencias.length > 0) {
    doc.addPage();
    yPosition = 20;
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Detalhamento das Divergências", 14, yPosition);
    
    yPosition += 10;

    const divergenciasFiltradas = divergencias.filter(d => d.status !== "ok");
    
    if (divergenciasFiltradas.length > 0) {
      const tableData = divergenciasFiltradas.slice(0, 50).map(div => [
        div.contratoInterno || div.contratoFornecedor,
        div.cliente,
        div.fornecedor,
        `R$ ${div.diferencaComissao.toFixed(2)}`,
        div.status === "divergente" ? "Divergente" : 
        div.status === "nao_encontrado_fornecedor" ? "Não Encontrado (Fornec.)" : 
        "Não Encontrado (Interno)",
        div.tiposDivergencia.join(", "),
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [["Contrato", "Cliente", "Fornecedor", "Dif. Comissão", "Status", "Observações"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [239, 68, 68] },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          5: { cellWidth: 50 },
        },
      });

      if (divergenciasFiltradas.length > 50) {
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text(
          `* Mostrando 50 de ${divergenciasFiltradas.length} divergências. Exporte os dados completos para análise detalhada.`,
          14,
          finalY
        );
      }
    }
  }

  // Rodapé em todas as páginas
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
    doc.text(
      "CréditoGestor - Sistema de Gestão de Consignados",
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 5,
      { align: "center" }
    );
  }

  // Salvar PDF
  const nomeArquivo = `conciliacao_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`;
  doc.save(nomeArquivo);
}
