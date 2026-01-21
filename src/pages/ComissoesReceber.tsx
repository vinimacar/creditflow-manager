import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, CheckCircle, Clock, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { getVendas, getFornecedores, getProdutos, getFuncionarios, getClientes } from "@/lib/firestore";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ComissaoReceber } from "@/types/financeiro";
import { calcularComissoes } from "@/lib/calculos-comissoes";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { Textarea } from "@/components/ui/textarea";

export default function ComissoesReceber() {
  const { hasPermission, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [comissoes, setComissoes] = useState<(ComissaoReceber & { fornecedorNome: string; vendedorNome: string; clienteNome: string; produtoNome: string })[]>([]);
  const [fornecedores, setFornecedores] = useState<{ id: string; nomeFantasia: string; razaoSocial: string }[]>([]);
  const [filtroFornecedor, setFiltroFornecedor] = useState<string>("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [comissaoSelecionada, setComissaoSelecionada] = useState<(ComissaoReceber & { fornecedorNome: string; vendedorNome: string; clienteNome: string; produtoNome: string }) | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  const [formData, setFormData] = useState({
    dataRecebimento: new Date(),
    formaPagamento: "",
    comprovante: "",
    observacoes: "",
  });

  // Move carregarFornecedores above useEffect so it is declared before use
  const carregarFornecedores = async () => {
    try {
      const fornecedoresData = await getFornecedores();
      setFornecedores(
        fornecedoresData
          .filter(f => !!f.id && !!f.nomeFantasia && !!f.razaoSocial)
          .map(f => ({
            id: f.id!,
            nomeFantasia: f.nomeFantasia,
            razaoSocial: f.razaoSocial,
          }))
      );
    } catch (error) {
      toast.error("Erro ao carregar fornecedores");
    }
  };

  // Conferência automática: importa relatório do fornecedor (CSV) e confere valores
  const handleImportarRelatorioFornecedor = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      // Suporte básico: CSV com colunas [vendaId, valorComissao, status]
      const linhas = text.split(/\r?\n/).filter(l => l.trim());
      if (linhas.length < 2) throw new Error("Arquivo CSV vazio ou inválido");
      const cabecalho = linhas[0].split(",");
      const idxVenda = cabecalho.findIndex(h => h.toLowerCase().includes("venda"));
      const idxValor = cabecalho.findIndex(h => h.toLowerCase().includes("valor"));
      const idxStatus = cabecalho.findIndex(h => h.toLowerCase().includes("status"));
      let conferidos = 0;
      for (let i = 1; i < linhas.length; i++) {
        const cols = linhas[i].split(",");
        if (cols.length < Math.max(idxVenda, idxValor, idxStatus) + 1) continue;
        const vendaId = cols[idxVenda];
        const valor = parseFloat(cols[idxValor].replace(/[^\d.,]/g, '').replace(',', '.'));
        const status = cols[idxStatus]?.toLowerCase();
        const comissao = comissoes.find(c => c.vendaId === vendaId);
        if (comissao && Math.abs(comissao.valorComissao - valor) < 0.01) {
          // Atualiza status para conferido/recebido se bater
          await updateDoc(doc(db, "comissoesReceber", comissao.id!), {
            status: status === "recebido" ? "recebido" : "conferido",
            atualizadoEm: Timestamp.fromDate(new Date()),
          });
          conferidos++;
        }
      }
      toast.success(`${conferidos} comissões conferidas automaticamente!`);
      await carregarComissoes();
    } catch (error) {
      toast.error("Erro ao importar/conferir relatório");
    }
    setImportDialogOpen(false);
  };

  useEffect(() => {
    carregarComissoes();
    carregarFornecedores();
  }, []);

  const carregarComissoes = async () => {
    try {
      setLoading(true);

      const [vendas, fornecedores, produtos, funcionarios, clientes, comissoesSnapshot] = await Promise.all([
        getVendas(),
        getFornecedores(),
        getProdutos(),
        getFuncionarios(),
        getClientes(),
        getDocs(collection(db, "comissoesReceber")),
      ]);

      // Mapear comissões existentes
      const comissoesExistentes = new Map(
        comissoesSnapshot.docs.map(doc => [
          doc.data().vendaId,
          { id: doc.id, ...doc.data(), dataVenda: doc.data().dataVenda?.toDate(), dataVencimento: doc.data().dataVencimento?.toDate(), dataRecebimento: doc.data().dataRecebimento?.toDate(), criadoEm: doc.data().criadoEm?.toDate(), atualizadoEm: doc.data().atualizadoEm?.toDate() } as ComissaoReceber
        ])
      );

      // Para cada venda aprovada, criar/atualizar comissão a receber
      const comissoesCompletas: (ComissaoReceber & { fornecedorNome: string; vendedorNome: string; clienteNome: string; produtoNome: string })[] = [];

      for (const venda of vendas) {
        if (venda.status !== "aprovada") continue;

        const produto = produtos.find(p => p.id === venda.produtoId);
        const fornecedor = fornecedores.find(f => f.id === produto?.fornecedorId);
        const funcionario = funcionarios.find(f => f.id === venda.funcionarioId);
        const cliente = clientes.find(c => c.id === venda.clienteId);

        if (!produto || !fornecedor) continue;

        const comissoes = calcularComissoes(venda, produto);
        
        // VALIDAÇÃO CRÍTICA: Verificar se há comissão configurada no produto
        const temComissao = comissoes.comissaoFornecedor > 0 || comissoes.comissaoFornecedorPercentual > 0;
        
        // Verificar se já existe registro desta venda
        let comissao = comissoesExistentes.get(venda.id!);
        
        // LIMPEZA: Se existe comissão mas o produto não tem mais comissão configurada, deletar
        if (comissao && !temComissao) {
          try {
            await deleteDoc(doc(db, "comissoesReceber", comissao.id!));
            console.log(`Comissão zerada deletada: ${comissao.id}`);
            continue;
          } catch (error) {
            console.error("Erro ao deletar comissão zerada:", error);
          }
        }
        
        // OTIMIZAÇÃO: Não criar comissão se o valor for zero
        if (!temComissao) {
          continue;
        }
        
        const dataVenda = venda.createdAt?.toDate?.() || new Date(venda.createdAt);

        if (!comissao) {
          // Criar nova comissão a receber
          const novaComissao: ComissaoReceber = {
            vendaId: venda.id!,
            fornecedorId: fornecedor.id!,
            funcionarioId: venda.funcionarioId,
            produtoId: produto.id!,
            valorComissao: comissoes.comissaoFornecedor,
            percentualComissao: comissoes.comissaoFornecedorPercentual,
            dataVenda,
            dataVencimento: new Date(dataVenda.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 dias após venda
            status: 'pendente',
            criadoEm: new Date(),
            atualizadoEm: new Date(),
          };

          const docRef = await addDoc(collection(db, "comissoesReceber"), {
            ...novaComissao,
            dataVenda: Timestamp.fromDate(novaComissao.dataVenda),
            dataVencimento: Timestamp.fromDate(novaComissao.dataVencimento),
            criadoEm: Timestamp.fromDate(novaComissao.criadoEm),
            atualizadoEm: Timestamp.fromDate(novaComissao.atualizadoEm),
          });

          comissao = { ...novaComissao, id: docRef.id };
        }

        // Atualizar status baseado em datas
        let status = comissao.status;
        if (comissao.dataRecebimento) {
          status = 'recebido';
        } else if (new Date() > comissao.dataVencimento) {
          status = 'atrasado';
        }

        comissoesCompletas.push({
          ...comissao,
          status,
          fornecedorNome: fornecedor.nomeFantasia || fornecedor.razaoSocial,
          vendedorNome: funcionario?.nome || "N/A",
          clienteNome: cliente?.nome || "N/A",
          produtoNome: produto.nome,
        });
      }

      setComissoes(comissoesCompletas);

    } catch (error) {
      console.error("Erro ao carregar comissões a receber:", error);
      toast.error("Erro ao carregar comissões");
    } finally {
      setLoading(false);
    }
  };

  const registrarRecebimento = async () => {
    if (!comissaoSelecionada || !formData.formaPagamento) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await updateDoc(doc(db, "comissoesReceber", comissaoSelecionada.id!), {
        dataRecebimento: Timestamp.fromDate(formData.dataRecebimento),
        formaPagamento: formData.formaPagamento,
        comprovante: formData.comprovante || "",
        observacoes: formData.observacoes || "",
        status: 'recebido',
        atualizadoEm: Timestamp.fromDate(new Date()),
      });

      toast.success("Recebimento registrado com sucesso!");
      setDialogOpen(false);
      setComissaoSelecionada(null);
      setFormData({
        dataRecebimento: new Date(),
        formaPagamento: "",
        comprovante: "",
        observacoes: "",
      });
      await carregarComissoes();

    } catch (error) {
      console.error("Erro ao registrar recebimento:", error);
      toast.error("Erro ao registrar recebimento");
    }
  };

  const abrirDialogRecebimento = (comissao: ComissaoReceber & { fornecedorNome: string; vendedorNome: string; clienteNome: string; produtoNome: string }) => {
    setComissaoSelecionada(comissao);
    setFormData({
      dataRecebimento: comissao.dataRecebimento || new Date(),
      formaPagamento: comissao.formaPagamento || "",
      comprovante: comissao.comprovante || "",
      observacoes: comissao.observacoes || "",
    });
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pendente: { variant: "secondary" as const, icon: Clock, label: "Pendente" },
      recebido: { variant: "default" as const, icon: CheckCircle, label: "Recebido" },
      atrasado: { variant: "destructive" as const, icon: AlertTriangle, label: "Atrasado" },
      cancelado: { variant: "outline" as const, icon: X, label: "Cancelado" },
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
        <PageHeader title="Comissões a Receber" description="Acesso restrito" />
        <Card className="p-6">
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Comissões a Receber" description="Carregando..." />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const comissoesFiltradas = filtroStatus === "todos"
    ? comissoes
    : comissoes.filter(c => c.status === filtroStatus);
  const comissoesFornecedorFiltradas = filtroFornecedor
    ? comissoesFiltradas.filter(c => c.fornecedorNome === fornecedores.find(f => f.id === filtroFornecedor)?.nomeFantasia)
    : comissoesFiltradas;

  const totalPendente = comissoes.filter(c => c.status === 'pendente').reduce((sum, c) => sum + c.valorComissao, 0);
  const totalRecebido = comissoes.filter(c => c.status === 'recebido').reduce((sum, c) => sum + c.valorComissao, 0);
  const totalAtrasado = comissoes.filter(c => c.status === 'atrasado').reduce((sum, c) => sum + c.valorComissao, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comissões a Receber"
        description="Controle de comissões pagas pelos fornecedores"
      />

      {/* Cards Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-yellow-50 dark:bg-yellow-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Pendente</p>
              <h3 className="text-2xl font-bold mt-2 text-yellow-700">
                R$ {totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-yellow-700 mt-1">
                {comissoes.filter(c => c.status === 'pendente').length} comissões
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-6 bg-green-50 dark:bg-green-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">Recebido</p>
              <h3 className="text-2xl font-bold mt-2 text-green-700">
                R$ {totalRecebido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-green-700 mt-1">
                {comissoes.filter(c => c.status === 'recebido').length} comissões
              </p>
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
              <p className="text-xs text-red-700 mt-1">
                {comissoes.filter(c => c.status === 'atrasado').length} comissões
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-4">
          <Label>Filtrar por Status:</Label>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="recebido">Recebido</SelectItem>
              <SelectItem value="atrasado">Atrasado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4">
          <Label>Filtrar por Fornecedor:</Label>
          <Select value={filtroFornecedor} onValueChange={setFiltroFornecedor}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {fornecedores.map(f => (
                <SelectItem key={f.id} value={f.id}>{f.nomeFantasia || f.razaoSocial}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            Importar relatório do fornecedor
          </Button>
          {importDialogOpen && (
            <input type="file" accept=".csv" style={{ display: 'none' }} id="input-relatorio-fornecedor" onChange={handleImportarRelatorioFornecedor} />
          )}
          {importDialogOpen && (
            <Button variant="secondary" size="sm" onClick={() => document.getElementById('input-relatorio-fornecedor')?.click()}>
              Selecionar arquivo CSV
            </Button>
          )}
          {importDialogOpen && (
            <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(false)}>Cancelar</Button>
          )}
        </div>
      </Card>

      {/* Tabela */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data Venda</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comissoesFornecedorFiltradas.map((comissao) => (
              <TableRow key={comissao.id}>
                <TableCell>{format(comissao.dataVenda, "dd/MM/yyyy")}</TableCell>
                <TableCell>{comissao.clienteNome}</TableCell>
                <TableCell>{comissao.fornecedorNome}</TableCell>
                <TableCell>{comissao.produtoNome}</TableCell>
                <TableCell>{comissao.vendedorNome}</TableCell>
                <TableCell className="text-right font-semibold">
                  R$ {comissao.valorComissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>{format(comissao.dataVencimento, "dd/MM/yyyy")}</TableCell>
                <TableCell>{getStatusBadge(comissao.status)}</TableCell>
                <TableCell>
                  {comissao.status !== 'recebido' && (
                    <Button
                      size="sm"
                      onClick={() => abrirDialogRecebimento(comissao)}
                    >
                      Registrar Recebimento
                    </Button>
                  )}
                  {comissao.status === 'recebido' && comissao.dataRecebimento && (
                    <span className="text-xs text-muted-foreground">
                      Recebido em {format(comissao.dataRecebimento, "dd/MM/yyyy")}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {comissoesFornecedorFiltradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  Nenhuma comissão encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Dialog Registrar Recebimento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Recebimento de Comissão</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {comissaoSelecionada && (
              <div className="p-3 bg-muted rounded">
                <p className="text-sm"><strong>Fornecedor:</strong> {comissaoSelecionada.fornecedorNome}</p>
                <p className="text-sm"><strong>Valor:</strong> R$ {comissaoSelecionada.valorComissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Data de Recebimento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.dataRecebimento && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dataRecebimento ? format(formData.dataRecebimento, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={formData.dataRecebimento} onSelect={(date) => date && setFormData(prev => ({ ...prev, dataRecebimento: date }))} locale={ptBR} />
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
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Comprovante (URL ou código)</Label>
              <Input value={formData.comprovante} onChange={(e) => setFormData(prev => ({ ...prev, comprovante: e.target.value }))} placeholder="Link ou código do comprovante" />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={formData.observacoes} onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))} placeholder="Observações adicionais" rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={registrarRecebimento}>
              Confirmar Recebimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
