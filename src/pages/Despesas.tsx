import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Plus, Trash2, Edit, Receipt, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { getDespesas, addDespesa, updateDespesa, deleteDespesa, type Despesa } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const categoriasDespesa = [
  "Aluguel",
  "Água",
  "Energia",
  "Telefone",
  "Internet",
  "Salários",
  "Impostos",
  "Material de Escritório",
  "Marketing",
  "Manutenção",
  "Combustível",
  "Alimentação",
  "Transporte",
  "Seguros",
  "Consultoria",
  "Software/Licenças",
  "Limpeza",
  "Segurança",
  "Outros",
];

const statusPagamento = ["Pago", "Pendente", "Atrasado"] as const;

export default function Despesas() {
  const { hasPermission } = useAuth();
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Despesa | null>(null);
  const [despesaParaDeletar, setDespesaParaDeletar] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    descricao: "",
    categoria: "",
    valor: "",
    dataVencimento: new Date(),
    dataPagamento: undefined as Date | undefined,
    status: "Pendente" as typeof statusPagamento[number],
    observacoes: "",
  });

  useEffect(() => {
    carregarDespesas();
  }, []);

  const carregarDespesas = async () => {
    try {
      setLoading(true);
      const dados = await getDespesas();
      setDespesas(dados);
    } catch (error) {
      console.error("Erro ao carregar despesas:", error);
      toast.error("Erro ao carregar despesas");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      descricao: "",
      categoria: "",
      valor: "",
      dataVencimento: new Date(),
      dataPagamento: undefined,
      status: "Pendente",
      observacoes: "",
    });
    setEditando(null);
  };

  const handleOpenDialog = (despesa?: Despesa) => {
    if (despesa) {
      setEditando(despesa);
      setFormData({
        descricao: despesa.descricao,
        categoria: despesa.categoria,
        valor: despesa.valor.toString(),
        dataVencimento: new Date(despesa.dataVencimento),
        dataPagamento: despesa.dataPagamento ? new Date(despesa.dataPagamento) : undefined,
        status: despesa.status,
        observacoes: despesa.observacoes || "",
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.descricao || !formData.categoria || !formData.valor) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const despesaData = {
        descricao: formData.descricao,
        categoria: formData.categoria,
        valor: parseFloat(formData.valor),
        dataVencimento: formData.dataVencimento.toISOString(),
        dataPagamento: formData.dataPagamento?.toISOString(),
        status: formData.status,
        observacoes: formData.observacoes,
      };

      if (editando) {
        await updateDespesa(editando.id!, despesaData);
        toast.success("Despesa atualizada com sucesso!");
      } else {
        await addDespesa(despesaData);
        toast.success("Despesa cadastrada com sucesso!");
      }

      handleCloseDialog();
      await carregarDespesas();
    } catch (error) {
      console.error("Erro ao salvar despesa:", error);
      toast.error("Erro ao salvar despesa");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDespesa(id);
      toast.success("Despesa excluída com sucesso!");
      setDespesaParaDeletar(null);
      await carregarDespesas();
    } catch (error) {
      console.error("Erro ao excluir despesa:", error);
      toast.error("Erro ao excluir despesa");
    }
  };

  const totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0);
  const totalPago = despesas.filter(d => d.status === "Pago").reduce((sum, d) => sum + d.valor, 0);
  const totalPendente = despesas.filter(d => d.status === "Pendente").reduce((sum, d) => sum + d.valor, 0);
  const totalAtrasado = despesas.filter(d => d.status === "Atrasado").reduce((sum, d) => sum + d.valor, 0);

  const getStatusBadge = (status: typeof statusPagamento[number]) => {
    const variants: Record<typeof statusPagamento[number], "default" | "secondary" | "destructive"> = {
      Pago: "default",
      Pendente: "secondary",
      Atrasado: "destructive",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (!hasPermission(["admin", "gerente"])) {
    return (
      <div className="space-y-6">
        <PageHeader title="Despesas" description="Acesso restrito" />
        <Card className="p-6">
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Despesas"
        description="Controle e organize todas as despesas da empresa"
      />

      {/* Cartões de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Despesas</p>
              <h3 className="text-2xl font-bold mt-2">
                R$ {totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <Receipt className="w-8 h-8 text-red-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pagas</p>
              <h3 className="text-2xl font-bold mt-2 text-green-600">
                R$ {totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <TrendingDown className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
              <h3 className="text-2xl font-bold mt-2 text-yellow-600">
                R$ {totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <Receipt className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Atrasadas</p>
              <h3 className="text-2xl font-bold mt-2 text-red-600">
                R$ {totalAtrasado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <Receipt className="w-8 h-8 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Tabela de Despesas */}
      <Card>
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Despesas Cadastradas</h3>
            <p className="text-sm text-muted-foreground">
              {despesas.length} {despesas.length === 1 ? "despesa" : "despesas"} cadastradas
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                Nova Despesa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editando ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
                <DialogDescription>
                  {editando ? "Atualize os dados da despesa" : "Preencha os dados da nova despesa"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="descricao">Descrição *</Label>
                    <Input
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Ex: Aluguel do escritório"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria *</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriasDespesa.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor *</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor}
                      onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Vencimento *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.dataVencimento && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.dataVencimento ? (
                            format(formData.dataVencimento, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione...</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.dataVencimento}
                          onSelect={(date) => date && setFormData({ ...formData, dataVencimento: date })}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Pagamento</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.dataPagamento && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.dataPagamento ? (
                            format(formData.dataPagamento, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione...</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.dataPagamento}
                          onSelect={(date) => setFormData({ ...formData, dataPagamento: date })}
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: typeof statusPagamento[number]) => setFormData({ ...formData, status: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusPagamento.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Input
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      placeholder="Informações adicionais..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editando ? "Atualizar" : "Cadastrar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Carregando despesas...
                  </TableCell>
                </TableRow>
              ) : despesas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma despesa cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                despesas.map((despesa) => (
                  <TableRow key={despesa.id}>
                    <TableCell className="font-medium">{despesa.descricao}</TableCell>
                    <TableCell>{despesa.categoria}</TableCell>
                    <TableCell>R$ {despesa.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      {format(new Date(despesa.dataVencimento), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {despesa.dataPagamento
                        ? format(new Date(despesa.dataPagamento), "dd/MM/yyyy", { locale: ptBR })
                        : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(despesa.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(despesa)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDespesaParaDeletar(despesa.id!)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!despesaParaDeletar} onOpenChange={() => setDespesaParaDeletar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => despesaParaDeletar && handleDelete(despesaParaDeletar)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
