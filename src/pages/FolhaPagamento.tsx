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
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, DollarSign, Download, Plus, Eye, Pencil, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  getFuncionarios, 
  getSalariosVigentes,
  getSalarioVigentePorFuncionario,
  addSalarioVigente,
  updateSalarioVigente,
  deleteSalarioVigente,
  type Funcionario,
  type SalarioVigente
} from "@/lib/firestore";
import {
  FolhaPagamento as FolhaPagamentoType,
  Proventos,
  Descontos,
  calcularINSS,
  calcularIRRF,
  calcularValeTransporte,
  calcularFGTS,
  calcularSalarioLiquido,
  calcularHorasExtras50,
  calcularHorasExtras100,
  calcularAdicionalNoturno,
  calcularDSR,
  calcularDescontoFaltas,
  calcularFolhaPagamentoCompleta,
  CalculoFolhaParams,
} from "@/types/folhaPagamento";

// Tipo estendido de Proventos com campos adicionais
interface ProventosExtendido extends Proventos {
  horasExtras50: number;
  horasExtras100: number;
  dsr: number;
}

// Tipo estendido de Descontos com campos adicionais
interface DescontosExtendido extends Descontos {
  faltas: number;
}

// Tipo estendido de FolhaPagamento com campos adicionais
interface FolhaPagamentoExtendido extends Omit<FolhaPagamentoType, 'encargos'> {
  encargos?: {
    fgts: number;
    total: number;
    provisaoFerias?: number;
    provisao13Salario?: number;
  };
  informacoesAdicionais?: Record<string, unknown>;
}
import { exportarParaESocialJSON, FolhaPagamentoDetalhada } from "@/types/esocial";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import jsPDF from "jspdf";

