import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  getBancos,
  addBanco,
  updateBanco,
  deleteBanco,
  type Banco,
} from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";

export default function Bancos() {
  const { hasPermission } = useAuth();
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Banco | null>(null);
  const [bancoParaDeletar, setBancoParaDeletar] = useState<Banco | null>(null);

  // Form fields
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");

  useEffect(() => {
    carregarBancos();
  }, []);

  const carregarBancos = async () => {
    const data = await getBancos();
    setBancos(data);
  };

  const abrirDialog = (banco?: Banco) => {
    if (banco) {
      setEditando(banco);
      setNome(banco.nome);
      setCodigo(banco.codigo || "");
    } else {
      setEditando(null);
      limparFormulario();
    }
    setDialogOpen(true);
  };

  const limparFormulario = () => {
    setNome("");
    setCodigo("");
  };

  const handleSalvar = async () => {
    if (!nome.trim()) {
      toast.error("Preencha o nome do banco");
      return;
    }

    try {
      const bancoData = {
        nome: nome.trim(),
        codigo: codigo.trim() || undefined,
        status: "ativo" as const,
      };

      if (editando?.id) {
        await updateBanco(editando.id, bancoData);
        toast.success("Banco atualizado com sucesso!");
      } else {
        await addBanco(bancoData);
        toast.success("Banco cadastrado com sucesso!");
      }

      setDialogOpen(false);
      limparFormulario();
      carregarBancos();
    } catch (error) {
      console.error("Erro ao salvar banco:", error);
      toast.error("Erro ao salvar banco");
    }
  };

  const handleDeletar = async () => {
    if (!bancoParaDeletar?.id) return;

    try {
      await deleteBanco(bancoParaDeletar.id);
      toast.success("Banco excluído com sucesso!");
      setDeleteDialogOpen(false);
      setBancoParaDeletar(null);
      carregarBancos();
    } catch (error) {
      console.error("Erro ao deletar banco:", error);
      toast.error("Erro ao excluir banco");
    }
  };

  const abrirDialogDeletar = (banco: Banco) => {
    setBancoParaDeletar(banco);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bancos"
        description="Cadastro e gerenciamento de bancos"
      />

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Bancos Cadastrados</h3>
          {hasPermission(["admin", "gerente"]) && (
            <Button onClick={() => abrirDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Banco
            </Button>
          )}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bancos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Building2 className="w-12 h-12" />
                      <p>Nenhum banco cadastrado</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                bancos.map((banco) => (
                  <TableRow key={banco.id}>
                    <TableCell className="font-mono">{banco.codigo || "-"}</TableCell>
                    <TableCell className="font-medium">{banco.nome}</TableCell>
                    <TableCell>
                      <Badge variant={banco.status === "ativo" ? "default" : "secondary"}>
                        {banco.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {hasPermission(["admin", "gerente"]) && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => abrirDialog(banco)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => abrirDialogDeletar(banco)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Dialog de Cadastro/Edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editando ? "Editar Banco" : "Novo Banco"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do banco
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Banco *</Label>
              <Input
                id="nome"
                placeholder="Ex: Banco do Brasil"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo">Código do Banco</Label>
              <Input
                id="codigo"
                placeholder="Ex: 001"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                maxLength={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar}>
              {editando ? "Atualizar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o banco "{bancoParaDeletar?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletar} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
