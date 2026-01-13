import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FiltrosDinamicosRelatorio, type FiltrosRelatorio } from "@/components/relatorios/FiltrosDinamicosRelatorio";
import { GraficoModerno } from "@/components/relatorios/GraficoModerno";
import {
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  Building2,
  FileSpreadsheet,
  HelpCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getVendas, getFuncionarios, getProdutos, getFornecedores, getClientes, getDespesas, type Venda, type Funcionario, type Produto, type Fornecedor, type Cliente, type Despesa } from "@/lib/firestore";
import { Skeleton } from "@/components/ui/skeleton";

interface DadosRelatorio {
  vendas: Array<{ mes: string; valor: number; quantidade: number }>;
  funcionarios: Array<{ nome: string; vendas: number; comissao: number }>;
  produtos: Array<{ nome: string; valor: number }>;
  fornecedores: Array<{ nome: string; valor: number }>;
  clientes: Array<{ nome: string; vendas: number; valor: number }>;
  despesas: Array<{ mes: string; valor: number; quantidade: number }>;
  receitas: Array<{ mes: string; valor: number }>;
  lucros: Array<{ mes: string; valor: number }>;
}

export default function Relatorios() {
  const [filtros, setFiltros] = useState<FiltrosRelatorio>({
    tipoRelatorio: "geral",
    agrupamento: "mes",
  });
  const [gerando, setGerando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dadosRelatorio, setDadosRelatorio] = useState<DadosRelatorio | null>(null);
  const [vendasCompletas, setVendasCompletas] = useState<Venda[]>([]);
  const [clientesCompletos, setClientesCompletos] = useState<Cliente[]>([]);
  const [funcionariosCompletos, setFuncionariosCompletos] = useState<Funcionario[]>([]);
  const [produtosCompletos, setProdutosCompletos] = useState<Produto[]>([]);
  const [despesasCompletas, setDespesasCompletas] = useState<Despesa[]>([]);

  useEffect(() => {
    let mounted = true;
    const abortController = new AbortController();

    const loadData = async () => {
      try {
        await carregarDados(mounted);
      } catch (error) {
        if (mounted && !abortController.signal.aborted) {
          console.error("Erro ao carregar dados:", error);
          toast.error("Erro ao carregar dados do relatório");
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, []);

  const carregarDados = async (mounted = true) => {
    try {
      const [vendas, funcionarios, produtos, fornecedores, clientes, despesas] = await Promise.all([
        getVendas(),
        getFuncionarios(),
        getProdutos(),
        getFornecedores(),
        getClientes(),
        getDespesas(),
      ]).catch(err => {
        console.error("Erro ao buscar dados:", err);
        throw err;
      });

      if (!mounted) return;

      // Armazenar dados completos para filtragem
      setVendasCompletas(vendas);
      setClientesCompletos(clientes);
      setFuncionariosCompletos(funcionarios);
      setProdutosCompletos(produtos);
      setDespesasCompletas(despesas);

      // Gerar dados de vendas por mês (últimos 6 meses)
      const vendasPorMes: Array<{ mes: string; valor: number; quantidade: number }> = [];
      const despesasPorMes: Array<{ mes: string; valor: number; quantidade: number }> = [];
      const receitasPorMes: Array<{ mes: string; valor: number }> = [];
      const lucrosPorMes: Array<{ mes: string; valor: number }> = [];
      const agora = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const mesData = subMonths(agora, i);
        const inicioMes = startOfMonth(mesData);
        const fimMes = endOfMonth(mesData);
        
        const vendasDoMes = vendas.filter((v) => {
          const dataVenda = v.createdAt?.toDate?.() || new Date(v.createdAt);
          return dataVenda >= inicioMes && dataVenda <= fimMes;
        });

        const despesasDoMes = despesas.filter((d) => {
          const dataDespesa = new Date(d.dataVencimento);
          return dataDespesa >= inicioMes && dataDespesa <= fimMes;
        });

        const valorVendas = vendasDoMes.reduce((sum, v) => sum + v.valorContrato, 0);
        const valorDespesas = despesasDoMes.reduce((sum, d) => sum + d.valor, 0);
        
        vendasPorMes.push({
          mes: format(mesData, "MMM", { locale: ptBR }),
          valor: valorVendas,
          quantidade: vendasDoMes.length,
        });

        despesasPorMes.push({
          mes: format(mesData, "MMM", { locale: ptBR }),
          valor: valorDespesas,
          quantidade: despesasDoMes.length,
        });

        receitasPorMes.push({
          mes: format(mesData, "MMM", { locale: ptBR }),
          valor: valorVendas,
        });

        lucrosPorMes.push({
          mes: format(mesData, "MMM", { locale: ptBR }),
          valor: valorVendas - valorDespesas,
        });
      }

      // Calcular vendas por funcionário
      const vendaPorFunc = new Map<string, { vendas: number; comissao: number; comissaoFornecedor: number }>();
      vendas.forEach((venda) => {
        const produto = produtos.find(p => p.id === venda.produtoId);
        
        // Comissão do agente - importar da venda (priority 1) ou calcular do produto
        let comissaoCalculada = venda.comissaoAgente || venda.comissao || 0;
        if (!comissaoCalculada && produto) {
          const comissaoPercentual = venda.comissaoAgentePercentual || venda.comissaoPercentual || produto?.comissaoAgente || produto?.comissao || 0;
          comissaoCalculada = venda.valorContrato * (comissaoPercentual / 100);
        }
        
        // Comissão do fornecedor - sempre importar da venda (dados reais salvos)
        let comissaoFornecedorCalculada = venda.comissaoFornecedor || 0;
        if (!comissaoFornecedorCalculada && venda.comissaoFornecedorPercentual) {
          comissaoFornecedorCalculada = venda.valorContrato * (venda.comissaoFornecedorPercentual / 100);
        } else if (!comissaoFornecedorCalculada && produto?.comissaoFornecedor) {
          comissaoFornecedorCalculada = venda.valorContrato * (produto.comissaoFornecedor / 100);
        }
        
        const current = vendaPorFunc.get(venda.funcionarioId) || { vendas: 0, comissao: 0, comissaoFornecedor: 0 };
        vendaPorFunc.set(venda.funcionarioId, {
          vendas: current.vendas + 1,
          comissao: current.comissao + comissaoCalculada,
          comissaoFornecedor: current.comissaoFornecedor + comissaoFornecedorCalculada,
        });
      });

      const funcionariosData = Array.from(vendaPorFunc.entries())
        .map(([id, stats]) => {
          const func = funcionarios.find((f) => f.id === id);
          return {
            nome: func?.nome || "Desconhecido",
            vendas: stats.vendas,
            comissao: stats.comissao,
            comissaoFornecedor: stats.comissaoFornecedor,
          };
        })
        .sort((a, b) => b.vendas - a.vendas)
        .slice(0, 5);

      // Calcular vendas por produto
      const vendaPorProd = new Map<string, number>();
      vendas.forEach((venda) => {
        const current = vendaPorProd.get(venda.produtoId) || 0;
        vendaPorProd.set(venda.produtoId, current + venda.valorContrato);
      });

      const produtosData = Array.from(vendaPorProd.entries())
        .map(([id, valor]) => {
          const prod = produtos.find((p) => p.id === id);
          return {
            nome: prod?.nome || "Desconhecido",
            valor,
          };
        })
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 4);

      // Mock de fornecedores (pode ser melhorado com dados reais se disponível)
      const fornecedoresData = fornecedores.slice(0, 4).map((f) => ({
        nome: f.razaoSocial,
        valor: Math.random() * 300000 + 100000, // Valores simulados
      }));

      // Calcular vendas por cliente
      const vendaPorCliente = new Map<string, { vendas: number; valor: number }>();
      vendas.forEach((venda) => {
        const current = vendaPorCliente.get(venda.clienteId) || { vendas: 0, valor: 0 };
        vendaPorCliente.set(venda.clienteId, {
          vendas: current.vendas + 1,
          valor: current.valor + venda.valorContrato,
        });
      });

      const clientesData = Array.from(vendaPorCliente.entries())
        .map(([id, stats]) => {
          const cliente = clientes.find((c) => c.id === id);
          return {
            nome: cliente?.nome || "Desconhecido",
            vendas: stats.vendas,
            valor: stats.valor,
          };
        })
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 10);

      if (mounted) {
        setDadosRelatorio({
          vendas: vendasPorMes,
          funcionarios: funcionariosData,
          produtos: produtosData,
          fornecedores: fornecedoresData,
          clientes: clientesData,
          despesas: despesasPorMes,
          receitas: receitasPorMes,
          lucros: lucrosPorMes,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar dados do relatório:", error);
      if (mounted) {
        toast.error("Erro ao carregar dados do relatório");
      }
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  };

  // Filtrar vendas com base nos filtros aplicados
  const dadosFiltrados = useMemo(() => {
    if (!filtros.periodo && !filtros.cliente && !filtros.funcionario && !filtros.produto) {
      return null;
    }

    let vendas = vendasCompletas;

    // Aplicar filtro de período
    if (filtros.periodo?.from) {
      vendas = vendas.filter(v => {
        const dataVenda = v.createdAt?.toDate?.() || new Date(v.createdAt);
        const from = filtros.periodo!.from!;
        const to = filtros.periodo!.to || from;
        return dataVenda >= from && dataVenda <= to;
      });
    }

    // Aplicar filtro de cliente
    if (filtros.cliente) {
      const cliente = clientesCompletos.find(c => c.nome === filtros.cliente);
      if (cliente) {
        vendas = vendas.filter(v => v.clienteId === cliente.id);
      }
    }

    // Aplicar filtro de funcionário
    if (filtros.funcionario) {
      const funcionario = funcionariosCompletos.find(f => f.nome === filtros.funcionario);
      if (funcionario) {
        vendas = vendas.filter(v => v.funcionarioId === funcionario.id);
      }
    }

    // Aplicar filtro de produto
    if (filtros.produto) {
      const produto = produtosCompletos.find(p => p.nome === filtros.produto);
      if (produto) {
        vendas = vendas.filter(v => v.produtoId === produto.id);
      }
    }

    return vendas.map(v => {
      const cliente = clientesCompletos.find(c => c.id === v.clienteId);
      const funcionario = funcionariosCompletos.find(f => f.id === v.funcionarioId);
      const produto = produtosCompletos.find(p => p.id === v.produtoId);
      
      // Usar comissão salva na venda ou calcular
      let comissaoPercentual = v.comissaoPercentual || v.comissaoAgentePercentual || 0;
      let comissaoCalculada = v.comissao || v.comissaoAgente || 0;
      
      // Se não houver comissão salva, calcular usando tabela de faixas ou percentual fixo
      if (!comissaoCalculada && produto) {
        if (produto.comissoes && produto.comissoes.length > 0) {
          const faixaAplicavel = produto.comissoes.find(
            faixa => v.valorContrato >= faixa.valorMin && v.valorContrato <= faixa.valorMax
          );
          
          if (faixaAplicavel) {
            comissaoPercentual = faixaAplicavel.percentual;
          } else {
            const ultimaFaixa = produto.comissoes[produto.comissoes.length - 1];
            comissaoPercentual = ultimaFaixa.percentual;
          }
        } else {
          comissaoPercentual = produto.comissaoAgente || produto.comissao || 0;
        }
        
        comissaoCalculada = v.valorContrato * (comissaoPercentual / 100);
      }
      
      // Calcular comissão do fornecedor (valor a receber) - usar valor salvo ou calcular
      const comissaoFornecedorPercentual = v.comissaoFornecedorPercentual || produto?.comissaoFornecedor || 0;
      const valorAReceber = v.comissaoFornecedor || (v.valorContrato * comissaoFornecedorPercentual / 100);
      
      return {
        id: v.id,
        data: v.createdAt?.toDate?.() || new Date(v.createdAt),
        cliente: cliente?.nome || "N/A",
        cpf: cliente?.cpf || "N/A",
        funcionario: funcionario?.nome || "N/A",
        produto: produto?.nome || "N/A",
        valorContrato: v.valorContrato,
        prazo: v.prazo,
        comissao: comissaoCalculada,
        comissaoPercentual: comissaoPercentual,
        comissaoFornecedorPercentual: comissaoFornecedorPercentual,
        valorAReceber: valorAReceber,
        status: v.status,
      };
    });
  }, [filtros, vendasCompletas, clientesCompletos, funcionariosCompletos, produtosCompletos]);

  // Recalcular dados dos gráficos baseado nos filtros
  const dadosGraficos = useMemo(() => {
    if (!dadosRelatorio) return null;

    // Se não há filtros, usar dados originais
    if (!filtros.periodo && !filtros.cliente && !filtros.funcionario && !filtros.produto) {
      return dadosRelatorio;
    }

    // Filtrar vendas
    let vendasFiltradas = vendasCompletas;

    if (filtros.periodo?.from) {
      vendasFiltradas = vendasFiltradas.filter(v => {
        const dataVenda = v.createdAt?.toDate?.() || new Date(v.createdAt);
        const from = filtros.periodo!.from!;
        const to = filtros.periodo!.to || from;
        return dataVenda >= from && dataVenda <= to;
      });
    }

    if (filtros.cliente) {
      const cliente = clientesCompletos.find(c => c.nome === filtros.cliente);
      if (cliente) {
        vendasFiltradas = vendasFiltradas.filter(v => v.clienteId === cliente.id);
      }
    }

    if (filtros.funcionario) {
      const funcionario = funcionariosCompletos.find(f => f.nome === filtros.funcionario);
      if (funcionario) {
        vendasFiltradas = vendasFiltradas.filter(v => v.funcionarioId === funcionario.id);
      }
    }

    if (filtros.produto) {
      const produto = produtosCompletos.find(p => p.nome === filtros.produto);
      if (produto) {
        vendasFiltradas = vendasFiltradas.filter(v => v.produtoId === produto.id);
      }
    }

    // Recalcular vendas por mês com dados filtrados
    const vendasPorMes: Array<{ mes: string; valor: number; quantidade: number }> = [];
    const receitasPorMes: Array<{ mes: string; valor: number }> = [];
    const lucrosPorMes: Array<{ mes: string; valor: number }> = [];
    const agora = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const mesData = subMonths(agora, i);
      const inicioMes = startOfMonth(mesData);
      const fimMes = endOfMonth(mesData);

      const vendasDoMes = vendasFiltradas.filter((v) => {
        const dataVenda = v.createdAt?.toDate?.() || new Date(v.createdAt);
        return dataVenda >= inicioMes && dataVenda <= fimMes;
      });

      const despesasDoMes = despesasCompletas.filter((d) => {
        const dataDespesa = new Date(d.dataVencimento);
        return dataDespesa >= inicioMes && dataDespesa <= fimMes;
      });

      const valorVendas = vendasDoMes.reduce((sum, v) => sum + v.valorContrato, 0);
      const valorDespesas = despesasDoMes.reduce((sum, d) => sum + d.valor, 0);
      
      vendasPorMes.push({
        mes: format(mesData, "MMM", { locale: ptBR }),
        valor: valorVendas,
        quantidade: vendasDoMes.length,
      });

      receitasPorMes.push({
        mes: format(mesData, "MMM", { locale: ptBR }),
        valor: valorVendas,
      });

      lucrosPorMes.push({
        mes: format(mesData, "MMM", { locale: ptBR }),
        valor: valorVendas - valorDespesas,
      });
    }

    // Recalcular vendas por funcionário
    const vendaPorFunc = new Map<string, { vendas: number; comissao: number; comissaoFornecedor: number }>();
    vendasFiltradas.forEach((venda) => {
      const produto = produtosCompletos.find(p => p.id === venda.produtoId);
      
      // Comissão do agente - importar da venda (priority 1) ou calcular do produto
      let comissaoCalculada = venda.comissaoAgente || venda.comissao || 0;
      if (!comissaoCalculada && produto) {
        const comissaoPercentual = venda.comissaoAgentePercentual || venda.comissaoPercentual || produto?.comissaoAgente || produto?.comissao || 0;
        comissaoCalculada = venda.valorContrato * (comissaoPercentual / 100);
      }
      
      // Comissão do fornecedor - sempre importar da venda (dados reais salvos)
      let comissaoFornecedorCalculada = venda.comissaoFornecedor || 0;
      if (!comissaoFornecedorCalculada && venda.comissaoFornecedorPercentual) {
        comissaoFornecedorCalculada = venda.valorContrato * (venda.comissaoFornecedorPercentual / 100);
      } else if (!comissaoFornecedorCalculada && produto?.comissaoFornecedor) {
        comissaoFornecedorCalculada = venda.valorContrato * (produto.comissaoFornecedor / 100);
      }
      
      const current = vendaPorFunc.get(venda.funcionarioId) || { vendas: 0, comissao: 0, comissaoFornecedor: 0 };
      vendaPorFunc.set(venda.funcionarioId, {
        vendas: current.vendas + 1,
        comissao: current.comissao + comissaoCalculada,
        comissaoFornecedor: current.comissaoFornecedor + comissaoFornecedorCalculada,
      });
    });

    const funcionariosData = Array.from(vendaPorFunc.entries())
      .map(([id, stats]) => {
        const func = funcionariosCompletos.find((f) => f.id === id);
        return {
          nome: func?.nome || "Desconhecido",
          vendas: stats.vendas,
          comissao: stats.comissao,
          comissaoFornecedor: stats.comissaoFornecedor,
        };
      })
      .sort((a, b) => b.vendas - a.vendas)
      .slice(0, 5);

    // Recalcular vendas por produto
    const vendaPorProd = new Map<string, number>();
    vendasFiltradas.forEach((venda) => {
      const current = vendaPorProd.get(venda.produtoId) || 0;
      vendaPorProd.set(venda.produtoId, current + venda.valorContrato);
    });

    const produtosData = Array.from(vendaPorProd.entries())
      .map(([id, valor]) => {
        const prod = produtosCompletos.find((p) => p.id === id);
        return {
          nome: prod?.nome || "Desconhecido",
          valor,
          comissao: prod?.comissao || 0,
        };
      })
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 4);

    // Recalcular vendas por cliente
    const vendaPorCliente = new Map<string, { vendas: number; valor: number }>();
    vendasFiltradas.forEach((venda) => {
      const current = vendaPorCliente.get(venda.clienteId) || { vendas: 0, valor: 0 };
      vendaPorCliente.set(venda.clienteId, {
        vendas: current.vendas + 1,
        valor: current.valor + venda.valorContrato,
      });
    });

    const clientesData = Array.from(vendaPorCliente.entries())
      .map(([id, stats]) => {
        const cliente = clientesCompletos.find((c) => c.id === id);
        return {
          nome: cliente?.nome || "Desconhecido",
          vendas: stats.vendas,
          valor: stats.valor,
        };
      })
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);

    return {
      vendas: vendasPorMes,
      funcionarios: funcionariosData,
      produtos: produtosData,
      fornecedores: dadosRelatorio.fornecedores,
      clientes: clientesData,
      despesas: dadosRelatorio.despesas,
      receitas: receitasPorMes,
      lucros: lucrosPorMes,
    };
  }, [filtros, dadosRelatorio, vendasCompletas, clientesCompletos, funcionariosCompletos, produtosCompletos, despesasCompletas]);

  const handleExportarDados = () => {
    if (!dadosFiltrados || dadosFiltrados.length === 0) {
      toast.error("Nenhum dado filtrado para exportar");
      return;
    }

    try {
      const dadosExport = dadosFiltrados.map((venda) => ({
        "Data": format(venda.data, "dd/MM/yyyy HH:mm", { locale: ptBR }),
        "Cliente": venda.cliente,
        "CPF": venda.cpf,
        "Funcionário": venda.funcionario,
        "Produto": venda.produto,
        "Valor Contrato": venda.valorContrato,
        "Prazo (meses)": venda.prazo,
        "Comissão": venda.comissao,
        "Status": venda.status,
      }));

      // Criar workbook e worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dadosExport);

      // Definir largura das colunas
      ws['!cols'] = [
        { wch: 18 },  // Data
        { wch: 25 },  // Cliente
        { wch: 15 },  // CPF
        { wch: 25 },  // Funcionário
        { wch: 30 },  // Produto
        { wch: 15 },  // Valor Contrato
        { wch: 15 },  // Prazo
        { wch: 15 },  // Comissão
        { wch: 12 },  // Status
      ];

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, "Relatório");

      // Exportar arquivo
      XLSX.writeFile(wb, `relatorio_filtrado_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);

      toast.success(`${dadosFiltrados.length} registros exportados com sucesso!`);
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      toast.error("Erro ao exportar dados");
    }
  };

  const estatisticas = useMemo(() => {
    const dados = dadosGraficos || dadosRelatorio;
    if (!dados) return null;
    
    const totalVendas = dados.vendas.reduce((sum, v) => sum + v.valor, 0); // Valor total negociado pelos agentes
    const totalAnterior = dados.vendas.slice(0, -1).reduce((sum, v) => sum + v.valor, 0);
    const crescimento = totalAnterior > 0 ? ((totalVendas - totalAnterior) / totalAnterior) * 100 : 0;
    
    // Receita Bruta = soma das comissões pagas pelos fornecedores
    const totalComissoes = dados.funcionarios.reduce((sum, f) => sum + (f.comissaoFornecedor || 0), 0);
    
    const totalDespesas = dados.despesas.reduce((sum, d) => sum + d.valor, 0);
    const totalReceitas = dados.receitas.reduce((sum, r) => sum + r.valor, 0);
    const receitaLiquida = totalComissoes - totalDespesas; // Receita líquida = comissões dos fornecedores - despesas
    const lucroTotal = totalReceitas - totalDespesas;
    const margemLucro = totalComissoes > 0 ? (receitaLiquida / totalComissoes) * 100 : 0;

    return {
      totalVendas, // Valor movimentado (negociado)
      crescimento,
      ticketMedio: totalVendas / dados.vendas.reduce((sum, v) => sum + v.quantidade, 0) || 0,
      totalFuncionarios: dados.funcionarios.length,
      produtoMaisVendido: dados.produtos[0]?.nome || "N/A",
      totalComissoes, // Receita bruta (comissões recebidas dos fornecedores)
      totalDespesas,
      totalReceitas,
      receitaLiquida, // Receita líquida
      lucroTotal,
      margemLucro,
    };
  }, [dadosGraficos, dadosRelatorio]);

  const gerarFeedback = () => {
    if (!estatisticas) return { tipo: "neutro" as const, mensagem: "Carregando dados..." };
    
    if (estatisticas.crescimento > 10) {
      return {
        tipo: "positivo" as const,
        mensagem: `Excelente! Crescimento de ${estatisticas.crescimento.toFixed(1)}% em relação ao período anterior. Continue com o ótimo trabalho!`,
      };
    } else if (estatisticas.crescimento < 0) {
      return {
        tipo: "negativo" as const,
        mensagem: `Atenção: Queda de ${Math.abs(estatisticas.crescimento).toFixed(1)}% nas vendas. Recomenda-se revisar estratégias e motivar a equipe.`,
      };
    } else {
      return {
        tipo: "neutro" as const,
        mensagem: `Crescimento moderado de ${estatisticas.crescimento.toFixed(1)}%. Há oportunidades para melhorar o desempenho.`,
      };
    }
  };

  const handleGerarRelatorio = () => {
    toast.success("Relatório gerado com sucesso!");
  };

  const handleImprimir = async () => {
    if (!dadosRelatorio || !estatisticas) {
      toast.error("Dados ainda não carregados");
      return;
    }
    
    setGerando(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // Cabeçalho
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório Gerencial", pageWidth / 2, y, { align: "center" });
      
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, y, { align: "center" });

      y += 15;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Resumo Executivo", 14, y);

      y += 10;
      autoTable(doc, {
        startY: y,
        head: [["Métrica", "Valor"]],
        body: [
          ["Total de Vendas", `R$ ${estatisticas.totalVendas.toLocaleString("pt-BR")}`],
          ["Total Comissão Fornecedor", `R$ ${dadosFiltrados.reduce((sum, v) => sum + v.valorAReceber, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
          ["Crescimento", `${estatisticas.crescimento > 0 ? "+" : ""}${estatisticas.crescimento.toFixed(1)}%`],
          ["Ticket Médio", `R$ ${estatisticas.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
          ["Total de Funcionários", estatisticas.totalFuncionarios.toString()],
          ["Produto Mais Vendido", estatisticas.produtoMaisVendido],
        ],
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
      });

      // Vendas por Funcionário
      doc.addPage();
      y = 20;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Desempenho por Funcionário", 14, y);

      y += 10;
      autoTable(doc, {
        startY: y,
        head: [["Funcionário", "Vendas", "Comissão"]],
        body: dadosRelatorio.funcionarios.map(f => [
          f.nome,
          f.vendas.toString(),
          `R$ ${f.comissao.toLocaleString("pt-BR")}`,
        ]),
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246] },
      });

      // Vendas por Produto
      doc.addPage();
      y = 20;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Vendas por Produto", 14, y);

      y += 10;
      autoTable(doc, {
        startY: y,
        head: [["Produto", "Valor Total"]],
        body: dadosRelatorio.produtos.map(p => [
          p.nome,
          `R$ ${p.valor.toLocaleString("pt-BR")}`,
        ]),
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246] },
      });

      // Top 10 Clientes
      doc.addPage();
      y = 20;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Top 10 Clientes", 14, y);

      y += 10;
      autoTable(doc, {
        startY: y,
        head: [["Cliente", "Qtd. Vendas", "Valor Total"]],
        body: dadosRelatorio.clientes.map(c => [
          c.nome,
          c.vendas.toString(),
          `R$ ${c.valor.toLocaleString("pt-BR")}`,
        ]),
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246] },
      });

      // Detalhamento das Vendas com Valores a Receber
      if (dadosFiltrados.length > 0) {
        doc.addPage();
        y = 20;
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Detalhamento de Vendas", 14, y);

        y += 10;
        autoTable(doc, {
          startY: y,
          head: [["Data", "Cliente", "Produto", "Valor Contrato", "Comissão Fornecedor", "Comissão Agente"]],
          body: dadosFiltrados.map(v => [
            format(v.data, "dd/MM/yyyy", { locale: ptBR }),
            v.cliente,
            v.produto,
            `R$ ${v.valorContrato.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            `R$ ${v.valorAReceber.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            `R$ ${v.comissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          ]),
          theme: "striped",
          headStyles: { fillColor: [59, 130, 246] },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 35 },
            2: { cellWidth: 35 },
            3: { cellWidth: 30, halign: 'right' },
            4: { cellWidth: 30, halign: 'right' },
            5: { cellWidth: 30, halign: 'right' },
          },
        });
      }

      // Rodapé
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Página ${i} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      doc.save(`relatorio_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`);
      toast.success("Relatório exportado com sucesso!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao gerar PDF:", errorMessage, error);
      toast.error("Erro ao gerar o relatório. Tente novamente.");
    } finally {
      setGerando(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Relatórios Gerenciais"
          description="Análise completa do desempenho e resultados"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const feedback = gerarFeedback();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios Gerenciais"
        description="Análises inteligentes e insights para tomada de decisões"
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Movimentado</p>
              <h3 className="text-2xl font-bold mt-2 text-blue-700 dark:text-blue-300">
                R$ {estatisticas!.totalVendas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Valor negociado pelos agentes</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">Receita Bruta</p>
              <h3 className="text-2xl font-bold mt-2 text-green-700 dark:text-green-300">
                R$ {estatisticas!.totalComissoes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">Comissões recebidas dos fornecedores</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-100">Total de Despesas</p>
              <h3 className="text-2xl font-bold mt-2 text-red-700 dark:text-red-300">
                R$ {estatisticas!.totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">Despesas lançadas no sistema</p>
            </div>
            <DollarSign className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </Card>

        <Card className={`p-6 bg-gradient-to-br ${estatisticas!.receitaLiquida >= 0 ? 'from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900' : 'from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900'}`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium ${estatisticas!.receitaLiquida >= 0 ? 'text-emerald-900 dark:text-emerald-100' : 'text-orange-900 dark:text-orange-100'}`}>
                Receita Líquida
              </p>
              <h3 className={`text-2xl font-bold mt-2 ${estatisticas!.receitaLiquida >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-orange-700 dark:text-orange-300'}`}>
                R$ {estatisticas!.receitaLiquida.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
              <p className={`text-xs mt-1 flex items-center gap-1 font-semibold ${estatisticas!.receitaLiquida >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-orange-700 dark:text-orange-300'}`}>
                {estatisticas!.receitaLiquida >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                Margem: {estatisticas!.margemLucro.toFixed(1)}%
              </p>
            </div>
            <DollarSign className={`w-8 h-8 ${estatisticas!.receitaLiquida >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`} />
          </div>
        </Card>
      </div>

      {/* KPIs Secundários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
              <h3 className="text-2xl font-bold mt-2">
                R$ {estatisticas!.ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Funcionários Ativos</p>
              <h3 className="text-2xl font-bold mt-2">{estatisticas!.totalFuncionarios}</h3>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Produto Destaque</p>
              <h3 className="text-lg font-bold mt-2">{estatisticas!.produtoMaisVendido}</h3>
            </div>
            <Package className="w-8 h-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <FiltrosDinamicosRelatorio
        filtros={filtros}
        onFiltrosChange={setFiltros}
        fornecedores={dadosRelatorio!.fornecedores.map(f => f.nome)}
        funcionarios={dadosRelatorio!.funcionarios.map(f => f.nome)}
        produtos={dadosRelatorio!.produtos.map(p => p.nome)}
        clientes={dadosRelatorio!.clientes.map(c => c.nome)}
        onGerarRelatorio={handleGerarRelatorio}
      />

      {/* Tabela de Dados Filtrados */}
      {dadosFiltrados && dadosFiltrados.length > 0 && (
        <Card>
          <div className="p-6 border-b flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Registros Filtrados</h3>
              <p className="text-sm text-muted-foreground">
                {dadosFiltrados.length} {dadosFiltrados.length === 1 ? "registro encontrado" : "registros encontrados"}
              </p>
            </div>
            <Button onClick={handleExportarDados} className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Exportar Excel
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Valor Contrato</TableHead>
                  <TableHead className="text-right">Prazo</TableHead>
                  <TableHead className="text-right bg-blue-50">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center justify-end gap-1 w-full">
                          Comissão Fornecedor
                          <HelpCircle className="w-3 h-3" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Valor da comissão que será paga pelo fornecedor/banco</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead className="text-right bg-green-50">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center justify-end gap-1 w-full">
                          Comissão Agente (%)
                          <HelpCircle className="w-3 h-3" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Percentual da comissão do agente/vendedor</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead className="text-right bg-green-50">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center justify-end gap-1 w-full">
                          Comissão Agente (R$)
                          <HelpCircle className="w-3 h-3" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Valor em reais da comissão do agente/vendedor</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosFiltrados.map((venda) => (
                  <TableRow key={venda.id}>
                    <TableCell className="whitespace-nowrap">{format(venda.data, "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                    <TableCell className="font-medium">{venda.cliente}</TableCell>
                    <TableCell>{venda.cpf}</TableCell>
                    <TableCell>{venda.funcionario}</TableCell>
                    <TableCell>{venda.produto}</TableCell>
                    <TableCell className="text-right">R$ {venda.valorContrato.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">{venda.prazo} meses</TableCell>
                    <TableCell className="text-right bg-blue-50 font-semibold text-blue-700">R$ {venda.valorAReceber.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right bg-green-50 font-semibold text-green-700">{venda.comissaoPercentual.toFixed(2)}%</TableCell>
                    <TableCell className="text-right bg-green-50 font-semibold text-green-700">R$ {venda.comissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        venda.status === "aprovada" ? "bg-green-100 text-green-800" :
                        venda.status === "pendente" ? "bg-yellow-100 text-yellow-800" :
                        venda.status === "em_analise" ? "bg-blue-100 text-blue-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {venda.status.replace("_", " ")}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Tabela de Despesas de Folha de Pagamento */}
      {despesasCompletas && despesasCompletas.filter(d => d.origem === "folha_pagamento").length > 0 && (
        <Card>
          <div className="p-6 border-b">
            <div>
              <h3 className="text-lg font-semibold">Despesas de Folha de Pagamento</h3>
              <p className="text-sm text-muted-foreground">
                {despesasCompletas.filter(d => d.origem === "folha_pagamento").length} folha(s) importada(s) como despesa
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {despesasCompletas
                  .filter(d => d.origem === "folha_pagamento")
                  .sort((a, b) => new Date(b.dataVencimento).getTime() - new Date(a.dataVencimento).getTime())
                  .map((despesa) => (
                    <TableRow key={despesa.id}>
                      <TableCell className="font-medium">{despesa.descricao}</TableCell>
                      <TableCell>
                        {format(new Date(despesa.dataVencimento), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {despesa.dataPagamento
                          ? format(new Date(despesa.dataPagamento), "dd/MM/yyyy", { locale: ptBR })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-red-600">
                        R$ {despesa.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          despesa.status === "Pago" ? "bg-green-100 text-green-800" :
                          despesa.status === "Pendente" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {despesa.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {despesa.observacoes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Ações */}
      <div className="flex gap-3 justify-end">
        <Button 
          variant="outline" 
          className="gap-2" 
          onClick={() => {
            try {
              window.print();
            } catch (error) {
              console.error("Erro ao imprimir:", error);
              toast.error("Erro ao abrir impressão");
            }
          }}
        >
          <Printer className="w-4 h-4" />
          Imprimir
        </Button>
        <Button className="gap-2" onClick={handleImprimir} disabled={gerando}>
          <Download className="w-4 h-4" />
          {gerando ? "Gerando PDF..." : "Exportar PDF"}
        </Button>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GraficoModerno
          titulo="Evolução de Vendas"
          tipo="linha"
          dados={{
            labels: (dadosGraficos || dadosRelatorio)!.vendas.map(v => v.mes),
            valores: (dadosGraficos || dadosRelatorio)!.vendas.map(v => v.valor),
          }}
          feedback={feedback}
        />

        <GraficoModerno
          titulo="Vendas por Produto"
          tipo="pizza"
          dados={{
            labels: (dadosGraficos || dadosRelatorio)!.produtos.map(p => p.nome),
            valores: (dadosGraficos || dadosRelatorio)!.produtos.map(p => p.valor),
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GraficoModerno
          titulo="Receitas x Despesas"
          tipo="barra"
          dados={{
            labels: (dadosGraficos || dadosRelatorio)!.receitas.map(r => r.mes),
            valores: (dadosGraficos || dadosRelatorio)!.receitas.map(r => r.valor),
            comparacao: (dadosGraficos || dadosRelatorio)!.despesas.map(d => d.valor),
          }}
        />

        <GraficoModerno
          titulo="Evolução de Lucros"
          tipo="linha"
          dados={{
            labels: (dadosGraficos || dadosRelatorio)!.lucros.map(l => l.mes),
            valores: (dadosGraficos || dadosRelatorio)!.lucros.map(l => l.valor),
          }}
        />

        <GraficoModerno
          titulo="Despesas por Período"
          tipo="barra"
          dados={{
            labels: (dadosGraficos || dadosRelatorio)!.despesas.map(d => d.mes),
            valores: (dadosGraficos || dadosRelatorio)!.despesas.map(d => d.valor),
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GraficoModerno
          titulo="Desempenho por Funcionário"
          tipo="barra"
          dados={{
            labels: (dadosGraficos || dadosRelatorio)!.funcionarios.map(f => f.nome.split(" ")[0]),
            valores: (dadosGraficos || dadosRelatorio)!.funcionarios.map(f => f.comissao),
          }}
        />

        <GraficoModerno
          titulo="Vendas por Fornecedor"
          tipo="barra"
          dados={{
            labels: (dadosGraficos || dadosRelatorio)!.fornecedores.map(f => f.nome.replace("Banco ", "")),
            valores: (dadosGraficos || dadosRelatorio)!.fornecedores.map(f => f.valor),
          }}
        />

        <GraficoModerno
          titulo="Top 10 Clientes"
          tipo="barra"
          dados={{
            labels: (dadosGraficos || dadosRelatorio)!.clientes.map(c => c.nome.split(" ")[0]),
            valores: (dadosGraficos || dadosRelatorio)!.clientes.map(c => c.valor),
          }}
        />
      </div>
    </div>
  );
}
