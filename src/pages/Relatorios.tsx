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
  FileSpreadsheet,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getVendas, getFuncionarios, getProdutos, getFornecedores, getClientes, getDespesas, type Venda, type Funcionario, type Produto, type Fornecedor, type Cliente, type Despesa } from "@/lib/firestore";
import { Skeleton } from "@/components/ui/skeleton";

interface DadosRelatorio {
  vendas: Array<{ mes: string; valor: number; quantidade: number }>;
  funcionarios: Array<{ nome: string; vendas: number; comissao: number }>;
  produtos: Array<{ nome: string; valor: number }>;
  fornecedores: Array<{ nome: string; valor: number }>;
  clientes: Array<{ nome: string; vendas: number; valor: number }>;
  despesas: Array<{ mes: string; valor: number; quantidade: number }>;
  receitas: Array<{ mes: string; valor: number }>;
  lucros: Array<{ mes: string; valor: number }>;
}

export default function Relatorios() {
  const [filtros, setFiltros] = useState<FiltrosRelatorio>({
    tipoRelatorio: "geral",
    agrupamento: "mes",
  });
  const [gerando, setGerando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dadosRelatorio, setDadosRelatorio] = useState<DadosRelatorio | null>(null);
  const [vendasCompletas, setVendasCompletas] = useState<Venda[]>([]);
  const [clientesCompletos, setClientesCompletos] = useState<Cliente[]>([]);
  const [funcionariosCompletos, setFuncionariosCompletos] = useState<Funcionario[]>([]);
  const [produtosCompletos, setProdutosCompletos] = useState<Produto[]>([]);
  const [despesasCompletas, setDespesasCompletas] = useState<Despesa[]>([]);

  useEffect(() => {
    let mounted = true;
    const abortController = new AbortController();

    const loadData = async () => {
      try {
        await carregarDados(mounted);
      } catch (error) {
        if (mounted && !abortController.signal.aborted) {
          console.error("Erro ao carregar dados:", error);
          toast.error("Erro ao carregar dados do relatório");
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, []);

  const carregarDados = async (mounted = true) => {
    try {
      const [vendas, funcionarios, produtos, fornecedores, clientes, despesas] = await Promise.all([
        getVendas(),
        getFuncionarios(),
        getProdutos(),
        getFornecedores(),
        getClientes(),
        getDespesas(),
      ]).catch(err => {
        console.error("Erro ao buscar dados:", err);
        throw err;
      });

      if (!mounted) return;

      // Armazenar dados completos para filtragem
      setVendasCompletas(vendas);
      setClientesCompletos(clientes);
      setFuncionariosCompletos(funcionarios);
      setProdutosCompletos(produtos);
      setDespesasCompletas(despesas);

      // Gerar dados de vendas por mês (últimos 6 meses)
      const vendasPorMes: Array<{ mes: string; valor: number; quantidade: number }> = [];
      const despesasPorMes: Array<{ mes: string; valor: number; quantidade: number }> = [];
      const receitasPorMes: Array<{ mes: string; valor: number }> = [];
      const lucrosPorMes: Array<{ mes: string; valor: number }> = [];
      const agora = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const mesData = subMonths(agora, i);
        const inicioMes = startOfMonth(mesData);
        const fimMes = endOfMonth(mesData);
        
        const vendasDoMes = vendas.filter((v) => {
          const dataVenda = v.createdAt?.toDate?.() || new Date(v.createdAt);
          return dataVenda >= inicioMes && dataVenda <= fimMes;
        });

        const despesasDoMes = despesas.filter((d) => {
          const dataDespesa = new Date(d.dataVencimento);
          return dataDespesa >= inicioMes && dataDespesa <= fimMes;
        });

        const valorVendas = vendasDoMes.reduce((sum, v) => sum + v.valorContrato, 0);
        const valorDespesas = despesasDoMes.reduce((sum, d) => sum + d.valor, 0);
        
        vendasPorMes.push({
          mes: format(mesData, "MMM", { locale: ptBR }),
          valor: valorVendas,
          quantidade: vendasDoMes.length,
        });

        despesasPorMes.push({
          mes: format(mesData, "MMM", { locale: ptBR }),
          valor: valorDespesas,
          quantidade: despesasDoMes.length,
        });

        receitasPorMes.push({
          mes: format(mesData, "MMM", { locale: ptBR }),
          valor: valorVendas,
        });

        lucrosPorMes.push({
          mes: format(mesData, "MMM", { locale: ptBR }),
          valor: valorVendas - valorDespesas,
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

      // Calcular vendas por cliente
      const vendaPorCliente = new Map<string, { vendas: number; valor: number }>();
      vendas.forEach((venda) => {
        const current = vendaPorCliente.get(venda.clienteId) || { vendas: 0, valor: 0 };
        vendaPorCliente.set(venda.clienteId, {
          vendas: current.vendas + 1,
          valor: current.valor + venda.valorContrato,
        });
      });

      const clientesData = Array.from(vendaPorCliente.entries())
        .map(([id, stats]) => {
          const cliente = clientes.find((c) => c.id === id);
          return {
            nome: cliente?.nome || "Desconhecido",
            vendas: stats.vendas,
            valor: stats.valor,
          };
        })
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 10);

      if (mounted) {
        setDadosRelatorio({
          vendas: vendasPorMes,
          funcionarios: funcionariosData,
          produtos: produtosData,
          fornecedores: fornecedoresData,
          clientes: clientesData,
          despesas: despesasPorMes,
          receitas: receitasPorMes,
          lucros: lucrosPorMes,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar dados do relatório:", error);
      if (mounted) {
        toast.error("Erro ao carregar dados do relatório");
      }
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  };

  // Filtrar vendas com base nos filtros aplicados
  const dadosFiltrados = useMemo(() => {
    if (!filtros.periodo && !filtros.cliente && !filtros.funcionario && !filtros.produto) {
      return null;
    }

    let vendas = vendasCompletas;

    // Aplicar filtro de período
    if (filtros.periodo?.from) {
      vendas = vendas.filter(v => {
        const dataVenda = v.createdAt?.toDate?.() || new Date(v.createdAt);
        const from = filtros.periodo!.from!;
        const to = filtros.periodo!.to || from;
        return dataVenda >= from && dataVenda <= to;
      });
    }

    // Aplicar filtro de cliente
    if (filtros.cliente) {
      const cliente = clientesCompletos.find(c => c.nome === filtros.cliente);
      if (cliente) {
        vendas = vendas.filter(v => v.clienteId === cliente.id);
      }
    }

    // Aplicar filtro de funcionário
    if (filtros.funcionario) {
      const funcionario = funcionariosCompletos.find(f => f.nome === filtros.funcionario);
      if (funcionario) {
        vendas = vendas.filter(v => v.funcionarioId === funcionario.id);
      }
    }

    // Aplicar filtro de produto
    if (filtros.produto) {
      const produto = produtosCompletos.find(p => p.nome === filtros.produto);
      if (produto) {
        vendas = vendas.filter(v => v.produtoId === produto.id);
      }
    }

    return vendas.map(v => {
      const cliente = clientesCompletos.find(c => c.id === v.clienteId);
      const funcionario = funcionariosCompletos.find(f => f.id === v.funcionarioId);
      const produto = produtosCompletos.find(p => p.id === v.produtoId);
      
      return {
        id: v.id,
        data: v.createdAt?.toDate?.() || new Date(v.createdAt),
        cliente: cliente?.nome || "N/A",
        cpf: cliente?.cpf || "N/A",
        funcionario: funcionario?.nome || "N/A",
        produto: produto?.nome || "N/A",
        valorContrato: v.valorContrato,
        prazo: v.prazo,
        comissao: v.comissao,
        comissaoPercentual: v.comissaoPercentual || (produto?.comissao || 0),
        status: v.status,
      };
    });
  }, [filtros, vendasCompletas, clientesCompletos, funcionariosCompletos, produtosCompletos]);

  // Recalcular dados dos gráficos baseado nos filtros
  const dadosGraficos = useMemo(() => {
    if (!dadosRelatorio) return null;

    // Se não há filtros, usar dados originais
    if (!filtros.periodo && !filtros.cliente && !filtros.funcionario && !filtros.produto) {
      return dadosRelatorio;
    }

    // Filtrar vendas
    let vendasFiltradas = vendasCompletas;

    if (filtros.periodo?.from) {
      vendasFiltradas = vendasFiltradas.filter(v => {
        const dataVenda = v.createdAt?.toDate?.() || new Date(v.createdAt);
        const from = filtros.periodo!.from!;
        const to = filtros.periodo!.to || from;
        return dataVenda >= from && dataVenda <= to;
      });
    }

    if (filtros.cliente) {
      const cliente = clientesCompletos.find(c => c.nome === filtros.cliente);
      if (cliente) {
        vendasFiltradas = vendasFiltradas.filter(v => v.clienteId === cliente.id);
      }
    }

    if (filtros.funcionario) {
      const funcionario = funcionariosCompletos.find(f => f.nome === filtros.funcionario);
      if (funcionario) {
        vendasFiltradas = vendasFiltradas.filter(v => v.funcionarioId === funcionario.id);
      }
    }

    if (filtros.produto) {
      const produto = produtosCompletos.find(p => p.nome === filtros.produto);
      if (produto) {
        vendasFiltradas = vendasFiltradas.filter(v => v.produtoId === produto.id);
      }
    }

    // Recalcular vendas por mês com dados filtrados
    const vendasPorMes: Array<{ mes: string; valor: number; quantidade: number }> = [];
    const receitasPorMes: Array<{ mes: string; valor: number }> = [];
    const lucrosPorMes: Array<{ mes: string; valor: number }> = [];
    const agora = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const mesData = subMonths(agora, i);
      const inicioMes = startOfMonth(mesData);
      const fimMes = endOfMonth(mesData);

      const vendasDoMes = vendasFiltradas.filter((v) => {
        const dataVenda = v.createdAt?.toDate?.() || new Date(v.createdAt);
        return dataVenda >= inicioMes && dataVenda <= fimMes;
      });

      const despesasDoMes = despesasCompletas.filter((d) => {
        const dataDespesa = new Date(d.dataVencimento);
        return dataDespesa >= inicioMes && dataDespesa <= fimMes;
      });

      const valorVendas = vendasDoMes.reduce((sum, v) => sum + v.valorContrato, 0);
      const valorDespesas = despesasDoMes.reduce((sum, d) => sum + d.valor, 0);
      
      vendasPorMes.push({
        mes: format(mesData, "MMM", { locale: ptBR }),
        valor: valorVendas,
        quantidade: vendasDoMes.length,
      });

      receitasPorMes.push({
        mes: format(mesData, "MMM", { locale: ptBR }),
        valor: valorVendas,
      });

      lucrosPorMes.push({
        mes: format(mesData, "MMM", { locale: ptBR }),
        valor: valorVendas - valorDespesas,
      });
    }

    // Recalcular vendas por funcionário
    const vendaPorFunc = new Map<string, { vendas: number; comissao: number }>();
    vendasFiltradas.forEach((venda) => {
      const current = vendaPorFunc.get(venda.funcionarioId) || { vendas: 0, comissao: 0 };
      vendaPorFunc.set(venda.funcionarioId, {
        vendas: current.vendas + 1,
        comissao: current.comissao + venda.comissao,
      });
    });

    const funcionariosData = Array.from(vendaPorFunc.entries())
      .map(([id, stats]) => {
        const func = funcionariosCompletos.find((f) => f.id === id);
        return {
          nome: func?.nome || "Desconhecido",
          vendas: stats.vendas,
          comissao: stats.comissao,
        };
      })
      .sort((a, b) => b.vendas - a.vendas)
      .slice(0, 5);

    // Recalcular vendas por produto
    const vendaPorProd = new Map<string, number>();
    vendasFiltradas.forEach((venda) => {
      const current = vendaPorProd.get(venda.produtoId) || 0;
      vendaPorProd.set(venda.produtoId, current + venda.valorContrato);
    });

    const produtosData = Array.from(vendaPorProd.entries())
      .map(([id, valor]) => {
        const prod = produtosCompletos.find((p) => p.id === id);
        return {
          nome: prod?.nome || "Desconhecido",
          valor,
          comissao: prod?.comissao || 0,
        };
      })
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 4);

    // Recalcular vendas por cliente
    const vendaPorCliente = new Map<string, { vendas: number; valor: number }>();
    vendasFiltradas.forEach((venda) => {
      const current = vendaPorCliente.get(venda.clienteId) || { vendas: 0, valor: 0 };
      vendaPorCliente.set(venda.clienteId, {
        vendas: current.vendas + 1,
        valor: current.valor + venda.valorContrato,
      });
    });

    const clientesData = Array.from(vendaPorCliente.entries())
      .map(([id, stats]) => {
        const cliente = clientesCompletos.find((c) => c.id === id);
        return {
          nome: cliente?.nome || "Desconhecido",
          vendas: stats.vendas,
          valor: stats.valor,
        };
      })
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);

    return {
      vendas: vendasPorMes,
      funcionarios: funcionariosData,
      produtos: produtosData,
      fornecedores: dadosRelatorio.fornecedores,
      clientes: clientesData,
      despesas: dadosRelatorio.despesas,
      receitas: receitasPorMes,
      lucros: lucrosPorMes,
    };
  }, [filtros, dadosRelatorio, vendasCompletas, clientesCompletos, funcionariosCompletos, produtosCompletos, despesasCompletas]);

  const handleExportarDados = () => {
    if (!dadosFiltrados || dadosFiltrados.length === 0) {
      toast.error("Nenhum dado filtrado para exportar");
      return;
    }

    try {
      const dadosExport = dadosFiltrados.map((venda) => ({
        "Data": format(venda.data, "dd/MM/yyyy HH:mm", { locale: ptBR }),
        "Cliente": venda.cliente,
        "CPF": venda.cpf,
        "Funcionário": venda.funcionario,
        "Produto": venda.produto,
        "Valor Contrato": venda.valorContrato.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        "Prazo": `${venda.prazo} meses`,
        "Comissão": venda.comissao.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        "Status": venda.status,
      }));

      const headers = Object.keys(dadosExport[0]);
      const csvContent = [
        headers.join(","),
        ...dadosExport.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
          }).join(",")
        )
      ].join("\n");

      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `relatorio_filtrado_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${dadosFiltrados.length} registros exportados com sucesso!`);
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      toast.error("Erro ao exportar dados");
    }
  };

  const estatisticas = useMemo(() => {
    const dados = dadosGraficos || dadosRelatorio;
    if (!dados) return null;
    
    const totalVendas = dados.vendas.reduce((sum, v) => sum + v.valor, 0);
    const totalAnterior = dados.vendas.slice(0, -1).reduce((sum, v) => sum + v.valor, 0);
    const crescimento = totalAnterior > 0 ? ((totalVendas - totalAnterior) / totalAnterior) * 100 : 0;
    const totalComissoes = dados.funcionarios.reduce((sum, f) => sum + f.comissao, 0);

    return {
      totalVendas,
      crescimento,
      ticketMedio: totalVendas / dados.vendas.reduce((sum, v) => sum + v.quantidade, 0) || 0,
      totalFuncionarios: dados.funcionarios.length,
      produtoMaisVendido: dados.produtos[0]?.nome || "N/A",
      totalComissoes,
    };
  }, [dadosGraficos, dadosRelatorio]);

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

      // Top 10 Clientes
      doc.addPage();
      y = 20;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Top 10 Clientes", 14, y);

      y += 10;
      autoTable(doc, {
        startY: y,
        head: [["Cliente", "Qtd. Vendas", "Valor Total"]],
        body: dadosRelatorio.clientes.map(c => [
          c.nome,
          c.vendas.toString(),
          `R$ ${c.valor.toLocaleString("pt-BR")}`,
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao gerar PDF:", errorMessage, error);
      toast.error("Erro ao gerar o relatório. Tente novamente.");
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <p className="text-sm font-medium text-muted-foreground">Total Comissões</p>
              <h3 className="text-2xl font-bold mt-2 text-green-700">
                R$ {estatisticas!.totalComissoes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Conforme cadastro de produtos</p>
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
        clientes={dadosRelatorio!.clientes.map(c => c.nome)}
        onGerarRelatorio={handleGerarRelatorio}
      />

      {/* Tabela de Dados Filtrados */}
      {dadosFiltrados && dadosFiltrados.length > 0 && (
        <Card>
          <div className="p-6 border-b flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Registros Filtrados</h3>
              <p className="text-sm text-muted-foreground">
                {dadosFiltrados.length} {dadosFiltrados.length === 1 ? "registro encontrado" : "registros encontrados"}
              </p>
            </div>
            <Button onClick={handleExportarDados} className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Exportar Excel
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Valor Contrato</TableHead>
                  <TableHead className="text-right">Prazo</TableHead>
                  <TableHead className="text-right bg-green-50">Comissão (%)</TableHead>
                  <TableHead className="text-right bg-green-50">Comissão (R$)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosFiltrados.map((venda) => (
                  <TableRow key={venda.id}>
                    <TableCell className="whitespace-nowrap">{format(venda.data, "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                    <TableCell className="font-medium">{venda.cliente}</TableCell>
                    <TableCell>{venda.cpf}</TableCell>
                    <TableCell>{venda.funcionario}</TableCell>
                    <TableCell>{venda.produto}</TableCell>
                    <TableCell className="text-right">R$ {venda.valorContrato.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">{venda.prazo} meses</TableCell>
                    <TableCell className="text-right bg-green-50 font-semibold text-green-700">{venda.comissaoPercentual.toFixed(2)}%</TableCell>
                    <TableCell className="text-right bg-green-50 font-semibold text-green-700">R$ {venda.comissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        venda.status === "aprovada" ? "bg-green-100 text-green-800" :
                        venda.status === "pendente" ? "bg-yellow-100 text-yellow-800" :
                        venda.status === "em_analise" ? "bg-blue-100 text-blue-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {venda.status.replace("_", " ")}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Ações */}
      <div className="flex gap-3 justify-end">
        <Button 
          variant="outline" 
          className="gap-2" 
          onClick={() => {
            try {
              window.print();
            } catch (error) {
              console.error("Erro ao imprimir:", error);
              toast.error("Erro ao abrir impressão");
            }
          }}
        >
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
            labels: (dadosGraficos || dadosRelatorio)!.vendas.map(v => v.mes),
            valores: (dadosGraficos || dadosRelatorio)!.vendas.map(v => v.valor),
          }}
          feedback={feedback}
        />

        <GraficoModerno
          titulo="Vendas por Produto"
          tipo="pizza"
          dados={{
            labels: (dadosGraficos || dadosRelatorio)!.produtos.map(p => p.nome),
            valores: (dadosGraficos || dadosRelatorio)!.produtos.map(p => p.valor),
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GraficoModerno
          titulo="Receitas x Despesas"
          tipo="barra"
          dados={{
            labels: (dadosGraficos || dadosRelatorio)!.receitas.map(r => r.mes),
            valores: (dadosGraficos || dadosRelatorio)!.receitas.map(r => r.valor),
            comparacao: (dadosGraficos || dadosRelatorio)!.despesas.map(d => d.valor),
          }}
        />

        <GraficoModerno
          titulo="Evolução de Lucros"
          tipo="linha"
          dados={{
            labels: (dadosGraficos || dadosRelatorio)!.lucros.map(l => l.mes),
            valores: (dadosGraficos || dadosRelatorio)!.lucros.map(l => l.valor),
          }}
        />

        <GraficoModerno
          titulo="Despesas por Período"
          tipo="barra"
          dados={{
            labels: (dadosGraficos || dadosRelatorio)!.despesas.map(d => d.mes),
            valores: (dadosGraficos || dadosRelatorio)!.despesas.map(d => d.valor),
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GraficoModerno
          titulo="Desempenho por Funcionário"
          tipo="barra"
          dados={{
            labels: (dadosGraficos || dadosRelatorio)!.funcionarios.map(f => f.nome.split(" ")[0]),
            valores: (dadosGraficos || dadosRelatorio)!.funcionarios.map(f => f.comissao),
          }}
        />

        <GraficoModerno
          titulo="Vendas por Fornecedor"
          tipo="barra"
          dados={{
            labels: (dadosGraficos || dadosRelatorio)!.fornecedores.map(f => f.nome.replace("Banco ", "")),
            valores: (dadosGraficos || dadosRelatorio)!.fornecedores.map(f => f.valor),
          }}
        />

        <GraficoModerno
          titulo="Top 10 Clientes"
          tipo="barra"
          dados={{
            labels: (dadosGraficos || dadosRelatorio)!.clientes.map(c => c.nome.split(" ")[0]),
            valores: (dadosGraficos || dadosRelatorio)!.clientes.map(c => c.valor),
          }}
        />
      </div>
    </div>
  );
}
