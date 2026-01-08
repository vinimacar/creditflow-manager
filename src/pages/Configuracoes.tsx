import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NovoUsuarioForm } from "@/components/forms/NovoUsuarioForm";
import {
  Building2,
  Bell,
  Shield,
  Palette,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export default function Configuracoes() {
  const handleSave = () => {
    toast.success("Configurações salvas com sucesso!");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Personalize o sistema de acordo com suas necessidades"
      />

      <Tabs defaultValue="empresa" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto p-1">
          <TabsTrigger value="empresa" className="gap-2 py-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Empresa</span>
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-2 py-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-2 py-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="gap-2 py-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="aparencia" className="gap-2 py-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Aparência</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empresa">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Dados da Empresa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Razão Social</Label>
                <Input placeholder="Nome da empresa" defaultValue="CréditoGestor Ltda" />
              </div>
              <div>
                <Label>CNPJ</Label>
                <Input placeholder="00.000.000/0000-00" defaultValue="12.345.678/0001-90" />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input placeholder="(00) 0000-0000" defaultValue="(11) 3456-7890" />
              </div>
              <div className="md:col-span-2">
                <Label>Endereço</Label>
                <Input placeholder="Endereço completo" defaultValue="Av. Paulista, 1000 - Bela Vista" />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input placeholder="Cidade" defaultValue="São Paulo" />
              </div>
              <div>
                <Label>Estado</Label>
                <Input placeholder="UF" defaultValue="SP" />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={handleSave}>Salvar Alterações</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Gerenciamento de Usuários</h3>
            <p className="text-muted-foreground mb-6">
              Configure os níveis de acesso e permissões dos usuários do sistema.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Admin</p>
                  <p className="text-sm text-muted-foreground">admin@empresa.com · Diretor</p>
                </div>
                <Button variant="outline" size="sm">Editar</Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Carlos Mendes</p>
                  <p className="text-sm text-muted-foreground">carlos@empresa.com · Agente</p>
                </div>
                <Button variant="outline" size="sm">Editar</Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Fernanda Lima</p>
                  <p className="text-sm text-muted-foreground">fernanda@empresa.com · Gerente</p>
                </div>
                <Button variant="outline" size="sm">Editar</Button>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <NovoUsuarioForm />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Preferências de Notificação</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Novas vendas</p>
                  <p className="text-sm text-muted-foreground">Receber notificação quando uma venda for registrada</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Divergências na conciliação</p>
                  <p className="text-sm text-muted-foreground">Alertas sobre diferenças encontradas</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Relatórios semanais</p>
                  <p className="text-sm text-muted-foreground">Resumo semanal por email</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Metas atingidas</p>
                  <p className="text-sm text-muted-foreground">Notificar quando agentes atingirem metas</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={handleSave}>Salvar Preferências</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Configurações de Segurança</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Autenticação em dois fatores</p>
                  <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Timeout de sessão</p>
                  <p className="text-sm text-muted-foreground">Desconectar após período de inatividade</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div>
                <Label>Alterar Senha</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <Input type="password" placeholder="Senha atual" />
                  <Input type="password" placeholder="Nova senha" />
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={handleSave}>Atualizar Segurança</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="aparencia">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Personalização Visual</h3>
            <p className="text-muted-foreground mb-6">
              Personalize a aparência do sistema de acordo com a identidade da sua empresa.
            </p>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Modo Escuro</p>
                  <p className="text-sm text-muted-foreground">Alternar entre tema claro e escuro</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sidebar Compacta</p>
                  <p className="text-sm text-muted-foreground">Manter menu lateral recolhido por padrão</p>
                </div>
                <Switch />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={handleSave}>Salvar Aparência</Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
