import { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

const mockClientes = [
  { id: "1", nome: "Maria Silva Santos", cpf: "123.456.789-00" },
  { id: "2", nome: "João Pedro Oliveira", cpf: "987.654.321-00" },
  { id: "3", nome: "Ana Costa Ferreira", cpf: "456.789.123-00" },
];

const mockProdutos = [
  { id: "1", nome: "Empréstimo Consignado INSS", comissao: 3.0 },
  { id: "2", nome: "Refinanciamento", comissao: 2.5 },
  { id: "3", nome: "Portabilidade", comissao: 2.8 },
  { id: "4", nome: "Cartão Consignado", comissao: 1.5 },
];

const mockFuncionarios = [
  { id: "1", nome: "Carlos Mendes" },
  { id: "2", nome: "Fernanda Lima" },
  { id: "3", nome: "Ricardo Alves" },
];

export default function PDV() {
  const [selectedCliente, setSelectedCliente] = useState<string>("");
  const [selectedProduto, setSelectedProduto] = useState<string>("");
  const [selectedFuncionario, setSelectedFuncionario] = useState<string>("");
  const [valorContrato, setValorContrato] = useState<string>("");
  const [prazo, setPrazo] = useState<string>("");

  const produto = mockProdutos.find((p) => p.id === selectedProduto);
  const comissaoValor = produto && valorContrato
    ? (parseFloat(valorContrato) * (produto.comissao / 100)).toFixed(2)
    : "0,00";

  const handleFinalizarVenda = () => {
    if (!selectedCliente || !selectedProduto || !selectedFuncionario || !valorContrato || !prazo) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    toast.success("Venda registrada com sucesso! ID: VND-" + Date.now().toString().slice(-6));
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
                <Input placeholder="Buscar por nome ou CPF..." className="pl-9" />
              </div>
              <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {mockClientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
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
                    {mockProdutos.map((produto) => (
                      <SelectItem key={produto.id} value={produto.id}>
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
                    {mockFuncionarios.map((func) => (
                      <SelectItem key={func.id} value={func.id}>
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
                    ? mockClientes.find((c) => c.id === selectedCliente)?.nome
                    : "-"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Produto</span>
                <span className="font-medium text-sm">
                  {selectedProduto
                    ? mockProdutos.find((p) => p.id === selectedProduto)?.nome
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
                <span className="text-muted-foreground">Comissão ({produto?.comissao || 0}%)</span>
                <span className="font-semibold text-success text-lg">
                  R$ {parseFloat(comissaoValor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button className="w-full gap-2" size="lg" onClick={handleFinalizarVenda}>
                <CheckCircle2 className="w-5 h-5" />
                Finalizar Venda
              </Button>
              <Button variant="outline" className="w-full gap-2">
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
