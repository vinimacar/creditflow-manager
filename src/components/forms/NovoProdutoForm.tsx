import { useState } from "react";
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
  categoria: string;
  descricao: string;
  valorMinimo: number;
  valorMaximo: number;
  prazoMinimo: number;
  prazoMaximo: number;
  taxaJuros: number;
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
    status: "ativo",
    comissoes: [
      { id: "1", valorMin: 0, valorMax: 10000, percentual: 3.5 },
    ],
  });

  const [salvando, setSalvando] = useState(false);

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

    if (!formData.categoria) {
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
              <Label htmlFor="categoria">Categoria *</Label>
              <Select value={formData.categoria} onValueChange={(v) => handleChange("categoria", v)}>
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consignado">Consignado</SelectItem>
                  <SelectItem value="refinanciamento">Refinanciamento</SelectItem>
                  <SelectItem value="portabilidade">Portabilidade</SelectItem>
                  <SelectItem value="cartao">Cartão Consignado</SelectItem>
                  <SelectItem value="pessoal">Empréstimo Pessoal</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
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
              />
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
    </Dialog>
  );
}
