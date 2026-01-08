import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const recentSales = [
  {
    id: "VND-001",
    cliente: "Maria Silva",
    produto: "Empréstimo Consignado INSS",
    valor: "R$ 15.000,00",
    comissao: "R$ 450,00",
    status: "aprovado",
    data: "08/01/2026",
  },
  {
    id: "VND-002",
    cliente: "João Santos",
    produto: "Refinanciamento",
    valor: "R$ 8.500,00",
    comissao: "R$ 255,00",
    status: "pendente",
    data: "08/01/2026",
  },
  {
    id: "VND-003",
    cliente: "Ana Costa",
    produto: "Portabilidade",
    valor: "R$ 22.000,00",
    comissao: "R$ 660,00",
    status: "aprovado",
    data: "07/01/2026",
  },
  {
    id: "VND-004",
    cliente: "Pedro Oliveira",
    produto: "Cartão Consignado",
    valor: "R$ 3.200,00",
    comissao: "R$ 96,00",
    status: "em_analise",
    data: "07/01/2026",
  },
  {
    id: "VND-005",
    cliente: "Lucia Ferreira",
    produto: "Empréstimo Consignado INSS",
    valor: "R$ 12.000,00",
    comissao: "R$ 360,00",
    status: "aprovado",
    data: "06/01/2026",
  },
];

const statusConfig = {
  aprovado: { label: "Aprovado", variant: "default" as const, className: "bg-success hover:bg-success/90" },
  pendente: { label: "Pendente", variant: "secondary" as const, className: "bg-warning hover:bg-warning/90 text-warning-foreground" },
  em_analise: { label: "Em Análise", variant: "outline" as const, className: "border-primary text-primary" },
  recusado: { label: "Recusado", variant: "destructive" as const, className: "" },
};

export function RecentSalesTable() {
  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold">Vendas Recentes</h3>
        <p className="text-sm text-muted-foreground">Últimas transações registradas no sistema</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Cliente</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Comissão</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentSales.map((sale) => {
            const status = statusConfig[sale.status as keyof typeof statusConfig];
            return (
              <TableRow key={sale.id} className="cursor-pointer">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                        {sale.cliente.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{sale.cliente}</p>
                      <p className="text-xs text-muted-foreground">{sale.id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{sale.produto}</TableCell>
                <TableCell className="font-medium">{sale.valor}</TableCell>
                <TableCell className="text-success font-medium">{sale.comissao}</TableCell>
                <TableCell>
                  <Badge variant={status.variant} className={status.className}>
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {sale.data}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
