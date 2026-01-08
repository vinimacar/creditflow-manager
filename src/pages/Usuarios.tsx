import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getAllUsers, updateUserRole, updateUserStatus, UserProfile } from "@/lib/firestore";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, UserCog } from "lucide-react";

type UserRole = "admin" | "gerente" | "agente" | "atendente";
type UserStatus = "ativo" | "bloqueado";

const getRoleBadge = (role: string) => {
  const badges: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: typeof ShieldCheck }> = {
    admin: { label: "Administrador", variant: "default", icon: ShieldCheck },
    gerente: { label: "Gerente", variant: "secondary", icon: UserCog },
    agente: { label: "Agente", variant: "outline", icon: UserCog },
    atendente: { label: "Atendente", variant: "outline", icon: UserCog },
  };
  return badges[role] || badges.agente;
};

const columns = [
  {
    key: "displayName",
    header: "Usuário",
    render: (user: UserProfile) => (
      <div className="flex items-center gap-3">
        <Avatar className="w-9 h-9">
          <AvatarImage src={user.photoURL} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {user.displayName?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-sm">{user.displayName}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: "role",
    header: "Perfil",
    render: (user: UserProfile) => {
      const roleInfo = getRoleBadge(user.role);
      const Icon = roleInfo.icon;
      return (
        <Badge variant={roleInfo.variant} className="gap-1">
          <Icon className="w-3 h-3" />
          {roleInfo.label}
        </Badge>
      );
    },
  },
  {
    key: "createdAt",
    header: "Cadastro",
    render: (user: UserProfile) => (
      <span className="text-sm">
        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("pt-BR") : "-"}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (user: UserProfile) => (
      <Badge
        variant={user.status === "ativo" ? "default" : "destructive"}
        className={user.status === "ativo" ? "bg-success hover:bg-success/90" : ""}
      >
        {user.status === "ativo" ? "Ativo" : "Bloqueado"}
      </Badge>
    ),
  },
];

export default function Usuarios() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("agente");
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>("ativo");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    setSelectedStatus(user.status || "ativo");
  };

  const handleSave = async () => {
    if (!editingUser?.id) return;

    try {
      // Atualizar role se mudou
      if (selectedRole !== editingUser.role) {
        await updateUserRole(editingUser.id, selectedRole);
      }

      // Atualizar status se mudou
      if (selectedStatus !== editingUser.status) {
        await updateUserStatus(editingUser.id, selectedStatus);
      }

      toast.success("Usuário atualizado com sucesso!");
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      toast.error("Erro ao atualizar usuário");
    }
  };

  const handleToggleStatus = async (user: UserProfile) => {
    if (!user.id) return;

    const newStatus = user.status === "ativo" ? "bloqueado" : "ativo";
    const action = newStatus === "bloqueado" ? "bloquear" : "desbloquear";

    if (!confirm(`Deseja realmente ${action} o usuário ${user.displayName}?`)) {
      return;
    }

    try {
      await updateUserStatus(user.id, newStatus);
      toast.success(`Usuário ${action === "bloquear" ? "bloqueado" : "desbloqueado"} com sucesso!`);
      loadUsers();
    } catch (error) {
      console.error(`Erro ao ${action} usuário:`, error);
      toast.error(`Erro ao ${action} usuário`);
    }
  };

  return (
    <div>
      <PageHeader
        title="Gerenciamento de Usuários"
        description="Gerencie permissões e acessos dos usuários do sistema"
      />

      <DataTable<UserProfile>
        columns={columns}
        data={users}
        searchPlaceholder="Buscar por nome ou email..."
        onEdit={handleEdit}
        onDelete={handleToggleStatus}
        deleteLabel={(user: UserProfile) => 
          user.status === "ativo" ? "Bloquear" : "Desbloquear"
        }
      />

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Permissões</DialogTitle>
            <DialogDescription>
              Altere o perfil e status de acesso do usuário
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Informações do Usuário */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Avatar className="w-12 h-12">
                <AvatarImage src={editingUser?.photoURL} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {editingUser?.displayName?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{editingUser?.displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{editingUser?.email}</p>
              </div>
            </div>

            {/* Perfil */}
            <div className="space-y-2">
              <Label htmlFor="role">Perfil de Acesso</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Administrador
                    </div>
                  </SelectItem>
                  <SelectItem value="gerente">
                    <div className="flex items-center gap-2">
                      <UserCog className="w-4 h-4" />
                      Gerente
                    </div>
                  </SelectItem>
                  <SelectItem value="agente">
                    <div className="flex items-center gap-2">
                      <UserCog className="w-4 h-4" />
                      Agente
                    </div>
                  </SelectItem>
                  <SelectItem value="atendente">
                    <div className="flex items-center gap-2">
                      <UserCog className="w-4 h-4" />
                      Atendente
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status da Conta</Label>
              <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as UserStatus)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-success rounded-full" />
                      Ativo
                    </div>
                  </SelectItem>
                  <SelectItem value="bloqueado">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-destructive" />
                      Bloqueado
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Descrições das Permissões */}
            <div className="p-3 bg-muted/30 rounded-lg text-xs space-y-2">
              <p className="font-medium">Permissões do perfil selecionado:</p>
              {selectedRole === "admin" && (
                <p className="text-muted-foreground">✓ Acesso completo a todas as funcionalidades</p>
              )}
              {selectedRole === "gerente" && (
                <p className="text-muted-foreground">✓ Acesso a Produtos, Relatórios e Conciliação</p>
              )}
              {(selectedRole === "agente" || selectedRole === "atendente") && (
                <p className="text-muted-foreground">
                  ✗ Sem acesso a Produtos, Relatórios e Conciliação
                  <br />✗ Comissões ocultas em contratos
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
