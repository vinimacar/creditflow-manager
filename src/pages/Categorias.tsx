import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { FolderOpen, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  getCategorias,
  addCategoria,
  updateCategoria,
  deleteCategoria,
  type Categoria,
} from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";

export default function Categorias() {
  const { hasPermission } = useAuth();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [categoriaParaDeletar, setCategoriaParaDeletar] = useState<Categoria | null>(null);

  // Form fields
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");

  useEffect(() => {
    carregarCategorias();
  }, []);

  const carregarCategorias = async () => {
    const data = await getCategorias();
    setCategorias(data);
  };

  const abrirDialog = (categoria?: Categoria) => {
    if (categoria) {
      setEditando(categoria);
      setNome(categoria.nome);
      setDescricao(categoria.descricao || "");
    } else {
      setEditando(null);
      limparFormulario();
    }
    setDialogOpen(true);
  };

  const limparFormulario = () => {
    setNome("");
    setDescricao("");
  };

  const handleSalvar = async () => {
    if (!nome.trim()) {
      toast.error("Preencha o nome da categoria");
      return;
    }

    try {
      const categoriaData = {
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        status: "ativo" as const,
      };

      if (editando?.id) {
        await updateCategoria(editando.id, categoriaData);
        toast.success("Categoria atualizada com sucesso!");
      } else {
        await addCategoria(categoriaData);
        toast.success("Categoria cadastrada com sucesso!");
      }

      setDialogOpen(false);
      limparFormulario();
      carregarCategorias();
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
      toast.error("Erro ao salvar categoria");
    }
  };

  const handleDeletar = async () => {
    if (!categoriaParaDeletar?.id) return;

    try {
      await deleteCategoria(categoriaParaDeletar.id);
      toast.success("Categoria excluída com sucesso!");
      setDeleteDialogOpen(false);
      setCategoriaParaDeletar(null);
      carregarCategorias();
    } catch (error) {
      console.error("Erro ao deletar categoria:", error);
      toast.error("Erro ao excluir categoria");
    }
  };

  const abrirDialogDeletar = (categoria: Categoria) => {
    setCategoriaParaDeletar(categoria);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias de Produtos"
        description="Cadastro e gerenciamento de categorias de produtos"
      />

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Categorias Cadastradas</h3>
          {hasPermission(["admin", "gerente"]) && (
            <Button onClick={() => abrirDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Categoria
            </Button>
          )}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorias.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FolderOpen className="w-12 h-12" />
                      <p>Nenhuma categoria cadastrada</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                categorias.map((categoria) => (
                  <TableRow key={categoria.id}>
                    <TableCell className="font-medium">{categoria.nome}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {categoria.descricao || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={categoria.status === "ativo" ? "default" : "secondary"}>
                        {categoria.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {hasPermission(["admin", "gerente"]) && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => abrirDialog(categoria)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => abrirDialogDeletar(categoria)}
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
              {editando ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados da categoria
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Categoria *</Label>
              <Input
                id="nome"
                placeholder="Ex: Empréstimo Consignado"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Descrição da categoria"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
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
              Tem certeza que deseja excluir a categoria "{categoriaParaDeletar?.nome}"?
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
