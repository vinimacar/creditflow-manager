import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClienteForm } from "@/components/forms/ClienteForm";
import { ImportDialog } from "@/components/ui/ImportDialog";
import { getClientes, deleteCliente, type Cliente } from "@/lib/firestore";
import { toast } from "sonner";

interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  cidade: string;
  estado: string;
  dataNascimento: string;
  status: "ativo" | "inativo";
}

interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  cidade: string;
  estado: string;
  dataNascimento: string;
  status: string;
}

const columns = [
  {
    key: "nome",
    header: "Cliente",
    render: (cliente: Cliente) => (
      <div className="flex items-center gap-3">
        <Avatar className="w-9 h-9">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {cliente.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-sm">{cliente.nome}</p>
          <p className="text-xs text-muted-foreground">{cliente.cpf}</p>
        </div>
      </div>
    ),
  },
  {
    key: "email",
    header: "Contato",
    render: (cliente: Cliente) => (
      <div>
        <p className="text-sm">{cliente.email}</p>
        <p className="text-xs text-muted-foreground">{cliente.telefone}</p>
      </div>
    ),
  },
  {
    key: "cidade",
    header: "Localização",
    render: (cliente: Cliente) => (
      <span className="text-sm">
        {cliente.cidade}, {cliente.estado}
      </span>
    ),
  },
  {
    key: "dataNascimento",
    header: "Data de Nasc.",
  },
  {
    key: "status",
    header: "Status",
    render: (cliente: Cliente) => (
      <Badge
        variant={cliente.status === "ativo" ? "default" : "secondary"}
        className={cliente.status === "ativo" ? "bg-success hover:bg-success/90" : ""}
      >
        {cliente.status === "ativo" ? "Ativo" : "Inativo"}
      </Badge>
    ),
  },
];

const clienteTemplateColumns = [
  "Nome", "CPF", "Email", "Telefone", "Endereço", "Cidade", "Estado", "CEP", "Data Nascimento", "Senha INSS"
];

export default function Clientes() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const data = await getClientes();
      setClientes(data);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast.error("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setIsFormOpen(true);
  };

  const handleDelete = async (cliente: Cliente) => {
    if (confirm(`Deseja realmente excluir o cliente ${cliente.nome}?`)) {
      try {
        await deleteCliente(cliente.id);
        toast.success("Cliente excluído com sucesso!");
        loadClientes();
      } catch (error) {
        console.error("Erro ao excluir cliente:", error);
        toast.error("Erro ao excluir cliente");
      }
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedCliente(null);
    loadClientes();
  };

  const handleImport = (data: Record<string, string>[]) => {
    console.log("Dados importados:", data);
    // Aqui você processaria os dados importados
  };

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Gerencie os clientes cadastrados no sistema"
        action={{
          label: "Novo Cliente",
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
        data={clientes}
        searchPlaceholder="Buscar por nome, CPF ou email..."
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={(cliente) => console.log("View", cliente)}
      />

      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) setSelectedCliente(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCliente ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <ClienteForm 
            initialData={selectedCliente || undefined} 
            onSuccess={handleFormSuccess} 
          />
        </DialogContent>
      </Dialog>

      <ImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        title="Clientes"
        description="Importe sua base de clientes a partir de um arquivo CSV"
        templateColumns={clienteTemplateColumns}
        onImport={handleImport}
      />
    </div>
  );
}
