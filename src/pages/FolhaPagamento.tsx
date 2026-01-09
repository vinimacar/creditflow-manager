import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, DollarSign, Download, Plus, Eye } from "lucide-react";
import { toast } from "sonner";
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getFuncionarios, type Funcionario } from "@/lib/firestore";
import {
  FolhaPagamento as FolhaPagamentoType,
  Proventos,
  Descontos,
  calcularINSS,
  calcularIRRF,
  calcularValeTransporte,
  calcularSalarioLiquido,
} from "@/types/folhaPagamento";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import jsPDF from "jspdf";

export default function FolhaPagamento() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [folhas, setFolhas] = useState<FolhaPagamentoType[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesReferencia, setMesReferencia] = useState(new Date());
  const [processando, setProcessando] = useState(false);

  // Estados para nova folha
  const [novaFolhaDialog, setNovaFolhaDialog] = useState(false);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState("");
  const [horasExtras, setHorasExtras] = useState(0);
  const [comissoes, setComissoes] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [adicionalNoturno, setAdicionalNoturno] = useState(0);
  const [insalubridade, setInsalubridade] = useState(0);
  const [periculosidade, setPericulosidade] = useState(0);
  const [outrosProventos, setOutrosProventos] = useState(0);
  const [valeRefeicao, setValeRefeicao] = useState(0);
  const [planoDeSaude, setPlanoDeSaude] = useState(0);
  const [outrosDescontos, setOutrosDescontos] = useState(0);
  const [optouVT, setOptouVT] = useState(true);
  const [custoVT, setCustoVT] = useState(0);

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesReferencia]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const funcs = await getFuncionarios();
      setFuncionarios(funcs);

      const mesInicio = format(startOfMonth(mesReferencia), "yyyy-MM");
      const mesFim = format(endOfMonth(mesReferencia), "yyyy-MM");

      const q = query(
        collection(db, "folhaPagamento"),
        where("mesReferencia", ">=", mesInicio),
        where("mesReferencia", "<=", mesFim)
      );

      const snapshot = await getDocs(q);
      const folhasData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        criadoEm: doc.data().criadoEm?.toDate(),
        atualizadoEm: doc.data().atualizadoEm?.toDate(),
        dataPagamento: doc.data().dataPagamento?.toDate(),
      })) as FolhaPagamentoType[];

      setFolhas(folhasData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados da folha de pagamento");
    } finally {
      setLoading(false);
    }
  };

  const processarFolha = async () => {
    if (!funcionarioSelecionado) {
      toast.error("Selecione um funcionário");
      return;
    }

    setProcessando(true);
    try {
      const funcionario = funcionarios.find((f) => f.id === funcionarioSelecionado);
      if (!funcionario) {
        toast.error("Funcionário não encontrado");
        return;
      }

      // Calcular proventos
      const proventos: Proventos = {
        salarioBase: funcionario.salario || 0,
        horasExtras,
        comissoes,
        bonus,
        adicionalNoturno,
        insalubridade,
        periculosidade,
        outros: outrosProventos,
        total: 0,
      };

      proventos.total =
        proventos.salarioBase +
        proventos.horasExtras +
        proventos.comissoes +
        proventos.bonus +
        proventos.adicionalNoturno +
        proventos.insalubridade +
        proventos.periculosidade +
        proventos.outros;

      // Calcular descontos
      const inss = calcularINSS(proventos.total);
      const irrf = calcularIRRF(proventos.total, inss, funcionario.dependentes || 0);
      const vt = calcularValeTransporte(proventos.total, custoVT, optouVT);

      const descontos: Descontos = {
        inss,
        irrf,
        valeTransporte: vt,
        valeRefeicao,
        planoDeSaude,
        outros: outrosDescontos,
        total: 0,
      };

      descontos.total =
        descontos.inss +
        descontos.irrf +
        descontos.valeTransporte +
        descontos.valeRefeicao +
        descontos.planoDeSaude +
        descontos.outros;

      const salarioLiquido = calcularSalarioLiquido(proventos, descontos);

      const folha: Omit<FolhaPagamentoType, "id"> = {
        funcionarioId: funcionarioSelecionado,
        mesReferencia: format(mesReferencia, "yyyy-MM"),
        salarioBruto: proventos.total,
        proventos,
        descontos,
        salarioLiquido,
        status: "processada",
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      };

      await addDoc(collection(db, "folhaPagamento"), folha);

      toast.success("Folha de pagamento processada com sucesso!");
      setNovaFolhaDialog(false);
      limparFormulario();
      carregarDados();
    } catch (error) {
      console.error("Erro ao processar folha:", error);
      toast.error("Erro ao processar folha de pagamento");
    } finally {
      setProcessando(false);
    }
  };

  const limparFormulario = () => {
    setFuncionarioSelecionado("");
    setHorasExtras(0);
    setComissoes(0);
    setBonus(0);
    setAdicionalNoturno(0);
    setInsalubridade(0);
    setPericulosidade(0);
    setOutrosProventos(0);
    setValeRefeicao(0);
    setPlanoDeSaude(0);
    setOutrosDescontos(0);
    setOptouVT(true);
    setCustoVT(0);
  };

  const marcarComoPaga = async (folhaId: string) => {
    try {
      await updateDoc(doc(db, "folhaPagamento", folhaId), {
        status: "paga",
        dataPagamento: new Date(),
        atualizadoEm: new Date(),
      });
      toast.success("Folha marcada como paga!");
      carregarDados();
    } catch (error) {
      console.error("Erro ao marcar como paga:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const gerarHolerite = (folha: FolhaPagamentoType) => {
    const funcionario = funcionarios.find((f) => f.id === folha.funcionarioId);
    if (!funcionario) {
      toast.error("Funcionário não encontrado");
      return;
    }

    const pdf = new jsPDF();

    // Cabeçalho
    pdf.setFontSize(18);
    pdf.text("HOLERITE DE PAGAMENTO", 105, 20, { align: "center" });

    pdf.setFontSize(10);
    pdf.text(`Referência: ${format(new Date(folha.mesReferencia + "-01"), "MMMM/yyyy", { locale: ptBR })}`, 105, 30, { align: "center" });

    // Dados do Funcionário
    pdf.setFontSize(12);
    pdf.text("DADOS DO FUNCIONÁRIO", 20, 45);
    pdf.setFontSize(10);
    pdf.text(`Nome: ${funcionario.nome}`, 20, 55);
    pdf.text(`CPF: ${funcionario.cpf}`, 20, 62);
    pdf.text(`Cargo: ${funcionario.cargo}`, 20, 69);

    // Proventos
    pdf.setFontSize(12);
    pdf.text("PROVENTOS", 20, 85);
    pdf.setFontSize(10);
    let y = 95;

    const adicionarLinha = (descricao: string, valor: number) => {
      if (valor > 0) {
        pdf.text(descricao, 20, y);
        pdf.text(`R$ ${valor.toFixed(2)}`, 160, y);
        y += 7;
      }
    };

    adicionarLinha("Salário Base", folha.proventos.salarioBase);
    adicionarLinha("Horas Extras", folha.proventos.horasExtras);
    adicionarLinha("Comissões", folha.proventos.comissoes);
    adicionarLinha("Bônus", folha.proventos.bonus);
    adicionarLinha("Adicional Noturno", folha.proventos.adicionalNoturno);
    adicionarLinha("Insalubridade", folha.proventos.insalubridade);
    adicionarLinha("Periculosidade", folha.proventos.periculosidade);
    adicionarLinha("Outros", folha.proventos.outros);

    pdf.line(20, y, 190, y);
    y += 7;
    pdf.setFontSize(11);
    pdf.text("Total Proventos", 20, y);
    pdf.text(`R$ ${folha.proventos.total.toFixed(2)}`, 160, y);

    // Descontos
    y += 15;
    pdf.setFontSize(12);
    pdf.text("DESCONTOS", 20, y);
    y += 10;
    pdf.setFontSize(10);

    adicionarLinha("INSS", folha.descontos.inss);
    adicionarLinha("IRRF", folha.descontos.irrf);
    adicionarLinha("Vale Transporte", folha.descontos.valeTransporte);
    adicionarLinha("Vale Refeição", folha.descontos.valeRefeicao);
    adicionarLinha("Plano de Saúde", folha.descontos.planoDeSaude);
    adicionarLinha("Outros", folha.descontos.outros);

    pdf.line(20, y, 190, y);
    y += 7;
    pdf.setFontSize(11);
    pdf.text("Total Descontos", 20, y);
    pdf.text(`R$ ${folha.descontos.total.toFixed(2)}`, 160, y);

    // Salário Líquido
    y += 15;
    pdf.setFontSize(14);
    pdf.setFont(undefined, "bold");
    pdf.text("SALÁRIO LÍQUIDO", 20, y);
    pdf.text(`R$ ${folha.salarioLiquido.toFixed(2)}`, 160, y);

    // Rodapé
    pdf.setFontSize(8);
    pdf.setFont(undefined, "normal");
    pdf.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 105, 280, { align: "center" });

    pdf.save(`holerite_${funcionario.nome.replace(/\s/g, "_")}_${folha.mesReferencia}.pdf`);
    toast.success("Holerite gerado com sucesso!");
  };

  const totalFolha = folhas.reduce((acc, f) => acc + f.salarioLiquido, 0);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Folha de Pagamento"
        description="Gestão de pagamentos e holerites dos funcionários"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total da Folha</p>
              <p className="text-2xl font-bold">
                R$ {totalFolha.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Eye className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Processadas</p>
              <p className="text-2xl font-bold">
                {folhas.filter((f) => f.status === "processada" || f.status === "paga").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div>
            <Label>Mês de Referência</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start mt-2">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(mesReferencia, "MMMM yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={mesReferencia}
                  onSelect={(date) => date && setMesReferencia(date)}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Folhas do Mês</h3>
          <Dialog open={novaFolhaDialog} onOpenChange={setNovaFolhaDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Processar Folha
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Processar Nova Folha de Pagamento</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <Label>Funcionário</Label>
                  <Select value={funcionarioSelecionado} onValueChange={setFuncionarioSelecionado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      {funcionarios.map((func) => (
                        <SelectItem key={func.id} value={func.id}>
                          {func.nome} - {func.cargo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {funcionarioSelecionado && (
                  <>
                    <Separator />
                    <h4 className="font-semibold text-sm">Proventos Adicionais</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Horas Extras</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={horasExtras}
                          onChange={(e) => setHorasExtras(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Comissões</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={comissoes}
                          onChange={(e) => setComissoes(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Bônus</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={bonus}
                          onChange={(e) => setBonus(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Adicional Noturno</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={adicionalNoturno}
                          onChange={(e) => setAdicionalNoturno(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Insalubridade</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={insalubridade}
                          onChange={(e) => setInsalubridade(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Periculosidade</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={periculosidade}
                          onChange={(e) => setPericulosidade(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Outros Proventos</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={outrosProventos}
                          onChange={(e) => setOutrosProventos(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <Separator />
                    <h4 className="font-semibold text-sm">Descontos Adicionais</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Vale Refeição</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={valeRefeicao}
                          onChange={(e) => setValeRefeicao(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Plano de Saúde</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={planoDeSaude}
                          onChange={(e) => setPlanoDeSaude(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Custo Vale Transporte</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={custoVT}
                          onChange={(e) => setCustoVT(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Outros Descontos</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={outrosDescontos}
                          onChange={(e) => setOutrosDescontos(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                      <Button variant="outline" onClick={() => setNovaFolhaDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={processarFolha} disabled={processando}>
                        {processando ? "Processando..." : "Processar Folha"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : folhas.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma folha processada para este mês
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Salário Bruto</TableHead>
                <TableHead>Descontos</TableHead>
                <TableHead>Salário Líquido</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {folhas.map((folha) => {
                const funcionario = funcionarios.find((f) => f.id === folha.funcionarioId);
                return (
                  <TableRow key={folha.id}>
                    <TableCell className="font-medium">{funcionario?.nome}</TableCell>
                    <TableCell>{funcionario?.cargo}</TableCell>
                    <TableCell>R$ {folha.salarioBruto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>R$ {folha.descontos.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="font-semibold">
                      R$ {folha.salarioLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          folha.status === "paga"
                            ? "default"
                            : folha.status === "processada"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {folha.status === "paga"
                          ? "Paga"
                          : folha.status === "processada"
                          ? "Processada"
                          : "Rascunho"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => gerarHolerite(folha)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {folha.status === "processada" && (
                          <Button
                            size="sm"
                            onClick={() => marcarComoPaga(folha.id)}
                          >
                            Marcar como Paga
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
