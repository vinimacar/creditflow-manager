import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NovoUsuarioForm } from "@/components/forms/NovoUsuarioForm";
import { EditarUsuarioForm } from "@/components/forms/EditarUsuarioForm";
import { PermissoesCargoEditor } from "@/components/configuracoes/PermissoesCargoEditor";
import { PermissoesFuncionarioEditor } from "@/components/configuracoes/PermissoesFuncionarioEditor";
import type { UserProfile } from "@/contexts/AuthTypes";
import type { UserRole } from "@/contexts/AuthTypes";
import type { Permissoes } from "@/types/permissions";
import { PERMISSOES_PADRAO } from "@/types/permissions";
import {
  Building2,
  Bell,
  Shield,
  Palette,
  Users,
  Key,
  Database,
  Download,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { collection, getDocs, doc, setDoc, getDoc, addDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { updatePassword } from "firebase/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  agente: "Agente",
  atendente: "Atendente",
};

interface ConfigEmpresa {
  razaoSocial: string;
  cnpj: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
}

interface ConfigNotificacoes {
  novasVendas: boolean;
  divergencias: boolean;
  relatoriosSemanais: boolean;
  metasAtingidas: boolean;
}

interface ConfigSeguranca {
  auth2FA: boolean;
  timeoutSessao: boolean;
}

interface ConfigAparencia {
  modoEscuro: boolean;
  sidebarCompacta: boolean;
}

export default function Configuracoes() {
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  // Estados para cada aba
  const [empresa, setEmpresa] = useState<ConfigEmpresa>({
    razaoSocial: "CréditoGestor Ltda",
    cnpj: "12.345.678/0001-90",
    telefone: "(11) 3456-7890",
    endereco: "Av. Paulista, 1000 - Bela Vista",
    cidade: "São Paulo",
    estado: "SP",
  });
  
  const [notificacoes, setNotificacoes] = useState<ConfigNotificacoes>({
    novasVendas: true,
    divergencias: true,
    relatoriosSemanais: false,
    metasAtingidas: true,
  });
  
  const [seguranca, setSeguranca] = useState<ConfigSeguranca>({
    auth2FA: false,
    timeoutSessao: true,
  });
  
  const [aparencia, setAparencia] = useState<ConfigAparencia>({
    modoEscuro: false,
    sidebarCompacta: false,
  });
  
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [salvandoPermissoes, setSalvandoPermissoes] = useState(false);
  const [importando, setImportando] = useState(false);
  const [exportando, setExportando] = useState(false);
  
  // Estados para permissões
  const [cargoSelecionado, setCargoSelecionado] = useState<UserRole>("agente");
  const [permissoesCargo, setPermissoesCargo] = useState<Record<UserRole, Permissoes>>(PERMISSOES_PADRAO);

  const carregarConfiguracoes = async () => {
    try {
      const configDoc = await getDoc(doc(db, "configuracoes", "geral"));
      if (configDoc.exists()) {
        const data = configDoc.data();
        if (data.empresa) setEmpresa(data.empresa);
        if (data.notificacoes) setNotificacoes(data.notificacoes);
        if (data.permissoesCargo) setPermissoesCargo(data.permissoesCargo);
        if (data.permissoesCargo) setPermissoesCargo(data.permissoesCargo);
        if (data.seguranca) setSeguranca(data.seguranca);
        if (data.aparencia) setAparencia(data.aparencia);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

  const handleSaveEmpresa = async () => {
    setSalvando(true);
    try {
      await setDoc(doc(db, "configuracoes", "geral"), { empresa }, { merge: true });
      toast.success("Dados da empresa salvos com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar dados da empresa");
    } finally {
      setSalvando(false);
    }
  };

  const handleSaveNotificacoes = async () => {
    setSalvando(true);
    try {
      await setDoc(doc(db, "configuracoes", "geral"), { notificacoes }, { merge: true });
      toast.success("Preferências de notificação salvas!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar notificações");
    } finally {
      setSalvando(false);
    }
  };

  const handleSaveSeguranca = async () => {
    setSalvando(true);
    try {
      await setDoc(doc(db, "configuracoes", "geral"), { seguranca }, { merge: true });
      toast.success("Configurações de segurança atualizadas!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atualizar segurança");
    } finally {
      setSalvando(false);
    }
  };

  const handleAlterarSenha = async () => {
    if (!novaSenha || novaSenha.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }
    
    setSalvando(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, novaSenha);
        toast.success("Senha alterada com sucesso!");
        setSenhaAtual("");
        setNovaSenha("");
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === "auth/requires-recent-login") {
        toast.error("Por segurança, faça login novamente antes de alterar a senha");
      } else {
        toast.error("Erro ao alterar senha");
      }
    } finally {
      setSalvando(false);
    }
  };

  const handleSaveAparencia = async () => {
    setSalvando(true);
    try {
      await setDoc(doc(db, "configuracoes", "geral"), { aparencia }, { merge: true });
      toast.success("Preferências de aparência salvas!");
      
      // Aplicar tema escuro
      if (aparencia.modoEscuro) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar aparência");
    } finally {
      setSalvando(false);
    }
  };

  const handleSavePermissoesCargo = async (cargo: UserRole) => {
    setSalvandoPermissoes(true);
    try {
      await setDoc(
        doc(db, "configuracoes", "geral"),
        { permissoesCargo },
        { merge: true }
      );
      toast.success(`Permissões do cargo ${roleLabels[cargo]} atualizadas com sucesso!`);
    } catch (error) {
      console.error("Erro ao salvar permissões:", error);
      toast.error("Erro ao salvar permissões");
    } finally {
      setSalvandoPermissoes(false);
    }
  };

  const handleSavePermissoesFuncionario = async (
    funcionarioId: string,
    permissoes: Permissoes,
    usarPadrao: boolean
  ) => {
    setSalvandoPermissoes(true);
    try {
      await setDoc(
        doc(db, "users", funcionarioId),
        {
          permissoesCustomizadas: usarPadrao ? null : permissoes,
          usarPermissoesCargo: usarPadrao,
        },
        { merge: true }
      );
      toast.success("Permissões do funcionário atualizadas com sucesso!");
      await carregarUsuarios();
    } catch (error) {
      console.error("Erro ao salvar permissões do funcionário:", error);
      toast.error("Erro ao salvar permissões");
    } finally {
      setSalvandoPermissoes(false);
    }
  };

  const carregarUsuarios = async () => {
    try {
      setLoadingUsers(true);
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersData = usersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as UserProfile[];
      
      setUsuarios(usersData);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    carregarUsuarios();
    carregarConfiguracoes();
  }, []);

  const handleBackupDados = async () => {
    setExportando(true);
    try {
      // Coleções para fazer backup
      const colecoes = [
        "clientes",
        "vendas",
        "produtos",
        "funcionarios",
        "fornecedores",
        "bancos",
        "categoriasProdutos",
        "despesas",
        "users",
      ];

      const backup: Record<string, any[]> = {};

      // Buscar dados de cada coleção
      for (const colecao of colecoes) {
        const snapshot = await getDocs(collection(db, colecao));
        backup[colecao] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      }

      // Adicionar metadados do backup
      const backupCompleto = {
        metadata: {
          dataExportacao: new Date().toISOString(),
          versao: "1.0",
          sistema: "CréditoGestor",
        },
        dados: backup,
      };

      // Criar arquivo JSON para download
      const dataStr = JSON.stringify(backupCompleto, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `backup_creditogestor_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Backup realizado com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer backup:", error);
      toast.error("Erro ao fazer backup dos dados");
    } finally {
      setExportando(false);
    }
  };

  const handleImportarVendas = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportando(true);
    try {
      const texto = await file.text();
      let dados: any;

      // Tentar parsear JSON ou CSV
      try {
        dados = JSON.parse(texto);
      } catch {
        // Se falhar, tentar como CSV
        dados = parseCSV(texto);
      }

      let vendasImportadas = 0;
      const vendas = Array.isArray(dados) ? dados : dados.vendas || dados.dados?.vendas || [];

      if (!Array.isArray(vendas) || vendas.length === 0) {
        toast.error("Nenhuma venda encontrada no arquivo");
        return;
      }

      // Importar cada venda
      for (const venda of vendas) {
        try {
          const vendaData: any = {
            clienteId: venda.clienteId || venda.cliente_id || "",
            produtoId: venda.produtoId || venda.produto_id || "",
            funcionarioId: venda.funcionarioId || venda.funcionario_id || "",
            fornecedorId: venda.fornecedorId || venda.fornecedor_id || "",
            valorContrato: parseFloat(venda.valorContrato || venda.valor_contrato || venda.valor || 0),
            prazo: parseInt(venda.prazo || 0),
            comissao: parseFloat(venda.comissao || 0),
            comissaoPercentual: parseFloat(venda.comissaoPercentual || venda.comissao_percentual || 0),
            status: venda.status || "aprovada",
            criadoPor: venda.criadoPor || venda.criado_por || auth.currentUser?.uid || "",
            createdAt: venda.createdAt ? Timestamp.fromDate(new Date(venda.createdAt)) : Timestamp.now(),
          };

          await addDoc(collection(db, "vendas"), vendaData);
          vendasImportadas++;
        } catch (error) {
          console.error("Erro ao importar venda:", error);
        }
      }

      toast.success(`${vendasImportadas} vendas importadas com sucesso!`);
      
      // Limpar input
      event.target.value = "";
    } catch (error) {
      console.error("Erro ao importar vendas:", error);
      toast.error("Erro ao importar vendas. Verifique o formato do arquivo.");
    } finally {
      setImportando(false);
    }
  };

  const parseCSV = (texto: string) => {
    const linhas = texto.split("\n").filter((l) => l.trim());
    if (linhas.length < 2) return [];

    const headers = linhas[0].split(",").map((h) => h.trim());
    const vendas = [];

    for (let i = 1; i < linhas.length; i++) {
      const valores = linhas[i].split(",");
      const venda: any = {};
      headers.forEach((header, index) => {
        venda[header] = valores[index]?.trim() || "";
      });
      vendas.push(venda);
    }

    return vendas;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Personalize o sistema de acordo com suas necessidades"
      />

      <Tabs defaultValue="empresa" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 h-auto p-1">
          <TabsTrigger value="empresa" className="gap-2 py-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Empresa</span>
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-2 py-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="permissoes" className="gap-2 py-2">
            <Key className="w-4 h-4" />
            <span className="hidden sm:inline">Permissões</span>
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
          <TabsTrigger value="dados" className="gap-2 py-2">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Dados</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empresa">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Dados da Empresa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Razão Social</Label>
                <Input 
                  placeholder="Nome da empresa" 
                  value={empresa.razaoSocial}
                  onChange={(e) => setEmpresa({...empresa, razaoSocial: e.target.value})}
                />
              </div>
              <div>
                <Label>CNPJ</Label>
                <Input 
                  placeholder="00.000.000/0000-00" 
                  value={empresa.cnpj}
                  onChange={(e) => setEmpresa({...empresa, cnpj: e.target.value})}
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input 
                  placeholder="(00) 0000-0000" 
                  value={empresa.telefone}
                  onChange={(e) => setEmpresa({...empresa, telefone: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Endereço</Label>
                <Input 
                  placeholder="Endereço completo" 
                  value={empresa.endereco}
                  onChange={(e) => setEmpresa({...empresa, endereco: e.target.value})}
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input 
                  placeholder="Cidade" 
                  value={empresa.cidade}
                  onChange={(e) => setEmpresa({...empresa, cidade: e.target.value})}
                />
              </div>
              <div>
                <Label>Estado</Label>
                <Input 
                  placeholder="UF" 
                  value={empresa.estado}
                  onChange={(e) => setEmpresa({...empresa, estado: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={handleSaveEmpresa} disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Gerenciamento de Usuários</h3>
            <p className="text-muted-foreground mb-6">
              Configure os níveis de acesso e permissões dos usuários do sistema.
            </p>
            
            {loadingUsers ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : usuarios.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum usuário cadastrado
              </div>
            ) : (
              <div className="space-y-4">
                {usuarios.map((usuario) => (
                  <div
                    key={usuario.uid}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{usuario.displayName}</p>
                      <p className="text-sm text-muted-foreground">
                        {usuario.email} · {roleLabels[usuario.role]}
                      </p>
                    </div>
                    <EditarUsuarioForm usuario={usuario} onUpdate={carregarUsuarios} />
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <NovoUsuarioForm onUserCreated={carregarUsuarios} />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="permissoes">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Gerenciamento de Permissões</h3>
            <p className="text-muted-foreground mb-6">
              Defina os níveis de acesso por função ou customize permissões individuais por funcionário.
            </p>

            <Tabs defaultValue="porCargo" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="porCargo">Por Cargo</TabsTrigger>
                <TabsTrigger value="porFuncionario">Por Funcionário</TabsTrigger>
              </TabsList>

              <TabsContent value="porCargo" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Selecione o Cargo
                    </label>
                    <Select
                      value={cargoSelecionado}
                      onValueChange={setCargoSelecionado}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Escolha um cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="gerente">Gerente</SelectItem>
                        <SelectItem value="agente">Agente</SelectItem>
                        <SelectItem value="atendente">Atendente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {cargoSelecionado && permissoesCargo[cargoSelecionado] && (
                    <PermissoesCargoEditor
                      cargo={cargoSelecionado}
                      permissoes={permissoesCargo[cargoSelecionado]}
                      onChange={(novasPermissoes) => {
                        setPermissoesCargo({
                          ...permissoesCargo,
                          [cargoSelecionado]: novasPermissoes,
                        });
                      }}
                      onSalvar={() => handleSavePermissoesCargo(cargoSelecionado)}
                      salvando={salvandoPermissoes}
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="porFuncionario" className="space-y-4 mt-6">
                <PermissoesFuncionarioEditor
                  usuarios={usuarios}
                  onSalvar={handleSavePermissoesFuncionario}
                  salvando={salvandoPermissoes}
                />
              </TabsContent>
            </Tabs>
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
                <Switch 
                  checked={notificacoes.novasVendas}
                  onCheckedChange={(checked) => setNotificacoes({...notificacoes, novasVendas: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Divergências na conciliação</p>
                  <p className="text-sm text-muted-foreground">Alertas sobre diferenças encontradas</p>
                </div>
                <Switch 
                  checked={notificacoes.divergencias}
                  onCheckedChange={(checked) => setNotificacoes({...notificacoes, divergencias: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Relatórios semanais</p>
                  <p className="text-sm text-muted-foreground">Resumo semanal por email</p>
                </div>
                <Switch 
                  checked={notificacoes.relatoriosSemanais}
                  onCheckedChange={(checked) => setNotificacoes({...notificacoes, relatoriosSemanais: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Metas atingidas</p>
                  <p className="text-sm text-muted-foreground">Notificar quando agentes atingirem metas</p>
                </div>
                <Switch 
                  checked={notificacoes.metasAtingidas}
                  onCheckedChange={(checked) => setNotificacoes({...notificacoes, metasAtingidas: checked})}
                />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={handleSaveNotificacoes} disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar Preferências"}
              </Button>
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
                <Switch 
                  checked={seguranca.auth2FA}
                  onCheckedChange={(checked) => setSeguranca({...seguranca, auth2FA: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Timeout de sessão</p>
                  <p className="text-sm text-muted-foreground">Desconectar após período de inatividade</p>
                </div>
                <Switch 
                  checked={seguranca.timeoutSessao}
                  onCheckedChange={(checked) => setSeguranca({...seguranca, timeoutSessao: checked})}
                />
              </div>
              <Separator />
              <div>
                <Label>Alterar Senha</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <Input 
                    type="password" 
                    placeholder="Senha atual" 
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                  />
                  <Input 
                    type="password" 
                    placeholder="Nova senha" 
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={handleAlterarSenha}
                    disabled={salvando || !novaSenha}
                  >
                    {salvando ? "Alterando..." : "Alterar Senha"}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={handleSaveSeguranca} disabled={salvando}>
                {salvando ? "Salvando..." : "Atualizar Segurança"}
              </Button>
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
                <Switch 
                  checked={aparencia.modoEscuro}
                  onCheckedChange={(checked) => setAparencia({...aparencia, modoEscuro: checked})}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sidebar Compacta</p>
                  <p className="text-sm text-muted-foreground">Manter menu lateral recolhido por padrão</p>
                </div>
                <Switch 
                  checked={aparencia.sidebarCompacta}
                  onCheckedChange={(checked) => setAparencia({...aparencia, sidebarCompacta: checked})}
                />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={handleSaveAparencia} disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar Aparência"}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="dados">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Backup de Dados</h3>
                  <p className="text-sm text-muted-foreground">Exportar todos os dados do sistema</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm mb-2">O backup incluirá:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                    <li>Clientes</li>
                    <li>Vendas</li>
                    <li>Produtos</li>
                    <li>Funcionários</li>
                    <li>Fornecedores</li>
                    <li>Bancos e Categorias</li>
                    <li>Despesas</li>
                    <li>Usuários</li>
                  </ul>
                </div>

                <Button 
                  onClick={handleBackupDados} 
                  disabled={exportando}
                  className="w-full gap-2"
                >
                  {exportando ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Exportar Backup (JSON)
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  O arquivo será baixado no formato JSON
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Upload className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Importar Vendas</h3>
                  <p className="text-sm text-muted-foreground">Importar vendas de arquivo externo</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm mb-2 font-medium">Formatos aceitos:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                    <li>JSON (backup completo ou vendas)</li>
                    <li>CSV (planilha de vendas)</li>
                  </ul>
                  
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm mb-2 font-medium">Campos necessários (CSV):</p>
                    <p className="text-xs text-muted-foreground">
                      clienteId, produtoId, funcionarioId, valorContrato, prazo, comissao, status
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <Input
                    type="file"
                    accept=".json,.csv"
                    onChange={handleImportarVendas}
                    disabled={importando}
                    className="cursor-pointer"
                  />
                </div>

                {importando && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <span className="animate-spin">⏳</span>
                    Importando vendas...
                  </div>
                )}

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <p className="text-xs text-yellow-700 dark:text-yellow-500">
                    ⚠️ As vendas serão adicionadas ao sistema. Certifique-se de que os IDs de clientes, produtos e funcionários existem no banco de dados.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
