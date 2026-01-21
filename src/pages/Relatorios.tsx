import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  FileSpreadsheet,
  HelpCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getVendas, getFuncionarios, getProdutos, getFornecedores, getClientes, getDespesas, type Venda, type Funcionario, type Produto, type Cliente, type Despesa } from "@/lib/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { calcularComissoes, calcularTotalComissoesFornecedor } from "@/lib/calculos-comissoes";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FolhaPagamento } from "@/types/folhaPagamento";
import { Separator } from "@/components/ui/separator";

interface VendaDetalhada {
  id: string;
  data: Date;
  cliente: string;
  cpf: string;
  funcionario: string;
  produto: string;
  valorContrato: number;
  prazo: number;
  comissaoFuncionario: number;
  comissaoFuncionarioPerc: number;
  comissaoFornecedor: number;
  comissaoFornecedorPerc: number;
  status: string;
}

export default function Relatorios() {
  const [filtros, setFiltros] = useState<FiltrosRelatorio>({
    tipoRelatorio: "geral",
    agrupamento: "mes",
  });
  const [gerando, setGerando] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Dados brutos do banco
  const [vendasCompletas, setVendasCompletas] = useState<Venda[]>([]);
  const [clientesCompletos, setClientesCompletos] = useState<Cliente[]>([]);
  const [funcionariosCompletos, setFuncionariosCompletos] = useState<Funcionario[]>([]);
  const [produtosCompletos, setProdutosCompletos] = useState<Produto[]>([]);
  const [despesasCompletas, setDespesasCompletas] = useState<Despesa[]>([]);
  const [folhasPagamento, setFolhasPagamento] = useState<FolhaPagamento[]>([]);

  // Carregar dados do banco
  useEffect(() => {
    let mounted = true;

    const carregarDados = async () => {
      try {
        const [vendas, funcionarios, produtos, fornecedores, clientes, despesas, folhasSnapshot] = await Promise.all([
          getVendas(),
          getFuncionarios(),
          getProdutos(),
          getFornecedores(),
          getClientes(),
          getDespesas(),
          getDocs(collection(db, "folhaPagamento")),
        ]);

        if (!mounted) return;

        const folhas = folhasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          criadoEm: doc.data().criadoEm?.toDate(),
          atualizadoEm: doc.data().atualizadoEm?.toDate(),
          dataPagamento: doc.data().dataPagamento?.toDate(),
        })) as FolhaPagamento[];

        setVendasCompletas(vendas);
        setClientesCompletos(clientes);
        setFuncionariosCompletos(funcionarios);
        setProdutosCompletos(produtos);
        setDespesasCompletas(despesas);
        setFolhasPagamento(folhas);
        setLoading(false);
      } catch (error) {
        if (mounted) {
          console.error("Erro ao carregar dados:", error);
          toast.error("Erro ao carregar dados do relatório");
          setLoading(false);
        }
      }
    };

    carregarDados();

    return () => {
      mounted = false;
    };
  }, []);

  // Processar vendas detalhadas
  const vendasDetalhadas: VendaDetalhada[] = useMemo(() => {
    return vendasCompletas.map(v => {
      const cliente = clientesCompletos.find(c => c.id === v.clienteId);
      const funcionario = funcionariosCompletos.find(f => f.id === v.funcionarioId);
      const produto = produtosCompletos.find(p => p.id === v.produtoId);
      
      const comissoes = calcularComissoes(v, produto);
      
      return {
        id: v.id || '',
        data: v.createdAt?.toDate?.() || new Date(v.createdAt),
        cliente: cliente?.nome || "N/A",
        cpf: cliente?.cpf || "N/A",
        funcionario: funcionario?.nome || "N/A",
        produto: produto?.nome || "N/A",
        valorContrato: v.valorContrato,
        prazo: v.prazo,
        comissaoFuncionario: comissoes.comissaoAgente,
        comissaoFuncionarioPerc: comissoes.comissaoAgentePercentual,
        comissaoFornecedor: comissoes.comissaoFornecedor,
        comissaoFornecedorPerc: comissoes.comissaoFornecedorPercentual,
        status: v.status || 'aprovada',
      };
    });
  }, [vendasCompletas, clientesCompletos, funcionariosCompletos, produtosCompletos]);

  // Filtrar vendas baseado nos filtros aplicados
  const vendasFiltradas = useMemo(() => {
    let vendas = vendasDetalhadas;

    // Filtro de período
    if (filtros.periodo?.from) {
      vendas = vendas.filter(v => {
        const from = filtros.periodo!.from!;
        const to = filtros.periodo!.to || from;
        return v.data >= from && v.data <= to;
      });
    }

    // Filtro de cliente
    if (filtros.cliente) {
      vendas = vendas.filter(v => v.cliente === filtros.cliente);
    }

    // Filtro de funcionário
    if (filtros.funcionario) {
      vendas = vendas.filter(v => v.funcionario === filtros.funcionario);
    }

    // Filtro de produto
    if (filtros.produto) {
      vendas = vendas.filter(v => v.produto === filtros.produto);
    }

    return vendas;
  }, [vendasDetalhadas, filtros]);

  // KPIs principais (sempre baseados nos dados filtrados ou completos)
  const kpis = useMemo(() => {
    const vendas = vendasFiltradas;
    
    const totalMovimentado = vendas.reduce((sum, v) => sum + v.valorContrato, 0);
    const totalComissoesFornecedor = vendas.reduce((sum, v) => sum + v.comissaoFornecedor, 0);
    const totalComissoesFuncionarios = vendas.reduce((sum, v) => sum + v.comissaoFuncionario, 0);
    
    // Despesas no período filtrado
    let despesasPeriodo = despesasCompletas;
    if (filtros.periodo?.from) {
      despesasPeriodo = despesasCompletas.filter(d => {
        const dataDespesa = new Date(d.dataVencimento);
        const from = filtros.periodo!.from!;
        const to = filtros.periodo!.to || from;
        return dataDespesa >= from && dataDespesa <= to;
      });
    }
    
    const totalDespesas = despesasPeriodo.reduce((sum, d) => sum + d.valor, 0);
    
    // Folhas de pagamento no período
    let folhasPeriodo = folhasPagamento;
    if (filtros.periodo?.from) {
      folhasPeriodo = folhasPagamento.filter(f => {
        const mesRef = f.mesReferencia + "-01";
        const dataFolha = new Date(mesRef);
        const from = startOfMonth(filtros.periodo!.from!);
        const to = endOfMonth(filtros.periodo!.to || filtros.periodo!.from!);
        return dataFolha >= from && dataFolha <= to;
      });
    }
    
    const totalFolhas = folhasPeriodo.reduce((sum, f) => sum + f.salarioLiquido, 0);
    const totalDespesasGeral = totalDespesas + totalFolhas;
    
    const receitaLiquida = totalComissoesFornecedor - totalDespesasGeral;
    const margemLucro = totalComissoesFornecedor > 0 ? (receitaLiquida / totalComissoesFornecedor) * 100 : 0;
    const ticketMedio = vendas.length > 0 ? totalMovimentado / vendas.length : 0;
    
    return {
      totalMovimentado,
      totalComissoesFornecedor,
      totalComissoesFuncionarios,
      totalDespesas: totalDespesasGeral,
      receitaLiquida,
      margemLucro,
      ticketMedio,
      quantidadeVendas: vendas.length,
      quantidadeFuncionarios: new Set(vendas.map(v => v.funcionario)).size,
    };
  }, [vendasFiltradas, despesasCompletas, folhasPagamento, filtros.periodo]);

  // Despesas filtradas por período
  const despesasFiltradas = useMemo(() => {
    let despesas = despesasCompletas;
    
    if (filtros.periodo?.from) {
      despesas = despesas.filter(d => {
        const dataDespesa = new Date(d.dataVencimento);
        const from = filtros.periodo!.from!;
        const to = filtros.periodo!.to || from;
        return dataDespesa >= from && dataDespesa <= to;
      });
    }
    
    return despesas.sort((a, b) => 
      new Date(b.dataVencimento).getTime() - new Date(a.dataVencimento).getTime()
    );
  }, [despesasCompletas, filtros.periodo]);

  // Vendas por funcionário
  const vendasPorFuncionario = useMemo(() => {
    const vendas = vendasFiltradas;
    const funcMap = new Map<string, {
      nome: string;
      vendas: VendaDetalhada[];
      totalVendas: number;
      totalComissao: number;
      quantidadeVendas: number;
    }>();
    
    vendas.forEach(v => {
      const current = funcMap.get(v.funcionario) || {
        nome: v.funcionario,
        vendas: [],
        totalVendas: 0,
        totalComissao: 0,
        quantidadeVendas: 0,
      };
      
      current.vendas.push(v);
      current.totalVendas += v.valorContrato;
      current.totalComissao += v.comissaoFuncionario;
      current.quantidadeVendas += 1;
      
      funcMap.set(v.funcionario, current);
    });
    
    return Array.from(funcMap.values()).sort((a, b) => b.totalComissao - a.totalComissao);
  }, [vendasFiltradas]);

  // Dados para gráficos
  const dadosGraficos = useMemo(() => {
    const vendas = vendasFiltradas;
    
    // Vendas por mês (últimos 6 meses)
    const vendasPorMes = [];
    const despesasPorMes = [];
    const receitasPorMes = [];
    const lucrosPorMes = [];
    
    for (let i = 5; i >= 0; i--) {
      const mesData = subMonths(new Date(), i);
      const inicioMes = startOfMonth(mesData);
      const fimMes = endOfMonth(mesData);
      
      const vendasDoMes = vendas.filter(v => v.data >= inicioMes && v.data <= fimMes);
      const despesasDoMes = despesasCompletas.filter(d => {
        const dataDespesa = new Date(d.dataVencimento);
        return dataDespesa >= inicioMes && dataDespesa <= fimMes;
      });
      
      const valorVendas = vendasDoMes.reduce((sum, v) => sum + v.valorContrato, 0);
      const valorDespesas = despesasDoMes.reduce((sum, d) => sum + d.valor, 0);
      const valorReceitas = vendasDoMes.reduce((sum, v) => sum + v.comissaoFornecedor, 0);
      
      vendasPorMes.push({
        mes: format(mesData, "MMM/yy", { locale: ptBR }),
        valor: valorVendas,
        quantidade: vendasDoMes.length,
      });
      
      despesasPorMes.push({
        mes: format(mesData, "MMM/yy", { locale: ptBR }),
        valor: valorDespesas,
      });
      
      receitasPorMes.push({
        mes: format(mesData, "MMM/yy", { locale: ptBR }),
        valor: valorReceitas,
      });
      
      lucrosPorMes.push({
        mes: format(mesData, "MMM/yy", { locale: ptBR }),
        valor: valorReceitas - valorDespesas,
      });
    }
    
    // Top 5 funcionários
    const vendaPorFunc = new Map<string, { vendas: number; comissao: number }>();
    vendas.forEach(v => {
      const current = vendaPorFunc.get(v.funcionario) || { vendas: 0, comissao: 0 };
      vendaPorFunc.set(v.funcionario, {
        vendas: current.vendas + 1,
        comissao: current.comissao + v.comissaoFuncionario,
      });
    });
    
    const topFuncionarios = Array.from(vendaPorFunc.entries())
      .map(([nome, stats]) => ({ nome, ...stats }))
      .sort((a, b) => b.comissao - a.comissao)
      .slice(0, 5);
    
    // Top 5 produtos
    const vendaPorProd = new Map<string, number>();
    vendas.forEach(v => {
      const current = vendaPorProd.get(v.produto) || 0;
      vendaPorProd.set(v.produto, current + v.valorContrato);
    });
    
    const topProdutos = Array.from(vendaPorProd.entries())
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
    
    // Top 10 clientes
    const vendaPorCliente = new Map<string, { vendas: number; valor: number }>();
    vendas.forEach(v => {
      const current = vendaPorCliente.get(v.cliente) || { vendas: 0, valor: 0 };
      vendaPorCliente.set(v.cliente, {
        vendas: current.vendas + 1,
        valor: current.valor + v.valorContrato,
      });
    });
    
    const topClientes = Array.from(vendaPorCliente.entries())
      .map(([nome, stats]) => ({ nome, ...stats }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);
    
    return {
      vendasPorMes,
      despesasPorMes,
      receitasPorMes,
      lucrosPorMes,
      topFuncionarios,
      topProdutos,
      topClientes,
    };
  }, [vendasFiltradas, despesasCompletas]);

  // Exportar Excel
  const handleExportarExcel = () => {
    try {
      const dadosExport = vendasFiltradas.map((venda) => ({
        "Data": format(venda.data, "dd/MM/yyyy HH:mm", { locale: ptBR }),
        "Cliente": venda.cliente,
        "CPF": venda.cpf,
        "Funcionário": venda.funcionario,
        "Produto": venda.produto,
        "Valor Contrato": venda.valorContrato,
        "Prazo (meses)": venda.prazo,
        "Comissão Funcionário (%)": venda.comissaoFuncionarioPerc,
        "Comissão Funcionário (R$)": venda.comissaoFuncionario,
        "Comissão Fornecedor (%)": venda.comissaoFornecedorPerc,
        "Comissão Fornecedor (R$)": venda.comissaoFornecedor,
        "Status": venda.status,
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dadosExport);

      ws['!cols'] = [
        { wch: 18 }, { wch: 30 }, { wch: 15 }, { wch: 30 }, { wch: 35 },
        { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 12 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Relatório");
      XLSX.writeFile(wb, `relatorio_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);

      toast.success(`${vendasFiltradas.length} registros exportados com sucesso!`);
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      toast.error("Erro ao exportar dados");
    }
  };

  // Exportar PDF
  const handleExportarPDF = async () => {
    setGerando(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      doc.setFontSize(20);
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
          ["Total Movimentado", `R$ ${kpis.totalMovimentado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
          ["Receita Bruta (Comissões)", `R$ ${kpis.totalComissoesFornecedor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
          ["Total de Despesas", `R$ ${kpis.totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
          ["Receita Líquida", `R$ ${kpis.receitaLiquida.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
          ["Margem de Lucro", `${kpis.margemLucro.toFixed(2)}%`],
          ["Ticket Médio", `R$ ${kpis.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
          ["Quantidade de Vendas", kpis.quantidadeVendas.toString()],
        ],
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
      });

      if (vendasFiltradas.length > 0) {
        doc.addPage();
        y = 20;
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Detalhamento de Vendas", 14, y);

        y += 10;
        autoTable(doc, {
          startY: y,
          head: [["Data", "Cliente", "Produto", "Valor", "Comissão Fornecedor", "Comissão Funcionário"]],
          body: vendasFiltradas.slice(0, 50).map(v => [
            format(v.data, "dd/MM/yyyy", { locale: ptBR }),
            v.cliente.length > 20 ? v.cliente.substring(0, 20) + '...' : v.cliente,
            v.produto.length > 20 ? v.produto.substring(0, 20) + '...' : v.produto,
            `R$ ${v.valorContrato.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            `R$ ${v.comissaoFornecedor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            `R$ ${v.comissaoFuncionario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          ]),
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246] },
          styles: { fontSize: 8 },
        });
      }

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
          description="Painel de análise e gestão empresarial"
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

  const temFiltros = !!(filtros.periodo?.from || filtros.cliente || filtros.funcionario || filtros.produto);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Relatórios Gerenciais"
        description="Painel completo de análise e tomada de decisões estratégicas"
      />

      {/* Indicador de filtros ativos */}
      {temFiltros && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">Filtros Aplicados</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Exibindo {vendasFiltradas.length} de {vendasDetalhadas.length} vendas
                {filtros.periodo?.from && ` • Período: ${format(filtros.periodo.from, "dd/MM/yyyy", { locale: ptBR })}`}
                {filtros.periodo?.to && ` até ${format(filtros.periodo.to, "dd/MM/yyyy", { locale: ptBR })}`}
                {filtros.cliente && ` • Cliente: ${filtros.cliente}`}
                {filtros.funcionario && ` • Funcionário: ${filtros.funcionario}`}
                {filtros.produto && ` • Produto: ${filtros.produto}`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltros({ tipoRelatorio: "geral", agrupamento: "mes" })}
              className="border-blue-600 text-blue-600 hover:bg-blue-100"
            >
              Limpar Filtros
            </Button>
          </div>
        </Card>
      )}

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Valor total de todos os contratos negociados</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Movimentado</h3>
          <p className="text-2xl font-bold mt-1 text-blue-700 dark:text-blue-300">
            R$ {kpis.totalMovimentado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            {kpis.quantidadeVendas} {kpis.quantidadeVendas === 1 ? 'venda' : 'vendas'}
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-green-600" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Comissões recebidas dos fornecedores/bancos</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <h3 className="text-sm font-medium text-green-900 dark:text-green-100">Receita Bruta</h3>
          <p className="text-2xl font-bold mt-1 text-green-700 dark:text-green-300">
            R$ {kpis.totalComissoesFornecedor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
            Comissões de fornecedores
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-red-500 rounded-lg">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-red-600" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Despesas operacionais + Folhas de pagamento</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <h3 className="text-sm font-medium text-red-900 dark:text-red-100">Total de Despesas</h3>
          <p className="text-2xl font-bold mt-1 text-red-700 dark:text-red-300">
            R$ {kpis.totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-2">
            Operacionais + Folha
          </p>
        </Card>

        <Card className={`p-6 bg-gradient-to-br border-2 ${
          kpis.receitaLiquida >= 0 
            ? 'from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-300'
            : 'from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-300'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg ${kpis.receitaLiquida >= 0 ? 'bg-emerald-500' : 'bg-orange-500'}`}>
              <Activity className="w-6 h-6 text-white" />
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className={`w-4 h-4 ${kpis.receitaLiquida >= 0 ? 'text-emerald-600' : 'text-orange-600'}`} />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Receita Bruta - Despesas Totais</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <h3 className={`text-sm font-medium ${kpis.receitaLiquida >= 0 ? 'text-emerald-900 dark:text-emerald-100' : 'text-orange-900 dark:text-orange-100'}`}>
            Receita Líquida
          </h3>
          <p className={`text-2xl font-bold mt-1 ${kpis.receitaLiquida >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-orange-700 dark:text-orange-300'}`}>
            R$ {kpis.receitaLiquida.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {kpis.receitaLiquida >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <TrendingDown className="w-4 h-4 text-orange-600" />}
            <p className={`text-xs font-semibold ${kpis.receitaLiquida >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
              Margem: {kpis.margemLucro.toFixed(1)}%
            </p>
          </div>
        </Card>
      </div>

      {/* KPIs Secundários */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Ticket Médio</p>
              <h3 className="text-xl font-bold mt-1">
                R$ {kpis.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-500 opacity-80" />
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Comissões Pagas</p>
              <h3 className="text-xl font-bold mt-1">
                R$ {kpis.totalComissoesFuncionarios.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <Users className="w-8 h-8 text-purple-500 opacity-80" />
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Funcionários Ativos</p>
              <h3 className="text-xl font-bold mt-1">{kpis.quantidadeFuncionarios}</h3>
            </div>
            <Package className="w-8 h-8 text-orange-500 opacity-80" />
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <FiltrosDinamicosRelatorio
        filtros={filtros}
        onFiltrosChange={setFiltros}
        fornecedores={[]}
        funcionarios={funcionariosCompletos.map(f => f.nome)}
        produtos={produtosCompletos.map(p => p.nome)}
        clientes={clientesCompletos.map(c => c.nome)}
        onGerarRelatorio={() => toast.success("Filtros aplicados!")}
      />

      {/* Gráficos de Desempenho */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GraficoModerno
          titulo="Evolução de Vendas (6 meses)"
          tipo="linha"
          dados={{
            labels: dadosGraficos.vendasPorMes.map(v => v.mes),
            valores: dadosGraficos.vendasPorMes.map(v => v.valor),
          }}
        />

        <GraficoModerno
          titulo="Receitas x Despesas"
          tipo="barra"
          dados={{
            labels: dadosGraficos.receitasPorMes.map(r => r.mes),
            valores: dadosGraficos.receitasPorMes.map(r => r.valor),
            comparacao: dadosGraficos.despesasPorMes.map(d => d.valor),
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GraficoModerno
          titulo="Top 5 Funcionários (Comissões)"
          tipo="barra"
          dados={{
            labels: dadosGraficos.topFuncionarios.map(f => f.nome.split(" ")[0]),
            valores: dadosGraficos.topFuncionarios.map(f => f.comissao),
          }}
        />

        <GraficoModerno
          titulo="Top 5 Produtos (Valor)"
          tipo="pizza"
          dados={{
            labels: dadosGraficos.topProdutos.map(p => p.nome.length > 15 ? p.nome.substring(0, 15) + '...' : p.nome),
            valores: dadosGraficos.topProdutos.map(p => p.valor),
          }}
        />

        <GraficoModerno
          titulo="Evolução de Lucros"
          tipo="linha"
          dados={{
            labels: dadosGraficos.lucrosPorMes.map(l => l.mes),
            valores: dadosGraficos.lucrosPorMes.map(l => l.valor),
          }}
        />
      </div>

      {/* Tabela de Vendas Detalhadas */}
      <Card>
        <div className="p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Vendas Detalhadas
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {vendasFiltradas.length} {vendasFiltradas.length === 1 ? 'venda' : 'vendas'} • Total: R$ {vendasFiltradas.reduce((sum, v) => sum + v.valorContrato, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportarExcel} className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportarPDF} disabled={gerando} className="gap-2">
              <Download className="w-4 h-4" />
              {gerando ? "Gerando..." : "PDF"}
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[120px]">Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Funcionário</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Prazo</TableHead>
                <TableHead className="text-right bg-green-50 dark:bg-green-950">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center justify-end gap-1 w-full">
                        Comissão Func.
                        <HelpCircle className="w-3 h-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Comissão paga ao funcionário</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="text-right bg-blue-50 dark:bg-blue-950">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center justify-end gap-1 w-full">
                        Comissão Forn.
                        <HelpCircle className="w-3 h-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Comissão recebida do fornecedor</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-8 h-8 opacity-50" />
                      <p>Nenhuma venda encontrada com os filtros aplicados</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                vendasFiltradas.slice(0, 100).map((venda) => (
                  <TableRow key={venda.id} className="hover:bg-muted/50">
                    <TableCell className="whitespace-nowrap font-mono text-xs">
                      {format(venda.data, "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium">{venda.cliente}</TableCell>
                    <TableCell>{venda.funcionario}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{venda.produto}</TableCell>
                    <TableCell className="text-right font-semibold">
                      R$ {venda.valorContrato.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">{venda.prazo}m</TableCell>
                    <TableCell className="text-right bg-green-50 dark:bg-green-950 font-semibold text-green-700 dark:text-green-400">
                      R$ {venda.comissaoFuncionario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right bg-blue-50 dark:bg-blue-950 font-semibold text-blue-700 dark:text-blue-400">
                      R$ {venda.comissaoFornecedor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={venda.status === "aprovada" ? "default" : venda.status === "pendente" ? "secondary" : "destructive"}>
                        {venda.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {vendasFiltradas.length > 100 && (
            <div className="p-4 text-center text-sm text-muted-foreground bg-muted/30">
              Exibindo 100 de {vendasFiltradas.length} vendas. Exporte para Excel para ver todas.
            </div>
          )}
        </div>
      </Card>

      {/* Tabela Top 10 Clientes */}
      {dadosGraficos.topClientes.length > 0 && (
        <Card>
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Top 10 Clientes
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Maiores clientes por valor total de contratos
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Qtd. Vendas</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="text-right">Ticket Médio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosGraficos.topClientes.map((cliente, index) => (
                  <TableRow key={cliente.nome}>
                    <TableCell className="font-bold text-muted-foreground">
                      {index + 1}º
                    </TableCell>
                    <TableCell className="font-medium">{cliente.nome}</TableCell>
                    <TableCell className="text-right">{cliente.vendas}</TableCell>
                    <TableCell className="text-right font-semibold text-blue-700 dark:text-blue-400">
                      R$ {cliente.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      R$ {(cliente.valor / cliente.vendas).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Tabela de Despesas do Período */}
      {despesasFiltradas.length > 0 && (
        <Card>
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              Despesas do Período
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {despesasFiltradas.length} {despesasFiltradas.length === 1 ? 'despesa' : 'despesas'} • Total: R$ {despesasFiltradas.reduce((sum, d) => sum + d.valor, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[120px]">Data Venc.</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {despesasFiltradas.map((despesa) => (
                  <TableRow key={despesa.id} className="hover:bg-muted/50">
                    <TableCell className="whitespace-nowrap font-mono text-xs">
                      {format(new Date(despesa.dataVencimento), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium">{despesa.descricao}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{despesa.categoria}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-red-700 dark:text-red-400">
                      R$ {despesa.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={despesa.status === "pago" ? "default" : despesa.status === "pendente" ? "secondary" : "destructive"}>
                        {despesa.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Tabela de Vendas por Funcionário */}
      {vendasPorFuncionario.length > 0 && (
        <Card>
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Vendas por Funcionário
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Desempenho individual com detalhamento de vendas
            </p>
          </div>
          <div className="space-y-4 p-6">
            {vendasPorFuncionario.map((func, idx) => (
              <div key={func.nome} className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300">
                      {idx + 1}º
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">{func.nome}</h4>
                      <p className="text-sm text-muted-foreground">
                        {func.quantidadeVendas} {func.quantidadeVendas === 1 ? 'venda' : 'vendas'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Vendido</p>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                      R$ {func.totalVendas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                      Comissão: R$ {func.totalComissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="w-[100px]">Data</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">Comissão</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {func.vendas.map((venda) => (
                        <TableRow key={venda.id}>
                          <TableCell className="whitespace-nowrap text-xs font-mono">
                            {format(venda.data, "dd/MM/yy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>{venda.cliente}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{venda.produto}</TableCell>
                          <TableCell className="text-right font-semibold">
                            R$ {venda.valorContrato.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                            R$ {venda.comissaoFuncionario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Botões de Ação */}
      <div className="flex justify-end gap-3 pt-4">
        <Button 
          variant="outline" 
          onClick={() => window.print()} 
          className="gap-2"
        >
          <Printer className="w-4 h-4" />
          Imprimir
        </Button>
      </div>
    </div>
  );
}
