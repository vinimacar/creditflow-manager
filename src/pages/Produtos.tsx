import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProdutoForm } from "@/components/forms/ProdutoForm";
import { ImportDialog } from "@/components/ui/ImportDialog";

interface Produto {
  id: string;
  nome: string;
  codigo: string;
  descricao: string;
  prazoMin: number;
  prazoMax: number;
  tipoTabela: string;
  comissao: number;
  status: "ativo" | "inativo";
}

const mockProdutos: Produto[] = [
  {
    id: "1",
    nome: "Empréstimo Consignado INSS",
    codigo: "CONS-INSS-001",
    descricao: "Empréstimo consignado para beneficiários do INSS",
    prazoMin: 12,
    prazoMax: 84,
    tipoTabela: "Tabela Price",
    comissao: 3.0,
    status: "ativo",
  },
  {
    id: "2",
    nome: "Refinanciamento",
    codigo: "REFIN-001",
    descricao: "Refinanciamento de contratos existentes",
    prazoMin: 12,
    prazoMax: 96,
    tipoTabela: "Tabela Price",
    comissao: 2.5,
    status: "ativo",
  },
  {
    id: "3",
    nome: "Portabilidade",
    codigo: "PORT-001",
    descricao: "Portabilidade de crédito de outras instituições",
    prazoMin: 12,
    prazoMax: 84,
    tipoTabela: "Tabela Price",
    comissao: 2.8,
    status: "ativo",
  },
  {
    id: "4",
    nome: "Cartão Consignado",
    codigo: "CARD-001",
    descricao: "Cartão de crédito com desconto em folha",
    prazoMin: 1,
    prazoMax: 12,
    tipoTabela: "Rotativo",
    comissao: 1.5,
    status: "ativo",
  },
  {
    id: "5",
    nome: "Consignado Servidor Público",
    codigo: "CONS-SP-001",
    descricao: "Empréstimo para servidores públicos",
    prazoMin: 12,
    prazoMax: 96,
    tipoTabela: "Tabela Price",
    comissao: 3.2,
    status: "inativo",
  },
];

const columns = [
  {
    key: "nome",
    header: "Produto",
    render: (produto: Produto) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Package className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-sm">{produto.nome}</p>
          <p className="text-xs text-muted-foreground">{produto.codigo}</p>
        </div>
      </div>
    ),
  },
  {
    key: "prazo",
    header: "Prazo",
    render: (produto: Produto) => (
      <span className="text-sm">{produto.prazoMin} - {produto.prazoMax} meses</span>
    ),
  },
  {
    key: "tipoTabela",
    header: "Tipo de Tabela",
  },
  {
    key: "comissao",
    header: "Comissão",
    render: (produto: Produto) => (
      <span className="font-medium text-success">{produto.comissao}%</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (produto: Produto) => (
      <Badge
        variant={produto.status === "ativo" ? "default" : "secondary"}
        className={produto.status === "ativo" ? "bg-success hover:bg-success/90" : ""}
      >
        {produto.status === "ativo" ? "Ativo" : "Inativo"}
      </Badge>
    ),
  },
];

const produtoTemplateColumns = [
  "Nome", "Código", "Descrição", "Prazo Mínimo", "Prazo Máximo", "Tipo Tabela", "Comissão %"
];

export default function Produtos() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleImport = (data: Record<string, string>[]) => {
    console.log("Produtos importados:", data);
  };

  return (
    <div>
      <PageHeader
        title="Produtos"
        description="Catálogo de produtos de crédito consignado"
        action={{
          label: "Novo Produto",
          onClick: () => setIsFormOpen(true),
        }}
      >
        <Button variant="outline" className="gap-2" onClick={() => setIsImportOpen(true)}>
          <Upload className="w-4 h-4" />
          Importar
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={mockProdutos}
        searchPlaceholder="Buscar por nome ou código..."
        onEdit={(produto) => console.log("Edit", produto)}
        onDelete={(produto) => console.log("Delete", produto)}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Novo Produto</DialogTitle>
          </DialogHeader>
          <ProdutoForm onSuccess={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>

      <ImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        title="Produtos"
        description="Importe seu catálogo de produtos a partir de um arquivo CSV"
        templateColumns={produtoTemplateColumns}
        onImport={handleImport}
      />
    </div>
  );
}
