import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import {
  getFornecedores,
  getBancos,
  getCategoriasProdutos,
  type Fornecedor,
  type Banco,
  type CategoriaProduto,
  type Produto,
  updateProduto
} from "@/lib/firestore";

interface ComissaoFaixa {
  id: string;
  valorMin: number;
  valorMax: number;
  percentual: number;
}

interface ProdutoFormProps {
  onSuccess: () => void;
  initialData?: Partial<Produto>;
}


export function ProdutoForm({ onSuccess, initialData }: ProdutoFormProps) {
  const [formData, setFormData] = useState({
    nome: initialData?.nome || "",
    categoria: initialData?.categoria || "",
    categoriaId: initialData?.categoriaId || "",
    descricao: initialData?.descricao || "",
    valorMinimo: initialData?.valorMinimo || 0,
    valorMaximo: initialData?.valorMaximo || 0,
    prazoMinimo: initialData?.prazoMinimo || initialData?.prazoMin || 12,
    prazoMaximo: initialData?.prazoMaximo || initialData?.prazoMax || 84,
    taxaJuros: initialData?.taxaJuros || 0,
    taxaNegociada: initialData?.taxaNegociada || 0,
    comissaoFornecedor: initialData?.comissaoFornecedor || 0,
    comissaoAgente: initialData?.comissaoAgente || initialData?.comissao || 0,
    fornecedorId: initialData?.fornecedorId || "",
    bancoId: initialData?.bancoId || "",
    status: (initialData?.status as "ativo" | "inativo") || "ativo",
    comissoes: (initialData?.comissoes as ComissaoFaixa[]) || [
      { id: "1", valorMin: 0, valorMax: 10000, percentual: 3.5 },
    ],
  });

  const [salvando, setSalvando] = useState(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([]);

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
    loadDados();
  }, []);

  const handleChange = <K extends keyof typeof formData>(field: K, value: any) => {
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      if (initialData?.id) {
        await updateProduto(initialData.id, {
          ...formData,
          updatedAt: new Date(),
        });
        toast.success("Produto atualizado com sucesso!");
      } else {
        toast.success("Produto salvo com sucesso!");
      }
      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      toast.error("Erro ao salvar produto");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
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
          <Label htmlFor="categoria">Categoria *</Label>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

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
          {formData.comissoes.map((comissao) => (
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

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : initialData?.id ? "Atualizar Produto" : "Salvar Produto"}
        </Button>
      </div>
    </form>
  );
}
