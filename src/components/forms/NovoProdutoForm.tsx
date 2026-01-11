import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getFornecedores, getBancos, getCategoriasProdutos, addCategoriaProduto, type Fornecedor, type Banco, type CategoriaProduto } from "@/lib/firestore";

interface ComissaoFaixa {
  id: string;
  valorMin: number;
  valorMax: number;
  percentual: number;
}

interface NovoProdutoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSalvar: (produto: ProdutoNovo) => void;
}

export interface ProdutoNovo {
  nome: string;
  categoria: string; // Mantido para compatibilidade (deprecated - usar categoriaId)
  categoriaId?: string; // ID da categoria do produto
  descricao: string;
  valorMinimo: number;
  valorMaximo: number;
  prazoMinimo: number;
  prazoMaximo: number;
  taxaJuros: number;
  taxaNegociada?: number; // Taxa específica negociada com o fornecedor
  comissaoFornecedor: number; // Comissão paga pelo fornecedor (%)
  comissaoAgente: number; // Comissão para o agente vendedor (%)
  fornecedorId?: string; // ID do fornecedor
  bancoId?: string; // ID do banco
  status: "ativo" | "inativo";
  comissoes: ComissaoFaixa[];
}

export function NovoProdutoForm({ open, onOpenChange, onSalvar }: NovoProdutoFormProps) {
  const [formData, setFormData] = useState<ProdutoNovo>({
    nome: "",
    categoria: "",
    descricao: "",
    valorMinimo: 0,
    valorMaximo: 0,
    prazoMinimo: 12,
    prazoMaximo: 84,
    taxaJuros: 0,
    taxaNegociada: 0,
    comissaoFornecedor: 0,
    comissaoAgente: 0,
    status: "ativo",
    comissoes: [
      { id: "1", valorMin: 0, valorMax: 10000, percentual: 3.5 },
    ],
  });

  const [salvando, setSalvando] = useState(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([]);
  const [novaCategoriaDialog, setNovaCategoriaDialog] = useState(false);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState("");
  
  // Categorias padrão do sistema
  const CATEGORIAS_PADRAO = [
    "Empréstimo Pessoal",
    "Empréstimo Consignado",
    "Portabilidade",
    "FGTS",
    "Troca Cartão",
    "Venda Digital",
    "Refin da Portabilidade",
    "REFIN",
    "Saque Digital",
  ];

  useEffect(() => {
    const loadDados = async () => {
      try {
        const [fornecedoresData, bancosData, categoriasData] = await Promise.all([
          getFornecedores(),
          getBancos(),
          getCategoriasProdutos(),
        ]);
        setFornecedores(fornecedoresData);
        setBancos(bancosData);
        setCategorias(categoriasData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };
    if (open) {
      loadDados();
    }
  }, [open]);

  const handleCriarCategoria = async () => {
    if (!novaCategoriaNome.trim()) {
      toast.error("Digite o nome da categoria");
      return;
    }

    try {
      await addCategoriaProduto({
        nome: novaCategoriaNome.trim(),
        status: "ativo",
      });
      
      toast.success("Categoria cadastrada com sucesso!");
      setNovaCategoriaDialog(false);
      setNovaCategoriaNome("");
      
      // Recarregar categorias
      const categoriasData = await getCategoriasProdutos();
      setCategorias(categoriasData);
    } catch (error) {
      console.error("Erro ao criar categoria:", error);
      toast.error("Erro ao cadastrar categoria");
    }
  };

  const handleChange = <K extends keyof ProdutoNovo>(field: K, value: ProdutoNovo[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const adicionarFaixa = () => {
    const novaFaixa: ComissaoFaixa = {
      id: Date.now().toString(),
      valorMin: formData.comissoes[formData.comissoes.length - 1]?.valorMax || 0,
      valorMax: 0,
      percentual: 0,
    };
    handleChange("comissoes", [...formData.comissoes, novaFaixa]);
  };

  const removerFaixa = (id: string) => {
    if (formData.comissoes.length === 1) {
      toast.error("Deve haver pelo menos uma faixa de comissão");
      return;
    }
    handleChange("comissoes", formData.comissoes.filter(c => c.id !== id));
  };

  const atualizarFaixa = (id: string, field: keyof ComissaoFaixa, value: number) => {
    handleChange(
      "comissoes",
      formData.comissoes.map(c => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSalvar = async () => {
    // Validações
    if (!formData.nome.trim()) {
      toast.error("Nome do produto é obrigatório");
      return;
    }

    if (!formData.categoriaId && !formData.categoria) {
      toast.error("Selecione uma categoria");
      return;
    }

    if (formData.valorMinimo <= 0) {
      toast.error("Valor mínimo deve ser maior que zero");
      return;
    }

    if (formData.valorMaximo <= formData.valorMinimo) {
      toast.error("Valor máximo deve ser maior que o valor mínimo");
      return;
    }

    // Validar comissões
    for (const comissao of formData.comissoes) {
      if (comissao.percentual <= 0 || comissao.percentual > 100) {
        toast.error("Percentual de comissão deve estar entre 0 e 100");
        return;
      }
      if (comissao.valorMax <= comissao.valorMin) {
        toast.error("Valor máximo da faixa deve ser maior que o mínimo");
        return;
      }
    }

    setSalvando(true);
    try {
      await onSalvar(formData);
      toast.success("Produto cadastrado com sucesso!");
      onOpenChange(false);
      // Reset form
      setFormData({
        nome: "",
        categoria: "",
        descricao: "",
        valorMinimo: 0,
        valorMaximo: 0,
        prazoMinimo: 12,
        prazoMaximo: 84,
        taxaJuros: 0,
        taxaNegociada: 0,
        comissaoFornecedor: 0,
        comissaoAgente: 0,
        status: "ativo",
        comissoes: [{ id: "1", valorMin: 0, valorMax: 10000, percentual: 3.5 }],
      });
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      toast.error("Erro ao cadastrar produto");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Produto</DialogTitle>
          <DialogDescription>
            Cadastre um novo produto financeiro com suas características e comissões
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Produto *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                placeholder="Ex: Consignado INSS"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria" className="flex items-center justify-between">
                Categoria *
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setNovaCategoriaDialog(true)}
                >
                  + Nova Categoria
                </Button>
              </Label>
              <Select 
                value={formData.categoriaId} 
                onValueChange={(v) => {
                  const categoriaSelecionada = categorias.find(c => c.id === v);
                  handleChange("categoriaId", v);
                  if (categoriaSelecionada) {
                    handleChange("categoria", categoriaSelecionada.nome);
                  }
                }}
              >
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {CATEGORIAS_PADRAO.map((catNome) => {
                    const categoriaExistente = categorias.find(
                      (c) => c.nome.toLowerCase() === catNome.toLowerCase()
                    );
                    if (categoriaExistente) {
                      return (
                        <SelectItem key={categoriaExistente.id} value={categoriaExistente.id!}>
                          {categoriaExistente.nome}
                        </SelectItem>
                      );
                    }
                    return null;
                  })}
                  
                  {categorias.filter(
                    (c) => !CATEGORIAS_PADRAO.some(
                      (cp) => cp.toLowerCase() === c.nome.toLowerCase()
                    )
                  ).map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id!}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {CATEGORIAS_PADRAO.length} categorias padrão disponíveis
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleChange("descricao", e.target.value)}
              placeholder="Descreva as características do produto..."
              rows={3}
            />
          </div>

          {/* Valores e Prazos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valorMinimo">Valor Mínimo (R$)</Label>
              <Input
                id="valorMinimo"
                type="number"
                value={formData.valorMinimo}
                onChange={(e) => handleChange("valorMinimo", parseFloat(e.target.value) || 0)}
                min="0"
                step="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorMaximo">Valor Máximo (R$)</Label>
              <Input
                id="valorMaximo"
                type="number"
                value={formData.valorMaximo}
                onChange={(e) => handleChange("valorMaximo", parseFloat(e.target.value) || 0)}
                min="0"
                step="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prazoMinimo">Prazo Mín. (meses)</Label>
              <Input
                id="prazoMinimo"
                type="number"
                value={formData.prazoMinimo}
                onChange={(e) => handleChange("prazoMinimo", parseInt(e.target.value) || 0)}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prazoMaximo">Prazo Máx. (meses)</Label>
              <Input
                id="prazoMaximo"
                type="number"
                value={formData.prazoMaximo}
                onChange={(e) => handleChange("prazoMaximo", parseInt(e.target.value) || 0)}
                min="1"
              />
            </div>
          </div>

          {/* Taxas e Comissões */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxaJuros">Taxa de Juros (% a.m.)</Label>
              <Input
                id="taxaJuros"
                type="number"
                value={formData.taxaJuros}
                onChange={(e) => handleChange("taxaJuros", parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxaNegociada">Taxa Negociada (% a.m.)</Label>
              <Input
                id="taxaNegociada"
                type="number"
                value={formData.taxaNegociada || 0}
                onChange={(e) => handleChange("taxaNegociada", parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                placeholder="Taxa acordada com fornecedor"
              />
              <p className="text-xs text-muted-foreground">
                Taxa específica negociada para este produto
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comissaoFornecedor">Comissão Fornecedor (%)</Label>
              <Input
                id="comissaoFornecedor"
                type="number"
                value={formData.comissaoFornecedor}
                onChange={(e) => handleChange("comissaoFornecedor", parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.1"
                placeholder="% paga pelo fornecedor"
              />
              <p className="text-xs text-muted-foreground">
                Percentual que o fornecedor paga sobre a venda
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="comissaoAgente">Comissão Agente (%)</Label>
              <Input
                id="comissaoAgente"
                type="number"
                value={formData.comissaoAgente}
                onChange={(e) => handleChange("comissaoAgente", parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.1"
                placeholder="% para o agente"
              />
              <p className="text-xs text-muted-foreground">
                Percentual que o agente recebe sobre a venda
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fornecedor">Fornecedor</Label>
              <Select value={formData.fornecedorId} onValueChange={(v) => handleChange("fornecedorId", v)}>
                <SelectTrigger id="fornecedor">
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores.map((fornecedor) => (
                    <SelectItem key={fornecedor.id} value={fornecedor.id!}>
                      {fornecedor.nomeFantasia || fornecedor.razaoSocial}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="banco">Banco</Label>
              <Select value={formData.bancoId} onValueChange={(v) => handleChange("bancoId", v)}>
                <SelectTrigger id="banco">
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent>
                  {bancos.length === 0 ? (
                    <SelectItem value="sem-banco" disabled>
                      Nenhum banco cadastrado
                    </SelectItem>
                  ) : (
                    bancos.map((banco) => (
                      <SelectItem key={banco.id} value={banco.id!}>
                        {banco.codigo ? `${banco.codigo} - ${banco.nome}` : banco.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Banco responsável pelo produto
              </p>
            </div>
          </div>

          {/* Comissões */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="comissaoFornecedor">Comissão Paga pelo Fornecedor (%)</Label>
              <Input
                id="comissaoFornecedor"
                type="number"
                value={formData.comissaoFornecedor}
                onChange={(e) => handleChange("comissaoFornecedor", parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.01"
                placeholder="Ex: 3.5"
              />
              <p className="text-xs text-muted-foreground">
                Percentual que o banco paga sobre o valor do contrato
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comissaoAgente">Comissão do Agente Vendedor (%)</Label>
              <Input
                id="comissaoAgente"
                type="number"
                value={formData.comissaoAgente}
                onChange={(e) => handleChange("comissaoAgente", parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.01"
                placeholder="Ex: 2.5"
              />
              <p className="text-xs text-muted-foreground">
                Percentual de comissão para o agente vendedor
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(v: "ativo" | "inativo") => handleChange("status", v)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabela de Comissões */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Tabela de Comissões</Label>
              <Button type="button" variant="outline" size="sm" onClick={adicionarFaixa} className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Faixa
              </Button>
            </div>

            <div className="space-y-3">
              {formData.comissoes.map((comissao, index) => (
                <Card key={comissao.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Valor Mín. (R$)</Label>
                        <Input
                          type="number"
                          value={comissao.valorMin}
                          onChange={(e) => atualizarFaixa(comissao.id, "valorMin", parseFloat(e.target.value) || 0)}
                          min="0"
                          step="100"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Valor Máx. (R$)</Label>
                        <Input
                          type="number"
                          value={comissao.valorMax}
                          onChange={(e) => atualizarFaixa(comissao.id, "valorMax", parseFloat(e.target.value) || 0)}
                          min="0"
                          step="100"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Comissão (%)</Label>
                        <Input
                          type="number"
                          value={comissao.percentual}
                          onChange={(e) => atualizarFaixa(comissao.id, "percentual", parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removerFaixa(comissao.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button onClick={handleSalvar} disabled={salvando}>
          {salvando ? "Salvando..." : "Cadastrar Produto"}
        </Button>
      </DialogFooter>
    </DialogContent>

    {/* Dialog Nova Categoria */}
    <Dialog open={novaCategoriaDialog} onOpenChange={setNovaCategoriaDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Categoria</DialogTitle>
          <DialogDescription>
            Cadastre uma nova categoria de produto
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nomeCategoria">Nome da Categoria *</Label>
            <Input
              id="nomeCategoria"
              value={novaCategoriaNome}
              onChange={(e) => setNovaCategoriaNome(e.target.value)}
              placeholder="Ex: Saque Aniversário FGTS"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCriarCategoria();
                }
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setNovaCategoriaDialog(false);
              setNovaCategoriaNome("");
            }}
          >
            Cancelar
          </Button>
          <Button onClick={handleCriarCategoria}>
            Cadastrar
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    </Dialog>
  );
}
