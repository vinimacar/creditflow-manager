import { useState, useEffect } from "react";
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
import { getFuncionarios, deleteFuncionario, type Funcionario } from "@/lib/firestore";
import { toast } from "sonner";

interface FuncionarioDisplay {
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
    render: (funcionario: FuncionarioDisplay) => (
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
    render: (funcionario: FuncionarioDisplay) => (
      <Badge className={funcaoColors[funcionario.funcao] || "bg-secondary"}>
        {funcionario.funcao}
      </Badge>
    ),
  },
  {
    key: "email",
    header: "Contato",
    render: (funcionario: FuncionarioDisplay) => (
      <div>
        <p className="text-sm">{funcionario.email}</p>
        <p className="text-xs text-muted-foreground">{funcionario.telefone}</p>
      </div>
    ),
  },
  {
    key: "cidade",
    header: "Localização",
    render: (funcionario: FuncionarioDisplay) => (
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
    render: (funcionario: FuncionarioDisplay) => (
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
  const [funcionarios, setFuncionarios] = useState<FuncionarioDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFuncionario, setSelectedFuncionario] = useState<Funcionario | null>(null);

  useEffect(() => {
    loadFuncionarios();
  }, []);

  const loadFuncionarios = async () => {
    try {
      setLoading(true);
      const data = await getFuncionarios();
      const displayData: FuncionarioDisplay[] = data.map(f => ({
        id: f.id,
        nome: f.nome,
        cpf: f.cpf,
        email: f.email,
        telefone: f.telefone,
        cidade: f.cidade,
        uf: f.uf,
        funcao: f.funcao,
        dataAdmissao: f.dataAdmissao,
        status: f.status as "ativo" | "inativo"
      }));
      setFuncionarios(displayData);
    } catch (error) {
      console.error("Erro ao carregar funcionários:", error);
      toast.error("Erro ao carregar funcionários");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (funcionario: FuncionarioDisplay) => {
    const fullData: Funcionario = {
      id: funcionario.id,
      nome: funcionario.nome,
      cpf: funcionario.cpf,
      email: funcionario.email,
      telefone: funcionario.telefone,
      endereco: "",
      cidade: funcionario.cidade,
      uf: funcionario.uf,
      cep: "",
      funcao: funcionario.funcao,
      dataAdmissao: funcionario.dataAdmissao,
      status: funcionario.status
    };
    setSelectedFuncionario(fullData);
    setIsFormOpen(true);
  };

  const handleDelete = async (funcionario: FuncionarioDisplay) => {
    if (confirm(`Deseja realmente excluir o funcionário ${funcionario.nome}?`)) {
      try {
        await deleteFuncionario(funcionario.id);
        toast.success("Funcionário excluído com sucesso!");
        loadFuncionarios();
      } catch (error) {
        console.error("Erro ao excluir funcionário:", error);
        toast.error("Erro ao excluir funcionário");
      }
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedFuncionario(null);
    loadFuncionarios();
  };

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
        data={funcionarios}
        searchPlaceholder="Buscar por nome, CPF ou função..."
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) setSelectedFuncionario(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedFuncionario ? "Editar Funcionário" : "Novo Funcionário"}</DialogTitle>
          </DialogHeader>
          <FuncionarioForm 
            initialData={selectedFuncionario || undefined}
            onSuccess={handleFormSuccess} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
