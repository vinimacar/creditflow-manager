import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FornecedorForm } from "@/components/forms/FornecedorForm";
import { ImportDialog } from "@/components/ui/ImportDialog";

interface Fornecedor {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  telefone: string;
  email: string;
  status: "ativo" | "inativo";
}

const mockFornecedores: Fornecedor[] = [
  {
    id: "1",
    razaoSocial: "Banco BMG S.A.",
    nomeFantasia: "BMG",
    cnpj: "61.186.680/0001-74",
    telefone: "(11) 3003-1234",
    email: "parceiros@bmg.com.br",
    status: "ativo",
  },
  {
    id: "2",
    razaoSocial: "Banco Pan S.A.",
    nomeFantasia: "Banco Pan",
    cnpj: "59.285.411/0001-13",
    telefone: "(11) 3003-5678",
    email: "correspondente@bancopan.com.br",
    status: "ativo",
  },
  {
    id: "3",
    razaoSocial: "Banco Bradesco S.A.",
    nomeFantasia: "Bradesco",
    cnpj: "60.746.948/0001-12",
    telefone: "(11) 4002-0022",
    email: "correspondentes@bradesco.com.br",
    status: "ativo",
  },
  {
    id: "4",
    razaoSocial: "Banco Itaú Consignado S.A.",
    nomeFantasia: "Itaú Consignado",
    cnpj: "33.885.724/0001-19",
    telefone: "(11) 4004-4828",
    email: "consignado@itau.com.br",
    status: "inativo",
  },
];

const columns = [
  {
    key: "nomeFantasia",
    header: "Fornecedor",
    render: (fornecedor: Fornecedor) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-accent" />
        </div>
        <div>
          <p className="font-medium text-sm">{fornecedor.nomeFantasia}</p>
          <p className="text-xs text-muted-foreground">{fornecedor.razaoSocial}</p>
        </div>
      </div>
    ),
  },
  {
    key: "cnpj",
    header: "CNPJ",
  },
  {
    key: "email",
    header: "Contato",
    render: (fornecedor: Fornecedor) => (
      <div>
        <p className="text-sm">{fornecedor.email}</p>
        <p className="text-xs text-muted-foreground">{fornecedor.telefone}</p>
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (fornecedor: Fornecedor) => (
      <Badge
        variant={fornecedor.status === "ativo" ? "default" : "secondary"}
        className={fornecedor.status === "ativo" ? "bg-success hover:bg-success/90" : ""}
      >
        {fornecedor.status === "ativo" ? "Ativo" : "Inativo"}
      </Badge>
    ),
  },
];

const fornecedorTemplateColumns = [
  "Razão Social", "Nome Fantasia", "CNPJ", "Telefone", "Email"
];

export default function Fornecedores() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleImport = (data: Record<string, string>[]) => {
    console.log("Fornecedores importados:", data);
  };

  return (
    <div>
      <PageHeader
        title="Fornecedores / Parceiros"
        description="Bancos e instituições financeiras parceiras"
        action={{
          label: "Novo Fornecedor",
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
        data={mockFornecedores}
        searchPlaceholder="Buscar por nome ou CNPJ..."
        onEdit={(fornecedor) => console.log("Edit", fornecedor)}
        onDelete={(fornecedor) => console.log("Delete", fornecedor)}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Novo Fornecedor</DialogTitle>
          </DialogHeader>
          <FornecedorForm onSuccess={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>

      <ImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        title="Fornecedores"
        description="Importe seus fornecedores e parceiros bancários a partir de um arquivo CSV"
        templateColumns={fornecedorTemplateColumns}
        onImport={handleImport}
      />
    </div>
  );
}
