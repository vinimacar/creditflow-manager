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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  User,
  Package,
  FileText,
  DollarSign,
  Calculator,
  CheckCircle2,
  UserPlus,
  Check,
  ChevronsUpDown,
  List,
  Edit,
  XCircle,
  Shield,
  Trash2,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getClientes, getProdutos, getFuncionarios, getVendas, getFornecedores, getBancos, getCategoriasProdutos, addBanco, addCategoriaProduto, getEmpresaConfig, type Cliente, type Produto, type Funcionario, type Venda, type Fornecedor, type Banco, type CategoriaProduto } from "@/lib/firestore";
import { BANCOS_BRASIL, buscarBancoPorCodigo } from "@/lib/bancos-brasil";
import { collection, addDoc, Timestamp, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PDV() {
  const { user: userProfile } = useAuth();
  
  // Debug: verificar role do usuário
  console.log('PDV - userProfile:', userProfile);
  console.log('PDV - role:', userProfile?.role);
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [openClienteCombobox, setOpenClienteCombobox] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<string>("");
  const [selectedProduto, setSelectedProduto] = useState<string>("");
  const [selectedFuncionario, setSelectedFuncionario] = useState<string>("");
  const [selectedFornecedor, setSelectedFornecedor] = useState<string>("");
  const [selectedBanco, setSelectedBanco] = useState<string>("");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("");
  const [valorContrato, setValorContrato] = useState<string>("");
  const [numeroContrato, setNumeroContrato] = useState<string>("");
  const [prazo, setPrazo] = useState<string>("");
  const [dataVenda, setDataVenda] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [processando, setProcessando] = useState(false);
  
  // Estados para diálogos de cadastro rápido
  const [novoBancoDialog, setNovoBancoDialog] = useState(false);
  const [novaCategoriaDialog, setNovaCategoriaDialog] = useState(false);
  const [novoBancoNome, setNovoBancoNome] = useState<string>("");
  const [novaCategoriaNome, setNovaCategoriaNome] = useState<string>("");
  
  // Estados para consulta de vendas
  const [consultarVendasOpen, setConsultarVendasOpen] = useState(false);
  const [vendaSelecionada, setVendaSelecionada] = useState<Venda | null>(null);
  const [editarVendaOpen, setEditarVendaOpen] = useState(false);
  const [estornarConfirmOpen, setEstornarConfirmOpen] = useState(false);
  const [excluirConfirmOpen, setExcluirConfirmOpen] = useState(false);
  
  // Estados para edição
  const [editValorContrato, setEditValorContrato] = useState<string>("");
  const [editPrazo, setEditPrazo] = useState<string>("");
  const [editClienteId, setEditClienteId] = useState<string>("");
  const [editProdutoId, setEditProdutoId] = useState<string>("");
  const [editFuncionarioId, setEditFuncionarioId] = useState<string>("");

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [clientesData, produtosData, funcionariosData, vendasData, fornecedoresData, bancosData, categoriasData] = await Promise.all([
        getClientes(),
        getProdutos(),
        getFuncionarios(),
        getVendas(),
        getFornecedores(),
        getBancos(),
        getCategoriasProdutos(),
      ]);
      setClientes(clientesData);
      setProdutos(produtosData);
      setFuncionarios(funcionariosData);
      setVendas(vendasData);
      setFornecedores(fornecedoresData);
      setBancos(bancosData);
      setCategorias(categoriasData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    }
  };

  const clienteSelecionado = clientes.find((c) => c.id === selectedCliente);
  const produto = produtos.find((p) => p.id === selectedProduto);
  
  // Função para calcular comissão baseada na tabela de faixas ou percentual fixo
  const calcularComissao = (valorContratoNum: number, produto: Produto | undefined): { percentual: number; valor: number } => {
    if (!produto) return { percentual: 0, valor: 0 };
    
    // Se existir tabela de comissões por faixa, usar ela
    if (produto.comissoes && produto.comissoes.length > 0) {
      const faixaAplicavel = produto.comissoes.find(
        faixa => valorContratoNum >= faixa.valorMin && valorContratoNum <= faixa.valorMax
      );
      
      if (faixaAplicavel) {
        return {
          percentual: faixaAplicavel.percentual,
          valor: (valorContratoNum * faixaAplicavel.percentual) / 100
        };
      }
      
      // Se não encontrar faixa, usar a última (maior valor)
      const ultimaFaixa = produto.comissoes[produto.comissoes.length - 1];
      return {
        percentual: ultimaFaixa.percentual,
        valor: (valorContratoNum * ultimaFaixa.percentual) / 100
      };
    }
    
    // Caso contrário, usar comissão fixa do funcionário
    const percentual = produto.comissaoFuncionario || produto.comissao || 0;
    return {
      percentual,
      valor: (valorContratoNum * percentual) / 100
    };
  };
  
  const valorContratoNum = valorContrato ? parseFloat(valorContrato) : 0;
  const comissaoCalculada = calcularComissao(valorContratoNum, produto);
  const comissaoPerc = comissaoCalculada.percentual;
  const comissaoValor = comissaoCalculada.valor.toFixed(2);
  
  // Comissões do fornecedor e funcionário
  const comissaoFornecedorPerc = produto?.comissaoFornecedor || 0;
  const comissaoFuncionarioPerc = comissaoCalculada.percentual;
  const comissaoFornecedorValor = valorContrato
    ? (parseFloat(valorContrato) * (comissaoFornecedorPerc / 100)).toFixed(2)
    : "0.00";
  const comissaoFuncionarioValor = comissaoValor;
  
  // Verificar se pode visualizar comissões
  const podeVisualizarComissoes = userProfile?.role === "gerente" || userProfile?.role === "admin";

  const handleFinalizarVenda = async () => {
    if (!selectedCliente || !selectedProduto || !selectedFuncionario || !valorContrato || !prazo) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setProcessando(true);
    try {
      const vendaId = `VND-${Date.now().toString().slice(-6)}`;
      const produtoSelecionado = produtos.find(p => p.id === selectedProduto);
      const valorContratoNum = parseFloat(valorContrato);
      
      // Calcular comissões usando a tabela de faixas ou percentual fixo
      const comissaoCalculadaAgente = calcularComissao(valorContratoNum, produtoSelecionado);
      const comissaoFornecedorPerc = produtoSelecionado?.comissaoFornecedor || 0;
      const comissaoFornecedorValor = (valorContratoNum * comissaoFornecedorPerc) / 100;
      
      // Converter a data selecionada para Timestamp
      const dataVendaDate = new Date(dataVenda + "T00:00:00");
      const dataVendaTimestamp = Timestamp.fromDate(dataVendaDate);
      
      const docRef = await addDoc(collection(db, "vendas"), {
        vendaId: vendaId, // ID visual da venda (VND-XXXXXX)
        clienteId: selectedCliente,
        produtoId: selectedProduto,
        funcionarioId: selectedFuncionario,
        fornecedorId: selectedFornecedor || produtoSelecionado?.fornecedorId || "",
        bancoId: selectedBanco || produtoSelecionado?.bancoId || "",
        categoriaId: selectedCategoria || produtoSelecionado?.categoriaId || "",
        valorContrato: valorContratoNum,
        numeroContrato: numeroContrato || "",
        prazo: parseInt(prazo),
        comissao: comissaoCalculadaAgente.valor, // Comissão do funcionário em R$
        comissaoPercentual: comissaoCalculadaAgente.percentual, // Comissão do funcionário em %
        comissaoFornecedor: comissaoFornecedorValor,
        comissaoFornecedorPercentual: comissaoFornecedorPerc,
        comissaoFuncionario: comissaoCalculadaAgente.valor,
        comissaoFuncionarioPercentual: comissaoCalculadaAgente.percentual,
        status: "aprovada",
        criadoPor: userProfile?.uid || "",
        createdAt: dataVendaTimestamp,
      });
      
      console.log('Venda criada com docId:', docRef.id, 'e vendaId:', vendaId);

      toast.success(`Venda registrada com sucesso! ID: ${vendaId}`);
      
      // Recarregar vendas
      await carregarDados();
      
      // Limpar formulário
      setSelectedCliente("");
      setSelectedProduto("");
      setSelectedFuncionario("");
      setSelectedFornecedor("");
      setSelectedBanco("");
      setSelectedCategoria("");
      setValorContrato("");
      setNumeroContrato("");
      setPrazo("");
      setDataVenda(format(new Date(), "yyyy-MM-dd"));
    } catch (error) {
      console.error("Erro ao registrar venda:", error);
      toast.error("Erro ao registrar venda");
    } finally {
      setProcessando(false);
    }
  };

  const podeEditarOuEstornar = () => {
    const temPermissao = userProfile?.role === "gerente" || userProfile?.role === "admin";
    console.log('podeEditarOuEstornar - role:', userProfile?.role, '- temPermissao:', temPermissao);
    return temPermissao;
  };

  const handleAbrirEditar = (venda: Venda) => {
    if (!podeEditarOuEstornar()) {
      toast.error("Apenas Gerentes e Administradores podem editar vendas");
      return;
    }
    
    setVendaSelecionada(venda);
    setEditClienteId(venda.clienteId);
    setEditProdutoId(venda.produtoId);
    setEditFuncionarioId(venda.funcionarioId);
    setEditValorContrato(venda.valorContrato.toString());
    setEditPrazo(venda.prazo.toString());
    setEditarVendaOpen(true);
  };

  const handleSalvarEdicao = async () => {
    if (!vendaSelecionada || !vendaSelecionada.id) {
      toast.error("Venda não encontrada");
      return;
    }

    try {
      const produtoSelecionado = produtos.find(p => p.id === editProdutoId);
      const valorContratoNum = parseFloat(editValorContrato);
      
      // Calcular comissões usando a tabela de faixas ou percentual fixo
      const comissaoCalculada = calcularComissao(valorContratoNum, produtoSelecionado);
      const comissaoFornecedorPerc = produtoSelecionado?.comissaoFornecedor || 0;
      const comissaoFornecedorValor = (valorContratoNum * comissaoFornecedorPerc) / 100;

      const vendaRef = doc(db, "vendas", vendaSelecionada.id);
      
      await updateDoc(vendaRef, {
        clienteId: editClienteId,
        produtoId: editProdutoId,
        funcionarioId: editFuncionarioId,
        fornecedorId: produtoSelecionado?.fornecedorId || "",
        bancoId: produtoSelecionado?.bancoId || "",
        categoriaId: produtoSelecionado?.categoriaId || "",
        valorContrato: valorContratoNum,
        prazo: parseInt(editPrazo),
        comissao: comissaoCalculada.valor,
        comissaoPercentual: comissaoCalculada.percentual,
        comissaoAgente: comissaoCalculada.valor,
        comissaoAgentePercentual: comissaoCalculada.percentual,
        comissaoFornecedor: comissaoFornecedorValor,
        comissaoFornecedorPercentual: comissaoFornecedorPerc,
        updatedAt: Timestamp.now(),
      });

      toast.success("Venda atualizada com sucesso!");
      setEditarVendaOpen(false);
      await carregarDados();
    } catch (error: any) {
      console.error("Erro ao atualizar venda:", error);
      
      if (error?.code === 'not-found' || error?.message?.includes('No document to update')) {
        toast.error("Esta venda não existe mais no banco de dados");
        setEditarVendaOpen(false);
        await carregarDados();
      } else {
        toast.error("Erro ao atualizar venda: " + (error?.message || "Erro desconhecido"));
      }
    }
  };

  const handleAbrirEstornar = (venda: Venda) => {
    if (!podeEditarOuEstornar()) {
      toast.error("Apenas Gerentes e Administradores podem estornar vendas");
      return;
    }
    
    setVendaSelecionada(venda);
    setEstornarConfirmOpen(true);
  };

  const handleEstornarVenda = async () => {
    if (!vendaSelecionada || !vendaSelecionada.id) {
      toast.error("Venda não encontrada");
      return;
    }

    try {
      console.log('Estornando venda com ID do documento:', vendaSelecionada.id);
      const vendaRef = doc(db, "vendas", vendaSelecionada.id);
      
      await updateDoc(vendaRef, {
        status: "cancelada",
        updatedAt: Timestamp.now(),
      });

      toast.success("Venda estornada com sucesso!");
      setEstornarConfirmOpen(false);
      setVendaSelecionada(null);
      await carregarDados();
    } catch (error: any) {
      console.error("Erro ao estornar venda:", error);
      console.error("Código do erro:", error?.code);
      
      if (error?.code === 'not-found' || error?.message?.includes('No document to update')) {
        toast.error("Esta venda não existe mais no banco de dados");
        setEstornarConfirmOpen(false);
        setVendaSelecionada(null);
        await carregarDados();
      } else {
        toast.error("Erro ao estornar venda: " + (error?.message || "Erro desconhecido"));
      }
    }
  };

  const handleAbrirExcluir = (venda: Venda) => {
    if (!podeEditarOuEstornar()) {
      toast.error("Apenas Gerentes e Administradores podem excluir vendas");
      return;
    }
    
    setVendaSelecionada(venda);
    setExcluirConfirmOpen(true);
  };

  const handleExcluirVenda = async () => {
    if (!vendaSelecionada || !vendaSelecionada.id) {
      toast.error("Venda não encontrada");
      return;
    }

    try {
      console.log('Excluindo venda com ID do documento:', vendaSelecionada.id);
      const vendaRef = doc(db, "vendas", vendaSelecionada.id);
      
      await deleteDoc(vendaRef);

      toast.success("Venda excluída com sucesso!");
      setExcluirConfirmOpen(false);
      setVendaSelecionada(null);
      await carregarDados();
    } catch (error: any) {
      console.error("Erro ao excluir venda:", error);
      console.error("Código do erro:", error?.code);
      
      if (error?.code === 'not-found' || error?.message?.includes('No document to update')) {
        toast.error("Esta venda não existe mais no banco de dados");
        setExcluirConfirmOpen(false);
        setVendaSelecionada(null);
        await carregarDados();
      } else {
        toast.error("Erro ao excluir venda: " + (error?.message || "Erro desconhecido"));
      }
    }
  };

  const handleCadastrarBanco = async () => {
    if (!novoBancoNome.trim()) {
      toast.error("Digite o nome do banco");
      return;
    }

    try {
      const novoId = await addBanco({
        nome: novoBancoNome,
        status: "ativo",
      });
      
      toast.success("Banco cadastrado com sucesso!");
      setNovoBancoNome("");
      setNovoBancoDialog(false);
      
      // Recarregar bancos e selecionar o novo
      await carregarDados();
      setSelectedBanco(novoId);
    } catch (error) {
      console.error("Erro ao cadastrar banco:", error);
      toast.error("Erro ao cadastrar banco");
    }
  };

  const handleCadastrarCategoria = async () => {
    if (!novaCategoriaNome.trim()) {
      toast.error("Digite o nome da categoria");
      return;
    }

    try {
      const novoId = await addCategoriaProduto({
        nome: novaCategoriaNome,
        status: "ativo",
      });
      
      toast.success("Categoria cadastrada com sucesso!");
      setNovaCategoriaNome("");
      setNovaCategoriaDialog(false);
      
      // Recarregar categorias e selecionar a nova
      await carregarDados();
      setSelectedCategoria(novoId);
    } catch (error) {
      console.error("Erro ao cadastrar categoria:", error);
      toast.error("Erro ao cadastrar categoria");
    }
  };

  const handleEmitirContrato = async () => {
    if (!selectedCliente || !selectedProduto || !valorContrato || !prazo) {
      toast.error("Preencha os dados da venda para emitir o contrato");
      return;
    }

    const cliente = clientes.find((c) => c.id === selectedCliente);
    const produtoInfo = produtos.find((p) => p.id === selectedProduto);
    
    // Buscar configurações da empresa
    let empresaConfig;
    try {
      empresaConfig = await getEmpresaConfig();
    } catch (error) {
      console.error("Erro ao buscar configurações da empresa:", error);
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxWidth = pageWidth - (margin * 2);
    let y = 20;
    
    // Cabeçalho
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    const titulo = doc.splitTextToSize("CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE INTERMEDIAÇÃO DE NEGÓCIOS BANCÁRIOS", maxWidth);
    titulo.forEach((linha: string) => {
      doc.text(linha, pageWidth / 2, y, { align: "center" });
      y += 6;
    });
    
    y += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Pelo presente instrumento particular, de um lado:", margin, y);
    
    // CONTRATADA
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("CONTRATADA:", margin, y);
    
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const nomeEmpresa = empresaConfig?.nome || "[NOME DA EMPRESA]";
    const cnpjEmpresa = empresaConfig?.cnpj || "[CNPJ]";
    const enderecoEmpresa = empresaConfig?.endereco || "[ENDEREÇO COMPLETO]";
    
    doc.text(`${nomeEmpresa}, pessoa jurídica de direito privado, inscrita no CNPJ sob nº ${cnpjEmpresa},`, margin, y);
    y += 5;
    doc.text(`com sede à ${enderecoEmpresa}, doravante denominada CONTRATADA;`, margin, y);
    
    // CONTRATANTE
    y += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("CONTRATANTE:", margin, y);
    
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`${cliente?.nome || "[NOME DO CLIENTE]"}, ${cliente?.nacionalidade || "[nacionalidade]"}, ${cliente?.estadoCivil || "[estado civil]"},`, margin, y);
    y += 5;
    doc.text(`${cliente?.profissao || "[profissão]"}, portador(a) do CPF nº ${cliente?.cpf || "[CPF]"} e RG nº ${cliente?.rg || "[RG]"},`, margin, y);
    y += 5;
    doc.text(`residente e domiciliado(a) à ${cliente?.endereco || "[ENDEREÇO]"}, doravante denominado(a) CONTRATANTE;`, margin, y);
    
    y += 10;
    doc.setFontSize(9);
    doc.text("Têm entre si justo e contratado o que segue:", margin, y);
    
    // CLÁUSULAS
    y += 10;
    const clausulas = [
      {
        titulo: "CLÁUSULA 1ª – DO OBJETO",
        texto: [
          "1.1. O presente contrato tem por objeto a prestação de serviços de intermediação de operações financeiras, consistentes na análise, encaminhamento e acompanhamento de propostas junto a instituições financeiras, referentes às seguintes modalidades:",
          "• Empréstimo consignado;",
          "• Empréstimo pessoal;",
          "• Refinanciamento;",
          "• Portabilidade de crédito;",
          "• Troca de crédito ou renegociação de dívidas;",
          "• Outras operações financeiras permitidas em lei.",
          "",
          "1.2. A CONTRATADA não é instituição financeira, não concede crédito próprio e não garante aprovação das operações, atuando exclusivamente como intermediadora entre o CONTRATANTE e as instituições financeiras."
        ]
      },
      {
        titulo: "CLÁUSULA 2ª – DAS OBRIGAÇÕES DA CONTRATADA",
        texto: [
          "2.1. Compete à CONTRATADA:",
          "a) Analisar as informações fornecidas pelo CONTRATANTE;",
          "b) Encaminhar propostas às instituições financeiras conveniadas;",
          "c) Acompanhar o andamento da proposta até sua conclusão ou recusa;",
          "d) Prestar informações claras sobre o status da operação;",
          "e) Manter sigilo sobre os dados pessoais e financeiros do CONTRATANTE."
        ]
      },
      {
        titulo: "CLÁUSULA 3ª – DAS OBRIGAÇÕES DO CONTRATANTE",
        texto: [
          "3.1. Compete ao CONTRATANTE:",
          "a) Fornecer informações e documentos verdadeiros e completos;",
          "b) Autorizar consultas cadastrais, inclusive junto a órgãos de proteção ao crédito;",
          "c) Ler atentamente as condições finais da operação antes da assinatura junto à instituição financeira;",
          "d) Responsabilizar-se integralmente pelo cumprimento das obrigações assumidas com o banco ou financeira."
        ]
      },
      {
        titulo: "CLÁUSULA 4ª – DA REMUNERAÇÃO",
        texto: [
          "4.1. Pelos serviços prestados, a CONTRATADA fará jus a uma remuneração, que poderá ocorrer das seguintes formas:",
          "• Comissão paga diretamente pela instituição financeira;",
          "• Comissão descontada do valor liberado;",
          "• Pagamento direto pelo CONTRATANTE, conforme previamente acordado.",
          "",
          "4.2. O valor da remuneração será informado previamente ao CONTRATANTE, sendo devida apenas em caso de efetiva concretização da operação financeira."
        ]
      }
    ];

    clausulas.forEach((clausula) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(clausula.titulo, margin, y);
      y += 6;
      
      doc.setFont("helvetica", "normal");
      clausula.texto.forEach((linha) => {
        const linhas = doc.splitTextToSize(linha, maxWidth);
        linhas.forEach((l: string) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(l, margin, y);
          y += 5;
        });
      });
      y += 3;
    });

    // Nova página para demais cláusulas
    doc.addPage();
    y = 20;

    const clausulas2 = [
      {
        titulo: "CLÁUSULA 5ª – DA NÃO GARANTIA DE CRÉDITO",
        texto: [
          "5.1. O CONTRATANTE declara ciência de que a aprovação, valor, taxa de juros, prazo e demais condições são definidos exclusivamente pela instituição financeira.",
          "",
          "5.2. A CONTRATADA não se responsabiliza por recusas, alterações de condições ou cancelamentos promovidos pela instituição financeira."
        ]
      },
      {
        titulo: "CLÁUSULA 6ª – DA AUTORIZAÇÃO PARA TRATAMENTO DE DADOS (LGPD)",
        texto: [
          "6.1. O CONTRATANTE autoriza expressamente a CONTRATADA a coletar, armazenar, tratar e compartilhar seus dados pessoais e financeiros, exclusivamente para fins de análise e intermediação das operações financeiras, nos termos da Lei nº 13.709/2018 (Lei Geral de Proteção de Dados – LGPD).",
          "",
          "6.2. Os dados serão tratados com confidencialidade e segurança, não sendo utilizados para fins diversos dos previstos neste contrato."
        ]
      },
      {
        titulo: "CLÁUSULA 7ª – DA VIGÊNCIA E RESCISÃO",
        texto: [
          "7.1. O presente contrato entra em vigor na data de sua assinatura e terá validade até a conclusão da operação ou manifestação formal de desistência.",
          "",
          "7.2. O CONTRATANTE poderá desistir do serviço a qualquer momento antes da formalização da operação, sem ônus, desde que não haja proposta aprovada."
        ]
      },
      {
        titulo: "CLÁUSULA 8ª – DA RESPONSABILIDADE",
        texto: [
          "8.1. A CONTRATADA não se responsabiliza por:",
          "• Inadimplência do CONTRATANTE;",
          "• Cláusulas contratuais firmadas diretamente com a instituição financeira;",
          "• Uso indevido das informações fornecidas pelo CONTRATANTE a terceiros estranhos à relação contratual."
        ]
      },
      {
        titulo: "CLÁUSULA 9ª – DO FORO",
        texto: [
          `9.1. Fica eleito o foro da comarca de ${empresaConfig?.cidade || "[CIDADE/UF]"}, com renúncia de qualquer outro, por mais privilegiado que seja, para dirimir dúvidas oriundas deste contrato.`
        ]
      }
    ];

    clausulas2.forEach((clausula) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(clausula.titulo, margin, y);
      y += 6;
      
      doc.setFont("helvetica", "normal");
      clausula.texto.forEach((linha) => {
        const linhas = doc.splitTextToSize(linha, maxWidth);
        linhas.forEach((l: string) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(l, margin, y);
          y += 5;
        });
      });
      y += 3;
    });

    // Assinaturas
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    y += 10;
    doc.setFontSize(9);
    doc.text("E, por estarem justas e contratadas, firmam o presente instrumento em duas vias de igual teor.", margin, y);
    
    y += 15;
    const cidadeData = `${empresaConfig?.cidade || "[CIDADE]"}, ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.`;
    doc.text(cidadeData, margin, y);
    
    y += 20;
    doc.text("_".repeat(60), margin, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("CONTRATANTE", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text(`Nome: ${cliente?.nome || ""}`, margin, y);
    y += 5;
    doc.text(`CPF: ${cliente?.cpf || ""}`, margin, y);
    
    y += 15;
    doc.text("_".repeat(60), margin, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("CONTRATADA", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text(`Nome do representante: ${empresaConfig?.representante || ""}`, margin, y);
    y += 5;
    doc.text(`CPF: ${empresaConfig?.cpfRepresentante || ""}`, margin, y);
    y += 5;
    doc.text(`Cargo: ${empresaConfig?.cargoRepresentante || ""}`, margin, y);
    
    doc.save(`contrato_${cliente?.nome?.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
    toast.success("Contrato emitido com sucesso!");
  };

  const handleImprimirControleVenda = () => {
    if (!selectedCliente || !selectedProduto || !selectedFuncionario || !valorContrato || !prazo) {
      toast.error("Preencha todos os dados da venda para imprimir o controle");
      return;
    }

    const cliente = clientes.find((c) => c.id === selectedCliente);
    const produtoInfo = produtos.find((p) => p.id === selectedProduto);
    const funcionario = funcionarios.find((f) => f.id === selectedFuncionario);
    const fornecedor = fornecedores.find((f) => f.id === produtoInfo?.fornecedorId);

    const doc = new jsPDF();
    
    // Cabeçalho
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("CONTROLE DE VENDA", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 105, 30, { align: "center" });
    doc.text(`ID: VND-${Date.now().toString().slice(-8)}`, 105, 37, { align: "center" });
    
    // Linha separadora
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(20, 42, 190, 42);
    
    // DADOS DO CLIENTE
    let y = 55;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y - 6, 170, 8, 'F');
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO CLIENTE", 25, y);
    
    y += 12;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Nome: ${cliente?.nome || ""}`, 25, y);
    y += 7;
    doc.text(`CPF: ${cliente?.cpf || ""}`, 25, y);
    y += 7;
    doc.text(`Email: ${cliente?.email || ""}`, 25, y);
    y += 7;
    doc.text(`Telefone: ${cliente?.telefone || ""}`, 25, y);
    y += 7;
    doc.text(`Endereço: ${cliente?.endereco || ""}, ${cliente?.cidade || ""} - ${cliente?.estado || ""}`, 25, y);
    
    // DADOS DO PRODUTO
    y += 15;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y - 6, 170, 8, 'F');
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO PRODUTO/SERVIÇO", 25, y);
    
    y += 12;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Produto: ${produtoInfo?.nome || ""}`, 25, y);
    y += 7;
    doc.text(`Fornecedor (Banco): ${fornecedor?.nomeFantasia || fornecedor?.razaoSocial || "Não informado"}`, 25, y);
    y += 7;
    doc.text(`Taxa de Juros: ${produtoInfo?.taxaJuros || ""}%`, 25, y);
    y += 7;
    doc.text(`Comissão: ${comissaoPerc}%`, 25, y);
    
    // DADOS DA VENDA
    y += 15;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y - 6, 170, 8, 'F');
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DETALHES DA VENDA", 25, y);
    
    y += 12;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Valor do Contrato: R$ ${parseFloat(valorContrato).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 25, y);
    y += 7;
    doc.text(`Prazo: ${prazo} ${prazo === "1" ? "mês" : "meses"}`, 25, y);
    y += 7;
    const valorParcela = parseFloat(valorContrato) / parseInt(prazo);
    doc.text(`Valor da Parcela: R$ ${valorParcela.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 25, y);
    y += 7;
    const valorComissao = (parseFloat(valorContrato) * comissaoPerc) / 100;
    doc.text(`Valor da Comissão: R$ ${valorComissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 25, y);
    y += 7;
    doc.text(`Data da Venda: ${new Date().toLocaleDateString("pt-BR")}`, 25, y);
    
    // DADOS DO AGENTE
    y += 15;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y - 6, 170, 8, 'F');
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO AGENTE DE VENDAS", 25, y);
    
    y += 12;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Nome: ${funcionario?.nome || ""}`, 25, y);
    y += 7;
    doc.text(`CPF: ${funcionario?.cpf || ""}`, 25, y);
    y += 7;
    doc.text(`Email: ${funcionario?.email || ""}`, 25, y);
    y += 7;
    doc.text(`Função: ${funcionario?.funcao || funcionario?.cargo || ""}`, 25, y);
    
    // Resumo Financeiro
    y += 15;
    doc.setFillColor(220, 220, 220);
    doc.rect(20, y - 6, 170, 20, 'F');
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMO FINANCEIRO", 105, y, { align: "center" });
    
    y += 10;
    doc.setFontSize(11);
    doc.text(`Total do Contrato: R$ ${parseFloat(valorContrato).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 25, y);
    doc.text(`Comissão do Agente: R$ ${valorComissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 120, y);
    
    // Rodapé
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("Documento gerado automaticamente pelo sistema CréditoGestor", 105, 280, { align: "center" });
    doc.text("Este controle de venda serve como comprovante interno da operação", 105, 285, { align: "center" });
    
    doc.save(`controle_venda_${Date.now()}.pdf`);
    toast.success("Controle de Venda impresso com sucesso!");
  };

  const handleExportarExcel = () => {
    if (vendas.length === 0) {
      toast.error("Não há vendas para exportar");
      return;
    }

    // Preparar dados para exportação
    const dadosExportacao = vendas.map((venda) => {
      const cliente = clientes.find(c => c.id === venda.clienteId);
      const produto = produtos.find(p => p.id === venda.produtoId);
      const funcionario = funcionarios.find(f => f.id === venda.funcionarioId);
      const fornecedor = fornecedores.find(f => f.id === venda.fornecedorId);
      const banco = bancos.find(b => b.id === venda.bancoId);

      return {
        'ID Venda': venda.vendaId || venda.id,
        'Data': venda.createdAt?.toDate ? format(venda.createdAt.toDate(), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-",
        'Cliente': cliente?.nome || "-",
        'CPF Cliente': cliente?.cpf || "-",
        'Produto': produto?.nome || "-",
        'Banco': banco?.nome || fornecedor?.nomeFantasia || "-",
        'Agente': funcionario?.nome || "-",
        'Valor Contrato': venda.valorContrato,
        'Prazo (meses)': venda.prazo,
        'Comissão Agente (%)': venda.comissaoAgentePercentual || venda.comissaoPercentual || 0,
        'Comissão Agente (R$)': venda.comissaoAgente || venda.comissao || 0,
        'Comissão Fornecedor (%)': venda.comissaoFornecedorPercentual || 0,
        'Comissão Fornecedor (R$)': venda.comissaoFornecedor || 0,
        'Nº Contrato': venda.numeroContrato || "-",
        'Status': venda.status || "aprovada",
      };
    });

    // Criar planilha
    const ws = XLSX.utils.json_to_sheet(dadosExportacao);
    
    // Ajustar largura das colunas
    const colWidths = [
      { wch: 15 }, // ID Venda
      { wch: 18 }, // Data
      { wch: 30 }, // Cliente
      { wch: 15 }, // CPF
      { wch: 25 }, // Produto
      { wch: 25 }, // Banco
      { wch: 25 }, // Agente
      { wch: 15 }, // Valor Contrato
      { wch: 12 }, // Prazo
      { wch: 18 }, // Comissão Agente %
      { wch: 18 }, // Comissão Agente R$
      { wch: 20 }, // Comissão Fornecedor %
      { wch: 20 }, // Comissão Fornecedor R$
      { wch: 15 }, // Nº Contrato
      { wch: 12 }, // Status
    ];
    ws['!cols'] = colWidths;

    // Criar workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vendas");

    // Gerar arquivo
    const fileName = `vendas_${format(new Date(), "dd-MM-yyyy_HH-mm")}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast.success(`${vendas.length} vendas exportadas para Excel com sucesso!`);
  };

  const handleExportarPDF = async () => {
    if (vendas.length === 0) {
      toast.error("Não há vendas para exportar");
      return;
    }

    try {
      // Buscar configurações da empresa
      const empresaConfig = await getEmpresaConfig();

      const doc = new jsPDF('l', 'mm', 'a4'); // Orientação landscape
      
      let yPos = 15;

      // Logo da empresa (se disponível)
      if (empresaConfig?.logoUrl) {
        try {
          // Criar imagem temporária para obter as dimensões
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = empresaConfig.logoUrl;
          
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });

          // Dimensões da logo (máximo 30mm de altura)
          const logoHeight = 25;
          const logoWidth = (img.width / img.height) * logoHeight;
          
          doc.addImage(empresaConfig.logoUrl, 'PNG', 15, yPos - 5, logoWidth, logoHeight);
        } catch (error) {
          console.error("Erro ao carregar logo:", error);
        }
      }

      // Cabeçalho
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("RELATÓRIO DE VENDAS", doc.internal.pageSize.width / 2, yPos, { align: "center" });
      yPos += 7;
      
      // Nome da empresa
      if (empresaConfig?.nomeEmpresa) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(empresaConfig.nomeEmpresa, doc.internal.pageSize.width / 2, yPos, { align: "center" });
        yPos += 5;
      }

      doc.setFontSize(10);
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, doc.internal.pageSize.width / 2, yPos, { align: "center" });
      yPos += 5;
      doc.text(`Total de vendas: ${vendas.length}`, doc.internal.pageSize.width / 2, yPos, { align: "center" });

      // Preparar dados da tabela
      const dadosTabela = vendas.map((venda) => {
        const cliente = clientes.find(c => c.id === venda.clienteId);
        const produto = produtos.find(p => p.id === venda.produtoId);
        const funcionario = funcionarios.find(f => f.id === venda.funcionarioId);

        return [
          venda.vendaId || venda.id?.substring(0, 8) || "-",
          venda.createdAt?.toDate ? format(venda.createdAt.toDate(), "dd/MM/yyyy", { locale: ptBR }) : "-",
          cliente?.nome || "-",
          produto?.nome || "-",
          funcionario?.nome || "-",
          `R$ ${Number(venda.valorContrato).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          `${venda.prazo}m`,
          `R$ ${Number(venda.comissaoAgente || venda.comissao || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          venda.status || "aprovada",
        ];
      });

      // Cor primária da empresa ou azul padrão
      const corPrimaria = empresaConfig?.corPrimaria || "#2980b9";
      const rgbPrimaria = hexToRgb(corPrimaria);

      // Adicionar tabela
      autoTable(doc, {
        head: [['ID', 'Data', 'Cliente', 'Produto', 'Agente', 'Valor', 'Prazo', 'Comissão', 'Status']],
        body: dadosTabela,
        startY: yPos + 5,
        theme: 'grid',
        styles: { 
          fontSize: 9,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: rgbPrimaria,
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 10,
        },
        columnStyles: {
          0: { cellWidth: 20 },  // ID
          1: { cellWidth: 22 },  // Data
          2: { cellWidth: 45 },  // Cliente
          3: { cellWidth: 40 },  // Produto
          4: { cellWidth: 40 },  // Agente
          5: { cellWidth: 25, halign: 'right' },  // Valor
          6: { cellWidth: 15, halign: 'center' },  // Prazo
          7: { cellWidth: 25, halign: 'right' },  // Comissão
          8: { cellWidth: 20, halign: 'center' },  // Status
        },
        margin: { top: yPos + 5 },
      });

      // Rodapé com informações da empresa
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        
        const footerY = doc.internal.pageSize.height - 10;
        
        // Informações da empresa no rodapé
        if (empresaConfig?.cnpj || empresaConfig?.telefone || empresaConfig?.email) {
          const footerInfo = [];
          if (empresaConfig.cnpj) footerInfo.push(`CNPJ: ${empresaConfig.cnpj}`);
          if (empresaConfig.telefone) footerInfo.push(`Tel: ${empresaConfig.telefone}`);
          if (empresaConfig.email) footerInfo.push(empresaConfig.email);
          
          doc.text(footerInfo.join(" | "), 15, footerY);
        }
        
        doc.setFont("helvetica", "italic");
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.width - 15,
          footerY,
          { align: "right" }
        );
      }

      const fileName = `vendas_${format(new Date(), "dd-MM-yyyy_HH-mm")}.pdf`;
      doc.save(fileName);

      toast.success(`${vendas.length} vendas exportadas para PDF com sucesso!`);
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao exportar PDF");
    }
  };

  // Função auxiliar para converter hex para RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [41, 128, 185]; // Azul padrão
  };

  // Função para emitir contrato de uma venda existente
  const handleEmitirContratoVenda = async (venda: Venda) => {
    const cliente = clientes.find((c) => c.id === venda.clienteId);
    const produtoInfo = produtos.find((p) => p.id === venda.produtoId);
    
    if (!cliente || !produtoInfo) {
      toast.error("Dados da venda incompletos para gerar contrato");
      return;
    }
    
    // Buscar configurações da empresa
    let empresaConfig;
    try {
      empresaConfig = await getEmpresaConfig();
    } catch (error) {
      console.error("Erro ao buscar configurações da empresa:", error);
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxWidth = pageWidth - (margin * 2);
    let y = 20;
    
    // Cabeçalho
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    const titulo = doc.splitTextToSize("CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE INTERMEDIAÇÃO DE NEGÓCIOS BANCÁRIOS", maxWidth);
    titulo.forEach((linha: string) => {
      doc.text(linha, pageWidth / 2, y, { align: "center" });
      y += 6;
    });
    
    y += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Pelo presente instrumento particular, de um lado:", margin, y);
    
    // CONTRATADA
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("CONTRATADA:", margin, y);
    
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const nomeEmpresa = empresaConfig?.nome || "[NOME DA EMPRESA]";
    const cnpjEmpresa = empresaConfig?.cnpj || "[CNPJ]";
    const enderecoEmpresa = empresaConfig?.endereco || "[ENDEREÇO COMPLETO]";
    
    doc.text(`${nomeEmpresa}, pessoa jurídica de direito privado, inscrita no CNPJ sob nº ${cnpjEmpresa},`, margin, y);
    y += 5;
    doc.text(`com sede à ${enderecoEmpresa}, doravante denominada CONTRATADA;`, margin, y);
    
    // CONTRATANTE
    y += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("CONTRATANTE:", margin, y);
    
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`${cliente.nome || "[NOME DO CLIENTE]"}, ${cliente.nacionalidade || "[nacionalidade]"}, ${cliente.estadoCivil || "[estado civil]"},`, margin, y);
    y += 5;
    doc.text(`${cliente.profissao || "[profissão]"}, portador(a) do CPF nº ${cliente.cpf || "[CPF]"} e RG nº ${cliente.rg || "[RG]"},`, margin, y);
    y += 5;
    doc.text(`residente e domiciliado(a) à ${cliente.endereco || "[ENDEREÇO]"}, doravante denominado(a) CONTRATANTE;`, margin, y);
    
    y += 10;
    doc.setFontSize(9);
    doc.text("Têm entre si justo e contratado o que segue:", margin, y);
    
    // CLÁUSULAS
    y += 10;
    const clausulas = [
      {
        titulo: "CLÁUSULA 1ª – DO OBJETO",
        texto: [
          "1.1. O presente contrato tem por objeto a prestação de serviços de intermediação de operações financeiras, consistentes na análise, encaminhamento e acompanhamento de propostas junto a instituições financeiras, referentes às seguintes modalidades:",
          "• Empréstimo consignado;",
          "• Empréstimo pessoal;",
          "• Refinanciamento;",
          "• Portabilidade de crédito;",
          "• Troca de crédito ou renegociação de dívidas;",
          "• Outras operações financeiras permitidas em lei.",
          "",
          "1.2. A CONTRATADA não é instituição financeira, não concede crédito próprio e não garante aprovação das operações, atuando exclusivamente como intermediadora entre o CONTRATANTE e as instituições financeiras."
        ]
      },
      {
        titulo: "CLÁUSULA 2ª – DAS OBRIGAÇÕES DA CONTRATADA",
        texto: [
          "2.1. Compete à CONTRATADA:",
          "a) Analisar as informações fornecidas pelo CONTRATANTE;",
          "b) Encaminhar propostas às instituições financeiras conveniadas;",
          "c) Acompanhar o andamento da proposta até sua conclusão ou recusa;",
          "d) Prestar informações claras sobre o status da operação;",
          "e) Manter sigilo sobre os dados pessoais e financeiros do CONTRATANTE."
        ]
      },
      {
        titulo: "CLÁUSULA 3ª – DAS OBRIGAÇÕES DO CONTRATANTE",
        texto: [
          "3.1. Compete ao CONTRATANTE:",
          "a) Fornecer informações e documentos verdadeiros e completos;",
          "b) Autorizar consultas cadastrais, inclusive junto a órgãos de proteção ao crédito;",
          "c) Ler atentamente as condições finais da operação antes da assinatura junto à instituição financeira;",
          "d) Responsabilizar-se integralmente pelo cumprimento das obrigações assumidas com o banco ou financeira."
        ]
      },
      {
        titulo: "CLÁUSULA 4ª – DA REMUNERAÇÃO",
        texto: [
          "4.1. Pelos serviços prestados, a CONTRATADA fará jus a uma remuneração, que poderá ocorrer das seguintes formas:",
          "• Comissão paga diretamente pela instituição financeira;",
          "• Comissão descontada do valor liberado;",
          "• Pagamento direto pelo CONTRATANTE, conforme previamente acordado.",
          "",
          "4.2. O valor da remuneração será informado previamente ao CONTRATANTE, sendo devida apenas em caso de efetiva concretização da operação financeira."
        ]
      }
    ];

    clausulas.forEach((clausula) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(clausula.titulo, margin, y);
      y += 6;
      
      doc.setFont("helvetica", "normal");
      clausula.texto.forEach((linha) => {
        const linhas = doc.splitTextToSize(linha, maxWidth);
        linhas.forEach((l: string) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(l, margin, y);
          y += 5;
        });
      });
      y += 3;
    });

    // Nova página para demais cláusulas
    doc.addPage();
    y = 20;

    const clausulas2 = [
      {
        titulo: "CLÁUSULA 5ª – DA NÃO GARANTIA DE CRÉDITO",
        texto: [
          "5.1. O CONTRATANTE declara ciência de que a aprovação, valor, taxa de juros, prazo e demais condições são definidos exclusivamente pela instituição financeira.",
          "",
          "5.2. A CONTRATADA não se responsabiliza por recusas, alterações de condições ou cancelamentos promovidos pela instituição financeira."
        ]
      },
      {
        titulo: "CLÁUSULA 6ª – DA AUTORIZAÇÃO PARA TRATAMENTO DE DADOS (LGPD)",
        texto: [
          "6.1. O CONTRATANTE autoriza expressamente a CONTRATADA a coletar, armazenar, tratar e compartilhar seus dados pessoais e financeiros, exclusivamente para fins de análise e intermediação das operações financeiras, nos termos da Lei nº 13.709/2018 (Lei Geral de Proteção de Dados – LGPD).",
          "",
          "6.2. Os dados serão tratados com confidencialidade e segurança, não sendo utilizados para fins diversos dos previstos neste contrato."
        ]
      },
      {
        titulo: "CLÁUSULA 7ª – DA VIGÊNCIA E RESCISÃO",
        texto: [
          "7.1. O presente contrato entra em vigor na data de sua assinatura e terá validade até a conclusão da operação ou manifestação formal de desistência.",
          "",
          "7.2. O CONTRATANTE poderá desistir do serviço a qualquer momento antes da formalização da operação, sem ônus, desde que não haja proposta aprovada."
        ]
      },
      {
        titulo: "CLÁUSULA 8ª – DA RESPONSABILIDADE",
        texto: [
          "8.1. A CONTRATADA não se responsabiliza por:",
          "• Inadimplência do CONTRATANTE;",
          "• Cláusulas contratuais firmadas diretamente com a instituição financeira;",
          "• Uso indevido das informações fornecidas pelo CONTRATANTE a terceiros estranhos à relação contratual."
        ]
      },
      {
        titulo: "CLÁUSULA 9ª – DO FORO",
        texto: [
          `9.1. Fica eleito o foro da comarca de ${empresaConfig?.cidade || "[CIDADE/UF]"}, com renúncia de qualquer outro, por mais privilegiado que seja, para dirimir dúvidas oriundas deste contrato.`
        ]
      }
    ];

    clausulas2.forEach((clausula) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(clausula.titulo, margin, y);
      y += 6;
      
      doc.setFont("helvetica", "normal");
      clausula.texto.forEach((linha) => {
        const linhas = doc.splitTextToSize(linha, maxWidth);
        linhas.forEach((l: string) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(l, margin, y);
          y += 5;
        });
      });
      y += 3;
    });

    // Assinaturas
    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    y += 10;
    doc.setFontSize(9);
    doc.text("E, por estarem justas e contratadas, firmam o presente instrumento em duas vias de igual teor.", margin, y);
    
    y += 15;
    const dataVenda = venda.createdAt?.toDate?.() || new Date();
    const cidadeData = `${empresaConfig?.cidade || "[CIDADE]"}, ${format(dataVenda, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.`;
    doc.text(cidadeData, margin, y);
    
    y += 20;
    doc.text("_".repeat(60), margin, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("CONTRATANTE", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text(`Nome: ${cliente.nome || ""}`, margin, y);
    y += 5;
    doc.text(`CPF: ${cliente.cpf || ""}`, margin, y);
    
    y += 15;
    doc.text("_".repeat(60), margin, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("CONTRATADA", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text(`Nome do representante: ${empresaConfig?.representante || ""}`, margin, y);
    y += 5;
    doc.text(`CPF: ${empresaConfig?.cpfRepresentante || ""}`, margin, y);
    y += 5;
    doc.text(`Cargo: ${empresaConfig?.cargoRepresentante || ""}`, margin, y);
    
    doc.save(`contrato_${cliente.nome?.replace(/\s+/g, '_')}_${venda.vendaId || venda.id}.pdf`);
    toast.success("Contrato emitido com sucesso!");
  };

  return (
    <div>
      <PageHeader
        title="Ponto de Venda (PDV)"
        description="Registre novas vendas e emita contratos"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Venda */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cliente */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">1. Selecionar Cliente</h3>
                <p className="text-sm text-muted-foreground">
                  Busque ou cadastre o cliente
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Cliente *</Label>
                <Popover open={openClienteCombobox} onOpenChange={setOpenClienteCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openClienteCombobox}
                      className="w-full justify-between"
                    >
                      {selectedCliente
                        ? `${clienteSelecionado?.nome} - CPF: ${clienteSelecionado?.cpf}`
                        : "Buscar cliente por nome ou CPF..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Digite o nome ou CPF do cliente..." />
                      <CommandList>
                        <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                        <CommandGroup>
                          {clientes.map((cliente) => (
                            <CommandItem
                              key={cliente.id}
                              value={`${cliente.nome} ${cliente.cpf}`}
                              onSelect={() => {
                                setSelectedCliente(cliente.id!);
                                setOpenClienteCombobox(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedCliente === cliente.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{cliente.nome}</span>
                                <span className="text-xs text-muted-foreground">
                                  CPF: {cliente.cpf}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </Card>

          {/* Produto */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold">2. Selecionar Produto</h3>
                <p className="text-sm text-muted-foreground">
                  Escolha o tipo de operação
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Produto *</Label>
                <Select value={selectedProduto} onValueChange={setSelectedProduto}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtos.map((produto) => (
                      <SelectItem key={produto.id} value={produto.id!}>
                        {produto.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fornecedor</Label>
                <Select value={selectedFornecedor} onValueChange={setSelectedFornecedor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((fornecedor) => (
                      <SelectItem key={fornecedor.id} value={fornecedor.id!}>
                        {fornecedor.nomeFantasia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center justify-between">
                  Banco
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setNovoBancoDialog(true)}
                  >
                    + Cadastrar Outro
                  </Button>
                </Label>
                <Select value={selectedBanco} onValueChange={setSelectedBanco}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o banco" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Bancos Cadastrados
                    </div>
                    {bancos.map((banco) => (
                      <SelectItem key={banco.id} value={banco.id!}>
                        {banco.codigo ? `${banco.codigo} - ${banco.nome}` : banco.nome}
                      </SelectItem>
                    ))}
                    
                    {BANCOS_BRASIL.length > 0 && (
                      <>
                        <Separator className="my-2" />
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          Todos os Bancos do Brasil
                        </div>
                        {BANCOS_BRASIL.map((banco) => (
                          <SelectItem key={`br-${banco.codigo}`} value={`banco-br-${banco.codigo}`}>
                            {banco.codigo} - {banco.nome}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {BANCOS_BRASIL.length} bancos disponíveis
                </p>
              </div>
              <div>
                <Label className="flex items-center justify-between">
                  Categoria
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setNovaCategoriaDialog(true)}
                  >
                    + Cadastrar
                  </Button>
                </Label>
                <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id!}>
                        {categoria.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prazo (meses) *</Label>
                <Select value={prazo} onValueChange={setPrazo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {Array.from({ length: 96 }, (_, i) => i + 1).map((p) => (
                      <SelectItem key={p} value={p.toString()}>
                        {p} {p === 1 ? 'mês' : 'meses'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor do Contrato (R$) *</Label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={valorContrato}
                  onChange={(e) => setValorContrato(e.target.value)}
                />
              </div>
              <div>
                <Label>Número do Contrato</Label>
                <Input
                  type="text"
                  placeholder="Ex: CT-2024-00001"
                  value={numeroContrato}
                  onChange={(e) => setNumeroContrato(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Número de identificação do contrato (opcional)
                </p>
              </div>
              <div>
                <Label>Data da Venda *</Label>
                <Input
                  type="date"
                  value={dataVenda}
                  onChange={(e) => setDataVenda(e.target.value)}
                  max={format(new Date(), "yyyy-MM-dd")}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Data em que a venda foi realizada
                </p>
              </div>
              <div>
                <Label>Agente Responsável *</Label>
                <Select value={selectedFuncionario} onValueChange={setSelectedFuncionario}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {funcionarios.map((func) => (
                      <SelectItem key={func.id} value={func.id!}>
                        {func.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </div>

        {/* Resumo da Venda */}
        <div className="space-y-6">
          <Card className="p-6 sticky top-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold">Resumo da Venda</h3>
                <p className="text-sm text-muted-foreground">
                  Confira os valores
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Cliente</span>
                <span className="font-medium text-sm">
                  {selectedCliente
                    ? clientes.find((c) => c.id === selectedCliente)?.nome
                    : "-"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Produto</span>
                <span className="font-medium text-sm">
                  {selectedProduto
                    ? produtos.find((p) => p.id === selectedProduto)?.nome
                    : "-"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Prazo</span>
                <span className="font-medium">{prazo ? `${prazo} meses` : "-"}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Nº Contrato</span>
                <span className="font-medium text-sm">
                  {numeroContrato || "-"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Valor do Contrato</span>
                <span className="font-semibold text-lg">
                  R$ {valorContrato ? parseFloat(valorContrato).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "0,00"}
                </span>
              </div>
              
              {podeVisualizarComissoes && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2 py-2 bg-amber-50 dark:bg-amber-950/20 px-3 rounded-md">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span className="text-xs text-amber-600 font-medium">
                      Informações visíveis apenas para Gerentes e Administradores
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Comissão Fornecedor ({comissaoFornecedorPerc}%)</span>
                    <span className="font-semibold text-orange-600 text-lg">
                      R$ {parseFloat(comissaoFornecedorValor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  
                  <Separator />
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Comissão Funcionário ({comissaoFuncionarioPerc}%)</span>
                    <span className="font-semibold text-success text-lg">
                      R$ {parseFloat(comissaoFuncionarioValor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}
              
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Comissão Total ({comissaoPerc}%)</span>
                <span className="font-semibold text-success text-lg">
                  R$ {parseFloat(comissaoValor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button 
                className="w-full gap-2" 
                size="lg" 
                onClick={handleFinalizarVenda}
                disabled={processando}
              >
                <CheckCircle2 className="w-5 h-5" />
                {processando ? "Processando..." : "Finalizar Venda"}
              </Button>
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={handleEmitirContrato}
                disabled={!selectedCliente || !selectedProduto || !valorContrato || !prazo}
              >
                <FileText className="w-5 h-5" />
                Emitir Contrato
              </Button>
              <Button 
                variant="secondary" 
                className="w-full gap-2"
                onClick={handleImprimirControleVenda}
                disabled={!selectedCliente || !selectedProduto || !selectedFuncionario || !valorContrato || !prazo}
              >
                <FileText className="w-5 h-5" />
                Imprimir Controle de Venda
              </Button>
              <Separator className="my-4" />
              <Button 
                variant="default" 
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                onClick={() => setConsultarVendasOpen(true)}
              >
                <List className="w-5 h-5" />
                Consultar Vendas
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="gap-2 text-green-600 border-green-600 hover:bg-green-50"
                  onClick={handleExportarExcel}
                  disabled={vendas.length === 0}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2 text-red-600 border-red-600 hover:bg-red-50"
                  onClick={handleExportarPDF}
                  disabled={vendas.length === 0}
                >
                  <Download className="w-4 h-4" />
                  PDF
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Dialog Consultar Vendas */}
      <Dialog open={consultarVendasOpen} onOpenChange={setConsultarVendasOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <List className="w-5 h-5" />
                Consultar Vendas
                {podeEditarOuEstornar() && (
                  <Badge variant="outline" className="ml-2">
                    <Shield className="w-3 h-3 mr-1" />
                    {userProfile?.role === "admin" ? "Administrador" : "Gerente"}
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  toast.loading("Atualizando vendas...");
                  await carregarDados();
                  toast.dismiss();
                  toast.success(`${vendas.length} vendas carregadas do banco de dados`);
                }}
              >
                Atualizar Lista
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      Nenhuma venda encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  vendas
                    .sort((a, b) => {
                      const dateA = a.createdAt?.toDate?.() || new Date(0);
                      const dateB = b.createdAt?.toDate?.() || new Date(0);
                      return dateB.getTime() - dateA.getTime();
                    })
                    .map((venda) => {
                      const cliente = clientes.find(c => c.id === venda.clienteId);
                      const produto = produtos.find(p => p.id === venda.produtoId);
                      
                      return (
                        <TableRow key={venda.id}>
                          <TableCell className="font-mono text-xs">{venda.vendaId || venda.id}</TableCell>
                          <TableCell>
                            {venda.createdAt?.toDate
                              ? format(venda.createdAt.toDate(), "dd/MM/yyyy", { locale: ptBR })
                              : "-"}
                          </TableCell>
                          <TableCell>{cliente?.nome || "-"}</TableCell>
                          <TableCell>{produto?.nome || "-"}</TableCell>
                          <TableCell className="font-semibold">
                            R$ {Number(venda.valorContrato).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>{venda.prazo} meses</TableCell>
                          <TableCell className="text-green-600 font-semibold">
                            R$ {Number(venda.comissao || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={venda.status === "cancelada" ? "destructive" : "default"}>
                              {venda.status || "aprovada"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              {/* Botão Emitir Contrato - disponível para todos */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                onClick={() => handleEmitirContratoVenda(venda)}
                                title="Emitir Contrato"
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                              
                              {/* Botão Controle de Venda - disponível para todos */}
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700"
                                onClick={() => {
                                  // Função para imprimir controle de venda específico
                                  const funcionario = funcionarios.find(f => f.id === venda.funcionarioId);
                                  const fornecedor = fornecedores.find(f => f.id === produto?.fornecedorId);
                                  
                                  const doc = new jsPDF();
                                  doc.setFontSize(20);
                                  doc.setFont("helvetica", "bold");
                                  doc.text("CONTROLE DE VENDA", 105, 20, { align: "center" });
                                  
                                  doc.setFontSize(10);
                                  doc.setFont("helvetica", "normal");
                                  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 105, 30, { align: "center" });
                                  doc.text(`ID: ${venda.vendaId || venda.id}`, 105, 37, { align: "center" });
                                  
                                  let y = 55;
                                  doc.setFillColor(240, 240, 240);
                                  doc.rect(20, y - 6, 170, 8, 'F');
                                  doc.setFontSize(12);
                                  doc.setFont("helvetica", "bold");
                                  doc.text("DADOS DO CLIENTE", 25, y);
                                  
                                  y += 12;
                                  doc.setFontSize(10);
                                  doc.setFont("helvetica", "normal");
                                  doc.text(`Nome: ${cliente?.nome || ""}`, 25, y);
                                  y += 7;
                                  doc.text(`CPF: ${cliente?.cpf || ""}`, 25, y);
                                  
                                  y += 15;
                                  doc.setFillColor(240, 240, 240);
                                  doc.rect(20, y - 6, 170, 8, 'F');
                                  doc.setFontSize(12);
                                  doc.setFont("helvetica", "bold");
                                  doc.text("DETALHES DA VENDA", 25, y);
                                  
                                  y += 12;
                                  doc.setFontSize(10);
                                  doc.setFont("helvetica", "normal");
                                  doc.text(`Produto: ${produto?.nome || ""}`, 25, y);
                                  y += 7;
                                  doc.text(`Valor: R$ ${Number(venda.valorContrato).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 25, y);
                                  y += 7;
                                  doc.text(`Prazo: ${venda.prazo} meses`, 25, y);
                                  y += 7;
                                  doc.text(`Funcionário: ${funcionario?.nome || ""}`, 25, y);
                                  
                                  doc.save(`controle_${venda.vendaId || venda.id}.pdf`);
                                  toast.success("Controle de Venda gerado!");
                                }}
                                title="Imprimir Controle de Venda"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              
                              {podeEditarOuEstornar() && (
                                <>
                                  {venda.status !== "cancelada" && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleAbrirEditar(venda)}
                                        title="Editar venda"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleAbrirEstornar(venda)}
                                        title="Estornar venda (cancelar)"
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => handleAbrirExcluir(venda)}
                                    title="Excluir venda permanentemente"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              📊 Exibindo <span className="font-semibold text-foreground">{vendas.length}</span> {vendas.length === 1 ? 'venda' : 'vendas'} carregada(s) do banco de dados
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Venda */}
      <Dialog open={editarVendaOpen} onOpenChange={setEditarVendaOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Venda
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label>Cliente *</Label>
              <Select value={editClienteId} onValueChange={setEditClienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id!}>
                      {cliente.nome} - CPF: {cliente.cpf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Produto *</Label>
              <Select value={editProdutoId} onValueChange={setEditProdutoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {produtos.map((produto) => (
                    <SelectItem key={produto.id} value={produto.id!}>
                      {produto.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Agente Responsável *</Label>
              <Select value={editFuncionarioId} onValueChange={setEditFuncionarioId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o agente" />
                </SelectTrigger>
                <SelectContent>
                  {funcionarios.map((func) => (
                    <SelectItem key={func.id} value={func.id!}>
                      {func.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor do Contrato (R$) *</Label>
                <Input
                  type="number"
                  value={editValorContrato}
                  onChange={(e) => setEditValorContrato(e.target.value)}
                />
              </div>
              <div>
                <Label>Prazo (meses) *</Label>
                <Select value={editPrazo} onValueChange={setEditPrazo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {Array.from({ length: 96 }, (_, i) => i + 1).map((p) => (
                      <SelectItem key={p} value={p.toString()}>
                        {p} {p === 1 ? 'mês' : 'meses'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditarVendaOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarEdicao}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Estorno */}
      <AlertDialog open={estornarConfirmOpen} onOpenChange={setEstornarConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              Confirmar Estorno de Venda
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja estornar esta venda?
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-mono font-semibold">{vendaSelecionada?.vendaId || vendaSelecionada?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-semibold">
                    {clientes.find(c => c.id === vendaSelecionada?.clienteId)?.nome}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-semibold">
                    R$ {Number(vendaSelecionada?.valorContrato || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <p className="mt-4 text-destructive font-semibold">
                Esta ação não pode ser desfeita!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEstornarVenda}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar Estorno
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Confirmar Exclusão */}
      <AlertDialog open={excluirConfirmOpen} onOpenChange={setExcluirConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Confirmar Exclusão de Venda
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p className="text-destructive font-bold text-base mb-4">
                ⚠️ ATENÇÃO: Esta ação irá EXCLUIR PERMANENTEMENTE a venda!
              </p>
              <p className="mb-4">
                A venda será removida completamente do sistema e não poderá ser recuperada.
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-mono font-semibold">{vendaSelecionada?.vendaId || vendaSelecionada?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-semibold">
                    {clientes.find(c => c.id === vendaSelecionada?.clienteId)?.nome}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-semibold">
                    R$ {Number(vendaSelecionada?.valorContrato || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-semibold">
                    {vendaSelecionada?.status || "aprovada"}
                  </span>
                </div>
              </div>
              <p className="mt-4 text-destructive font-bold">
                Esta ação é IRREVERSÍVEL! Tem certeza que deseja continuar?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluirVenda}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Sim, Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Cadastrar Banco */}
      <Dialog open={novoBancoDialog} onOpenChange={setNovoBancoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Banco</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Nome do Banco *</Label>
              <Input
                placeholder="Ex: Banco do Brasil, Caixa, Itaú..."
                value={novoBancoNome}
                onChange={(e) => setNovoBancoNome(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCadastrarBanco();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setNovoBancoDialog(false);
              setNovoBancoNome("");
            }}>
              Cancelar
            </Button>
            <Button onClick={handleCadastrarBanco}>
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Cadastrar Categoria */}
      <Dialog open={novaCategoriaDialog} onOpenChange={setNovaCategoriaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar Nova Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Nome da Categoria *</Label>
              <Input
                placeholder="Ex: Empréstimo Pessoal, Consignado, Cartão..."
                value={novaCategoriaNome}
                onChange={(e) => setNovaCategoriaNome(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCadastrarCategoria();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setNovaCategoriaDialog(false);
              setNovaCategoriaNome("");
            }}>
              Cancelar
            </Button>
            <Button onClick={handleCadastrarCategoria}>
              Cadastrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
