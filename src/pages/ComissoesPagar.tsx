import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, CheckCircle, Clock, AlertTriangle, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { getVendas, getProdutos, getFuncionarios, getClientes } from "@/lib/firestore";
import { collection, addDoc, updateDoc, doc, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ComissaoPagar } from "@/types/financeiro";
import { calcularComissoes } from "@/lib/calculos-comissoes";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

export default function ComissoesPagar() {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [comissoes, setComissoes] = useState<(ComissaoPagar & { funcionarioNome: string; clienteNome: string; produtoNome: string })[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [comissaoSelecionada, setComissaoSelecionada] = useState<any>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    dataPagamento: new Date(),
    formaPagamento: "",
    comprovante: "",
    observacoes: "",
    integradoFolha: false,
  });

  useEffect(() => {
    carregarComissoes();
  }, []);

  const carregarComissoes = async () => {
    try {
      setLoading(true);

      const [vendas, produtos, funcionarios, clientes, comissoesSnapshot] = await Promise.all([
        getVendas(),
        getProdutos(),
        getFuncionarios(),
        getClientes(),
        getDocs(collection(db, "comissoesPagar")),
      ]);

      const comissoesExistentes = new Map(
        comissoesSnapshot.docs.map(doc => [
          doc.data().vendaId,
          { id: doc.id, ...doc.data(), dataVenda: doc.data().dataVenda?.toDate(), dataVencimento: doc.data().dataVencimento?.toDate(), dataPagamento: doc.data().dataPagamento?.toDate(), criadoEm: doc.data().criadoEm?.toDate(), atualizadoEm: doc.data().atualizadoEm?.toDate() } as ComissaoPagar
        ])
      );

      const comissoesCompletas: any[] = [];

      for (const venda of vendas) {
        if (venda.status !== "aprovada") continue;

        const produto = produtos.find(p => p.id === venda.produtoId);
        const funcionario = funcionarios.find(f => f.id === venda.funcionarioId);
        const cliente = clientes.find(c => c.id === venda.clienteId);

        if (!produto || !funcionario) continue;

        const comissoes = calcularComissoes(venda, produto);
        const dataVenda = venda.createdAt?.toDate?.() || new Date(venda.createdAt);

        let comissao = comissoesExistentes.get(venda.id!);

        if (!comissao) {
          const novaComissao: ComissaoPagar = {
            vendaId: venda.id!,
            funcionarioId: venda.funcionarioId,
            produtoId: produto.id!,
            valorComissao: comissoes.comissaoAgente,
            percentualComissao: comissoes.comissaoAgentePercentual,
            dataVenda,
            dataVencimento: new Date(dataVenda.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 dias
            status: 'pendente',
            integradoFolha: false,
            criadoEm: new Date(),
            atualizadoEm: new Date(),
          };

          const docRef = await addDoc(collection(db, "comissoesPagar"), {
            ...novaComissao,
            dataVenda: Timestamp.fromDate(novaComissao.dataVenda),
            dataVencimento: Timestamp.fromDate(novaComissao.dataVencimento),
            criadoEm: Timestamp.fromDate(novaComissao.criadoEm),
            atualizadoEm: Timestamp.fromDate(novaComissao.atualizadoEm),
          });

          comissao = { ...novaComissao, id: docRef.id };
        }

        let status = comissao.status;
        if (comissao.dataPagamento) {
          status = 'pago';
        } else if (new Date() > comissao.dataVencimento) {
          status = 'atrasado';
        }

        comissoesCompletas.push({
          ...comissao,
          status,
          funcionarioNome: funcionario.nome,
          clienteNome: cliente?.nome || "N/A",
          produtoNome: produto.nome,
        });
      }

      setComissoes(comissoesCompletas);
    } catch (error) {
      console.error("Erro ao carregar comissões a pagar:", error);
      toast.error("Erro ao carregar comissões");
    } finally {
      setLoading(false);
    }
  };

  const registrarPagamento = async () => {
    if (!comissaoSelecionada || !formData.formaPagamento) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await updateDoc(doc(db, "comissoesPagar", comissaoSelecionada.id!), {
        dataPagamento: Timestamp.fromDate(formData.dataPagamento),
        formaPagamento: formData.formaPagamento,
        comprovante: formData.comprovante || "",
        observacoes: formData.observacoes || "",
        integradoFolha: formData.integradoFolha,
        status: 'pago',
        atualizadoEm: Timestamp.fromDate(new Date()),
      });

      toast.success("Pagamento registrado com sucesso!");
      setDialogOpen(false);
      setComissaoSelecionada(null);
      resetForm();
      await carregarComissoes();
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
      toast.error("Erro ao registrar pagamento");
    }
  };

  const pagarEmLote = async () => {
    if (selecionadas.size === 0) {
      toast.error("Selecione pelo menos uma comissão");
      return;
    }

    try {
      for (const id of selecionadas) {
        await updateDoc(doc(db, "comissoesPagar", id), {
          dataPagamento: Timestamp.fromDate(new Date()),
          formaPagamento: 'folha',
          integradoFolha: true,
          status: 'pago',
          atualizadoEm: Timestamp.fromDate(new Date()),
        });
      }

      toast.success(`${selecionadas.size} comissões marcadas como pagas via folha!`);
      setSelecionadas(new Set());
      await carregarComissoes();
    } catch (error) {
      console.error("Erro ao pagar em lote:", error);
      toast.error("Erro ao processar pagamentos");
    }
  };

  const resetForm = () => {
    setFormData({
      dataPagamento: new Date(),
      formaPagamento: "",
      comprovante: "",
      observacoes: "",
      integradoFolha: false,
    });
  };

  const abrirDialogPagamento = (comissao: any) => {
    setComissaoSelecionada(comissao);
    setFormData({
      dataPagamento: comissao.dataPagamento || new Date(),
      formaPagamento: comissao.formaPagamento || "",
      comprovante: comissao.comprovante || "",
      observacoes: comissao.observacoes || "",
      integradoFolha: comissao.integradoFolha || false,
    });
    setDialogOpen(true);
  };

  const toggleSelecao = (id: string) => {
    const novas = new Set(selecionadas);
    if (novas.has(id)) {
      novas.delete(id);
    } else {
      novas.add(id);
    }
    setSelecionadas(novas);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pendente: { variant: "secondary" as const, icon: Clock, label: "Pendente" },
      pago: { variant: "default" as const, icon: CheckCircle, label: "Pago" },
      atrasado: { variant: "destructive" as const, icon: AlertTriangle, label: "Atrasado" },
    };
    const config = badges[status as keyof typeof badges] || badges.pendente;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (!hasPermission(["admin", "gerente"])) {
    return (
      <div className="space-y-6">
        <PageHeader title="Comissões a Pagar" description="Acesso restrito" />
        <Card className="p-6">
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Comissões a Pagar" description="Carregando..." />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const comissoesFiltradas = filtroStatus === "todos" ? comissoes : comissoes.filter(c => c.status === filtroStatus);
  const totalPendente = comissoes.filter(c => c.status === 'pendente').reduce((sum, c) => sum + c.valorComissao, 0);
  const totalPago = comissoes.filter(c => c.status === 'pago').reduce((sum, c) => sum + c.valorComissao, 0);
  const totalAtrasado = comissoes.filter(c => c.status === 'atrasado').reduce((sum, c) => sum + c.valorComissao, 0);
  const totalSelecionadas = Array.from(selecionadas).reduce((sum, id) => {
    const c = comissoes.find(com => com.id === id);
    return sum + (c?.valorComissao || 0);
  }, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Comissões a Pagar" description="Controle de comissões pagas aos vendedores" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-yellow-50 dark:bg-yellow-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Pendente</p>
              <h3 className="text-2xl font-bold mt-2 text-yellow-700">
                R$ {totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-yellow-700 mt-1">{comissoes.filter(c => c.status === 'pendente').length} comissões</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-6 bg-green-50 dark:bg-green-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">Pago</p>
              <h3 className="text-2xl font-bold mt-2 text-green-700">
                R$ {totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-green-700 mt-1">{comissoes.filter(c => c.status === 'pago').length} comissões</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6 bg-red-50 dark:bg-red-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-900 dark:text-red-100">Atrasado</p>
              <h3 className="text-2xl font-bold mt-2 text-red-700">
                R$ {totalAtrasado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-red-700 mt-1">{comissoes.filter(c => c.status === 'atrasado').length} comissões</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </Card>

        <Card className="p-6 bg-blue-50 dark:bg-blue-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Selecionadas</p>
              <h3 className="text-2xl font-bold mt-2 text-blue-700">
                R$ {totalSelecionadas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-blue-700 mt-1">{selecionadas.size} selecionadas</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Label>Filtrar:</Label>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {selecionadas.size > 0 && (
            <Button onClick={pagarEmLote}>
              Pagar {selecionadas.size} Selecionadas via Folha
            </Button>
          )}
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selecionadas.size === comissoesFiltradas.filter(c => c.status === 'pendente').length && comissoesFiltradas.filter(c => c.status === 'pendente').length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelecionadas(new Set(comissoesFiltradas.filter(c => c.status === 'pendente').map(c => c.id!)));
                    } else {
                      setSelecionadas(new Set());
                    }
                  }}
                />
              </TableHead>
              <TableHead>Data Venda</TableHead>
              <TableHead>Funcionário</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comissoesFiltradas.map((comissao) => (
              <TableRow key={comissao.id}>
                <TableCell>
                  {comissao.status === 'pendente' && (
                    <Checkbox
                      checked={selecionadas.has(comissao.id!)}
                      onCheckedChange={() => toggleSelecao(comissao.id!)}
                    />
                  )}
                </TableCell>
                <TableCell>{format(comissao.dataVenda, "dd/MM/yyyy")}</TableCell>
                <TableCell>{comissao.funcionarioNome}</TableCell>
                <TableCell>{comissao.clienteNome}</TableCell>
                <TableCell>{comissao.produtoNome}</TableCell>
                <TableCell className="text-right font-semibold">
                  R$ {comissao.valorComissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>{format(comissao.dataVencimento, "dd/MM/yyyy")}</TableCell>
                <TableCell>{getStatusBadge(comissao.status)}</TableCell>
                <TableCell>
                  {comissao.status !== 'pago' && (
                    <Button size="sm" onClick={() => abrirDialogPagamento(comissao)}>
                      Registrar Pagamento
                    </Button>
                  )}
                  {comissao.status === 'pago' && comissao.dataPagamento && (
                    <span className="text-xs text-muted-foreground">
                      Pago em {format(comissao.dataPagamento, "dd/MM/yyyy")}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {comissoesFiltradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  Nenhuma comissão encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento de Comissão</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {comissaoSelecionada && (
              <div className="p-3 bg-muted rounded">
                <p className="text-sm"><strong>Funcionário:</strong> {comissaoSelecionada.funcionarioNome}</p>
                <p className="text-sm"><strong>Valor:</strong> R$ {comissaoSelecionada.valorComissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Data de Pagamento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.dataPagamento && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dataPagamento ? format(formData.dataPagamento, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={formData.dataPagamento} onSelect={(date) => date && setFormData(prev => ({ ...prev, dataPagamento: date }))} locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Forma de Pagamento *</Label>
              <Select value={formData.formaPagamento} onValueChange={(value) => setFormData(prev => ({ ...prev, formaPagamento: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="folha">Folha de Pagamento</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="integrado"
                checked={formData.integradoFolha}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, integradoFolha: checked as boolean }))}
              />
              <label htmlFor="integrado" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Integrado à folha de pagamento
              </label>
            </div>

            <div className="space-y-2">
              <Label>Comprovante</Label>
              <Input value={formData.comprovante} onChange={(e) => setFormData(prev => ({ ...prev, comprovante: e.target.value }))} placeholder="Link ou código do comprovante" />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={formData.observacoes} onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))} placeholder="Observações adicionais" rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={registrarPagamento}>Confirmar Pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
