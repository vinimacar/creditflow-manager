import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FiltrosDinamicosRelatorio, type FiltrosRelatorio } from "@/components/relatorios/FiltrosDinamicosRelatorio";
import { GraficoModerno } from "@/components/relatorios/GraficoModerno";
import {
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Dados mock para demonstração
const dadosMock = {
  vendas: [
    { mes: "Jan", valor: 125000, quantidade: 45 },
    { mes: "Fev", valor: 138000, quantidade: 52 },
    { mes: "Mar", valor: 162000, quantidade: 61 },
    { mes: "Abr", valor: 145000, quantidade: 54 },
    { mes: "Mai", valor: 178000, quantidade: 68 },
    { mes: "Jun", valor: 195000, quantidade: 75 },
  ],
  funcionarios: [
    { nome: "Carlos Mendes", vendas: 45, comissao: 18500 },
    { nome: "Fernanda Lima", vendas: 38, comissao: 15600 },
    { nome: "Ricardo Santos", vendas: 32, comissao: 12800 },
    { nome: "Juliana Costa", vendas: 28, comissao: 11200 },
    { nome: "Pedro Silva", vendas: 22, comissao: 8800 },
  ],
  produtos: [
    { nome: "Consignado INSS", valor: 450000 },
    { nome: "Refinanciamento", valor: 180000 },
    { nome: "Portabilidade", valor: 120000 },
    { nome: "Cartão Consignado", valor: 80000 },
  ],
  fornecedores: [
    { nome: "Banco BMG", valor: 350000 },
    { nome: "Banco Pan", valor: 280000 },
    { nome: "Bradesco", valor: 180000 },
    { nome: "Itaú", valor: 120000 },
  ],
};

export default function Relatorios() {
  const [filtros, setFiltros] = useState<FiltrosRelatorio>({
    tipoRelatorio: "geral",
    agrupamento: "mes",
  });
  const [gerando, setGerando] = useState(false);

  const estatisticas = useMemo(() => {
    const totalVendas = dadosMock.vendas.reduce((sum, v) => sum + v.valor, 0);
    const totalAnterior = 800000; // Mock
    const crescimento = ((totalVendas - totalAnterior) / totalAnterior) * 100;

    return {
      totalVendas,
      crescimento,
      ticketMedio: totalVendas / dadosMock.vendas.reduce((sum, v) => sum + v.quantidade, 0),
      totalFuncionarios: dadosMock.funcionarios.length,
      produtoMaisVendido: dadosMock.produtos[0].nome,
    };
  }, []);

  const gerarFeedback = () => {
    if (estat isticas.crescimento > 10) {
      return {
        tipo: "positivo" as const,
        mensagem: `Excelente! Crescimento de ${estatisticas.crescimento.toFixed(1)}% em relação ao período anterior. Continue com o ótimo trabalho!`,
      };
    } else if (estatisticas.crescimento < 0) {
      return {
        tipo: "negativo" as const,
        mensagem: `Atenção: Queda de ${Math.abs(estatisticas.crescimento).toFixed(1)}% nas vendas. Recomenda-se revisar estratégias e motivar a equipe.`,
      };
    } else {
      return {
        tipo: "neutro" as const,
        mensagem: `Crescimento moderado de ${estatisticas.crescimento.toFixed(1)}%. Há oportunidades para melhorar o desempenho.`,
      };
    }
  };

  const handleGerarRelatorio = () => {
    toast.success("Relatório gerado com sucesso!");
  };

  const handleImprimir = async () => {
    setGerando(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // Cabeçalho
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório Gerencial", pageWidth / 2, y, { align: "center" });
      
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, y, { align: "center" });

      y += 15;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Resumo Executivo", 14, y);

      y += 10;
      autoTable(doc, {
        startY: y,
        head: [["Métrica", "Valor"]],
        body: [
          ["Total de Vendas", `R$ ${estatisticas.totalVendas.toLocaleString("pt-BR")}`],
          ["Crescimento", `${estatisticas.crescimento > 0 ? "+" : ""}${estatisticas.crescimento.toFixed(1)}%`],
          ["Ticket Médio", `R$ ${estatisticas.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
          ["Total de Funcionários", estatisticas.totalFuncionarios.toString()],
          ["Produto Mais Vendido", estatisticas.produtoMaisVendido],
        ],
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
      });

      // Vendas por Funcionário
      doc.addPage();
      y = 20;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Desempenho por Funcionário", 14, y);

      y += 10;
      autoTable(doc, {
        startY: y,
        head: [["Funcionário", "Vendas", "Comissão"]],
        body: dadosMock.funcionarios.map(f => [
          f.nome,
          f.vendas.toString(),
          `R$ ${f.comissao.toLocaleString("pt-BR")}`,
        ]),
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246] },
      });

      // Vendas por Produto
      doc.addPage();
      y = 20;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Vendas por Produto", 14, y);

      y += 10;
      autoTable(doc, {
        startY: y,
        head: [["Produto", "Valor Total"]],
        body: dadosMock.produtos.map(p => [
          p.nome,
          `R$ ${p.valor.toLocaleString("pt-BR")}`,
        ]),
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246] },
      });

      // Rodapé
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Página ${i} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      doc.save(`relatorio_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`);
      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar o relatório");
    } finally {
      setGerando(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios Gerenciais"
        description="Análises inteligentes e insights para tomada de decisões"
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Vendas</p>
              <h3 className="text-2xl font-bold mt-2">
                R$ {estatisticas.totalVendas.toLocaleString("pt-BR")}
              </h3>
              <p className={`text-sm mt-1 flex items-center gap-1 ${estatisticas.crescimento >= 0 ? "text-green-600" : "text-red-600"}`}>
                {estatisticas.crescimento >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {estatisticas.crescimento > 0 ? "+" : ""}{estatisticas.crescimento.toFixed(1)}% vs período anterior
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
              <h3 className="text-2xl font-bold mt-2">
                R$ {estatisticas.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Funcionários Ativos</p>
              <h3 className="text-2xl font-bold mt-2">{estatisticas.totalFuncionarios}</h3>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Produto Destaque</p>
              <h3 className="text-lg font-bold mt-2">{estatisticas.produtoMaisVendido}</h3>
            </div>
            <Package className="w-8 h-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <FiltrosDinamicosRelatorio
        filtros={filtros}
        onFiltrosChange={setFiltros}
        fornecedores={dadosMock.fornecedores.map(f => f.nome)}
        funcionarios={dadosMock.funcionarios.map(f => f.nome)}
        produtos={dadosMock.produtos.map(p => p.nome)}
        onGerarRelatorio={handleGerarRelatorio}
      />

      {/* Ações */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" className="gap-2" onClick={() => window.print()}>
          <Printer className="w-4 h-4" />
          Imprimir
        </Button>
        <Button className="gap-2" onClick={handleImprimir} disabled={gerando}>
          <Download className="w-4 h-4" />
          {gerando ? "Gerando PDF..." : "Exportar PDF"}
        </Button>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GraficoModerno
          titulo="Evolução de Vendas"
          tipo="linha"
          dados={{
            labels: dadosMock.vendas.map(v => v.mes),
            valores: dadosMock.vendas.map(v => v.valor),
          }}
          feedback={gerarFeedback()}
        />

        <GraficoModerno
          titulo="Desempenho por Funcionário"
          tipo="barra"
          dados={{
            labels: dadosMock.funcionarios.map(f => f.nome.split(" ")[0]),
            valores: dadosMock.funcionarios.map(f => f.comissao),
          }}
        />

        <GraficoModerno
          titulo="Vendas por Produto"
          tipo="pizza"
          dados={{
            labels: dadosMock.produtos.map(p => p.nome),
            valores: dadosMock.produtos.map(p => p.valor),
          }}
        />

        <GraficoModerno
          titulo="Vendas por Fornecedor"
          tipo="barra"
          dados={{
            labels: dadosMock.fornecedores.map(f => f.nome.replace("Banco ", "")),
            valores: dadosMock.fornecedores.map(f => f.valor),
          }}
        />
      </div>
    </div>
  );
}
