import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getVendas, type Venda } from "@/lib/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfMonth, endOfMonth, format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChartData {
  mes: string;
  vendas: number;
  comissoes: number;
}

export function SalesChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const vendas = await getVendas();
      
      // Gerar dados dos últimos 7 meses
      const chartData: ChartData[] = [];
      const agora = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const mesData = subMonths(agora, i);
        const inicioMes = startOfMonth(mesData);
        const fimMes = endOfMonth(mesData);
        
        // Filtrar vendas do mês
        const vendasDoMes = vendas.filter((v) => {
          const dataVenda = v.createdAt?.toDate?.() || new Date(v.createdAt);
          return dataVenda >= inicioMes && dataVenda <= fimMes;
        });
        
        const totalVendas = vendasDoMes.reduce((sum, v) => sum + v.valorContrato, 0);
        const totalComissoes = vendasDoMes.reduce((sum, v) => sum + v.comissao, 0);
        
        chartData.push({
          mes: format(mesData, "MMM", { locale: ptBR }),
          vendas: totalVendas,
          comissoes: totalComissoes,
        });
      }
      
      setData(chartData);
    } catch (error) {
      console.error("Erro ao carregar dados do gráfico:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold">Evolução de Vendas</h3>
          <p className="text-sm text-muted-foreground">Últimos 7 meses</p>
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }
  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6 animate-fade-in">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Evolução de Vendas</h3>
        <p className="text-sm text-muted-foreground">Últimos 7 meses</p>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(230, 80%, 55%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(230, 80%, 55%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorComissoes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(175, 70%, 40%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(175, 70%, 40%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" vertical={false} />
            <XAxis
              dataKey="mes"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(220, 10%, 45%)", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(220, 10%, 45%)", fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(0, 0%, 100%)",
                border: "1px solid hsl(220, 15%, 88%)",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
              }}
              formatter={(value: number, name: string) => [
                `R$ ${value.toLocaleString("pt-BR")}`,
                name === "vendas" ? "Vendas" : "Comissões",
              ]}
            />
            <Area
              type="monotone"
              dataKey="vendas"
              stroke="hsl(230, 80%, 55%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorVendas)"
            />
            <Area
              type="monotone"
              dataKey="comissoes"
              stroke="hsl(175, 70%, 40%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorComissoes)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">Vendas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent" />
          <span className="text-sm text-muted-foreground">Comissões</span>
        </div>
      </div>
    </div>
  );
}