export default function FolhaPagamento() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [folhas, setFolhas] = useState<FolhaPagamentoType[]>([]);
  const [salariosVigentes, setSalariosVigentes] = useState<SalarioVigente[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesReferencia, setMesReferencia] = useState(new Date());
  const [processando, setProcessando] = useState(false);

  // Estados para nova folha
  const [novaFolhaDialog, setNovaFolhaDialog] = useState(false);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState("");
  const [salarioBaseAtual, setSalarioBaseAtual] = useState(0);
  
  // Estados para horas extras detalhadas
  const [horasExtras50, setHorasExtras50] = useState(0); // HE 50% (dias úteis)
  const [horasExtras100, setHorasExtras100] = useState(0); // HE 100% (domingos/feriados)
  const [horasAdicionalNoturno, setHorasAdicionalNoturno] = useState(0); // Horas noturnas
  
  // Estados para cálculos adicionais
  const [numeroDependentes, setNumeroDependentes] = useState(0);
  const [diasFaltas, setDiasFaltas] = useState(0);
  const [diasUteis, setDiasUteis] = useState(22); // Padrão 22 dias úteis
  const [diasDSR, setDiasDSR] = useState(8); // Padrão ~8 domingos/feriados
  const [horasMensais, setHorasMensais] = useState(220); // Padrão 220 horas
  
  // Estados mantidos para compatibilidade
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

  // Estados para edição de folha
  const [editarFolhaDialog, setEditarFolhaDialog] = useState(false);
  const [folhaEmEdicao, setFolhaEmEdicao] = useState<FolhaPagamentoType | null>(null);

  // Estados para gerenciar salário vigente
  const [salarioDialog, setSalarioDialog] = useState(false);
  const [novoSalarioFuncId, setNovoSalarioFuncId] = useState("");
  const [novoSalarioValor, setNovoSalarioValor] = useState(0);
  const [novoSalarioData, setNovoSalarioData] = useState<Date>(new Date());
  const [novoSalarioObs, setNovoSalarioObs] = useState("");

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesReferencia]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [funcs, salarios] = await Promise.all([
        getFuncionarios(),
        getSalariosVigentes()
      ]);
      
      setFuncionarios(funcs);
      setSalariosVigentes(salarios);

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

      // Buscar salário vigente do funcionário ou usar o cadastrado
      const salarioVigente = await getSalarioVigentePorFuncionario(funcionarioSelecionado);
      const salarioBase = salarioVigente?.salarioBase || funcionario.salarioBruto || funcionario.salario || 0;
      
      setSalarioBaseAtual(salarioBase);

      // Usar a nova função de cálculo completo
      const params: CalculoFolhaParams = {
        funcionarioId: funcionarioSelecionado,
        mesReferencia: format(mesReferencia, "yyyy-MM"),
        salarioBase,
        horasExtras50,
        horasExtras100,
        horasAdicionalNoturno,
        comissoes,
        bonus,
        insalubridade,
        periculosidade,
        outrosProventos,
        valeRefeicao,
        planoDeSaude,
        outrosDescontos,
        numeroDependentes: numeroDependentes || funcionario.dependentes || 0,
        diasFaltas,
        diasUteis,
        diasDSR,
        horasMensais,
        optouVT,
        custoVT,
      };

      const resultado = calcularFolhaPagamentoCompleta(params);

      const folha: Omit<FolhaPagamentoType, "id"> = {
        funcionarioId: funcionarioSelecionado,
        mesReferencia: format(mesReferencia, "yyyy-MM"),
        salarioBruto: resultado.salarioBruto,
        proventos: resultado.proventos,
        descontos: resultado.descontos,
        salarioLiquido: resultado.salarioLiquido,
        fgts: resultado.fgts,
        encargos: resultado.encargos,
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
    setSalarioBaseAtual(0);
    setHorasExtras50(0);
    setHorasExtras100(0);
    setHorasAdicionalNoturno(0);
    setNumeroDependentes(0);
    setDiasFaltas(0);
    setDiasUteis(22);
    setDiasDSR(8);
    setHorasMensais(220);
    setComissoes(0);
    setBonus(0);
    setInsalubridade(0);
    setPericulosidade(0);
    setOutrosProventos(0);
    setValeRefeicao(0);
    setPlanoDeSaude(0);
    setOutrosDescontos(0);
    setOptouVT(true);
    setCustoVT(0);
  };

  const abrirEdicaoFolha = async (folha: FolhaPagamentoType) => {
    setFolhaEmEdicao(folha);
    setFuncionarioSelecionado(folha.funcionarioId);
    
    // Buscar salário vigente do funcionário
    const salarioVigente = await getSalarioVigentePorFuncionario(folha.funcionarioId);
    const funcionario = funcionarios.find((f) => f.id === folha.funcionarioId);
    const salarioBase = salarioVigente?.salarioBase || funcionario?.salarioBruto || funcionario?.salario || 0;
    
    setSalarioBaseAtual(salarioBase);
    
    // Carregar horas detalhadas (se disponíveis) ou usar valores antigos
    const proventosExtendido = folha.proventos as ProventosExtendido;
    setHorasExtras50(proventosExtendido.horasExtras50 || 0);
    setHorasExtras100(proventosExtendido.horasExtras100 || 0);
    setHorasAdicionalNoturno(folha.proventos.adicionalNoturno || 0);
    
    setNumeroDependentes(folha.numeroDependentes || funcionario?.dependentes || 0);
    setDiasFaltas(folha.diasFaltas || 0);
    setDiasUteis(22);
    setDiasDSR(8);
    setHorasMensais(220);
    
    setComissoes(folha.proventos.comissoes || 0);
    setBonus(folha.proventos.bonus || 0);
    setInsalubridade(folha.proventos.insalubridade || 0);
    setPericulosidade(folha.proventos.periculosidade || 0);
    setOutrosProventos(folha.proventos.outros || 0);
    setValeRefeicao(folha.descontos.valeRefeicao || 0);
    setPlanoDeSaude(folha.descontos.planoDeSaude || 0);
    setOutrosDescontos(folha.descontos.outros || 0);
    setCustoVT(folha.descontos.valeTransporte || 0);
    
    setEditarFolhaDialog(true);
  };

  const salvarEdicaoFolha = async () => {
    if (!folhaEmEdicao) return;

    setProcessando(true);
    try {
      const funcionario = funcionarios.find((f) => f.id === funcionarioSelecionado);
      if (!funcionario) {
        toast.error("Funcionário não encontrado");
        return;
      }

      // Usar a nova função de cálculo completo
      const params: CalculoFolhaParams = {
        funcionarioId: funcionarioSelecionado,
        mesReferencia: format(mesReferencia, "yyyy-MM"),
        salarioBase: salarioBaseAtual,
        horasExtras50,
        horasExtras100,
        horasAdicionalNoturno,
        comissoes,
        bonus,
        insalubridade,
        periculosidade,
        outrosProventos,
        valeRefeicao,
        planoDeSaude,
        outrosDescontos,
        numeroDependentes: numeroDependentes || funcionario.dependentes || 0,
        diasFaltas,
        diasUteis,
        diasDSR,
        horasMensais,
        optouVT,
        custoVT,
      };

      const resultado = calcularFolhaPagamentoCompleta(params);

      await updateDoc(doc(db, "folhaPagamento", folhaEmEdicao.id), {
        salarioBruto: resultado.salarioBruto,
        proventos: resultado.proventos,
        descontos: resultado.descontos,
        salarioLiquido: resultado.salarioLiquido,
        fgts: resultado.fgts,
        atualizadoEm: new Date(),
      });

      toast.success("Folha de pagamento atualizada com sucesso!");
      setEditarFolhaDialog(false);
      setFolhaEmEdicao(null);
      limparFormulario();
      carregarDados();
    } catch (error) {
      console.error("Erro ao atualizar folha:", error);
      toast.error("Erro ao atualizar folha de pagamento");
    } finally {
      setProcessando(false);
    }
  };

  const excluirFolha = async (folhaId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta folha de pagamento?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "folhaPagamento", folhaId));
      toast.success("Folha de pagamento excluída com sucesso!");
      carregarDados();
    } catch (error) {
      console.error("Erro ao excluir folha:", error);
      toast.error("Erro ao excluir folha de pagamento");
    }
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

  const exportarESocial = () => {
    if (folhas.length === 0) {
      toast.error("Nenhuma folha disponível para exportar");
      return;
    }

    try {
      // Converter folhas para o formato detalhado do eSocial
      const folhasDetalhadas: FolhaPagamentoDetalhada[] = folhas.map(folha => {
        const funcionario = funcionarios.find(f => f.id === folha.funcionarioId);
        
        return {
          id: folha.id,
          funcionarioId: folha.funcionarioId,
          funcionarioNome: funcionario?.nome || "",
          funcionarioCPF: funcionario?.cpf || "",
          mesReferencia: folha.mesReferencia,
          salarioBase: folha.proventos.salarioBase,
          horasExtras50: (folha.proventos as ProventosExtendido).horasExtras50 || 0,
          horasExtras100: (folha.proventos as ProventosExtendido).horasExtras100 || 0,
          adicionalNoturno: folha.proventos.adicionalNoturno || 0,
          dsr: (folha.proventos as ProventosExtendido).dsr || 0,
          comissoes: folha.proventos.comissoes || 0,
          bonus: folha.proventos.bonus || 0,
          insalubridade: folha.proventos.insalubridade || 0,
          periculosidade: folha.proventos.periculosidade || 0,
          outrosProventos: folha.proventos.outros || 0,
          inss: folha.descontos.inss,
          irrf: folha.descontos.irrf,
          valeTransporte: folha.descontos.valeTransporte,
          valeRefeicao: folha.descontos.valeRefeicao,
          planoDeSaude: folha.descontos.planoDeSaude,
          faltas: (folha.descontos as DescontosExtendido).faltas || 0,
          outrosDescontos: folha.descontos.outros || 0,
          fgts: folha.fgts,
          provisaoFerias: (folha as FolhaPagamentoExtendido).encargos?.provisaoFerias || 0,
          provisao13Salario: (folha as FolhaPagamentoExtendido).encargos?.provisao13Salario || 0,
          totalProventos: folha.proventos.total,
          totalDescontos: folha.descontos.total,
          salarioLiquido: folha.salarioLiquido,
          proventos: folha.proventos,
          descontos: folha.descontos,
          encargos: folha.encargos,
          informacoesAdicionais: (folha as FolhaPagamentoExtendido).informacoesAdicionais || {},
          status: folha.status,
        };
      });

      // Gerar JSON do eSocial
      const jsonESocial = exportarParaESocialJSON(folhasDetalhadas, "00000000000000");
      
      // Criar blob e fazer download
      const blob = new Blob([jsonESocial], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `esocial_${format(mesReferencia, "yyyy-MM")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Arquivo eSocial exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar eSocial:", error);
      toast.error("Erro ao exportar arquivo eSocial");
    }
  };

  const gerarHolerite = (folha: FolhaPagamentoType) => {
    const funcionario = funcionarios.find((f) => f.id === folha.funcionarioId);
    if (!funcionario) {
      toast.error("Funcionário não encontrado");
      return;
    }

    const pdf = new jsPDF();
    const mesRef = format(new Date(folha.mesReferencia + "-01"), "MMMM/yyyy", { locale: ptBR });
    
    // Cabeçalho da Empresa
    pdf.setFontSize(11);
    pdf.setFont(undefined, "bold");
    pdf.text("Nome empresa", 15, 15);
    
    pdf.setFontSize(8);
    pdf.setFont(undefined, "normal");
    pdf.text("Endereço", 15, 20);
    pdf.text("CNPJ: 04.290.167/0001-95", 15, 24);
    
    // Título do documento
    pdf.setFontSize(12);
    pdf.setFont(undefined, "bold");
    pdf.text("Recibo de Pagamento de Salário", 80, 15);
    pdf.setFontSize(9);
    pdf.setFont(undefined, "normal");
    pdf.text(`Mês de referência: ${mesRef}`, 80, 20);

    // Caixa lateral com texto rotacionado
    pdf.setFontSize(7);
    pdf.text("Recibo de Pagamento de Salário", 195, 80, { angle: 90 });

    // Dados do Funcionário - Tabela
    const startY = 30;
    pdf.setFontSize(8);
    pdf.setFont(undefined, "bold");
    
    // Cabeçalhos da tabela de dados do funcionário
    pdf.rect(15, startY, 20, 6);
    pdf.text("Código", 17, startY + 4);
    
    pdf.rect(35, startY, 80, 6);
    pdf.text("Nome do Funcionário", 37, startY + 4);
    
    pdf.rect(115, startY, 25, 6);
    pdf.text("Admissão", 117, startY + 4);
    
    pdf.rect(140, startY, 15, 6);
    pdf.text("CBO", 142, startY + 4);
    
    pdf.rect(155, startY, 40, 6);
    pdf.text("Função", 157, startY + 4);

    // Dados do funcionário
    pdf.setFont(undefined, "normal");
    pdf.rect(15, startY + 6, 20, 6);
    pdf.text("cod. func", 17, startY + 10);
    
    pdf.rect(35, startY + 6, 80, 6);
    pdf.text(funcionario.nome.substring(0, 40), 37, startY + 10);
    
    pdf.rect(115, startY + 6, 25, 6);
    pdf.text("dt. adm", 117, startY + 10);
    
    pdf.rect(140, startY + 6, 15, 6);
    pdf.text("cbo", 142, startY + 10);
    
    pdf.rect(155, startY + 6, 40, 6);
    pdf.text(funcionario.cargo.substring(0, 20), 157, startY + 10);

    // Tabela de Eventos (Proventos e Descontos)
    const tableStartY = startY + 18;
    pdf.setFont(undefined, "bold");
    
    // Cabeçalhos
    pdf.rect(15, tableStartY, 15, 6);
    pdf.text("Código", 17, tableStartY + 4);
    
    pdf.rect(30, tableStartY, 80, 6);
    pdf.text("Nome do Funcionário", 32, tableStartY + 4);
    
    pdf.rect(110, tableStartY, 20, 6);
    pdf.text("Referência", 112, tableStartY + 4);
    
    pdf.rect(130, tableStartY, 30, 6);
    pdf.text("Vencimentos", 132, tableStartY + 4);
    
    pdf.rect(160, tableStartY, 30, 6);
    pdf.text("Descontos", 162, tableStartY + 4);

    // Eventos
    let currentY = tableStartY + 6;
    pdf.setFont(undefined, "normal");
    
    // Código dos eventos (exemplo)
    const eventos: Array<{cod: string, nome: string, ref: string, venc: number, desc: number}> = [];
    
    const salarioBaseValor = Number(folha.proventos.salarioBase) || 0;
    const bonusValor = Number(folha.proventos.bonus) || 0;
    const proventosExt = folha.proventos as ProventosExtendido;
    const horasExtrasValor = (Number(proventosExt.horasExtras50) || 0) + (Number(proventosExt.horasExtras100) || 0);
    const comissoesValor = Number(folha.proventos.comissoes) || 0;
    const adicionalNoturnoValor = Number(folha.proventos.adicionalNoturno) || 0;
    const insalubridadeValor = Number(folha.proventos.insalubridade) || 0;
    const periculosidadeValor = Number(folha.proventos.periculosidade) || 0;
    const inssValor = Number(folha.descontos.inss) || 0;
    const valeTransporteValor = Number(folha.descontos.valeTransporte) || 0;
    const valeRefeicaoValor = Number(folha.descontos.valeRefeicao) || 0;
    const planoDeSaudeValor = Number(folha.descontos.planoDeSaude) || 0;
    const irrfValor = Number(folha.descontos.irrf) || 0;
    const outrosValor = Number(folha.descontos.outros) || 0;
    
    if (salarioBaseValor > 0) {
      eventos.push({cod: "001", nome: "SALÁRIO", ref: "30", venc: salarioBaseValor, desc: 0});
    }
    if (bonusValor > 0) {
      eventos.push({cod: "112", nome: "SALÁRIO FAMÍLIA", ref: "0", venc: bonusValor, desc: 0});
    }
    if (horasExtrasValor > 0) {
      eventos.push({cod: "", nome: "HORAS EXTRAS", ref: "", venc: horasExtrasValor, desc: 0});
    }
    if (comissoesValor > 0) {
      eventos.push({cod: "", nome: "COMISSÕES", ref: "", venc: comissoesValor, desc: 0});
    }
    if (adicionalNoturnoValor > 0) {
      eventos.push({cod: "", nome: "ADICIONAL NOTURNO", ref: "", venc: adicionalNoturnoValor, desc: 0});
    }
    if (insalubridadeValor > 0) {
      eventos.push({cod: "", nome: "INSALUBRIDADE", ref: "", venc: insalubridadeValor, desc: 0});
    }
    if (periculosidadeValor > 0) {
      eventos.push({cod: "", nome: "PERICULOSIDADE", ref: "", venc: periculosidadeValor, desc: 0});
    }
    
    // Descontos
    if (inssValor > 0) {
      eventos.push({cod: "108", nome: "INSS", ref: "0", venc: 0, desc: inssValor});
    }
    if (valeTransporteValor > 0) {
      eventos.push({cod: "107", nome: "VALE TRANSPORTE", ref: "0", venc: 0, desc: valeTransporteValor});
    }
    if (valeRefeicaoValor > 0) {
      eventos.push({cod: "187", nome: "ALIMENTAÇÃO", ref: "0", venc: 0, desc: valeRefeicaoValor});
    }
    if (planoDeSaudeValor > 0) {
      eventos.push({cod: "", nome: "PLANO DE SAÚDE", ref: "", venc: 0, desc: planoDeSaudeValor});
    }
    if (irrfValor > 0) {
      eventos.push({cod: "", nome: "IRRF", ref: "", venc: 0, desc: irrfValor});
    }
    if (outrosValor > 0) {
      eventos.push({cod: "106", nome: "DIFERENÇA SAL", ref: "", venc: 0, desc: outrosValor});
    }

    // Renderizar eventos
    eventos.forEach((evento) => {
      pdf.rect(15, currentY, 15, 5);
      pdf.text(evento.cod, 17, currentY + 3.5);
      
      pdf.rect(30, currentY, 80, 5);
      pdf.text(evento.nome, 32, currentY + 3.5);
      
      pdf.rect(110, currentY, 20, 5);
      pdf.text(evento.ref, 112, currentY + 3.5);
      
      pdf.rect(130, currentY, 30, 5);
      if (evento.venc > 0) {
        pdf.text(evento.venc.toFixed(2), 132, currentY + 3.5);
      }
      
      pdf.rect(160, currentY, 30, 5);
      if (evento.desc > 0) {
        pdf.text(evento.desc.toFixed(2), 162, currentY + 3.5);
      }
      
      currentY += 5;
    });

    // Preencher espaço vazio até ter pelo menos 12 linhas
    const minLines = 12;
    const currentLines = eventos.length;
    if (currentLines < minLines) {
      for (let i = 0; i < minLines - currentLines; i++) {
        pdf.rect(15, currentY, 15, 5);
        pdf.rect(30, currentY, 80, 5);
        pdf.rect(110, currentY, 20, 5);
        pdf.rect(130, currentY, 30, 5);
        pdf.rect(160, currentY, 30, 5);
        currentY += 5;
      }
    }

    // Totais
    currentY += 5;
    pdf.setFont(undefined, "bold");
    pdf.text("Total de Vencimentos", 100, currentY);
    pdf.text("Total de Descontos", 132, currentY);
    
    pdf.setFontSize(9);
    const totalProventos = Number(folha.proventos.total) || 0;
    const totalDescontos = Number(folha.descontos.total) || 0;
    pdf.text(totalProventos.toFixed(2), 100, currentY + 5);
    pdf.text(totalDescontos.toFixed(2), 132, currentY + 5);

    // Valor Líquido com seta
    currentY += 12;
    pdf.setFontSize(10);
    pdf.text("Valor Líquido", 70, currentY);
    
    pdf.setFontSize(8);
    pdf.text("R$", 95, currentY);
    
    // Seta
    pdf.text("═══>", 105, currentY);
    
    pdf.setFontSize(11);
    pdf.setFont(undefined, "bold");
    const salarioLiquido = Number(folha.salarioLiquido) || 0;
    pdf.text(salarioLiquido.toFixed(2), 120, currentY);

    // Rodapé com informações adicionais
    currentY += 10;
    pdf.setFontSize(8);
    pdf.setFont(undefined, "normal");
    
    const baseFGTS = Number(folha.proventos.total) || 0;
    const fgtsMes = baseFGTS * 0.08;
    const salarioBasePdf = Number(folha.proventos.salarioBase) || 0;
    const inssDescontoPdf = Number(folha.descontos.inss) || 0;
    
    pdf.text(`Salário Base: ${salarioBasePdf.toFixed(2)}`, 15, currentY);
    pdf.text(`Salário Contr. INSS: ${(baseFGTS - inssDescontoPdf).toFixed(2)}`, 60, currentY);
    pdf.text(`Base FGTS: ${baseFGTS.toFixed(2)}`, 110, currentY);
    pdf.text(`FGTS do Mês: ${fgtsMes.toFixed(2)}`, 145, currentY);
    pdf.text(`Base Calc.: ${baseFGTS.toFixed(2)}`, 175, currentY);

    // Data de geração
    currentY += 10;
    pdf.setFontSize(7);
    pdf.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 105, currentY, { align: "center" });

    pdf.save(`recibo_pagamento_${funcionario.nome.replace(/\s/g, "_")}_${folha.mesReferencia}.pdf`);
    toast.success("Recibo de pagamento gerado com sucesso!");
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportarESocial} disabled={folhas.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Exportar eSocial
            </Button>
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
                  <Select value={funcionarioSelecionado} onValueChange={async (value) => {
                    setFuncionarioSelecionado(value);
                    // Buscar e mostrar o salário do funcionário
                    const salarioVigente = await getSalarioVigentePorFuncionario(value);
                    const funcionario = funcionarios.find(f => f.id === value);
                    const salario = salarioVigente?.salarioBase || funcionario?.salarioBruto || funcionario?.salario || 0;
                    setSalarioBaseAtual(salario);
                  }}>
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
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Salário Base Cadastrado: R$ {salarioBaseAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Este valor será usado como salário base e somado aos proventos adicionais.
                      </p>
                    </div>

                    <Separator />
                    <h4 className="font-semibold text-sm">Horas Trabalhadas e Extras (2026)</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>HE 50% (horas)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={horasExtras50}
                          onChange={(e) => setHorasExtras50(Number(e.target.value))}
                          placeholder="Ex: 10"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Dias úteis</p>
                      </div>
                      <div>
                        <Label>HE 100% (horas)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={horasExtras100}
                          onChange={(e) => setHorasExtras100(Number(e.target.value))}
                          placeholder="Ex: 5"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Domingos/feriados</p>
                      </div>
                      <div>
                        <Label>Adicional Noturno (horas)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={horasAdicionalNoturno}
                          onChange={(e) => setHorasAdicionalNoturno(Number(e.target.value))}
                          placeholder="Ex: 20"
                        />
                        <p className="text-xs text-muted-foreground mt-1">22h-5h (20%+redução)</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Dias Úteis</Label>
                        <Input
                          type="number"
                          value={diasUteis}
                          onChange={(e) => setDiasUteis(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Dias DSR</Label>
                        <Input
                          type="number"
                          value={diasDSR}
                          onChange={(e) => setDiasDSR(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Horas Mensais</Label>
                        <Input
                          type="number"
                          value={horasMensais}
                          onChange={(e) => setHorasMensais(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <Separator />
                    <h4 className="font-semibold text-sm">Outros Proventos</h4>
                    <div className="grid grid-cols-2 gap-4">
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
                    <h4 className="font-semibold text-sm">Descontos e Dependentes</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Número de Dependentes (IRRF)</Label>
                        <Input
                          type="number"
                          value={numeroDependentes}
                          onChange={(e) => setNumeroDependentes(Number(e.target.value))}
                          placeholder="0"
                        />
                        <p className="text-xs text-muted-foreground mt-1">R$ 189,59 por dependente</p>
                      </div>
                      <div>
                        <Label>Dias de Faltas</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={diasFaltas}
                          onChange={(e) => setDiasFaltas(Number(e.target.value))}
                          placeholder="0"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Desconto proporcional</p>
                      </div>
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
                          placeholder="Ex: 250.00"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Desconto automático 6%</p>
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
        </div>

        {/* Dialog de Edição de Folha */}
        <Dialog open={editarFolhaDialog} onOpenChange={setEditarFolhaDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Folha de Pagamento</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {folhaEmEdicao && funcionarioSelecionado && (
                <>
                  <div>
                    <Label>Funcionário</Label>
                    <Input 
                      value={funcionarios.find(f => f.id === funcionarioSelecionado)?.nome || ""} 
                      disabled 
                    />
                  </div>

                  <div>
                    <Label>Salário Base (do Cadastro)</Label>
                    <Input 
                      value={`R$ ${salarioBaseAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                      disabled 
                    />
                  </div>

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
                    <Button variant="outline" onClick={() => {
                      setEditarFolhaDialog(false);
                      setFolhaEmEdicao(null);
                      limparFormulario();
                    }}>
                      Cancelar
                    </Button>
                    <Button onClick={salvarEdicaoFolha} disabled={processando}>
                      {processando ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

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
                          title="Baixar Holerite"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => abrirEdicaoFolha(folha)}
                          title="Editar Lançamento"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => excluirFolha(folha.id)}
                          title="Excluir Lançamento"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
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
