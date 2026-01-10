import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface FiltrosConciliacao {
  periodo?: {
    inicio: Date;
    fim: Date;
  };
  fornecedor?: string;
  funcionario?: string;
  statusDivergencia?: "todos" | "ok" | "divergente" | "nao_encontrado";
  valorMinimo?: number;
  valorMaximo?: number;
  [key: string]: unknown;
}

interface FiltrosInteligentesConciliacaoProps {
  filtros: FiltrosConciliacao;
  onFiltrosChange: (filtros: FiltrosConciliacao) => void;
  fornecedores: string[];
  funcionarios: string[];
}

export function FiltrosInteligentesConciliacao({
  filtros,
  onFiltrosChange,
  fornecedores,
  funcionarios,
}: FiltrosInteligentesConciliacaoProps) {
  const [dataInicio, setDataInicio] = useState<Date | undefined>(filtros.periodo?.inicio);
  const [dataFim, setDataFim] = useState<Date | undefined>(filtros.periodo?.fim);

  const handlePeriodoChange = (inicio?: Date, fim?: Date) => {
    if (inicio && fim) {
      onFiltrosChange({
        ...filtros,
        periodo: { inicio, fim },
      });
    } else {
      const { periodo, ...restoFiltros } = filtros;
      onFiltrosChange(restoFiltros);
    }
  };

  const limparFiltros = () => {
    setDataInicio(undefined);
    setDataFim(undefined);
    onFiltrosChange({});
  };

  const temFiltrosAtivos = Object.keys(filtros).length > 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Filtros de Conciliação</h3>
        {temFiltrosAtivos && (
          <Button
            variant="ghost"
            size="sm"
            onClick={limparFiltros}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
            Limpar Filtros
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Período */}
        <div className="space-y-2 md:col-span-2 lg:col-span-1">
          <Label>Período</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !dataInicio && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Data inicial"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dataInicio}
                  onSelect={(date) => {
                    setDataInicio(date);
                    if (date && dataFim) {
                      handlePeriodoChange(date, dataFim);
                    }
                  }}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !dataFim && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Data final"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dataFim}
                  onSelect={(date) => {
                    setDataFim(date);
                    if (dataInicio && date) {
                      handlePeriodoChange(dataInicio, date);
                    }
                  }}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Fornecedor */}
        <div className="space-y-2">
          <Label>Fornecedor</Label>
          <Select
            value={filtros.fornecedor || "todos"}
            onValueChange={(value) =>
              onFiltrosChange({
                ...filtros,
                fornecedor: value === "todos" ? undefined : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os fornecedores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os fornecedores</SelectItem>
              {fornecedores.map((fornecedor) => (
                <SelectItem key={fornecedor} value={fornecedor}>
                  {fornecedor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Funcionário */}
        <div className="space-y-2">
          <Label>Funcionário/Agente</Label>
          <Select
            value={filtros.funcionario || "todos"}
            onValueChange={(value) =>
              onFiltrosChange({
                ...filtros,
                funcionario: value === "todos" ? undefined : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os funcionários" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os funcionários</SelectItem>
              {funcionarios.map((funcionario) => (
                <SelectItem key={funcionario} value={funcionario}>
                  {funcionario}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={filtros.statusDivergencia || "todos"}
            onValueChange={(value) =>
              onFiltrosChange({
                ...filtros,
                statusDivergencia: value as "todos" | "ok" | "divergente" | "nao_encontrado",
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ok">✓ Conciliado</SelectItem>
              <SelectItem value="divergente">⚠ Divergente</SelectItem>
              <SelectItem value="nao_encontrado">✗ Não Encontrado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Valor Mínimo */}
        <div className="space-y-2">
          <Label>Valor Mínimo (R$)</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="0,00"
            value={filtros.valorMinimo || ""}
            onChange={(e) =>
              onFiltrosChange({
                ...filtros,
                valorMinimo: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
          />
        </div>

        {/* Valor Máximo */}
        <div className="space-y-2">
          <Label>Valor Máximo (R$)</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="0,00"
            value={filtros.valorMaximo || ""}
            onChange={(e) =>
              onFiltrosChange({
                ...filtros,
                valorMaximo: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
          />
        </div>
      </div>
    </Card>
  );
}
