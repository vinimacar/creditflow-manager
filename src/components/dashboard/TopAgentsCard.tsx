import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { TrendingUp } from "lucide-react";

const topAgents = [
  { name: "Carlos Mendes", vendas: 45, meta: 50, valor: "R$ 185.000" },
  { name: "Fernanda Lima", vendas: 38, meta: 40, valor: "R$ 156.000" },
  { name: "Ricardo Alves", vendas: 32, meta: 35, valor: "R$ 128.000" },
  { name: "Juliana Costa", vendas: 28, meta: 30, valor: "R$ 112.000" },
];

export function TopAgentsCard() {
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
        {topAgents.map((agent, index) => {
          const progress = (agent.vendas / agent.meta) * 100;
          return (
            <div key={agent.name} className="space-y-2">
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
                      {agent.vendas} vendas · {agent.valor}
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
        })}
      </div>
    </div>
  );
}
