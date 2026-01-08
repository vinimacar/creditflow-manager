import { useState } from "react";
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

const mockClientes: Cliente[] = [
  {
    id: "1",
    nome: "Maria Silva Santos",
    cpf: "123.456.789-00",
    email: "maria.silva@email.com",
    telefone: "(11) 99999-1234",
    cidade: "São Paulo",
    estado: "SP",
    dataNascimento: "15/03/1965",
    status: "ativo",
  },
  {
    id: "2",
    nome: "João Pedro Oliveira",
    cpf: "987.654.321-00",
    email: "joao.oliveira@email.com",
    telefone: "(21) 98888-5678",
    cidade: "Rio de Janeiro",
    estado: "RJ",
    dataNascimento: "22/07/1958",
    status: "ativo",
  },
  {
    id: "3",
    nome: "Ana Costa Ferreira",
    cpf: "456.789.123-00",
    email: "ana.costa@email.com",
    telefone: "(31) 97777-9012",
    cidade: "Belo Horizonte",
    estado: "MG",
    dataNascimento: "10/11/1972",
    status: "ativo",
  },
  {
    id: "4",
    nome: "Carlos Alberto Lima",
    cpf: "321.654.987-00",
    email: "carlos.lima@email.com",
    telefone: "(41) 96666-3456",
    cidade: "Curitiba",
    estado: "PR",
    dataNascimento: "05/09/1960",
    status: "inativo",
  },
];

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
        data={mockClientes}
        searchPlaceholder="Buscar por nome, CPF ou email..."
        onEdit={(cliente) => console.log("Edit", cliente)}
        onDelete={(cliente) => console.log("Delete", cliente)}
        onView={(cliente) => console.log("View", cliente)}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          <ClienteForm onSuccess={() => setIsFormOpen(false)} />
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
