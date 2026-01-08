import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { toast } from "sonner";

const produtoSchema = z.object({
  nome: z.string().min(3, "Nome é obrigatório"),
  codigo: z.string().min(2, "Código é obrigatório"),
  descricao: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  prazoMin: z.coerce.number().min(1, "Prazo mínimo é obrigatório"),
  prazoMax: z.coerce.number().min(1, "Prazo máximo é obrigatório"),
  tipoTabela: z.string().min(1, "Tipo de tabela é obrigatório"),
  comissao: z.coerce.number().min(0, "Comissão é obrigatória"),
});

type ProdutoFormData = z.infer<typeof produtoSchema>;

interface ProdutoFormProps {
  onSuccess: () => void;
  initialData?: Partial<ProdutoFormData>;
}

const tiposTabela = [
  "Tabela Price",
  "Tabela SAC",
  "Rotativo",
  "Personalizada",
];

export function ProdutoForm({ onSuccess, initialData }: ProdutoFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProdutoFormData>({
    resolver: zodResolver(produtoSchema),
    defaultValues: initialData,
  });

  const onSubmit = async (data: ProdutoFormData) => {
    try {
      console.log("Produto data:", data);
      toast.success("Produto salvo com sucesso!");
      onSuccess();
    } catch (error) {
      toast.error("Erro ao salvar produto");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="nome">Nome do Produto *</Label>
          <Input id="nome" {...register("nome")} placeholder="Ex: Empréstimo Consignado INSS" />
          {errors.nome && <p className="text-sm text-destructive mt-1">{errors.nome.message}</p>}
        </div>

        <div>
          <Label htmlFor="codigo">Código *</Label>
          <Input id="codigo" {...register("codigo")} placeholder="Ex: CONS-001" />
          {errors.codigo && <p className="text-sm text-destructive mt-1">{errors.codigo.message}</p>}
        </div>

        <div>
          <Label htmlFor="tipoTabela">Tipo de Tabela *</Label>
          <Select onValueChange={(value) => setValue("tipoTabela", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {tiposTabela.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.tipoTabela && <p className="text-sm text-destructive mt-1">{errors.tipoTabela.message}</p>}
        </div>

        <div>
          <Label htmlFor="prazoMin">Prazo Mínimo (meses) *</Label>
          <Input id="prazoMin" type="number" min="1" {...register("prazoMin")} placeholder="12" />
          {errors.prazoMin && <p className="text-sm text-destructive mt-1">{errors.prazoMin.message}</p>}
        </div>

        <div>
          <Label htmlFor="prazoMax">Prazo Máximo (meses) *</Label>
          <Input id="prazoMax" type="number" min="1" max="96" {...register("prazoMax")} placeholder="84" />
          {errors.prazoMax && <p className="text-sm text-destructive mt-1">{errors.prazoMax.message}</p>}
        </div>

        <div>
          <Label htmlFor="comissao">Comissão (%) *</Label>
          <Input id="comissao" type="number" step="0.1" {...register("comissao")} placeholder="3.0" />
          {errors.comissao && <p className="text-sm text-destructive mt-1">{errors.comissao.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="descricao">Descrição Detalhada *</Label>
        <Textarea 
          id="descricao" 
          {...register("descricao")} 
          placeholder="Descreva os detalhes do produto..."
          rows={3}
        />
        {errors.descricao && <p className="text-sm text-destructive mt-1">{errors.descricao.message}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar Produto"}
        </Button>
      </div>
    </form>
  );
}
