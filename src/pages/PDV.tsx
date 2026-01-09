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
} from "lucide-react";
import { toast } from "sonner";
import { getClientes, getProdutos, getFuncionarios, type Cliente, type Produto, type Funcionario } from "@/lib/firestore";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import jsPDF from "jspdf";

export default function PDV() {
  const { userProfile } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<string>("");
  const [selectedProduto, setSelectedProduto] = useState<string>("");
  const [selectedFuncionario, setSelectedFuncionario] = useState<string>("");
  const [valorContrato, setValorContrato] = useState<string>("");
  const [prazo, setPrazo] = useState<string>("");
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [clientesData, produtosData, funcionariosData] = await Promise.all([
        getClientes(),
        getProdutos(),
        getFuncionarios(),
      ]);
      setClientes(clientesData);
      setProdutos(produtosData);
      setFuncionarios(funcionariosData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    }
  };

  const clientesFiltrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(buscaCliente.toLowerCase()) ||
    c.cpf.includes(buscaCliente)
  );

  const produto = produtos.find((p) => p.id === selectedProduto);
  const comissaoPerc = produto?.comissao || 0;
  const comissaoValor = valorContrato
    ? (parseFloat(valorContrato) * (comissaoPerc / 100)).toFixed(2)
    : "0.00";

  const handleFinalizarVenda = async () => {
    if (!selectedCliente || !selectedProduto || !selectedFuncionario || !valorContrato || !prazo) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setProcessando(true);
    try {
      const vendaId = `VND-${Date.now().toString().slice(-6)}`;
      
      await addDoc(collection(db, "vendas"), {
        id: vendaId,
        clienteId: selectedCliente,
        produtoId: selectedProduto,
        funcionarioId: selectedFuncionario,
        valorContrato: parseFloat(valorContrato),
        prazo: parseInt(prazo),
        comissao: parseFloat(comissaoValor),
        comissaoPercentual: comissaoPerc,
        status: "aprovada",
        criadoPor: userProfile?.uid || "",
        createdAt: Timestamp.now(),
      });

      toast.success(`Venda registrada com sucesso! ID: ${vendaId}`);
      
      // Limpar formulário
      setSelectedCliente("");
      setSelectedProduto("");
      setSelectedFuncionario("");
      setValorContrato("");
      setPrazo("");
      setBuscaCliente("");
    } catch (error) {
      console.error("Erro ao registrar venda:", error);
      toast.error("Erro ao registrar venda");
    } finally {
      setProcessando(false);
    }
  };

  const handleEmitirContrato = () => {
    if (!selectedCliente || !selectedProduto || !valorContrato || !prazo) {
      toast.error("Preencha os dados da venda para emitir o contrato");
      return;
    }

    const cliente = clientes.find((c) => c.id === selectedCliente);
    const produtoInfo = produtos.find((p) => p.id === selectedProduto);

    const doc = new jsPDF();
    
    // Cabeçalho
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("CONTRATO DE EMPRÉSTIMO", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Contrato Nº: VND-${Date.now().toString().slice(-6)}`, 105, 30, { align: "center" });
    
    // Dados do cliente
    let y = 50;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO CONTRATANTE", 20, y);
    
    y += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Nome: ${cliente?.nome || ""}`, 20, y);
    y += 7;
    doc.text(`CPF: ${cliente?.cpf || ""}`, 20, y);
    y += 7;
    doc.text(`Endereço: ${cliente?.endereco || ""}`, 20, y);
    
    // Dados do contrato
    y += 15;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO CONTRATO", 20, y);
    
    y += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Produto: ${produtoInfo?.nome || ""}`, 20, y);
    y += 7;
    doc.text(`Valor: R$ ${parseFloat(valorContrato).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, 20, y);
    y += 7;
    doc.text(`Prazo: ${prazo} meses`, 20, y);
    y += 7;
    doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 20, y);
    
    // Rodapé
    y = 250;
    doc.setFontSize(8);
    doc.text("_".repeat(80), 20, y);
    y += 5;
    doc.text("Assinatura do Contratante", 20, y);
    
    doc.save(`contrato_${Date.now()}.pdf`);
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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome ou CPF..." 
                  className="pl-9"
                  value={buscaCliente}
                  onChange={(e) => setBuscaCliente(e.target.value)}
                />
              </div>
              <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientesFiltrados.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id!}>
                      {cliente.nome} - {cliente.cpf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <Label>Prazo (meses) *</Label>
                <Select value={prazo} onValueChange={setPrazo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {[12, 24, 36, 48, 60, 72, 84, 96].map((p) => (
                      <SelectItem key={p} value={p.toString()}>
                        {p} meses
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
                <span className="text-muted-foreground">Valor do Contrato</span>
                <span className="font-semibold text-lg">
                  R$ {valorContrato ? parseFloat(valorContrato).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "0,00"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Comissão ({comissaoPerc}%)</span>
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
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
