import { useState, useEffect } from "react";
import {
  DollarSign,
  Users,
  ShoppingCart,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentSalesTable } from "@/components/dashboard/RecentSalesTable";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { TopAgentsCard } from "@/components/dashboard/TopAgentsCard";
import { getVendas, getClientes, type Venda } from "@/lib/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

interface DashboardStats {
  vendasMes: number;
  comissoesMes: number;
  totalVendas: number;
  clientesAtivos: number;
  crescimentoVendas: number;
  crescimentoComissoes: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [vendas, clientes] = await Promise.all([
        getVendas(),
        getClientes(),
      ]);

      // Datas para comparação
      const agora = new Date();
      const inicioMesAtual = startOfMonth(agora);
      const fimMesAtual = endOfMonth(agora);
      const inicioMesAnterior = startOfMonth(subMonths(agora, 1));
      const fimMesAnterior = endOfMonth(subMonths(agora, 1));

      // Filtrar vendas do mês atual
      const vendasMesAtual = vendas.filter((v) => {
        const dataVenda = v.createdAt?.toDate?.() || new Date(v.createdAt);
        return dataVenda >= inicioMesAtual && dataVenda <= fimMesAtual;
      });

      // Filtrar vendas do mês anterior
      const vendasMesAnterior = vendas.filter((v) => {
        const dataVenda = v.createdAt?.toDate?.() || new Date(v.createdAt);
        return dataVenda >= inicioMesAnterior && dataVenda <= fimMesAnterior;
      });

      // Calcular totais
      const vendasMes = vendasMesAtual.reduce((sum, v) => sum + v.valorContrato, 0);
      const comissoesMes = vendasMesAtual.reduce((sum, v) => sum + (v.comissaoFornecedor || 0), 0);
      
      const vendasMesAnteriorTotal = vendasMesAnterior.reduce((sum, v) => sum + v.valorContrato, 0);
      const comissoesMesAnteriorTotal = vendasMesAnterior.reduce((sum, v) => sum + (v.comissaoFornecedor || 0), 0);

      console.log("Vendas do mês atual:", vendasMesAtual);
      console.log("Total de comissões dos fornecedores:", comissoesMes);
      console.log("Vendas com comissão fornecedor:", vendasMesAtual.filter(v => (v.comissaoFornecedor || 0) > 0));

      // Calcular crescimento
      const crescimentoVendas = vendasMesAnteriorTotal > 0
        ? ((vendasMes - vendasMesAnteriorTotal) / vendasMesAnteriorTotal) * 100
        : 0;
      
      const crescimentoComissoes = comissoesMesAnteriorTotal > 0
        ? ((comissoesMes - comissoesMesAnteriorTotal) / comissoesMesAnteriorTotal) * 100
        : 0;

      setStats({
        vendasMes,
        comissoesMes,
        totalVendas: vendasMesAtual.length,
        clientesAtivos: clientes.filter((c) => c.status === "ativo").length,
        crescimentoVendas,
        crescimentoComissoes,
      });
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral do desempenho da sua operação
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96" />
          <Skeleton className="h-96" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do desempenho da sua operação
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card px-4 py-2 rounded-lg border border-border/50">
          <span>Período:</span>
          <span className="font-medium text-foreground">
            {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Vendas do Mês"
          value={`R$ ${stats!.vendasMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          change={`${stats!.crescimentoVendas > 0 ? "+" : ""}${stats!.crescimentoVendas.toFixed(1)}% vs mês anterior`}
          changeType={stats!.crescimentoVendas >= 0 ? "positive" : "negative"}
          icon={DollarSign}
          iconColor="primary"
        />
        <StatCard
          title="Receita (Comissão Fornecedores)"
          value={`R$ ${stats!.comissoesMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          change={`${stats!.crescimentoComissoes > 0 ? "+" : ""}${stats!.crescimentoComissoes.toFixed(1)}% vs mês anterior`}
          changeType={stats!.crescimentoComissoes >= 0 ? "positive" : "negative"}
          icon={TrendingUp}
          iconColor="success"
        />
        <StatCard
          title="Total de Vendas"
          value={stats!.totalVendas.toString()}
          change={`${stats!.totalVendas} vendas este mês`}
          changeType="positive"
          icon={ShoppingCart}
          iconColor="accent"
        />
        <StatCard
          title="Clientes Ativos"
          value={stats!.clientesAtivos.toString()}
          change="Base de clientes"
          changeType="positive"
          icon={Users}
          iconColor="warning"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <TopAgentsCard />
      </div>

      {/* Recent Sales */}
      <RecentSalesTable />
    </div>
  );
}
