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
import { Eye, EyeOff } from "lucide-react";
import { cpfValidation, telefoneValidation, cepValidation } from "@/lib/zod-validations";
import { mascaraCPF, mascaraTelefone, mascaraCEP, buscarCEP } from "@/lib/validations";
import { addCliente, updateCliente } from "@/lib/firestore";

const clienteSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cpf: cpfValidation,
  email: z.string().email("Email inválido"),
  telefone: telefoneValidation,
  endereco: z.string().min(5, "Endereço é obrigatório"),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().min(2, "Cidade é obrigatória"),
  estado: z.string().min(2, "Estado é obrigatório"),
  cep: cepValidation,
  dataNascimento: z.string().min(10, "Data de nascimento é obrigatória"),
  senhaINSS: z.string().optional(),
});

type ClienteFormData = z.infer<typeof clienteSchema>;

interface ClienteFormProps {
  onSuccess: () => void;
  initialData?: Partial<ClienteFormData>;
}

const estados = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export function ClienteForm({ onSuccess, initialData }: ClienteFormProps) {
  const [buscandoCEP, setBuscandoCEP] = useState(false);
  const [mostrarSenhaINSS, setMostrarSenhaINSS] = useState(false);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: initialData,
  });

  const dataNascimento = watch("dataNascimento");

  // Função para calcular a idade atualizada
  const calcularIdade = (dataNasc: string): number | null => {
    if (!dataNasc) return null;
    
    const hoje = new Date();
    const nascimento = new Date(dataNasc);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    
    return idade;
  };

  const idadeAtual = calcularIdade(dataNascimento);

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
          setValue("bairro", dados.bairro);
          setValue("cidade", dados.localidade);
          setValue("estado", dados.uf);
          toast.success("CEP encontrado!");
        }
      } catch (error) {
        toast.error("CEP não encontrado");
      } finally {
        setBuscandoCEP(false);
      }
    }
  };

  const onSubmit = async (data: ClienteFormData) => {
    try {
      if (initialData?.id) {
        // Atualizar cliente existente
        await updateCliente(initialData.id, {
          ...data,
          status: "ativo",
        });
        toast.success("Cliente atualizado com sucesso!");
      } else {
        // Criar novo cliente
        await addCliente({
          ...data,
          status: "ativo",
        });
        toast.success("Cliente cadastrado com sucesso!");
      }
      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      toast.error("Erro ao salvar cliente. Tente novamente.");
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
          <Input 
            id="cpf" 
            {...register("cpf")} 
            onChange={handleCPFChange}
            placeholder="000.000.000-00"
            maxLength={14}
          />
          {errors.cpf && <p className="text-sm text-destructive mt-1">{errors.cpf.message}</p>}
        </div>

        <div>
          <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
          <Input id="dataNascimento" type="date" {...register("dataNascimento")} />
          {idadeAtual !== null && (
            <p className="text-sm text-muted-foreground mt-1">
              Idade: {idadeAtual} ano{idadeAtual !== 1 ? 's' : ''}
            </p>
          )}
          {errors.dataNascimento && <p className="text-sm text-destructive mt-1">{errors.dataNascimento.message}</p>}
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" {...register("email")} placeholder="email@exemplo.com" />
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

        <div>
          <Label htmlFor="cep">CEP {buscandoCEP && "(Buscando...)"}</Label>
          <Input 
            id="cep" 
            {...register("cep")} 
            onChange={handleCEPChange}
            placeholder="00000-000"
            maxLength={9}
          />
          {errors.cep && <p className="text-sm text-destructive mt-1">{errors.cep.message}</p>}
        </div>

        <div>
          <Label htmlFor="endereco">Endereço (Rua/Av) *</Label>
          <Input id="endereco" {...register("endereco")} placeholder="Nome da rua ou avenida" />
          {errors.endereco && <p className="text-sm text-destructive mt-1">{errors.endereco.message}</p>}
        </div>

        <div>
          <Label htmlFor="numero">Número</Label>
          <Input id="numero" {...register("numero")} placeholder="Nº" />
          {errors.numero && <p className="text-sm text-destructive mt-1">{errors.numero.message}</p>}
        </div>

        <div>
          <Label htmlFor="bairro">Bairro</Label>
          <Input id="bairro" {...register("bairro")} placeholder="Digite o bairro" />
          {errors.bairro && <p className="text-sm text-destructive mt-1">{errors.bairro.message}</p>}
        </div>

        <div>
          <Label htmlFor="cidade">Cidade *</Label>
          <Input id="cidade" {...register("cidade")} placeholder="Digite a cidade" />
          {errors.cidade && <p className="text-sm text-destructive mt-1">{errors.cidade.message}</p>}
        </div>

        <div>
          <Label htmlFor="estado">Estado *</Label>
          <Select onValueChange={(value) => setValue("estado", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o estado" />
            </SelectTrigger>
            <SelectContent>
              {estados.map((uf) => (
                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.estado && <p className="text-sm text-destructive mt-1">{errors.estado.message}</p>}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="senhaINSS">Senha do INSS (opcional)</Label>
          <div className="relative">
            <Input 
              id="senhaINSS" 
              type={mostrarSenhaINSS ? "text" : "password"} 
              {...register("senhaINSS")} 
              placeholder="Digite a senha do INSS"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setMostrarSenhaINSS(!mostrarSenhaINSS)}
            >
              {mostrarSenhaINSS ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          <Input id="senhaINSS" type="password" {...register("senhaINSS")} placeholder="••••••" />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar Cliente"}
        </Button>
      </div>
    </form>
  );
}
