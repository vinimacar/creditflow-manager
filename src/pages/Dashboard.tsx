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

export default function Dashboard() {
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
          <span className="font-medium text-foreground">Janeiro 2026</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Vendas do Mês"
          value="R$ 248.500"
          change="+12,5% vs mês anterior"
          changeType="positive"
          icon={DollarSign}
          iconColor="primary"
        />
        <StatCard
          title="Comissões"
          value="R$ 7.455"
          change="+8,2% vs mês anterior"
          changeType="positive"
          icon={TrendingUp}
          iconColor="success"
        />
        <StatCard
          title="Total de Vendas"
          value="143"
          change="+15 vendas"
          changeType="positive"
          icon={ShoppingCart}
          iconColor="accent"
        />
        <StatCard
          title="Clientes Ativos"
          value="1.284"
          change="+48 novos"
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
