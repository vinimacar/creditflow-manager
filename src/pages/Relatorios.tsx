import { useState, useMemo, useEffect } from "react";
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
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getVendas, getFuncionarios, getProdutos, getFornecedores, type Venda, type Funcionario, type Produto, type Fornecedor } from "@/lib/firestore";
import { Skeleton } from "@/components/ui/skeleton";

interface DadosRelatorio {
  vendas: Array<{ mes: string; valor: number; quantidade: number }>;
  funcionarios: Array<{ nome: string; vendas: number; comissao: number }>;
  produtos: Array<{ nome: string; valor: number }>;
  fornecedores: Array<{ nome: string; valor: number }>;
}

export default function Relatorios() {
  const [filtros, setFiltros] = useState<FiltrosRelatorio>({
    tipoRelatorio: "geral",
    agrupamento: "mes",
  });
  const [gerando, setGerando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dadosRelatorio, setDadosRelatorio] = useState<DadosRelatorio | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [vendas, funcionarios, produtos, fornecedores] = await Promise.all([
        getVendas(),
        getFuncionarios(),
        getProdutos(),
        getFornecedores(),
      ]);

      // Gerar dados de vendas por mês (últimos 6 meses)
      const vendasPorMes: Array<{ mes: string; valor: number; quantidade: number }> = [];
      const agora = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const mesData = subMonths(agora, i);
        const inicioMes = startOfMonth(mesData);
        const fimMes = endOfMonth(mesData);
        
        const vendasDoMes = vendas.filter((v) => {
          const dataVenda = v.createdAt?.toDate?.() || new Date(v.createdAt);
          return dataVenda >= inicioMes && dataVenda <= fimMes;
        });
        
        vendasPorMes.push({
          mes: format(mesData, "MMM", { locale: ptBR }),
          valor: vendasDoMes.reduce((sum, v) => sum + v.valorContrato, 0),
          quantidade: vendasDoMes.length,
        });
      }

      // Calcular vendas por funcionário
      const vendaPorFunc = new Map<string, { vendas: number; comissao: number }>();
      vendas.forEach((venda) => {
        const current = vendaPorFunc.get(venda.funcionarioId) || { vendas: 0, comissao: 0 };
        vendaPorFunc.set(venda.funcionarioId, {
          vendas: current.vendas + 1,
          comissao: current.comissao + venda.comissao,
        });
      });

      const funcionariosData = Array.from(vendaPorFunc.entries())
        .map(([id, stats]) => {
          const func = funcionarios.find((f) => f.id === id);
          return {
            nome: func?.nome || "Desconhecido",
            vendas: stats.vendas,
            comissao: stats.comissao,
          };
        })
        .sort((a, b) => b.vendas - a.vendas)
        .slice(0, 5);

      // Calcular vendas por produto
      const vendaPorProd = new Map<string, number>();
      vendas.forEach((venda) => {
        const current = vendaPorProd.get(venda.produtoId) || 0;
        vendaPorProd.set(venda.produtoId, current + venda.valorContrato);
      });

      const produtosData = Array.from(vendaPorProd.entries())
        .map(([id, valor]) => {
          const prod = produtos.find((p) => p.id === id);
          return {
            nome: prod?.nome || "Desconhecido",
            valor,
          };
        })
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 4);

      // Mock de fornecedores (pode ser melhorado com dados reais se disponível)
      const fornecedoresData = fornecedores.slice(0, 4).map((f) => ({
        nome: f.razaoSocial,
        valor: Math.random() * 300000 + 100000, // Valores simulados
      }));

      setDadosRelatorio({
        vendas: vendasPorMes,
        funcionarios: funcionariosData,
        produtos: produtosData,
        fornecedores: fornecedoresData,
      });
    } catch (error) {
      console.error("Erro ao carregar dados do relatório:", error);
    } finally {
      setLoading(false);
    }
  };

  const estatisticas = useMemo(() => {
    if (!dadosRelatorio) return null;
    
    const totalVendas = dadosRelatorio.vendas.reduce((sum, v) => sum + v.valor, 0);
    const totalAnterior = dadosRelatorio.vendas.slice(0, -1).reduce((sum, v) => sum + v.valor, 0);
    const crescimento = totalAnterior > 0 ? ((totalVendas - totalAnterior) / totalAnterior) * 100 : 0;

    return {
      totalVendas,
      crescimento,
      ticketMedio: totalVendas / dadosRelatorio.vendas.reduce((sum, v) => sum + v.quantidade, 0) || 0,
      totalFuncionarios: dadosRelatorio.funcionarios.length,
      produtoMaisVendido: dadosRelatorio.produtos[0]?.nome || "N/A",
    };
  }, [dadosRelatorio]);

  const gerarFeedback = () => {
    if (!estatisticas) return { tipo: "neutro" as const, mensagem: "Carregando dados..." };
    
    if (estatisticas.crescimento > 10) {
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
    if (!dadosRelatorio || !estatisticas) {
      toast.error("Dados ainda não carregados");
      return;
    }
    
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
        body: dadosRelatorio.funcionarios.map(f => [
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
        body: dadosRelatorio.produtos.map(p => [
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

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Relatórios Gerenciais"
          description="Análise completa do desempenho e resultados"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const feedback = gerarFeedback();

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
                R$ {estatisticas!.totalVendas.toLocaleString("pt-BR")}
              </h3>
              <p className={`text-sm mt-1 flex items-center gap-1 ${estatisticas!.crescimento >= 0 ? "text-green-600" : "text-red-600"}`}>
                {estatisticas!.crescimento >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {estatisticas!.crescimento > 0 ? "+" : ""}{estatisticas!.crescimento.toFixed(1)}% vs período anterior
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
                R$ {estatisticas!.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Funcionários Ativos</p>
              <h3 className="text-2xl font-bold mt-2">{estatisticas!.totalFuncionarios}</h3>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Produto Destaque</p>
              <h3 className="text-lg font-bold mt-2">{estatisticas!.produtoMaisVendido}</h3>
            </div>
            <Package className="w-8 h-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <FiltrosDinamicosRelatorio
        filtros={filtros}
        onFiltrosChange={setFiltros}
        fornecedores={dadosRelatorio!.fornecedores.map(f => f.nome)}
        funcionarios={dadosRelatorio!.funcionarios.map(f => f.nome)}
        produtos={dadosRelatorio!.produtos.map(p => p.nome)}
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
            labels: dadosRelatorio!.vendas.map(v => v.mes),
            valores: dadosRelatorio!.vendas.map(v => v.valor),
          }}
          feedback={feedback}
        />

        <GraficoModerno
          titulo="Desempenho por Funcionário"
          tipo="barra"
          dados={{
            labels: dadosRelatorio!.funcionarios.map(f => f.nome.split(" ")[0]),
            valores: dadosRelatorio!.funcionarios.map(f => f.comissao),
          }}
        />

        <GraficoModerno
          titulo="Vendas por Produto"
          tipo="pizza"
          dados={{
            labels: dadosRelatorio!.produtos.map(p => p.nome),
            valores: dadosRelatorio!.produtos.map(p => p.valor),
          }}
        />

        <GraficoModerno
          titulo="Vendas por Fornecedor"
          tipo="barra"
          dados={{
            labels: dadosRelatorio!.fornecedores.map(f => f.nome.replace("Banco ", "")),
            valores: dadosRelatorio!.fornecedores.map(f => f.valor),
          }}
        />
      </div>
    </div>
  );
}
