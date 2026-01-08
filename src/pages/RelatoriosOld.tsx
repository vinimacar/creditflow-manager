import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileBarChart,
  Users,
  Package,
  DollarSign,
  Building2,
  UserCog,
  Download,
  Filter,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const vendasPorAgente = [
  { nome: "Carlos", vendas: 45, valor: 185000 },
  { nome: "Fernanda", vendas: 38, valor: 156000 },
  { nome: "Ricardo", vendas: 32, valor: 128000 },
  { nome: "Juliana", vendas: 28, valor: 112000 },
  { nome: "Pedro", vendas: 22, valor: 88000 },
];

const vendasPorProduto = [
  { nome: "Consignado INSS", valor: 450000, color: "hsl(230, 80%, 55%)" },
  { nome: "Refinanciamento", valor: 180000, color: "hsl(175, 70%, 40%)" },
  { nome: "Portabilidade", valor: 120000, color: "hsl(142, 71%, 45%)" },
  { nome: "Cartão", valor: 80000, color: "hsl(38, 92%, 50%)" },
];

const reportTypes = [
  {
    id: "vendas",
    title: "Vendas",
    description: "Relatório completo de vendas",
    icon: FileBarChart,
    color: "primary",
  },
  {
    id: "vendas-funcionario",
    title: "Vendas por Funcionário",
    description: "Desempenho individual",
    icon: UserCog,
    color: "accent",
  },
  {
    id: "comissoes",
    title: "Comissões",
    description: "Comissões geradas",
    icon: DollarSign,
    color: "success",
  },
  {
    id: "clientes",
    title: "Clientes",
    description: "Base de clientes",
    icon: Users,
    color: "warning",
  },
  {
    id: "produtos",
    title: "Produtos",
    description: "Performance por produto",
    icon: Package,
    color: "primary",
  },
  {
    id: "fornecedores",
    title: "Fornecedores",
    description: "Parceiros bancários",
    icon: Building2,
    color: "accent",
  },
];

const iconColorClasses: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

export default function Relatorios() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Análises e métricas do seu negócio"
      />

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label className="text-xs">Período</Label>
            <div className="flex gap-2 mt-1">
              <Input type="date" className="w-36" />
              <Input type="date" className="w-36" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Funcionário</Label>
            <Select>
              <SelectTrigger className="w-40 mt-1">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="1">Carlos Mendes</SelectItem>
                <SelectItem value="2">Fernanda Lima</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Fornecedor</Label>
            <Select>
              <SelectTrigger className="w-40 mt-1">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="1">BMG</SelectItem>
                <SelectItem value="2">Banco Pan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="gap-2">
            <Filter className="w-4 h-4" />
            Filtrar
          </Button>
        </div>
      </Card>

      {/* Tipos de Relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((report) => (
          <Card
            key={report.id}
            className="p-5 cursor-pointer card-hover flex items-center gap-4"
          >
            <div className={`p-3 rounded-xl ${iconColorClasses[report.color]}`}>
              <report.icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{report.title}</h3>
              <p className="text-xs text-muted-foreground">{report.description}</p>
            </div>
            <Button variant="ghost" size="icon">
              <Download className="w-4 h-4" />
            </Button>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas por Agente */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold">Vendas por Agente</h3>
              <p className="text-sm text-muted-foreground">Janeiro 2026</p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendasPorAgente} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" horizontal={false} />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(220, 10%, 45%)", fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="nome"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(220, 10%, 45%)", fontSize: 12 }}
                  width={70}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(220, 15%, 88%)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Valor"]}
                />
                <Bar dataKey="valor" fill="hsl(230, 80%, 55%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Vendas por Produto */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold">Vendas por Produto</h3>
              <p className="text-sm text-muted-foreground">Distribuição do mês</p>
            </div>
            <div className="p-2 rounded-lg bg-accent/10">
              <Package className="w-5 h-5 text-accent" />
            </div>
          </div>
          <div className="h-[300px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vendasPorProduto}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="valor"
                >
                  {vendasPorProduto.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(220, 15%, 88%)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Valor"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {vendasPorProduto.map((produto) => (
              <div key={produto.nome} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: produto.color }}
                />
                <span className="text-xs text-muted-foreground">{produto.nome}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
