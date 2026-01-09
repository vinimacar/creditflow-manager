import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { ImportarExcel, type DadosExcel } from "@/components/conciliacao/ImportarExcel";
import { FiltrosInteligentesConciliacao, type FiltrosConciliacao } from "@/components/conciliacao/FiltrosInteligentesConciliacao";
import { analisarConciliacao, calcularEstatisticas, type Divergencia } from "@/lib/conciliacao";
import { gerarRelatorioPDF } from "@/lib/gerarPDFConciliacao";
import { useAuth } from "@/contexts/AuthContext";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  FileBarChart,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Database,
  RefreshCw,
  FileSpreadsheet,
  CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getClientes, getProdutos, getFuncionarios } from "@/lib/firestore";

export default function Conciliacao() {
  const { hasPermission } = useAuth();
  const [dadosInternos, setDadosInternos] = useState<DadosExcel[]>([]);
  const [dadosFornecedor, setDadosFornecedor] = useState<DadosExcel[]>([]);
  const [filtros, setFiltros] = useState<FiltrosConciliacao>({});
  const [processando, setProcessando] = useState(false);
  const [carregandoSistema, setCarregandoSistema] = useState(false);
  const [periodoImportacao, setPeriodoImportacao] = useState<{ inicio?: Date; fim?: Date }>({});

  // Verificar permissão (apenas gerentes e admins)
  if (!hasPermission(["admin", "gerente"])) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Conciliação"
          description="Acesso restrito"
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Apenas gerentes e administradores podem acessar a ferramenta de conciliação.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleImportarInterno = (dados: DadosExcel[]) => {
    setDadosInternos(dados);
    toast.success(`${dados.length} registros internos importados`);
  };

  const handleImportarFornecedor = (dados: DadosExcel[]) => {
    setDadosFornecedor(dados);
    toast.success(`${dados.length} registros do fornecedor importados`);
  };

  // Carregar dados do sistema (vendas do Firestore)
  const handleCarregarDoSistema = async () => {
    setCarregandoSistema(true);
    try {
      // Buscar vendas, clientes, produtos e funcionários
      const [vendasSnapshot, clientes, produtos, funcionarios] = await Promise.all([
        getDocs(query(collection(db, "vendas"), orderBy("createdAt", "desc"))),
        getClientes(),
        getProdutos(),
        getFuncionarios(),
      ]);

      let vendas = vendasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }));

      // Aplicar filtro de período se definido
      if (periodoImportacao.inicio && periodoImportacao.fim) {
        vendas = vendas.filter((venda: any) => {
          const dataVenda = venda.createdAt;
          if (!dataVenda) return false;
          return dataVenda >= periodoImportacao.inicio! && dataVenda <= periodoImportacao.fim!;
        });
      }

      // Mapear para o formato DadosExcel
      const dadosFormatados: DadosExcel[] = vendas.map((venda: any) => {
        const cliente = clientes.find(c => c.id === venda.clienteId);
        const produto = produtos.find(p => p.id === venda.produtoId);
        const funcionario = funcionarios.find(f => f.id === venda.funcionarioId);

        return {
          contrato: venda.id || "",
          cliente: cliente?.nome || "",
          cpfCliente: cliente?.cpf || "",
          fornecedor: produto?.fornecedor || "",
          funcionario: funcionario?.nome || "",
          cpfFuncionario: funcionario?.cpf || "",
          produto: produto?.nome || "",
          prazo: venda.prazo || 0,
          valorComissao: venda.comissao || 0,
          valorProduto: venda.valorContrato || 0,
          dataVenda: venda.createdAt || new Date(),
          dataPagamento: undefined,
          status: venda.status || "pendente",
          observacoes: venda.observacoes || "",
        };
      });

      setDadosInternos(dadosFormatados);
      const mensagem = periodoImportacao.inicio && periodoImportacao.fim
        ? `${dadosFormatados.length} vendas carregadas (${format(periodoImportacao.inicio, "dd/MM/yyyy")} - ${format(periodoImportacao.fim, "dd/MM/yyyy")})`
        : `${dadosFormatados.length} vendas carregadas do sistema`;
      toast.success(mensagem);
    } catch (error) {
      console.error("Erro ao carregar dados do sistema:", error);
      toast.error("Erro ao carregar vendas do sistema");
    } finally {
      setCarregandoSistema(false);
    }
  };

  // Analisar conciliação
  const divergencias = useMemo(() => {
    if (dadosInternos.length === 0 || dadosFornecedor.length === 0) {
      return [];
    }
    return analisarConciliacao(dadosInternos, dadosFornecedor);
  }, [dadosInternos, dadosFornecedor]);

  // Aplicar filtros
  const divergenciasFiltradas = useMemo(() => {
    return divergencias.filter(div => {
      // Filtro de período
      if (filtros.periodo) {
        const dataVenda = div.dataVenda;
        if (dataVenda < filtros.periodo.inicio || dataVenda > filtros.periodo.fim) {
          return false;
        }
      }

      // Filtro de fornecedor
      if (filtros.fornecedor && div.fornecedor !== filtros.fornecedor) {
        return false;
      }

      // Filtro de funcionário
      if (filtros.funcionario && div.funcionario !== filtros.funcionario) {
        return false;
      }

      // Filtro de status
      if (filtros.statusDivergencia && filtros.statusDivergencia !== "todos") {
        if (filtros.statusDivergencia === "nao_encontrado") {
          if (div.status !== "nao_encontrado_fornecedor" && div.status !== "nao_encontrado_interno") {
            return false;
          }
        } else if (div.status !== filtros.statusDivergencia) {
          return false;
        }
      }

      // Filtro de valor mínimo
      if (filtros.valorMinimo !== undefined && div.valorComissaoInterno < filtros.valorMinimo) {
        return false;
      }

      // Filtro de valor máximo
      if (filtros.valorMaximo !== undefined && div.valorComissaoInterno > filtros.valorMaximo) {
        return false;
      }

      return true;
    });
  }, [divergencias, filtros]);

  // Calcular estatísticas
  const estatisticas = useMemo(() => {
    return calcularEstatisticas(divergenciasFiltradas);
  }, [divergenciasFiltradas]);

  // Extrair listas únicas para filtros
  const fornecedoresUnicos = useMemo(() => {
    return Array.from(new Set(divergencias.map(d => d.fornecedor))).filter(Boolean).sort();
  }, [divergencias]);

  const funcionariosUnicos = useMemo(() => {
    return Array.from(new Set(divergencias.map(d => d.funcionario))).filter(Boolean).sort();
  }, [divergencias]);

  const handleGerarPDF = async () => {
    if (divergenciasFiltradas.length === 0) {
      toast.error("Não há dados para gerar o relatório");
      return;
    }

    setProcessando(true);
    try {
      await gerarRelatorioPDF(divergenciasFiltradas, estatisticas, filtros);
      toast.success("Relatório PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar o relatório PDF");
    } finally {
      setProcessando(false);
    }
  };

  const handleExportarExcel = () => {
    if (dadosInternos.length === 0) {
      toast.error("Nenhuma venda disponível para exportar");
      return;
    }

    try {
      // Preparar dados para exportação
      const dadosExport = dadosInternos.map((venda) => ({
        "Contrato": venda.contrato,
        "Cliente": venda.cliente,
        "CPF Cliente": venda.cpfCliente || "-",
        "Produto": venda.produto || "-",
        "Prazo (meses)": venda.prazo || "-",
        "Fornecedor": venda.fornecedor,
        "Funcionário": venda.funcionario,
        "CPF Funcionário": venda.cpfFuncionario || "-",
        "Valor do Produto": venda.valorProduto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        "Comissão": venda.valorComissao.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        "Data da Venda": venda.dataVenda ? format(new Date(venda.dataVenda), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-",
        "Data de Pagamento": venda.dataPagamento ? format(new Date(venda.dataPagamento), "dd/MM/yyyy", { locale: ptBR }) : "-",
        "Status": venda.status || "-",
        "Observações": venda.observacoes || "-",
      }));

      // Criar CSV
      const headers = Object.keys(dadosExport[0]);
      const csvContent = [
        headers.join(","),
        ...dadosExport.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            // Envolver em aspas se contiver vírgula
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
          }).join(",")
        )
      ].join("\n");

      // Criar BOM para UTF-8
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `vendas_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${dadosInternos.length} vendas exportadas com sucesso!`);
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      toast.error("Erro ao exportar vendas");
    }
  };

  const getStatusBadge = (status: Divergencia["status"]) => {
    switch (status) {
      case "ok":
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <CheckCircle2 className="w-3 h-3" />
            Conciliado
          </Badge>
        );
      case "divergente":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="w-3 h-3" />
            Divergente
          </Badge>
        );
      case "nao_encontrado_fornecedor":
      case "nao_encontrado_interno":
        return (
          <Badge variant="secondary" className="gap-1">
            <XCircle className="w-3 h-3" />
            Não Encontrado
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conciliação de Comissões"
        description="Análise e validação de comissões pagas pelos fornecedores"
      />

      {/* Cards de Importação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Dados Internos</h3>
                <p className="text-sm text-muted-foreground">
                  {dadosInternos.length > 0 
                    ? `${dadosInternos.length} registros carregados`
                    : "Carregue ou importe dados internos"
                  }
                </p>
              </div>
            </div>
            
            {/* Filtro de período para importação */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Período (opcional)</label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !periodoImportacao.inicio && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {periodoImportacao.inicio ? format(periodoImportacao.inicio, "dd/MM/yyyy", { locale: ptBR }) : "Data inicial"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={periodoImportacao.inicio}
                      onSelect={(date) => setPeriodoImportacao(prev => ({ ...prev, inicio: date }))}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !periodoImportacao.fim && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {periodoImportacao.fim ? format(periodoImportacao.fim, "dd/MM/yyyy", { locale: ptBR }) : "Data final"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={periodoImportacao.fim}
                      onSelect={(date) => setPeriodoImportacao(prev => ({ ...prev, fim: date }))}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleCarregarDoSistema}
                disabled={carregandoSistema}
                className="flex-1 gap-2"
                variant="default"
              >
                {carregandoSistema ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Carregar do Sistema
                  </>
                )}
              </Button>
              <ImportarExcel tipo="interno" onImport={handleImportarInterno} apenasButton={true} />
            </div>
            {dadosInternos.length > 0 && (
              <Button
                onClick={handleExportarExcel}
                variant="outline"
                className="w-full gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Exportar Excel ({dadosInternos.length} vendas)
              </Button>
            )}
          </div>
        </Card>
        <ImportarExcel tipo="fornecedor" onImport={handleImportarFornecedor} />
      </div>

      {/* Tabela de Dados Internos Carregados */}
      {dadosInternos.length > 0 && divergencias.length === 0 && (
        <Card>
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Dados Internos Carregados</h3>
            <p className="text-sm text-muted-foreground">
              {dadosInternos.length} {dadosInternos.length === 1 ? "venda carregada" : "vendas carregadas"}
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>CPF Cliente</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Funcionário</TableHead>
                  <TableHead className="text-right">Valor Produto</TableHead>
                  <TableHead className="text-right bg-blue-50">Comissão</TableHead>
                  <TableHead>Data Venda</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosInternos.slice(0, 50).map((venda, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-xs">{venda.contrato}</TableCell>
                    <TableCell className="font-medium">{venda.cliente}</TableCell>
                    <TableCell className="text-sm">{venda.cpfCliente || "-"}</TableCell>
                    <TableCell>{venda.produto || "-"}</TableCell>
                    <TableCell>{venda.prazo ? `${venda.prazo} meses` : "-"}</TableCell>
                    <TableCell>{venda.fornecedor}</TableCell>
                    <TableCell>{venda.funcionario}</TableCell>
                    <TableCell className="text-right">
                      R$ {venda.valorProduto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right bg-blue-50 font-semibold text-blue-700">
                      R$ {venda.valorComissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {venda.dataVenda ? format(new Date(venda.dataVenda), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={venda.status === "aprovada" ? "default" : "secondary"}>
                        {venda.status || "pendente"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {dadosInternos.length > 50 && (
            <div className="p-4 border-t text-center text-sm text-muted-foreground">
              Mostrando 50 de {dadosInternos.length} vendas. Exporte para ver todos os dados.
            </div>
          )}
        </Card>
      )}

      {/* Estatísticas */}
      {divergencias.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <h3 className="text-2xl font-bold mt-2">{estatisticas.total}</h3>
              </div>
              <FileBarChart className="w-8 h-8 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conciliados</p>
                <h3 className="text-2xl font-bold mt-2 text-green-600">
                  {estatisticas.conciliados}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {estatisticas.percentualConciliado.toFixed(1)}%
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Divergentes</p>
                <h3 className="text-2xl font-bold mt-2 text-orange-600">
                  {estatisticas.divergentes}
                </h3>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Diferença Total</p>
                <h3 className={`text-2xl font-bold mt-2 ${estatisticas.diferencaTotalComissao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {Math.abs(estatisticas.diferencaTotalComissao).toFixed(2)}
                </h3>
              </div>
              {estatisticas.diferencaTotalComissao >= 0 ? (
                <TrendingUp className="w-8 h-8 text-green-600" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-600" />
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Filtros */}
      {divergencias.length > 0 && (
        <FiltrosInteligentesConciliacao
          filtros={filtros}
          onFiltrosChange={setFiltros}
          fornecedores={fornecedoresUnicos}
          funcionarios={funcionariosUnicos}
        />
      )}

      {/* Tabela de Divergências */}
      {divergencias.length > 0 ? (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Resultados da Conciliação
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({divergenciasFiltradas.length} registros)
                </span>
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={handleExportarExcel}
                  disabled={dadosInternos.length === 0}
                  variant="default"
                  className="gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Exportar Excel
                </Button>
                <Button
                  onClick={() => toast.success("Conciliação realizada com sucesso!")}
                  variant="secondary"
                  className="gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Conciliar
                </Button>
                <Button
                  onClick={handleGerarPDF}
                  disabled={processando || divergenciasFiltradas.length === 0}
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  {processando ? "Gerando PDF..." : "Gerar Relatório PDF"}
                </Button>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Funcionário</TableHead>
                    <TableHead className="text-right">Comissão Interna</TableHead>
                    <TableHead className="text-right">Comissão Fornecedor</TableHead>
                    <TableHead className="text-right">Taxa</TableHead>
                    <TableHead className="text-right">Diferença</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {divergenciasFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Nenhum registro encontrado com os filtros aplicados
                      </TableCell>
                    </TableRow>
                  ) : (
                    divergenciasFiltradas.map((div) => (
                      <TableRow key={div.id}>
                        <TableCell className="font-medium">
                          {div.contratoInterno || div.contratoFornecedor}
                        </TableCell>
                        <TableCell>{div.cliente}</TableCell>
                        <TableCell>{div.fornecedor}</TableCell>
                        <TableCell>{div.funcionario}</TableCell>
                        <TableCell className="text-right">
                          R$ {div.valorComissaoInterno.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {div.valorComissaoFornecedor.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                            <div className={cn(
                              "font-medium",
                              div.validacaoInteligente?.taxaDivergente && "text-orange-600"
                            )}>
                              {div.validacaoInteligente?.taxaAplicadaInterno.toFixed(2)}%
                            </div>
                            {div.validacaoInteligente?.taxaAplicadaFornecedor > 0 && 
                             div.validacaoInteligente.taxaAplicadaFornecedor !== div.validacaoInteligente.taxaAplicadaInterno && (
                              <div className="text-xs text-muted-foreground">
                                Forn: {div.validacaoInteligente.taxaAplicadaFornecedor.toFixed(2)}%
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={div.diferencaComissao > 0.01 ? "text-red-600 font-semibold" : "text-green-600"}>
                            R$ {div.diferencaComissao.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(div.status)}
                          {div.validacaoInteligente?.observacoes && div.validacaoInteligente.observacoes.length > 0 && (
                            <div className="text-xs mt-1 space-y-0.5">
                              {div.validacaoInteligente.observacoes.slice(0, 2).map((obs, idx) => (
                                <div key={idx} className={cn(
                                  obs.includes('✓') ? "text-green-600" : 
                                  obs.includes('⚠️') ? "text-orange-600" : 
                                  "text-red-600"
                                )}>
                                  {obs}
                                </div>
                              ))}
                            </div>
                          )}
                          {div.tiposDivergencia.length > 0 && !div.validacaoInteligente?.observacoes?.length && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {div.tiposDivergencia[0]}
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
        </Card>
      ) : (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <FileBarChart className="w-16 h-16 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Nenhuma conciliação iniciada</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Importe os dados internos e o relatório do fornecedor para iniciar a análise de conciliação.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
