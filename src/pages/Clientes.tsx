import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Upload, History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ClienteForm } from "@/components/forms/ClienteForm";
import { ImportDialog } from "@/components/ui/ImportDialog";
import { getClientes, deleteCliente, getVendasPorCliente, getProdutos, getFuncionarios, type Cliente, type Venda, type Produto, type Funcionario } from "@/lib/firestore";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [historico, setHistorico] = useState<Venda[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  useEffect(() => {
    loadClientes();
    loadProdutosEFuncionarios();
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

  const loadProdutosEFuncionarios = async () => {
    try {
      const [produtosData, funcionariosData] = await Promise.all([
        getProdutos(),
        getFuncionarios()
      ]);
      setProdutos(produtosData);
      setFuncionarios(funcionariosData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const handleViewHistorico = async (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setLoadingHistorico(true);
    setIsHistoricoOpen(true);
    
    try {
      const vendas = await getVendasPorCliente(cliente.id!);
      setHistorico(vendas);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      toast.error("Erro ao carregar histórico do cliente");
    } finally {
      setLoadingHistorico(false);
    }
  };

  const getNomeProduto = (produtoId: string) => {
    const produto = produtos.find(p => p.id === produtoId);
    return produto?.nome || "Produto não encontrado";
  };

  const getNomeFuncionario = (funcionarioId: string) => {
    const funcionario = funcionarios.find(f => f.id === funcionarioId);
    return funcionario?.nome || "Funcionário não encontrado";
  };

  const formatarData = (data: any) => {
    if (!data) return "-";
    try {
      const timestamp = data.seconds ? new Date(data.seconds * 1000) : new Date(data);
      return timestamp.toLocaleDateString("pt-BR");
    } catch {
      return "-";
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(valor);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "aprovada": return "default";
      case "pendente": return "secondary";
      case "em_analise": return "outline";
      case "recusada": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "aprovada": return "Aprovada";
      case "pendente": return "Pendente";
      case "em_analise": return "Em Análise";
      case "recusada": return "Recusada";
      default: return status;
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
        onView={handleViewHistorico}
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

      <Dialog open={isHistoricoOpen} onOpenChange={(open) => {
        setIsHistoricoOpen(open);
        if (!open) {
          setSelectedCliente(null);
          setHistorico([]);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Histórico de Vendas
            </DialogTitle>
            <DialogDescription>
              {selectedCliente && (
                <div className="mt-2">
                  <p className="font-semibold text-foreground">{selectedCliente.nome}</p>
                  <p className="text-sm">CPF: {selectedCliente.cpf}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {loadingHistorico ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando histórico...
              </div>
            ) : historico.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma venda encontrada para este cliente.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{historico.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {formatarMoeda(historico.reduce((acc, v) => acc + (v.valorContrato || 0), 0))}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div className="space-y-3">
                  {historico.map((venda) => (
                    <Card key={venda.id}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Produto</p>
                            <p className="font-semibold">{getNomeProduto(venda.produtoId)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Vendedor</p>
                            <p className="font-semibold">{getNomeFuncionario(venda.funcionarioId)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Valor do Contrato</p>
                            <p className="font-semibold text-lg">{formatarMoeda(venda.valorContrato)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Prazo</p>
                            <p className="font-semibold">{venda.prazo} meses</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Comissão</p>
                            <p className="font-semibold">
                              {formatarMoeda(venda.comissao)} ({venda.comissaoPercentual}%)
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Data da Venda</p>
                            <p className="font-semibold">{formatarData(venda.createdAt)}</p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-sm text-muted-foreground mb-1">Status</p>
                            <Badge variant={getStatusBadgeVariant(venda.status)}>
                              {getStatusLabel(venda.status)}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
