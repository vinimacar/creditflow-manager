import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  ativa?: boolean;
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
    comissaoAtiva: initialData?.comissaoAtiva !== false, // Default true
    fornecedorId: initialData?.fornecedorId || "",
    bancoId: initialData?.bancoId || "",
    status: (initialData?.status as "ativo" | "inativo") || "ativo",
    comissoes: (initialData?.comissoes as ComissaoFaixa[]) || [
      { id: "1", valorMin: 0, valorMax: 10000, percentual: 3.5, ativa: true },
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
      ativa: true,
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
      {/* SEÇÃO 1: Informações Básicas */}
      <Card className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
        <h3 className="font-semibold text-sm mb-3 text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span className="text-blue-600">📋</span> Informações Básicas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Produto *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              placeholder="Ex: Consignado INSS"
              className="bg-white dark:bg-slate-950"
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
              <SelectTrigger id="categoria" className="bg-white dark:bg-slate-950">
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

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleChange("descricao", e.target.value)}
              placeholder="Descreva as características do produto..."
              rows={2}
              className="bg-white dark:bg-slate-950"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(v: "ativo" | "inativo") => handleChange("status", v)}>
              <SelectTrigger id="status" className="bg-white dark:bg-slate-950">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">✓ Ativo</SelectItem>
                <SelectItem value="inativo">✗ Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* SEÇÃO 2: Valores e Prazos */}
      <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-700">
        <h3 className="font-semibold text-sm mb-3 text-green-900 dark:text-green-100 flex items-center gap-2">
          <span className="text-green-600">💰</span> Valores e Prazos
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="valorMinimo">Valor Mín. (R$)</Label>
            <Input
              id="valorMinimo"
              type="number"
              value={formData.valorMinimo}
              onChange={(e) => handleChange("valorMinimo", parseFloat(e.target.value) || 0)}
              min="0"
              step="100"
              className="bg-white dark:bg-slate-950"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valorMaximo">Valor Máx. (R$)</Label>
            <Input
              id="valorMaximo"
              type="number"
              value={formData.valorMaximo}
              onChange={(e) => handleChange("valorMaximo", parseFloat(e.target.value) || 0)}
              min="0"
              step="100"
              className="bg-white dark:bg-slate-950"
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
              className="bg-white dark:bg-slate-950"
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
              className="bg-white dark:bg-slate-950"
            />
          </div>
        </div>
      </Card>

      {/* SEÇÃO 3: Taxas */}
      <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-700">
        <h3 className="font-semibold text-sm mb-3 text-amber-900 dark:text-amber-100 flex items-center gap-2">
          <span className="text-amber-600">📊</span> Taxas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="taxaJuros">Taxa de Juros (% a.m.)</Label>
            <Input
              id="taxaJuros"
              type="number"
              value={formData.taxaJuros}
              onChange={(e) => handleChange("taxaJuros", parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className="bg-white dark:bg-slate-950"
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
              className="bg-white dark:bg-slate-950"
            />
          </div>
        </div>
      </Card>

      {/* SEÇÃO 4: Fornecedor e Banco */}
      <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-700">
        <h3 className="font-semibold text-sm mb-3 text-purple-900 dark:text-purple-100 flex items-center gap-2">
          <span className="text-purple-600">🏢</span> Fornecedor e Banco
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fornecedor">Fornecedor</Label>
            <Select value={formData.fornecedorId} onValueChange={(v) => handleChange("fornecedorId", v)}>
              <SelectTrigger id="fornecedor" className="bg-white dark:bg-slate-950">
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

          <div className="space-y-2">
            <Label htmlFor="banco">Banco</Label>
            <Select value={formData.bancoId} onValueChange={(v) => handleChange("bancoId", v)}>
              <SelectTrigger id="banco" className="bg-white dark:bg-slate-950">
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
        </div>
      </Card>

      {/* SEÇÃO 5: Comissões */}
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-700">
        <h3 className="font-semibold text-sm mb-3 text-blue-900 dark:text-blue-100 flex items-center gap-2">
          <span className="text-blue-600">💵</span> Configuração de Comissões
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="comissaoFornecedor" className="flex items-center gap-2">
              <span>Comissão da Empresa (%)</span>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-normal">Recebida do fornecedor</span>
            </Label>
            <Input
              id="comissaoFornecedor"
              type="number"
              value={formData.comissaoFornecedor}
              onChange={(e) => handleChange("comissaoFornecedor", parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
              step="0.1"
              placeholder="Ex: 2.5"
              className="bg-white dark:bg-gray-950"
            />
            <p className="text-xs text-muted-foreground">Percentual que o fornecedor paga à empresa</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comissaoAgente" className="flex items-center gap-2">
              <span>Comissão do Funcionário (%)</span>
              <span className="text-xs text-green-600 dark:text-green-400 font-normal">Paga ao vendedor</span>
            </Label>
            <Input
              id="comissaoAgente"
              type="number"
              value={formData.comissaoAgente}
              onChange={(e) => handleChange("comissaoAgente", parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
              step="0.1"
              placeholder="0 = Sem comissão (salário fixo)"
              className="bg-white dark:bg-gray-950"
              disabled={!formData.comissaoAtiva}
            />
            <p className="text-xs text-muted-foreground">
              {formData.comissaoAgente > 0 
                ? `Funcionário receberá ${formData.comissaoAgente}% por venda`
                : "Deixe em 0 para funcionários com salário fixo"}
            </p>
            
            {/* Switch para ativar/desativar comissão */}
            <div className="flex items-center gap-3 pt-2 border-t">
              <Switch
                id="comissaoAtiva"
                checked={formData.comissaoAtiva !== false}
                onCheckedChange={(checked) => handleChange("comissaoAtiva", checked)}
              />
              <Label htmlFor="comissaoAtiva" className="cursor-pointer text-sm">
                {formData.comissaoAtiva !== false ? (
                  <span className="text-green-600 font-medium">✓ Comissão Ativa</span>
                ) : (
                  <span className="text-red-600 font-medium">✗ Comissão Desativada</span>
                )}
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              {formData.comissaoAtiva !== false 
                ? "Vendas deste produto pagarão comissão ao funcionário"
                : "⚠️ Vendas deste produto NÃO pagarão comissão (salário fixo)"}
            </p>
          </div>
        </div>
      </Card>

      {/* SEÇÃO 6: Tabela de Comissões por Faixa de Valor */}
      <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-700">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
              <span className="text-emerald-600">📈</span> Tabela de Comissões por Faixa de Valor
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Configure diferentes percentuais de comissão baseados no valor do contrato
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={adicionarFaixa} className="gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Faixa
          </Button>
        </div>

        <div className="space-y-3">
          {formData.comissoes.map((comissao) => (
            <Card key={comissao.id} className="p-3 bg-white dark:bg-slate-950 border-emerald-200 dark:border-emerald-800">
              <div className="flex items-start gap-3">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Valor Mín. (R$)</Label>
                    <Input
                      type="number"
                      value={comissao.valorMin}
                      onChange={(e) => atualizarFaixa(comissao.id, "valorMin", parseFloat(e.target.value) || 0)}
                      min="0"
                      step="100"
                      placeholder="0"
                      className="h-9"
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
                      placeholder="10000"
                      className="h-9"
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
                      placeholder="0"
                      disabled={!formData.comissaoAtiva || comissao.ativa === false}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Status da Faixa</Label>
                    <div className="flex items-center gap-2 h-9">
                      <Switch
                        checked={comissao.ativa !== false}
                        onCheckedChange={(checked) => {
                          handleChange(
                            "comissoes",
                            formData.comissoes.map(c => (c.id === comissao.id ? { ...c, ativa: checked } : c))
                          );
                        }}
                        disabled={!formData.comissaoAtiva}
                      />
                      <span className="text-xs font-medium">
                        {comissao.ativa !== false ? (
                          <span className="text-green-600">✓ Ativa</span>
                        ) : (
                          <span className="text-red-600">✗ Inativa</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removerFaixa(comissao.id)}
                  className="text-destructive hover:text-destructive mt-5"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <div className="flex justify-end gap-3 pt-4 border-t">
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
