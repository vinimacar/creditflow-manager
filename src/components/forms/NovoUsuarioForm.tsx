import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/contexts/AuthTypes";
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
import { Key } from "lucide-react";
import { toast } from "sonner";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function NovoUsuarioForm() {
  const { hasPermission } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    uid: "",
    email: "",
    displayName: "",
    role: "atendente" as UserRole,
  });

  // Apenas admins podem cadastrar usuários
  if (!hasPermission(["admin"])) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validações básicas
      if (!formData.uid || !formData.email || !formData.displayName) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }

      // Criar documento do usuário no Firestore
      await setDoc(doc(db, "users", formData.uid), {
        email: formData.email,
        displayName: formData.displayName,
        role: formData.role,
        createdAt: new Date(),
      });

      toast.success("Usuário cadastrado com sucesso!");
      
      // Resetar formulário
      setFormData({
        uid: "",
        email: "",
        displayName: "",
        role: "atendente",
      });
      
      setOpen(false);
    } catch (error) {
      console.error("Erro ao cadastrar usuário:", error);
      toast.error("Erro ao cadastrar usuário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Key className="w-4 h-4" />
          Novo Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
          <DialogDescription>
            Preencha os dados do novo usuário. O usuário deve fazer login primeiro com Google para obter o UID.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="uid">
              UID do Firebase <span className="text-red-500">*</span>
            </Label>
            <Input
              id="uid"
              placeholder="Ex: abc123xyz456..."
              value={formData.uid}
              onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              O UID é obtido após o primeiro login com Google. Você pode verificar no console do Firebase.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@empresa.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
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
              {loading ? "Cadastrando..." : "Cadastrar Usuário"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
