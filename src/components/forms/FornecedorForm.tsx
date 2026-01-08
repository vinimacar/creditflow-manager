import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cnpjValidation, telefoneValidation } from "@/lib/zod-validations";
import { mascaraCNPJ, mascaraTelefone } from "@/lib/validations";

const fornecedorSchema = z.object({
  razaoSocial: z.string().min(3, "Razão Social é obrigatória"),
  nomeFantasia: z.string().min(2, "Nome Fantasia é obrigatório"),
  cnpj: cnpjValidation,
  telefone: telefoneValidation,
  email: z.string().email("Email inválido"),
});

type FornecedorFormData = z.infer<typeof fornecedorSchema>;

interface FornecedorFormProps {
  onSuccess: () => void;
  initialData?: Partial<FornecedorFormData>;
}

export function FornecedorForm({ onSuccess, initialData }: FornecedorFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FornecedorFormData>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: initialData,
  });

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorMascarado = mascaraCNPJ(e.target.value);
    setValue("cnpj", valorMascarado);
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorMascarado = mascaraTelefone(e.target.value);
    setValue("telefone", valorMascarado);
  };

  const onSubmit = async (data: FornecedorFormData) => {
    try {
      console.log("Fornecedor data:", data);
      toast.success("Fornecedor salvo com sucesso!");
      onSuccess();
    } catch (error) {
      toast.error("Erro ao salvar fornecedor");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="razaoSocial">Razão Social *</Label>
        <Input id="razaoSocial" {...register("razaoSocial")} placeholder="Nome completo da empresa" />
        {errors.razaoSocial && <p className="text-sm text-destructive mt-1">{errors.razaoSocial.message}</p>}
      </div>

      <div>
        <Label htmlFor="nomeFantasia">Nome Fantasia *</Label>
        <Input id="nomeFantasia" {...register("nomeFantasia")} placeholder="Nome comercial" />
        {errors.nomeFantasia && <p className="text-sm text-destructive mt-1">{errors.nomeFantasia.message}</p>}
      </div>

      <div>
        <Label htmlFor="cnpj">CNPJ *</Label>
        <Input 
          id="cnpj" 
          {...register("cnpj")} 
          onChange={handleCNPJChange}
          placeholder="00.000.000/0000-00"
          maxLength={18}
        />
        {errors.cnpj && <p className="text-sm text-destructive mt-1">{errors.cnpj.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" {...register("email")} placeholder="contato@empresa.com" />
          {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <Label htmlFor="telefone">Telefone *</Label>
          <Input 
            id="telefone" 
            {...register("telefone")} 
            onChange={handleTelefoneChange}
            placeholder="(00) 0000-0000"
            maxLength={15}
          />
          {errors.telefone && <p className="text-sm text-destructive mt-1">{errors.telefone.message}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar Fornecedor"}
        </Button>
      </div>
    </form>
  );
}
