import { useState, useEffect } from "react";
import type { UserRole, UserProfile } from "@/contexts/AuthTypes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface EditarUsuarioFormProps {
  usuario: UserProfile;
  onUpdate?: () => void;
}

const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  agente: "Agente",
  atendente: "Atendente",
};

export function EditarUsuarioForm({ usuario, onUpdate }: EditarUsuarioFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: usuario.displayName,
    role: usuario.role,
  });

  useEffect(() => {
    setFormData({
      displayName: usuario.displayName,
      role: usuario.role,
    });
  }, [usuario]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validações básicas
      if (!formData.displayName) {
        toast.error("O nome é obrigatório");
        return;
      }

      // Atualizar documento do usuário no Firestore
      await updateDoc(doc(db, "users", usuario.uid), {
        displayName: formData.displayName,
        role: formData.role,
      });

      toast.success("Usuário atualizado com sucesso!");
      setOpen(false);
      
      // Callback para atualizar a lista
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      toast.error("Erro ao atualizar usuário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Atualize as informações do usuário. O email não pode ser alterado.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={usuario.email}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">
              Nome Completo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="displayName"
              placeholder="João da Silva"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">
              Função <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="atendente">Atendente</SelectItem>
                <SelectItem value="agente">Agente</SelectItem>
                <SelectItem value="gerente">Gerente</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Atendente {'<'} Agente {'<'} Gerente {'<'} Admin
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
