import { useState, useEffect } from "react";
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
import { getFornecedores, deleteFornecedor, type Fornecedor } from "@/lib/firestore";
import { toast } from "sonner";

interface FornecedorDisplay {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  telefone: string;
  email: string;
  status: "ativo" | "inativo";
}

const columns = [
  {
    key: "nomeFantasia",
    header: "Fornecedor",
    render: (fornecedor: FornecedorDisplay) => (
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
    render: (fornecedor: FornecedorDisplay) => (
      <div>
        <p className="text-sm">{fornecedor.email}</p>
        <p className="text-xs text-muted-foreground">{fornecedor.telefone}</p>
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (fornecedor: FornecedorDisplay) => (
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
  const [fornecedores, setFornecedores] = useState<FornecedorDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFornecedor, setSelectedFornecedor] = useState<Fornecedor | null>(null);

  useEffect(() => {
    loadFornecedores();
  }, []);

  const loadFornecedores = async () => {
    try {
      setLoading(true);
      const data = await getFornecedores();
      const displayData: FornecedorDisplay[] = data.map(f => ({
        id: f.id,
        razaoSocial: f.razaoSocial,
        nomeFantasia: f.nomeFantasia,
        cnpj: f.cnpj,
        telefone: f.telefone,
        email: f.email,
        status: f.status as "ativo" | "inativo"
      }));
      setFornecedores(displayData);
    } catch (error) {
      console.error("Erro ao carregar fornecedores:", error);
      toast.error("Erro ao carregar fornecedores");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (fornecedor: FornecedorDisplay) => {
    const fullData: Fornecedor = {
      id: fornecedor.id,
      razaoSocial: fornecedor.razaoSocial,
      nomeFantasia: fornecedor.nomeFantasia,
      cnpj: fornecedor.cnpj,
      telefone: fornecedor.telefone,
      email: fornecedor.email,
      status: fornecedor.status
    };
    setSelectedFornecedor(fullData);
    setIsFormOpen(true);
  };

  const handleDelete = async (fornecedor: FornecedorDisplay) => {
    if (confirm(`Deseja realmente excluir o fornecedor ${fornecedor.nomeFantasia}?`)) {
      try {
        await deleteFornecedor(fornecedor.id);
        toast.success("Fornecedor excluído com sucesso!");
        loadFornecedores();
      } catch (error) {
        console.error("Erro ao excluir fornecedor:", error);
        toast.error("Erro ao excluir fornecedor");
      }
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedFornecedor(null);
    loadFornecedores();
  };

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
        data={fornecedores}
        searchPlaceholder="Buscar por nome ou CNPJ..."
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) setSelectedFornecedor(null);
      }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedFornecedor ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
          </DialogHeader>
          <FornecedorForm 
            initialData={selectedFornecedor || undefined}
            onSuccess={handleFormSuccess} 
          />
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
