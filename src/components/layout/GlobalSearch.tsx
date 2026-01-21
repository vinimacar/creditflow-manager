import { useState, useEffect } from "react";
import { Search, User, Package, ShoppingCart, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getClientes, getProdutos, getVendas, type Cliente, type Produto, type Venda } from "@/lib/firestore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchResult {
  type: 'cliente' | 'produto' | 'venda';
  id: string;
  title: string;
  subtitle: string;
  extra?: string;
  data?: Cliente | Produto | Venda;
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clientesData, produtosData, vendasData] = await Promise.all([
        getClientes(),
        getProdutos(),
        getVendas(),
      ]);
      setClientes(clientesData);
      setProdutos(produtosData);
      setVendas(vendasData);
    } catch (error) {
      console.error("Erro ao carregar dados para busca:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm.length < 2) {
      setResults([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Buscar clientes por nome ou CPF
    clientes.forEach(cliente => {
      const matchNome = cliente.nome.toLowerCase().includes(term);
      const matchCPF = cliente.cpf.replace(/\D/g, '').includes(term.replace(/\D/g, ''));
      
      if (matchNome || matchCPF) {
        // Contar vendas do cliente
        const vendasCliente = vendas.filter(v => v.clienteId === cliente.id);
        
        searchResults.push({
          type: 'cliente',
          id: cliente.id,
          title: cliente.nome,
          subtitle: cliente.cpf,
          extra: `${vendasCliente.length} venda(s)`,
          data: cliente,
        });
      }
    });

    // Buscar produtos por nome
    produtos.forEach(produto => {
      if (produto.nome.toLowerCase().includes(term)) {
        const vendasProduto = vendas.filter(v => v.produtoId === produto.id);
        
        searchResults.push({
          type: 'produto',
          id: produto.id,
          title: produto.nome,
          subtitle: produto.categoria || 'Sem categoria',
          extra: `${vendasProduto.length} venda(s)`,
          data: produto,
        });
      }
    });

    // Buscar vendas por ID ou valor
    vendas.forEach(venda => {
      const cliente = clientes.find(c => c.id === venda.clienteId);
      const produto = produtos.find(p => p.id === venda.produtoId);
      
      if (!cliente || !produto) return;
      
      const matchCliente = cliente.nome.toLowerCase().includes(term);
      const matchProduto = produto.nome.toLowerCase().includes(term);
      const matchValor = venda.valorContrato.toString().includes(term);
      
      if (matchCliente || matchProduto || matchValor) {
        const dataVenda = venda.createdAt?.toDate?.() || new Date(venda.createdAt);
        
        searchResults.push({
          type: 'venda',
          id: venda.id!,
          title: `Venda - ${cliente.nome}`,
          subtitle: produto.nome,
          extra: `R$ ${venda.valorContrato.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} - ${format(dataVenda, "dd/MM/yyyy", { locale: ptBR })}`,
          data: venda,
        });
      }
    });

    setResults(searchResults.slice(0, 20)); // Limitar a 20 resultados
  }, [searchTerm, clientes, produtos, vendas]);

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setSearchTerm("");
    
    if (result.type === 'cliente') {
      navigate('/clientes');
    } else if (result.type === 'produto') {
      navigate('/produtos');
    } else if (result.type === 'venda') {
      navigate('/pdv');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'cliente':
        return <User className="w-4 h-4" />;
      case 'produto':
        return <Package className="w-4 h-4" />;
      case 'venda':
        return <ShoppingCart className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'cliente':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'produto':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'venda':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'cliente':
        return 'Cliente';
      case 'produto':
        return 'Produto';
      case 'venda':
        return 'Venda';
      default:
        return '';
    }
  };

  return (
    <>
      {/* Desktop Search */}
      <div className="relative w-full max-w-md hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar clientes, produtos, vendas..."
          className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 transition-colors cursor-pointer"
          onClick={() => setIsOpen(true)}
          readOnly
        />
      </div>

      {/* Mobile Search Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="sm:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Search Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>Busca Global</DialogTitle>
          </DialogHeader>
          
          <div className="px-6 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Digite o nome do cliente, CPF, produto ou valor..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="px-6 pb-6 overflow-y-auto max-h-[50vh]">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : searchTerm.length < 2 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Digite pelo menos 2 caracteres para buscar</p>
                <p className="text-xs mt-2">Você pode buscar por: nome, CPF, produto, valor...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Nenhum resultado encontrado</p>
                <p className="text-xs mt-2">Tente buscar por outro termo</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">
                  {results.length} resultado(s) encontrado(s)
                </p>
                {results.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="p-4 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-md ${getTypeColor(result.type)}`}>
                        {getIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">{result.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(result.type)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                        {result.extra && (
                          <p className="text-xs text-muted-foreground mt-1">{result.extra}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
