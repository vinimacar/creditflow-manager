import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProdutoForm } from "@/components/forms/ProdutoForm";
import { NovoProdutoForm, type ProdutoNovo } from "@/components/forms/NovoProdutoForm";
import { ImportDialog } from "@/components/ui/ImportDialog";
import { getProdutos, deleteProduto, type Produto } from "@/lib/firestore";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

interface ProdutoDisplay {
  id: string;
  nome: string;
  codigo: string;
  descricao: string;
  prazoMin: number;
  prazoMax: number;
  tipoTabela: string;
  comissao: number;
  status: "ativo" | "inativo";
}

const columns = [
  {
    key: "nome",
    header: "Produto",
    render: (produto: ProdutoDisplay) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Package className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-sm">{produto.nome}</p>
          <p className="text-xs text-muted-foreground">{produto.codigo}</p>
        </div>
      </div>
    ),
  },
  {
    key: "prazo",
    header: "Prazo",
    render: (produto: ProdutoDisplay) => (
      <span className="text-sm">{produto.prazoMin} - {produto.prazoMax} meses</span>
    ),
  },
  {
    key: "tipoTabela",
    header: "Tipo de Tabela",
  },
  {
    key: "comissao",
    header: "Comissão",
    render: (produto: ProdutoDisplay) => (
      <span className="font-medium text-success">{produto.comissao}%</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (produto: ProdutoDisplay) => (
      <Badge
        variant={produto.status === "ativo" ? "default" : "secondary"}
        className={produto.status === "ativo" ? "bg-success hover:bg-success/90" : ""}
      >
        {produto.status === "ativo" ? "Ativo" : "Inativo"}
      </Badge>
    ),
  },
];

const produtoTemplateColumns = [
  "Nome", "Código", "Descrição", "Prazo Mínimo", "Prazo Máximo", "Tipo Tabela", "Comissão %"
];

export default function Produtos() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isNovoProdutoOpen, setIsNovoProdutoOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [produtos, setProdutos] = useState<ProdutoDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);

  useEffect(() => {
    loadProdutos();
  }, []);

  const loadProdutos = async () => {
    try {
      setLoading(true);
      const data = await getProdutos();
      const displayData: ProdutoDisplay[] = data.map(p => ({
        id: p.id,
        nome: p.nome,
        codigo: p.codigo,
        descricao: p.descricao,
        prazoMin: p.prazoMin,
        prazoMax: p.prazoMax,
        tipoTabela: p.tipoTabela,
        comissao: p.comissao,
        status: p.status as "ativo" | "inativo"
      }));
      setProdutos(displayData);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (produto: ProdutoDisplay) => {
    const fullData: Produto = {
      id: produto.id,
      nome: produto.nome,
      codigo: produto.codigo,
      descricao: produto.descricao,
      prazoMin: produto.prazoMin,
      prazoMax: produto.prazoMax,
      tipoTabela: produto.tipoTabela,
      comissao: produto.comissao,
      status: produto.status
    };
    setSelectedProduto(fullData);
    setIsFormOpen(true);
  };

  const handleDelete = async (produto: ProdutoDisplay) => {
    if (confirm(`Deseja realmente excluir o produto ${produto.nome}?`)) {
      try {
        await deleteProduto(produto.id);
        toast.success("Produto excluído com sucesso!");
        loadProdutos();
      } catch (error) {
        console.error("Erro ao excluir produto:", error);
        toast.error("Erro ao excluir produto");
      }
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedProduto(null);
    loadProdutos();
  };

  const handleSalvarNovoProduto = async (produto: ProdutoNovo) => {
    try {
      await addDoc(collection(db, "produtos"), {
        ...produto,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setIsNovoProdutoOpen(false);
      loadProdutos();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      throw error;
    }
  };

  const handleImport = (data: Record<string, string>[]) => {
    console.log("Produtos importados:", data);
  };

  return (
    <div>
      <PageHeader
        title="Produtos"
        description="Catálogo de produtos de crédito consignado"
        action={{
          label: "Novo Produto",
          onClick: () => setIsNovoProdutoOpen(true),
        }}
      >
        <Button variant="outline" className="gap-2" onClick={() => setIsFormOpen(true)}>
          Editar
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => setIsImportOpen(true)}>
          <Upload className="w-4 h-4" />
          Importar
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={produtos}
        searchPlaceholder="Buscar por nome ou código..."
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Dialog de edição - ProdutoForm existente */}
      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) setSelectedProduto(null);
      }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedProduto ? "Editar Produto" : "Produto"}</DialogTitle>
          </DialogHeader>
          <ProdutoForm 
            initialData={selectedProduto || undefined}
            onSuccess={handleFormSuccess} 
          />
        </DialogContent>
      </Dialog>

      {/* Novo Dialog - NovoProdutoForm com comissões */}
      <NovoProdutoForm
        open={isNovoProdutoOpen}
        onOpenChange={setIsNovoProdutoOpen}
        onSalvar={handleSalvarNovoProduto}
      />

      <ImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        title="Produtos"
        description="Importe seu catálogo de produtos a partir de um arquivo CSV"
        templateColumns={produtoTemplateColumns}
        onImport={handleImport}
      />
    </div>
  );
}
