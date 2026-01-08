import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FuncionarioForm } from "@/components/forms/FuncionarioForm";

interface Funcionario {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  cidade: string;
  uf: string;
  funcao: string;
  dataAdmissao: string;
  status: "ativo" | "inativo";
}

const mockFuncionarios: Funcionario[] = [
  {
    id: "1",
    nome: "Carlos Mendes Silva",
    cpf: "123.456.789-00",
    email: "carlos.mendes@empresa.com",
    telefone: "(11) 99999-1111",
    cidade: "São Paulo",
    uf: "SP",
    funcao: "Agente",
    dataAdmissao: "15/03/2023",
    status: "ativo",
  },
  {
    id: "2",
    nome: "Fernanda Lima Costa",
    cpf: "987.654.321-00",
    email: "fernanda.lima@empresa.com",
    telefone: "(11) 99999-2222",
    cidade: "São Paulo",
    uf: "SP",
    funcao: "Gerente",
    dataAdmissao: "10/01/2022",
    status: "ativo",
  },
  {
    id: "3",
    nome: "Ricardo Alves Santos",
    cpf: "456.789.123-00",
    email: "ricardo.alves@empresa.com",
    telefone: "(21) 99999-3333",
    cidade: "Rio de Janeiro",
    uf: "RJ",
    funcao: "Agente",
    dataAdmissao: "20/06/2023",
    status: "ativo",
  },
  {
    id: "4",
    nome: "Juliana Costa Oliveira",
    cpf: "321.654.987-00",
    email: "juliana.costa@empresa.com",
    telefone: "(11) 99999-4444",
    cidade: "São Paulo",
    uf: "SP",
    funcao: "Atendente",
    dataAdmissao: "05/09/2024",
    status: "ativo",
  },
  {
    id: "5",
    nome: "Pedro Henrique Souza",
    cpf: "654.321.987-00",
    email: "pedro.souza@empresa.com",
    telefone: "(31) 99999-5555",
    cidade: "Belo Horizonte",
    uf: "MG",
    funcao: "Agente",
    dataAdmissao: "12/04/2023",
    status: "inativo",
  },
];

const funcaoColors: Record<string, string> = {
  Agente: "bg-primary hover:bg-primary/90",
  Gerente: "bg-accent hover:bg-accent/90",
  Atendente: "bg-warning hover:bg-warning/90 text-warning-foreground",
  Diretor: "bg-success hover:bg-success/90",
};

const columns = [
  {
    key: "nome",
    header: "Funcionário",
    render: (funcionario: Funcionario) => (
      <div className="flex items-center gap-3">
        <Avatar className="w-9 h-9">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {funcionario.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-sm">{funcionario.nome}</p>
          <p className="text-xs text-muted-foreground">{funcionario.cpf}</p>
        </div>
      </div>
    ),
  },
  {
    key: "funcao",
    header: "Função",
    render: (funcionario: Funcionario) => (
      <Badge className={funcaoColors[funcionario.funcao] || "bg-secondary"}>
        {funcionario.funcao}
      </Badge>
    ),
  },
  {
    key: "email",
    header: "Contato",
    render: (funcionario: Funcionario) => (
      <div>
        <p className="text-sm">{funcionario.email}</p>
        <p className="text-xs text-muted-foreground">{funcionario.telefone}</p>
      </div>
    ),
  },
  {
    key: "cidade",
    header: "Localização",
    render: (funcionario: Funcionario) => (
      <span className="text-sm">{funcionario.cidade}, {funcionario.uf}</span>
    ),
  },
  {
    key: "dataAdmissao",
    header: "Admissão",
  },
  {
    key: "status",
    header: "Status",
    render: (funcionario: Funcionario) => (
      <Badge
        variant={funcionario.status === "ativo" ? "default" : "secondary"}
        className={funcionario.status === "ativo" ? "bg-success hover:bg-success/90" : ""}
      >
        {funcionario.status === "ativo" ? "Ativo" : "Inativo"}
      </Badge>
    ),
  },
];

export default function Funcionarios() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Funcionários / Agentes"
        description="Gerencie a equipe de colaboradores"
        action={{
          label: "Novo Funcionário",
          onClick: () => setIsFormOpen(true),
        }}
      />

      <DataTable
        columns={columns}
        data={mockFuncionarios}
        searchPlaceholder="Buscar por nome, CPF ou função..."
        onEdit={(funcionario) => console.log("Edit", funcionario)}
        onDelete={(funcionario) => console.log("Delete", funcionario)}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Funcionário</DialogTitle>
          </DialogHeader>
          <FuncionarioForm onSuccess={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
