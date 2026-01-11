import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Edit } from "lucide-react";
import {
  getCategoriasProdutos,
  addCategoriaProduto,
  updateCategoriaProduto,
  deleteCategoriaProduto,
  type CategoriaProduto,
} from "@/lib/firestore";
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

interface GerenciarCategoriasProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GerenciarCategorias({ open, onOpenChange }: GerenciarCategoriasProps) {
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([]);
  const [loading, setLoading] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [categoriaEditando, setCategoriaEditando] = useState<CategoriaProduto | null>(null);
  const [categoriaExcluir, setCategoriaExcluir] = useState<CategoriaProduto | null>(null);

  useEffect(() => {
    if (open) {
      loadCategorias();
    }
  }, [open]);

  const loadCategorias = async () => {
    try {
      setLoading(true);
      const data = await getCategoriasProdutos();
      setCategorias(data);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      toast.error("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionar = async () => {
    if (!novaCategoria.trim()) {
      toast.error("Digite o nome da categoria");
      return;
    }

    try {
      await addCategoriaProduto({
        nome: novaCategoria.trim(),
        status: "ativo",
      });
      toast.success("Categoria cadastrada com sucesso!");
      setNovaCategoria("");
      loadCategorias();
    } catch (error) {
      console.error("Erro ao adicionar categoria:", error);
      toast.error("Erro ao cadastrar categoria");
    }
  };

  const handleEditar = async () => {
    if (!categoriaEditando || !categoriaEditando.nome.trim()) {
      toast.error("Digite o nome da categoria");
      return;
    }

    try {
      await updateCategoriaProduto(categoriaEditando.id!, {
        nome: categoriaEditando.nome.trim(),
      });
      toast.success("Categoria atualizada com sucesso!");
      setCategoriaEditando(null);
      loadCategorias();
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error);
      toast.error("Erro ao atualizar categoria");
    }
  };

  const handleExcluir = async () => {
    if (!categoriaExcluir) return;

    try {
      await deleteCategoriaProduto(categoriaExcluir.id!);
      toast.success("Categoria excluída com sucesso!");
      setCategoriaExcluir(null);
      loadCategorias();
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      toast.error("Erro ao excluir categoria");
    }
  };

  const toggleStatus = async (categoria: CategoriaProduto) => {
    try {
      const novoStatus = categoria.status === "ativo" ? "inativo" : "ativo";
      await updateCategoriaProduto(categoria.id!, { status: novoStatus });
      toast.success(`Categoria ${novoStatus === "ativo" ? "ativada" : "desativada"} com sucesso!`);
      loadCategorias();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast.error("Erro ao alterar status da categoria");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias de Produtos</DialogTitle>
            <DialogDescription>
              Cadastre e gerencie as categorias disponíveis para os produtos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Adicionar nova categoria */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="novaCategoria">Nova Categoria</Label>
                <Input
                  id="novaCategoria"
                  value={novaCategoria}
                  onChange={(e) => setNovaCategoria(e.target.value)}
                  placeholder="Ex: Financiamento Imobiliário"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAdicionar();
                    }
                  }}
                />
              </div>
              <Button onClick={handleAdicionar} className="mt-6 gap-2">
                <Plus className="w-4 h-4" />
                Adicionar
              </Button>
            </div>

            {/* Lista de categorias */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-32 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : categorias.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        Nenhuma categoria cadastrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    categorias.map((categoria) => (
                      <TableRow key={categoria.id}>
                        <TableCell>
                          {categoriaEditando?.id === categoria.id ? (
                            <Input
                              value={categoriaEditando.nome}
                              onChange={(e) =>
                                setCategoriaEditando({ ...categoriaEditando, nome: e.target.value })
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleEditar();
                                }
                                if (e.key === "Escape") {
                                  setCategoriaEditando(null);
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <span className="font-medium">{categoria.nome}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={categoria.status === "ativo" ? "default" : "secondary"}
                            className={`cursor-pointer ${
                              categoria.status === "ativo" ? "bg-success hover:bg-success/90" : ""
                            }`}
                            onClick={() => toggleStatus(categoria)}
                          >
                            {categoria.status === "ativo" ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {categoriaEditando?.id === categoria.id ? (
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" variant="outline" onClick={() => setCategoriaEditando(null)}>
                                Cancelar
                              </Button>
                              <Button size="sm" onClick={handleEditar}>
                                Salvar
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setCategoriaEditando(categoria)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setCategoriaExcluir(categoria)}
                              >
                                <Trash2 className="w-4 h-4" />
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog para confirmar exclusão */}
      <AlertDialog open={!!categoriaExcluir} onOpenChange={(open) => !open && setCategoriaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{categoriaExcluir?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
