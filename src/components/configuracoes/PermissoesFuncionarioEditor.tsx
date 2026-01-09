import { useState, useEffect } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { UserProfile } from "@/contexts/AuthTypes";
import type { Permissoes, Modulo, Acao } from "@/types/permissions";
import {
  PERMISSOES_PADRAO,
  MODULOS_LABELS,
  ACOES_LABELS,
  obterPermissoesEfetivas,
} from "@/types/permissions";
import { Shield, User, Lock, Unlock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PermissoesFuncionarioEditorProps {
  funcionarios: UserProfile[];
  onSalvar: (funcionarioId: string, permissoes: Permissoes, usarPadrao: boolean) => void;
  salvando: boolean;
}

export function PermissoesFuncionarioEditor({
  funcionarios,
  onSalvar,
  salvando,
}: PermissoesFuncionarioEditorProps) {
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<string>("");
  const [usarPermissoesCargo, setUsarPermissoesCargo] = useState(true);
  const [permissoesCustomizadas, setPermissoesCustomizadas] = useState<Permissoes>({});

  const funcionario = funcionarios.find((f) => f.uid === funcionarioSelecionado);
  const modulos = Object.keys(MODULOS_LABELS) as Modulo[];
  const acoesPossiveis: Acao[] = ["visualizar", "criar", "editar", "excluir", "exportar"];

  useEffect(() => {
    if (funcionario && usarPermissoesCargo) {
      setPermissoesCustomizadas(PERMISSOES_PADRAO[funcionario.role || "atendente"]);
    }
  }, [funcionario, usarPermissoesCargo]);

  const toggleAcao = (modulo: Modulo, acao: Acao) => {
    const acoesAtuais = permissoesCustomizadas[modulo] || [];
    const novasAcoes = acoesAtuais.includes(acao)
      ? acoesAtuais.filter((a) => a !== acao)
      : [...acoesAtuais, acao];

    setPermissoesCustomizadas({
      ...permissoesCustomizadas,
      [modulo]: novasAcoes,
    });
  };

  const handleSalvar = () => {
    if (!funcionarioSelecionado) return;
    onSalvar(funcionarioSelecionado, permissoesCustomizadas, usarPermissoesCargo);
  };

  const cargoLabels: Record<string, string> = {
    admin: "Administrador",
    gerente: "Gerente",
    agente: "Agente",
    atendente: "Atendente",
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Permissões por Funcionário</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Personalize as permissões de acesso para funcionários específicos
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Selecionar Funcionário</Label>
            <Select value={funcionarioSelecionado} onValueChange={setFuncionarioSelecionado}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um funcionário" />
              </SelectTrigger>
              <SelectContent>
                {funcionarios.map((func) => (
                  <SelectItem key={func.uid} value={func.uid}>
                    <div className="flex items-center gap-2">
                      <span>{func.displayName}</span>
                      <Badge variant="outline" className="text-xs">
                        {cargoLabels[func.role || "atendente"]}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {funcionario && (
            <div>
              <Label>Tipo de Permissões</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Switch
                  checked={usarPermissoesCargo}
                  onCheckedChange={setUsarPermissoesCargo}
                  id="usar-cargo"
                />
                <Label htmlFor="usar-cargo" className="cursor-pointer">
                  Usar permissões do cargo ({cargoLabels[funcionario.role || "atendente"]})
                </Label>
              </div>
            </div>
          )}
        </div>
      </div>

      {funcionario && !usarPermissoesCargo && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você está configurando permissões customizadas para {funcionario.displayName}.
            Essas permissões substituirão as permissões padrão do cargo.
          </AlertDescription>
        </Alert>
      )}

      {funcionario && (
        <>
          <Separator />

          <div className="space-y-4">
            {modulos.map((modulo) => {
              const acoesModulo = permissoesCustomizadas[modulo] || [];

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
                            id={`func-${modulo}-${acao}`}
                            disabled={usarPermissoesCargo}
                          />
                          <Label
                            htmlFor={`func-${modulo}-${acao}`}
                            className={`text-sm ${usarPermissoesCargo ? "opacity-50" : "cursor-pointer"}`}
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
            <Button onClick={handleSalvar} disabled={salvando || !funcionarioSelecionado}>
              {salvando ? "Salvando..." : "Salvar Permissões"}
            </Button>
          </div>
        </>
      )}

      {!funcionario && funcionarioSelecionado === "" && (
        <div className="text-center py-12 text-muted-foreground">
          <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Selecione um funcionário para configurar suas permissões</p>
        </div>
      )}
    </div>
  );
}
