import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserRole } from "@/contexts/AuthTypes";
import type { Permissoes, Modulo, Acao } from "@/types/permissions";
import {
  PERMISSOES_PADRAO,
  MODULOS_LABELS,
  ACOES_LABELS,
} from "@/types/permissions";
import { Shield, Lock, Unlock } from "lucide-react";

interface PermissoesCargoEditorProps {
  cargo: UserRole;
  permissoes: Permissoes;
  onChange: (permissoes: Permissoes) => void;
  onSalvar: () => void;
  salvando: boolean;
}

export function PermissoesCargoEditor({
  cargo,
  permissoes,
  onChange,
  onSalvar,
  salvando,
}: PermissoesCargoEditorProps) {
  const modulos = Object.keys(MODULOS_LABELS) as Modulo[];
  const acoesPossiveis: Acao[] = ["visualizar", "criar", "editar", "excluir", "exportar"];

  const toggleAcao = (modulo: Modulo, acao: Acao) => {
    const acoesAtuais = permissoes[modulo] || [];
    const novasAcoes = acoesAtuais.includes(acao)
      ? acoesAtuais.filter((a) => a !== acao)
      : [...acoesAtuais, acao];

    onChange({
      ...permissoes,
      [modulo]: novasAcoes,
    });
  };

  const restaurarPadrao = () => {
    onChange(PERMISSOES_PADRAO[cargo]);
  };

  const cargoLabels: Record<UserRole, string> = {
    admin: "Administrador",
    gerente: "Gerente",
    agente: "Agente",
    atendente: "Atendente",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Permissões - {cargoLabels[cargo]}</h3>
          <p className="text-sm text-muted-foreground">
            Configure o que usuários com este cargo podem acessar
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={restaurarPadrao}>
          Restaurar Padrão
        </Button>
      </div>

      <div className="space-y-4">
        {modulos.map((modulo) => {
          const acoesModulo = permissoes[modulo] || [];
          const todasAcoesAtivas = acoesPossiveis.every((acao) =>
            acoesModulo.includes(acao)
          );

          return (
            <Card key={modulo} className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{MODULOS_LABELS[modulo]}</p>
                      <p className="text-xs text-muted-foreground">
                        {acoesModulo.length} {acoesModulo.length === 1 ? "permissão" : "permissões"} ativa(s)
                      </p>
                    </div>
                  </div>
                  <Badge variant={acoesModulo.length > 0 ? "default" : "secondary"}>
                    {acoesModulo.length > 0 ? <Unlock className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                    {acoesModulo.length > 0 ? "Ativo" : "Bloqueado"}
                  </Badge>
                </div>

                <Separator />

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {acoesPossiveis.map((acao) => (
                    <div key={acao} className="flex items-center space-x-2">
                      <Switch
                        checked={acoesModulo.includes(acao)}
                        onCheckedChange={() => toggleAcao(modulo, acao)}
                        id={`${modulo}-${acao}`}
                      />
                      <Label
                        htmlFor={`${modulo}-${acao}`}
                        className="text-sm cursor-pointer"
                      >
                        {ACOES_LABELS[acao]}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={onSalvar} disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar Permissões"}
        </Button>
      </div>
    </div>
  );
}
