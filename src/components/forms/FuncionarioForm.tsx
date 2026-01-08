import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { toast } from "sonner";
import { cpfValidation, telefoneValidation, cepValidation } from "@/lib/zod-validations";
import { mascaraCPF, mascaraTelefone, mascaraCEP, buscarCEP } from "@/lib/validations";
import { addFuncionario, updateFuncionario } from "@/lib/firestore";

const funcionarioSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cpf: cpfValidation,
  email: z.string().email("Email inválido"),
  telefone: telefoneValidation,
  endereco: z.string().min(5, "Endereço é obrigatório"),
  cidade: z.string().min(2, "Cidade é obrigatória"),
  uf: z.string().min(2, "UF é obrigatória"),
  cep: cepValidation,
  dataNascimento: z.string().min(10, "Data de nascimento é obrigatória"),
  dataAdmissao: z.string().min(10, "Data de admissão é obrigatória"),
  dataDemissao: z.string().optional(),
});

type FuncionarioFormData = z.infer<typeof funcionarioSchema>;

interface FuncionarioFormProps {
  onSuccess: () => void;
  initialData?: Partial<FuncionarioFormData>;
}

const estados = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export function FuncionarioForm({ onSuccess, initialData }: FuncionarioFormProps) {
  const [buscandoCEP, setBuscandoCEP] = useState(false);
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FuncionarioFormData>({
    resolver: zodResolver(funcionarioSchema),
    defaultValues: initialData,
  });

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorMascarado = mascaraCPF(e.target.value);
    setValue("cpf", valorMascarado);
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorMascarado = mascaraTelefone(e.target.value);
    setValue("telefone", valorMascarado);
  };

  const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorMascarado = mascaraCEP(e.target.value);
    setValue("cep", valorMascarado);

    // Busca automaticamente quando o CEP estiver completo
    if (valorMascarado.replace(/\D/g, '').length === 8) {
      setBuscandoCEP(true);
      try {
        const dados = await buscarCEP(valorMascarado);
        if (dados) {
          setValue("endereco", dados.logradouro);
          setValue("cidade", dados.localidade);
          setValue("uf", dados.uf);
          toast.success("CEP encontrado!");
        }
      } catch (error) {
        toast.error("CEP não encontrado");
      } finally {
        setBuscandoCEP(false);
      }
    }
  };

  const onSubmit = async (data: FuncionarioFormData) => {
    try {
      if (initialData?.id) {
        // Atualizar funcionário existente
        await updateFuncionario(initialData.id, {
          ...data,
          status: "ativo",
        });
        toast.success("Funcionário atualizado com sucesso!");
      } else {
        // Criar novo funcionário
        await addFuncionario({
          ...data,
          status: "ativo",
        });
        toast.success("Funcionário cadastrado com sucesso!");
      }
      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar funcionário:", error);
      toast.error("Erro ao salvar funcionário. Tente novamente.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="nome">Nome Completo *</Label>
          <Input id="nome" {...register("nome")} placeholder="Digite o nome completo" />
          {errors.nome && <p className="text-sm text-destructive mt-1">{errors.nome.message}</p>}
        </div>

        <div>
          <Label htmlFor="cpf">CPF *</Label>
          <Input id="cpf" {...register("cpf")} placeholder="000.000.000-00" />
          {errors.cpf && <p className="text-sm text-destructive mt-1">{errors.cpf.message}</p>}
        </div>

        <div>
          <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
          <Input id="dataNascimento" type="date" {...register("dataNascimento")} />
          {errors.dataNascimento && <p className="text-sm text-destructive mt-1">{errors.dataNascimento.message}</p>}
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" {...register("email")} placeholder="email@empresa.com" />
          {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <Label htmlFor="telefone">Telefone *</Label>
          <Input 
            id="telefone" 
            {...register("telefone")} 
            onChange={handleTelefoneChange}
            placeholder="(00) 00000-0000"
            maxLength={15}
          />
          {errors.telefone && <p className="text-sm text-destructive mt-1">{errors.telefone.message}</p>}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="endereco">Endereço *</Label>
          <Input id="endereco" {...register("endereco")} placeholder="Rua, número, bairro" />
          {errors.endereco && <p className="text-sm text-destructive mt-1">{errors.endereco.message}</p>}
        </div>

        <div>
          <Label htmlFor="cidade">Cidade *</Label>
          <Input id="cidade" {...register("cidade")} placeholder="Digite a cidade" />
          {errors.cidade && <p className="text-sm text-destructive mt-1">{errors.cidade.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="uf">UF *</Label>
            <Select onValueChange={(value) => setValue("uf", value)}>
              <SelectTrigger>
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                {estados.map((uf) => (
                  <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.uf && <p className="text-sm text-destructive mt-1">{errors.uf.message}</p>}
          </div>

          <div>
            <Label htmlFor="cep">CEP {buscandoCEP && "(Buscando...)"}</Label>
            <Input 
              id="cep" 
              {...register("cep")} 
              onChange={handleCEPChange}
              placeholder="00000-000"
              maxLength={9}
              disabled={buscandoCEP}
            />
            {errors.cep && <p className="text-sm text-destructive mt-1">{errors.cep.message}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="dataAdmissao">Data de Admissão *</Label>
          <Input id="dataAdmissao" type="date" {...register("dataAdmissao")} />
          {errors.dataAdmissao && <p className="text-sm text-destructive mt-1">{errors.dataAdmissao.message}</p>}
        </div>

        <div>
          <Label htmlFor="dataDemissao">Data de Demissão</Label>
          <Input id="dataDemissao" type="date" {...register("dataDemissao")} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar Funcionário"}
        </Button>
      </div>
    </form>
  );
}
