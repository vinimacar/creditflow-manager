import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import { getVendas, getFuncionarios, type Venda, type Funcionario } from "@/lib/firestore";
import { startOfMonth, endOfMonth } from "date-fns";

interface AgentStats {
  id: string;
  name: string;
  vendas: number;
  valor: number;
  meta: number;
}

export function TopAgentsCard() {
  const [agents, setAgents] = useState<AgentStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [vendas, funcionarios] = await Promise.all([
        getVendas(),
        getFuncionarios(),
      ]);

      // Filtrar vendas do mês atual
      const agora = new Date();
      const inicioMes = startOfMonth(agora);
      const fimMes = endOfMonth(agora);

      const vendasDoMes = vendas.filter((v) => {
        const dataVenda = v.createdAt?.toDate?.() || new Date(v.createdAt);
        return dataVenda >= inicioMes && dataVenda <= fimMes;
      });

      // Agrupar vendas por funcionário
      const vendaPorFuncionario = new Map<string, { vendas: number; valor: number }>();

      vendasDoMes.forEach((venda) => {
        const current = vendaPorFuncionario.get(venda.funcionarioId) || { vendas: 0, valor: 0 };
        vendaPorFuncionario.set(venda.funcionarioId, {
          vendas: current.vendas + 1,
          valor: current.valor + venda.valorContrato,
        });
      });

      // Criar array de estatísticas
      const agentStats: AgentStats[] = [];
      vendaPorFuncionario.forEach((stats, funcionarioId) => {
        const funcionario = funcionarios.find((f) => f.id === funcionarioId);
        if (funcionario) {
          agentStats.push({
            id: funcionarioId,
            name: funcionario.nome,
            vendas: stats.vendas,
            valor: stats.valor,
            meta: 40, // Meta padrão, pode ser configurada no futuro
          });
        }
      });

      // Ordenar por número de vendas e pegar top 4
      agentStats.sort((a, b) => b.vendas - a.vendas);
      setAgents(agentStats.slice(0, 4));
    } catch (error) {
      console.error("Erro ao carregar top agentes:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Top Agentes</h3>
            <p className="text-sm text-muted-foreground">Desempenho do mês</p>
          </div>
          <div className="p-2 rounded-lg bg-success/10">
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
        </div>
        <div className="space-y-5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-sm p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Top Agentes</h3>
          <p className="text-sm text-muted-foreground">Desempenho do mês</p>
        </div>
        <div className="p-2 rounded-lg bg-success/10">
          <TrendingUp className="w-5 h-5 text-success" />
        </div>
      </div>
      <div className="space-y-5">
        {agents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhuma venda registrada este mês
          </div>
        ) : (
          agents.map((agent, index) => {
            const progress = (agent.vendas / agent.meta) * 100;
            return (
              <div key={agent.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                          {agent.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {agent.vendas} vendas · R$ {agent.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-success">
                    {Math.round(progress)}%
                  </span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
