import { useState, useEffect } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { getVendas, getClientes, getProdutos, type Venda, type Cliente, type Produto } from "@/lib/firestore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface VendaCompleta extends Venda {
  clienteNome?: string;
  produtoNome?: string;
}

const statusConfig = {
  aprovada: { label: "Aprovado", variant: "default" as const, className: "bg-success hover:bg-success/90" },
  pendente: { label: "Pendente", variant: "secondary" as const, className: "bg-warning hover:bg-warning/90 text-warning-foreground" },
  em_analise: { label: "Em Análise", variant: "outline" as const, className: "border-primary text-primary" },
  recusada: { label: "Recusado", variant: "destructive" as const, className: "" },
};

export function RecentSalesTable() {
  const [vendas, setVendas] = useState<VendaCompleta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarVendas();
  }, []);

  const carregarVendas = async () => {
    try {
      const [vendasData, clientes, produtos] = await Promise.all([
        getVendas(),
        getClientes(),
        getProdutos(),
      ]);

      // Pegar apenas as 5 vendas mais recentes e enriquecer com dados de cliente e produto
      const vendasEnriquecidas = vendasData.slice(0, 5).map((venda) => {
        const cliente = clientes.find((c) => c.id === venda.clienteId);
        const produto = produtos.find((p) => p.id === venda.produtoId);
        return {
          ...venda,
          clienteNome: cliente?.nome || "Cliente não encontrado",
          produtoNome: produto?.nome || "Produto não encontrado",
        };
      });

      setVendas(vendasEnriquecidas);
    } catch (error) {
      console.error("Erro ao carregar vendas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold">Vendas Recentes</h3>
          <p className="text-sm text-muted-foreground">Últimas transações registradas no sistema</p>
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }
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
          {vendas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Nenhuma venda registrada
              </TableCell>
            </TableRow>
          ) : (
            vendas.map((venda) => {
              const status = statusConfig[venda.status as keyof typeof statusConfig];
              const dataVenda = venda.createdAt?.toDate?.() || new Date(venda.createdAt);
              return (
                <TableRow key={venda.id} className="cursor-pointer">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                          {venda.clienteNome?.split(" ").map((n) => n[0]).join("") || "??"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{venda.clienteNome}</p>
                        <p className="text-xs text-muted-foreground">{venda.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{venda.produtoNome}</TableCell>
                  <TableCell className="font-medium">
                    R$ {venda.valorContrato.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-success font-medium">
                    R$ {venda.comissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant} className={status.className}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {format(dataVenda, "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
