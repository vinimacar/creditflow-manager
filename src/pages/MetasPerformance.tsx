import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Trophy, TrendingUp, Award, Users } from "lucide-react";
import { toast } from "sonner";
import { getVendas, getFuncionarios } from "@/lib/firestore";
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Meta, PerformanceFuncionario } from "@/types/financeiro";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";

export default function MetasPerformance() {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [performances, setPerformances] = useState<PerformanceFuncionario[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [periodoSelecionado, setPeriodoSelecionado] = useState(format(new Date(), "yyyy-MM"));

  const [formData, setFormData] = useState({
    tipo: "vendas" as "vendas" | "comissoes" | "clientes" | "ticket_medio",
    funcionarioId: "",
    valorMeta: "",
    premiacao: "",
  });

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);

      const [vendas, funcionarios, metasSnapshot] = await Promise.all([
        getVendas(),
        getFuncionarios(),
        getDocs(collection(db, "metas")),
      ]);

      const metasDoPeriodo = metasSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data(), criadoEm: doc.data().criadoEm?.toDate(), atualizadoEm: doc.data().atualizadoEm?.toDate() } as Meta))
        .filter(m => m.periodo === periodoSelecionado);

      const inicioMes = startOfMonth(new Date(periodoSelecionado + "-01"));
      const fimMes = endOfMonth(new Date(periodoSelecionado + "-01"));

      const vendasMes = vendas.filter(v => {
        const dataVenda = v.createdAt?.toDate?.() || new Date(v.createdAt);
        return dataVenda >= inicioMes && dataVenda <= fimMes && v.status === "aprovada";
      });

      const performanceMap = new Map<string, PerformanceFuncionario>();

      vendasMes.forEach(venda => {
        const current = performanceMap.get(venda.funcionarioId) || {
          funcionarioId: venda.funcionarioId,
          funcionarioNome: "",
          periodo: periodoSelecionado,
          totalVendas: 0,
          valorVendido: 0,
          comissoesGeradas: 0,
          comissoesRecebidas: 0,
          ticketMedio: 0,
          taxaConversao: 0,
          metasAtingidas: 0,
          metasTotais: 0,
          ranking: 0,
        };

        current.totalVendas++;
        current.valorVendido += venda.valorContrato;
        current.comissoesGeradas += venda.comissaoAgente || 0;

        performanceMap.set(venda.funcionarioId, current);
      });

      const performancesArray: PerformanceFuncionario[] = Array.from(performanceMap.values())
        .map(perf => {
          const func = funcionarios.find(f => f.id === perf.funcionarioId);
          const metasFunc = metasDoPeriodo.filter(m => m.funcionarioId === perf.funcionarioId || !m.funcionarioId);
          
          perf.funcionarioNome = func?.nome || "Desconhecido";
          perf.ticketMedio = perf.totalVendas > 0 ? perf.valorVendido / perf.totalVendas : 0;
          perf.metasTotais = metasFunc.length;
          perf.metasAtingidas = metasFunc.filter(m => m.percentualAtingido >= 100).length;

          return perf;
        })
        .sort((a, b) => b.valorVendido - a.valorVendido);

      performancesArray.forEach((perf, index) => {
        perf.ranking = index + 1;
      });

      setMetas(metasDoPeriodo);
      setPerformances(performancesArray);

    } catch (error) {
      console.error("Erro ao carregar metas:", error);
      toast.error("Erro ao carregar metas");
    } finally {
      setLoading(false);
    }
  }, [periodoSelecionado]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const criarMeta = async () => {
    if (!formData.valorMeta) {
      toast.error("Preencha o valor da meta");
      return;
    }

    try {
      const novaMeta: Meta = {
        tipo: formData.tipo,
        periodo: periodoSelecionado,
        funcionarioId: formData.funcionarioId || undefined,
        valorMeta: parseFloat(formData.valorMeta),
        valorRealizado: 0,
        percentualAtingido: 0,
        status: 'em_andamento',
        premiacao: formData.premiacao ? parseFloat(formData.premiacao) : undefined,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
        criadoPor: "admin",
      };

      await addDoc(collection(db, "metas"), {
        ...novaMeta,
        criadoEm: Timestamp.fromDate(novaMeta.criadoEm),
        atualizadoEm: Timestamp.fromDate(novaMeta.atualizadoEm),
      });

      toast.success("Meta criada com sucesso!");
      setDialogOpen(false);
      setFormData({ tipo: "vendas", funcionarioId: "", valorMeta: "", premiacao: "" });
      await carregarDados();

    } catch (error) {
      console.error("Erro ao criar meta:", error);
      toast.error("Erro ao criar meta");
    }
  };

  if (!hasPermission(["admin", "gerente"])) {
    return (
      <div className="space-y-6">
        <PageHeader title="Metas e Performance" description="Acesso restrito" />
        <Card className="p-6">
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Metas e Performance" description="Carregando..." />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Metas e Performance" description="Acompanhamento de metas e ranking da equipe" />

      <div className="flex items-center justify-between">
        <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2026-01">Janeiro 2026</SelectItem>
            <SelectItem value="2025-12">Dezembro 2025</SelectItem>
            <SelectItem value="2025-11">Novembro 2025</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => setDialogOpen(true)}>
          <Target className="w-4 h-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Metas Ativas</p>
              <h3 className="text-2xl font-bold mt-2">{metas.filter(m => m.status === 'em_andamento').length}</h3>
            </div>
            <Target className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Metas Atingidas</p>
              <h3 className="text-2xl font-bold mt-2">{metas.filter(m => m.status === 'atingida' || m.status === 'superada').length}</h3>
            </div>
            <Trophy className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Vendedores Ativos</p>
              <h3 className="text-2xl font-bold mt-2">{performances.length}</h3>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Ranking de Performance
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Funcionário</TableHead>
                <TableHead className="text-right">Total Vendas</TableHead>
                <TableHead className="text-right">Valor Vendido</TableHead>
                <TableHead className="text-right">Ticket Médio</TableHead>
                <TableHead className="text-right">Comissões</TableHead>
                <TableHead className="text-center">Metas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performances.map((perf) => (
                <TableRow key={perf.funcionarioId}>
                  <TableCell className="font-bold">
                    {perf.ranking === 1 && <Award className="w-5 h-5 text-yellow-500 inline" />}
                    {perf.ranking === 2 && <Award className="w-5 h-5 text-gray-400 inline" />}
                    {perf.ranking === 3 && <Award className="w-5 h-5 text-orange-600 inline" />}
                    {perf.ranking > 3 && perf.ranking}
                  </TableCell>
                  <TableCell className="font-medium">{perf.funcionarioNome}</TableCell>
                  <TableCell className="text-right">{perf.totalVendas}</TableCell>
                  <TableCell className="text-right">
                    R$ {perf.valorVendido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {perf.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {perf.comissoesGeradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={perf.metasAtingidas === perf.metasTotais ? "default" : "secondary"}>
                      {perf.metasAtingidas}/{perf.metasTotais}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {performances.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhuma venda neste período
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {metas.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Metas do Período</h3>
            <div className="space-y-4">
              {metas.map((meta) => {
                const percentual = meta.percentualAtingido || 0;
                return (
                  <div key={meta.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold">
                          {meta.tipo.replace("_", " ").toUpperCase()} 
                          {meta.funcionarioId ? " - Individual" : " - Geral"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Meta: R$ {meta.valorMeta.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <Badge variant={percentual >= 100 ? "default" : percentual >= 70 ? "secondary" : "destructive"}>
                        {percentual.toFixed(0)}%
                      </Badge>
                    </div>
                    <Progress value={Math.min(percentual, 100)} className="h-2" />
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Meta</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Meta *</Label>
              <Select value={formData.tipo} onValueChange={(value: "vendas" | "comissoes" | "clientes" | "ticket_medio") => setFormData(prev => ({ ...prev, tipo: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendas">Valor de Vendas</SelectItem>
                  <SelectItem value="comissoes">Comissões Geradas</SelectItem>
                  <SelectItem value="clientes">Novos Clientes</SelectItem>
                  <SelectItem value="ticket_medio">Ticket Médio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor da Meta *</Label>
              <Input
                type="number"
                value={formData.valorMeta}
                onChange={(e) => setFormData(prev => ({ ...prev, valorMeta: e.target.value }))}
                placeholder="Ex: 50000"
              />
            </div>

            <div className="space-y-2">
              <Label>Premiação (Opcional)</Label>
              <Input
                type="number"
                value={formData.premiacao}
                onChange={(e) => setFormData(prev => ({ ...prev, premiacao: e.target.value }))}
                placeholder="Valor do bônus se atingir"
              />
            </div>

            <div className="space-y-2">
              <Label>Funcionário (Deixe em branco para meta geral)</Label>
              <Input
                value={formData.funcionarioId}
                onChange={(e) => setFormData(prev => ({ ...prev, funcionarioId: e.target.value }))}
                placeholder="ID do funcionário"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={criarMeta}>Criar Meta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
