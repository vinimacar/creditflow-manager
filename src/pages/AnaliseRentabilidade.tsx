import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, DollarSign, Package, Building2, Users, Award } from "lucide-react";
import { toast } from "sonner";
import { getVendas, getProdutos, getFornecedores, getFuncionarios, getFolhasPagamento } from "@/lib/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { RentabilidadeProduto, RentabilidadeFornecedor, RentabilidadeFuncionario } from "@/types/rentabilidade";
import { calcularComissoes } from "@/lib/calculos-comissoes";

export default function AnaliseRentabilidade() {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [periodoSelecionado, setPeriodoSelecionado] = useState(format(new Date(), "yyyy-MM"));
  
  const [rentabilidadeProdutos, setRentabilidadeProdutos] = useState<RentabilidadeProduto[]>([]);
  const [rentabilidadeFornecedores, setRentabilidadeFornecedores] = useState<RentabilidadeFornecedor[]>([]);
  const [rentabilidadeFuncionarios, setRentabilidadeFuncionarios] = useState<RentabilidadeFuncionario[]>([]);
  
  const [aba, setAba] = useState<"produtos" | "fornecedores" | "funcionarios">("produtos");

  useEffect(() => {
    carregarDados();
  }, [periodoSelecionado]);

  const carregarDados = async () => {
    try {
      setLoading(true);

      const inicioMes = startOfMonth(new Date(periodoSelecionado + "-01"));
      const fimMes = endOfMonth(new Date(periodoSelecionado + "-01"));

      const [vendas, produtos, fornecedores, funcionarios, folhas] = await Promise.all([
        getVendas(),
        getProdutos(),
        getFornecedores(),
        getFuncionarios(),
        getFolhasPagamento(),
      ]);

      // Filtrar vendas do período e aprovadas
      const vendasPeriodo = vendas.filter(v => {
        const dataVenda = v.createdAt?.toDate?.() || new Date(v.createdAt);
        return dataVenda >= inicioMes && dataVenda <= fimMes && v.status === "aprovada";
      });

      // === RENTABILIDADE POR PRODUTO ===
      const produtosMap = new Map<string, RentabilidadeProduto>();

      vendasPeriodo.forEach(venda => {
        const produto = produtos.find(p => p.id === venda.produtoId);
        if (!produto) return;

        const fornecedor = fornecedores.find(f => f.id === produto.fornecedorId);
        const comissoes = calcularComissoes(venda, produto);

        const current = produtosMap.get(produto.id!) || {
          produtoId: produto.id!,
          produtoNome: produto.nome,
          fornecedorNome: fornecedor?.nomeFantasia || fornecedor?.razaoSocial || "N/A",
          totalVendas: 0,
          receitaBruta: 0,
          comissoesPagas: 0,
          comissoesReceber: 0,
          lucroLiquido: 0,
          margemLucro: 0,
          ticketMedio: 0,
        };

        current.totalVendas++;
        current.receitaBruta += venda.valorContrato;
        current.comissoesPagas += comissoes.comissaoAgente;
        current.comissoesReceber += comissoes.comissaoFornecedor;

        produtosMap.set(produto.id!, current);
      });

      const produtosArray = Array.from(produtosMap.values()).map(p => {
        p.lucroLiquido = p.comissoesReceber - p.comissoesPagas;
        p.margemLucro = p.comissoesReceber > 0 ? (p.lucroLiquido / p.comissoesReceber) * 100 : 0;
        p.ticketMedio = p.totalVendas > 0 ? p.receitaBruta / p.totalVendas : 0;
        return p;
      }).sort((a, b) => b.lucroLiquido - a.lucroLiquido);

      setRentabilidadeProdutos(produtosArray);

      // === RENTABILIDADE POR FORNECEDOR ===
      const fornecedoresMap = new Map<string, RentabilidadeFornecedor>();

      vendasPeriodo.forEach(venda => {
        const produto = produtos.find(p => p.id === venda.produtoId);
        if (!produto) return;

        const fornecedor = fornecedores.find(f => f.id === produto.fornecedorId);
        if (!fornecedor) return;

        const comissoes = calcularComissoes(venda, produto);

        const current = fornecedoresMap.get(fornecedor.id!) || {
          fornecedorId: fornecedor.id!,
          fornecedorNome: fornecedor.nomeFantasia || fornecedor.razaoSocial,
          totalProdutos: 0,
          totalVendas: 0,
          receitaBruta: 0,
          comissoesPagas: 0,
          lucroLiquido: 0,
          margemLucro: 0,
          ticketMedio: 0,
        };

        current.totalVendas++;
        current.receitaBruta += venda.valorContrato;
        current.comissoesPagas += comissoes.comissaoAgente;

        fornecedoresMap.set(fornecedor.id!, current);
      });

      const fornecedoresArray = Array.from(fornecedoresMap.values()).map(f => {
        const produtosFornecedor = produtos.filter(p => p.fornecedorId === f.fornecedorId);
        f.totalProdutos = produtosFornecedor.length;
        
        const comissoesReceber = produtosArray
          .filter(p => p.fornecedorNome === f.fornecedorNome)
          .reduce((sum, p) => sum + p.comissoesReceber, 0);

        f.lucroLiquido = comissoesReceber - f.comissoesPagas;
        f.margemLucro = comissoesReceber > 0 ? (f.lucroLiquido / comissoesReceber) * 100 : 0;
        f.ticketMedio = f.totalVendas > 0 ? f.receitaBruta / f.totalVendas : 0;
        return f;
      }).sort((a, b) => b.lucroLiquido - a.lucroLiquido);

      setRentabilidadeFornecedores(fornecedoresArray);

      // === RENTABILIDADE POR FUNCIONÁRIO ===
      const funcionariosMap = new Map<string, RentabilidadeFuncionario>();

      vendasPeriodo.forEach(venda => {
        const funcionario = funcionarios.find(f => f.id === venda.funcionarioId);
        if (!funcionario) return;

        const produto = produtos.find(p => p.id === venda.produtoId);
        if (!produto) return;

        const comissoes = calcularComissoes(venda, produto);

        const current = funcionariosMap.get(funcionario.id!) || {
          funcionarioId: funcionario.id!,
          funcionarioNome: funcionario.nome,
          cargo: funcionario.cargo,
          totalVendas: 0,
          receitaGerada: 0,
          comissoesRecebidas: 0,
          custoSalarial: 0,
          lucroLiquido: 0,
          roi: 0,
          ticketMedio: 0,
        };

        current.totalVendas++;
        current.receitaGerada += venda.valorContrato;
        current.comissoesRecebidas += comissoes.comissaoAgente;

        funcionariosMap.set(funcionario.id!, current);
      });

      // Adicionar custo salarial das folhas
      const folhaMes = folhas.find(f => 
        f.mes === parseInt(periodoSelecionado.split('-')[1]) &&
        f.ano === parseInt(periodoSelecionado.split('-')[0])
      );

      const funcionariosArray = Array.from(funcionariosMap.values()).map(f => {
        const funcionarioData = funcionarios.find(func => func.id === f.funcionarioId);
        f.custoSalarial = funcionarioData?.salario || 0;

        // Buscar na folha se existe
        if (folhaMes?.funcionarios) {
          const folhaFunc = folhaMes.funcionarios.find(ff => ff.funcionarioId === f.funcionarioId);
          if (folhaFunc) {
            f.custoSalarial = folhaFunc.salarioBruto;
          }
        }

        const comissoesReceber = produtosArray
          .reduce((sum, p) => sum + p.comissoesReceber, 0);

        const receitaLiquida = comissoesReceber - f.comissoesRecebidas;
        f.lucroLiquido = receitaLiquida;
        f.roi = f.custoSalarial > 0 ? (f.lucroLiquido / f.custoSalarial) * 100 : 0;
        f.ticketMedio = f.totalVendas > 0 ? f.receitaGerada / f.totalVendas : 0;
        
        return f;
      }).sort((a, b) => b.roi - a.roi);

      setRentabilidadeFuncionarios(funcionariosArray);

    } catch (error) {
      console.error("Erro ao carregar rentabilidade:", error);
      toast.error("Erro ao carregar análise de rentabilidade");
    } finally {
      setLoading(false);
    }
  };

  if (!hasPermission(["admin", "gerente"])) {
    return (
      <div className="space-y-6">
        <PageHeader title="Análise de Rentabilidade" description="Acesso restrito" />
        <Card className="p-6">
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Análise de Rentabilidade" description="Carregando..." />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const produtoMaisRentavel = rentabilidadeProdutos[0];
  const fornecedorMelhor = rentabilidadeFornecedores[0];
  const funcionarioDestaque = rentabilidadeFuncionarios[0];

  const lucroTotalProdutos = rentabilidadeProdutos.reduce((sum, p) => sum + p.lucroLiquido, 0);
  const receitaTotalProdutos = rentabilidadeProdutos.reduce((sum, p) => sum + p.comissoesReceber, 0);
  const margemMedia = receitaTotalProdutos > 0 ? (lucroTotalProdutos / receitaTotalProdutos) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Análise de Rentabilidade" 
        description="Análise de lucro por produto, fornecedor e funcionário" 
      />

      <div className="flex items-center justify-between">
        <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2026-01">Janeiro 2026</SelectItem>
            <SelectItem value="2025-12">Dezembro 2025</SelectItem>
            <SelectItem value="2025-11">Novembro 2025</SelectItem>
            <SelectItem value="2025-10">Outubro 2025</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-green-50 dark:bg-green-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">Lucro Total</p>
              <h3 className="text-2xl font-bold mt-2 text-green-700">
                R$ {lucroTotalProdutos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-green-700 mt-1">Margem: {margemMedia.toFixed(1)}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6 bg-blue-50 dark:bg-blue-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Produto Top</p>
              <h3 className="text-lg font-bold mt-2 text-blue-700 truncate">
                {produtoMaisRentavel?.produtoNome || "N/A"}
              </h3>
              <p className="text-xs text-blue-700 mt-1">
                R$ {produtoMaisRentavel?.lucroLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6 bg-purple-50 dark:bg-purple-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Fornecedor Top</p>
              <h3 className="text-lg font-bold mt-2 text-purple-700 truncate">
                {fornecedorMelhor?.fornecedorNome || "N/A"}
              </h3>
              <p className="text-xs text-purple-700 mt-1">
                R$ {fornecedorMelhor?.lucroLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Building2 className="w-8 h-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6 bg-orange-50 dark:bg-orange-950">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100">Funcionário Top</p>
              <h3 className="text-lg font-bold mt-2 text-orange-700 truncate">
                {funcionarioDestaque?.funcionarioNome || "N/A"}
              </h3>
              <p className="text-xs text-orange-700 mt-1">
                ROI: {funcionarioDestaque?.roi.toFixed(0)}%
              </p>
            </div>
            <Award className="w-8 h-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Abas */}
      <div className="flex gap-2">
        <button
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            aba === "produtos" ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
          }`}
          onClick={() => setAba("produtos")}
        >
          <Package className="w-4 h-4 inline mr-2" />
          Produtos ({rentabilidadeProdutos.length})
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            aba === "fornecedores" ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
          }`}
          onClick={() => setAba("fornecedores")}
        >
          <Building2 className="w-4 h-4 inline mr-2" />
          Fornecedores ({rentabilidadeFornecedores.length})
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            aba === "funcionarios" ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
          }`}
          onClick={() => setAba("funcionarios")}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Funcionários ({rentabilidadeFuncionarios.length})
        </button>
      </div>

      {/* Tabelas */}
      {aba === "produtos" && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Receita Bruta</TableHead>
                <TableHead className="text-right">Comissões Receber</TableHead>
                <TableHead className="text-right">Comissões Pagar</TableHead>
                <TableHead className="text-right">Lucro Líquido</TableHead>
                <TableHead className="text-right">Margem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rentabilidadeProdutos.map((produto, index) => (
                <TableRow key={produto.produtoId}>
                  <TableCell className="font-bold">
                    {index + 1}
                    {index === 0 && <Award className="w-4 h-4 text-yellow-500 inline ml-1" />}
                  </TableCell>
                  <TableCell className="font-medium">{produto.produtoNome}</TableCell>
                  <TableCell>{produto.fornecedorNome}</TableCell>
                  <TableCell className="text-right">{produto.totalVendas}</TableCell>
                  <TableCell className="text-right">
                    R$ {produto.receitaBruta.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    R$ {produto.comissoesReceber.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    R$ {produto.comissoesPagas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    R$ {produto.lucroLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={produto.margemLucro >= 50 ? "default" : produto.margemLucro >= 30 ? "secondary" : "outline"}>
                      {produto.margemLucro.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {rentabilidadeProdutos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    Nenhum produto vendido neste período
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {aba === "fornecedores" && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="text-right">Produtos</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">Comissões Pagas</TableHead>
                <TableHead className="text-right">Lucro Líquido</TableHead>
                <TableHead className="text-right">Margem</TableHead>
                <TableHead className="text-right">Ticket Médio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rentabilidadeFornecedores.map((fornecedor, index) => (
                <TableRow key={fornecedor.fornecedorId}>
                  <TableCell className="font-bold">
                    {index + 1}
                    {index === 0 && <Award className="w-4 h-4 text-yellow-500 inline ml-1" />}
                  </TableCell>
                  <TableCell className="font-medium">{fornecedor.fornecedorNome}</TableCell>
                  <TableCell className="text-right">{fornecedor.totalProdutos}</TableCell>
                  <TableCell className="text-right">{fornecedor.totalVendas}</TableCell>
                  <TableCell className="text-right">
                    R$ {fornecedor.receitaBruta.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    R$ {fornecedor.comissoesPagas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    R$ {fornecedor.lucroLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={fornecedor.margemLucro >= 50 ? "default" : fornecedor.margemLucro >= 30 ? "secondary" : "outline"}>
                      {fornecedor.margemLucro.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {fornecedor.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
              {rentabilidadeFornecedores.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    Nenhum fornecedor com vendas neste período
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {aba === "funcionarios" && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Funcionário</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Receita Gerada</TableHead>
                <TableHead className="text-right">Comissões</TableHead>
                <TableHead className="text-right">Custo Salarial</TableHead>
                <TableHead className="text-right">Lucro Líquido</TableHead>
                <TableHead className="text-right">ROI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rentabilidadeFuncionarios.map((funcionario, index) => (
                <TableRow key={funcionario.funcionarioId}>
                  <TableCell className="font-bold">
                    {index + 1}
                    {index === 0 && <Award className="w-4 h-4 text-yellow-500 inline ml-1" />}
                  </TableCell>
                  <TableCell className="font-medium">{funcionario.funcionarioNome}</TableCell>
                  <TableCell className="capitalize">{funcionario.cargo}</TableCell>
                  <TableCell className="text-right">{funcionario.totalVendas}</TableCell>
                  <TableCell className="text-right">
                    R$ {funcionario.receitaGerada.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right text-orange-600">
                    R$ {funcionario.comissoesRecebidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    R$ {funcionario.custoSalarial.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    R$ {funcionario.lucroLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={funcionario.roi >= 200 ? "default" : funcionario.roi >= 100 ? "secondary" : "outline"}>
                      {funcionario.roi > 0 ? '+' : ''}{funcionario.roi.toFixed(0)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {rentabilidadeFuncionarios.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    Nenhum funcionário com vendas neste período
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
