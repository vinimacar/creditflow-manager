import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, X, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

export interface FiltrosRelatorio {
  periodo?: DateRange;
  tipoRelatorio: "vendas" | "funcionarios" | "produtos" | "fornecedores" | "despesas" | "receitas" | "lucros" | "geral";
  fornecedor?: string;
  funcionario?: string;
  produto?: string;
  cliente?: string;
  agrupamento: "dia" | "semana" | "mes" | "ano";
}

interface FiltrosDinamicosRelatorioProps {
  filtros: FiltrosRelatorio;
  onFiltrosChange: (filtros: FiltrosRelatorio) => void;
  fornecedores?: string[];
  funcionarios?: string[];
  produtos?: string[];
  clientes?: string[];
  onGerarRelatorio: () => void;
}

export function FiltrosDinamicosRelatorio({
  filtros,
  onFiltrosChange,
  fornecedores = [],
  funcionarios = [],
  produtos = [],
  clientes = [],
  onGerarRelatorio,
}: FiltrosDinamicosRelatorioProps) {
  const limparFiltros = () => {
    onFiltrosChange({
      tipoRelatorio: "geral",
      agrupamento: "mes",
    });
  };

  const temFiltrosAtivos = filtros.periodo || filtros.fornecedor || filtros.funcionario || filtros.produto || filtros.cliente;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Filtros de Relatório</h3>
            <p className="text-sm text-muted-foreground">
              Configure os parâmetros para gerar o relatório
            </p>
          </div>
        </div>
        {temFiltrosAtivos && (
          <Button
            variant="ghost"
            size="sm"
            onClick={limparFiltros}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
            Limpar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Tipo de Relatório */}
        <div className="space-y-2">
          <Label>Tipo de Relatório</Label>
          <Select
            value={filtros.tipoRelatorio}
            onValueChange={(value: string) =>
              onFiltrosChange({ ...filtros, tipoRelatorio: value as FiltrosRelatorio["tipoRelatorio"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="geral">📊 Visão Geral</SelectItem>
              <SelectItem value="vendas">💰 Vendas</SelectItem>
              <SelectItem value="receitas">💵 Receitas</SelectItem>
              <SelectItem value="despesas">💸 Despesas</SelectItem>
              <SelectItem value="lucros">📈 Lucros</SelectItem>
              <SelectItem value="funcionarios">👥 Funcionários</SelectItem>
              <SelectItem value="produtos">📦 Produtos</SelectItem>
              <SelectItem value="fornecedores">🏢 Fornecedores</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Período */}
        <div className="space-y-2 md:col-span-2 lg:col-span-1">
          <Label>Período</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filtros.periodo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filtros.periodo?.from ? (
                  filtros.periodo.to ? (
                    <>
                      {format(filtros.periodo.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                      {format(filtros.periodo.to, "dd/MM/yy", { locale: ptBR })}
                    </>
                  ) : (
                    format(filtros.periodo.from, "dd/MM/yyyy", { locale: ptBR })
                  )
                ) : (
                  "Selecione o período"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={filtros.periodo?.from}
                selected={filtros.periodo}
                onSelect={(range) =>
                  onFiltrosChange({ ...filtros, periodo: range })
                }
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Agrupamento */}
        <div className="space-y-2">
          <Label>Agrupamento</Label>
          <Select
            value={filtros.agrupamento}
            onValueChange={(value: string) =>
              onFiltrosChange({ ...filtros, agrupamento: value as FiltrosRelatorio["agrupamento"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dia">Por Dia</SelectItem>
              <SelectItem value="semana">Por Semana</SelectItem>
              <SelectItem value="mes">Por Mês</SelectItem>
              <SelectItem value="ano">Por Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fornecedor (condicional) */}
        {filtros.tipoRelatorio !== "fornecedores" && fornecedores.length > 0 && (
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
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {fornecedores.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Funcionário (condicional) */}
        {filtros.tipoRelatorio !== "funcionarios" && funcionarios.length > 0 && (
          <div className="space-y-2">
            <Label>Funcionário</Label>
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
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {funcionarios.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Produto (condicional) */}
        {filtros.tipoRelatorio !== "produtos" && produtos.length > 0 && (
          <div className="space-y-2">
            <Label>Produto</Label>
            <Select
              value={filtros.produto || "todos"}
              onValueChange={(value) =>
                onFiltrosChange({
                  ...filtros,
                  produto: value === "todos" ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {produtos.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Cliente */}
        {clientes.length > 0 && (
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select
              value={filtros.cliente || "todos"}
              onValueChange={(value) =>
                onFiltrosChange({
                  ...filtros,
                  cliente: value === "todos" ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {clientes.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={onGerarRelatorio} size="lg" className="gap-2">
          <BarChart3 className="w-4 h-4" />
          Gerar Relatório
        </Button>
      </div>
    </Card>
  );
}
