import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCcw,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface Conciliacao {
  id: string;
  contratoInterno: string;
  contratoBanco: string;
  cliente: string;
  valorInterno: number;
  valorBanco: number;
  status: "ok" | "divergente" | "nao_encontrado";
  divergencia?: string;
}

const mockConciliacao: Conciliacao[] = [
  {
    id: "1",
    contratoInterno: "VND-001234",
    contratoBanco: "BMG-001234",
    cliente: "Maria Silva Santos",
    valorInterno: 15000,
    valorBanco: 15000,
    status: "ok",
  },
  {
    id: "2",
    contratoInterno: "VND-001235",
    contratoBanco: "BMG-001235",
    cliente: "João Pedro Oliveira",
    valorInterno: 8500,
    valorBanco: 8200,
    status: "divergente",
    divergencia: "Diferença de R$ 300,00",
  },
  {
    id: "3",
    contratoInterno: "VND-001236",
    contratoBanco: "PAN-001236",
    cliente: "Ana Costa Ferreira",
    valorInterno: 22000,
    valorBanco: 22000,
    status: "ok",
  },
  {
    id: "4",
    contratoInterno: "VND-001237",
    contratoBanco: "-",
    cliente: "Carlos Alberto Lima",
    valorInterno: 12000,
    valorBanco: 0,
    status: "nao_encontrado",
    divergencia: "Contrato não encontrado no extrato do banco",
  },
  {
    id: "5",
    contratoInterno: "VND-001238",
    contratoBanco: "BRAD-001238",
    cliente: "Lucia Ferreira Costa",
    valorInterno: 18500,
    valorBanco: 18500,
    status: "ok",
  },
];

const statusConfig = {
  ok: {
    label: "Conciliado",
    icon: CheckCircle2,
    className: "bg-success hover:bg-success/90",
  },
  divergente: {
    label: "Divergente",
    icon: AlertTriangle,
    className: "bg-warning hover:bg-warning/90 text-warning-foreground",
  },
  nao_encontrado: {
    label: "Não Encontrado",
    icon: XCircle,
    className: "bg-destructive hover:bg-destructive/90",
  },
};

export default function Conciliacao() {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      toast.success("Arquivo importado com sucesso! Conciliação realizada.");
    }, 2000);
  };

  const totais = {
    ok: mockConciliacao.filter((c) => c.status === "ok").length,
    divergente: mockConciliacao.filter((c) => c.status === "divergente").length,
    naoEncontrado: mockConciliacao.filter((c) => c.status === "nao_encontrado").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conciliação"
        description="Compare as vendas com os relatórios dos bancos"
      />

      {/* Upload Section */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Importar Extrato Bancário</h3>
              <p className="text-sm text-muted-foreground">
                Faça upload do arquivo CSV ou XLSX do banco parceiro
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Modelo CSV
            </Button>
            <Button className="gap-2" onClick={handleUpload} disabled={isUploading}>
              <Upload className="w-4 h-4" />
              {isUploading ? "Processando..." : "Importar Arquivo"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-success/10">
            <CheckCircle2 className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totais.ok}</p>
            <p className="text-sm text-muted-foreground">Conciliados</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-warning/10">
            <AlertTriangle className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totais.divergente}</p>
            <p className="text-sm text-muted-foreground">Divergentes</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-destructive/10">
            <XCircle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totais.naoEncontrado}</p>
            <p className="text-sm text-muted-foreground">Não Encontrados</p>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Resultado da Conciliação</h3>
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCcw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Contrato Interno</TableHead>
              <TableHead>Contrato Banco</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Valor Interno</TableHead>
              <TableHead className="text-right">Valor Banco</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Observação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockConciliacao.map((item) => {
              const config = statusConfig[item.status];
              const StatusIcon = config.icon;
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.contratoInterno}</TableCell>
                  <TableCell className="text-muted-foreground">{item.contratoBanco}</TableCell>
                  <TableCell>{item.cliente}</TableCell>
                  <TableCell className="text-right font-medium">
                    R$ {item.valorInterno.toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {item.valorBanco > 0
                      ? `R$ ${item.valorBanco.toLocaleString("pt-BR")}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge className={config.className}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {item.divergencia || "-"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
