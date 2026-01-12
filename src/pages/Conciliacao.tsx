import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ImportarPDF } from "@/components/conciliacao/ImportarPDF";
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
  X,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getClientes, getProdutos, getFuncionarios, getFornecedores, type Fornecedor } from "@/lib/firestore";

export default function Conciliacao() {
  const { hasPermission } = useAuth();
  const [dadosInternos, setDadosInternos] = useState<DadosExcel[]>([]);
  const [dadosFornecedor, setDadosFornecedor] = useState<DadosExcel[]>([]);
  const [filtros, setFiltros] = useState<FiltrosConciliacao>({});
  const [processando, setProcessando] = useState(false);
  const [carregandoSistema, setCarregandoSistema] = useState(false);
  const [periodoImportacao, setPeriodoImportacao] = useState<{ inicio?: Date; fim?: Date }>({});
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [fornecedorFiltro, setFornecedorFiltro] = useState<string>("todos");
  const [etapaAtual, setEtapaAtual] = useState<1 | 2 | 3>(1); // Controle de etapas do processo

  // Carregar fornecedores
  useEffect(() => {
    const carregarFornecedores = async () => {
      try {
        const data = await getFornecedores();
        setFornecedores(data);
      } catch (error) {
        console.error("Erro ao carregar fornecedores:", error);
      }
    };
    carregarFornecedores();
  }, []);

  const handleImportarInterno = (dados: DadosExcel[]) => {
    setDadosInternos(dados);
    toast.success(`${dados.length} registros internos importados`);
    if (dados.length > 0) {
      setEtapaAtual(2); // Avança para a etapa de importar extrato
    }
  };

  const handleImportarFornecedor = (dados: DadosExcel[]) => {
    setDadosFornecedor(dados);
    toast.success(`${dados.length} registros do extrato bancário importados`);
    if (dados.length > 0) {
      setEtapaAtual(3); // Avança para visualizar resultados da conciliação
    }
  };

  // Carregar dados do sistema (vendas do Firestore)
  const handleCarregarDoSistema = async () => {
    setCarregandoSistema(true);
    try {
      // Buscar vendas, clientes, produtos, funcionários e fornecedores
      const [vendasSnapshot, clientes, produtos, funcionarios, fornecedoresData] = await Promise.all([
        getDocs(query(collection(db, "vendas"), orderBy("createdAt", "desc"))),
        getClientes(),
        getProdutos(),
        getFuncionarios(),
        getFornecedores(),
      ]);

      let vendas = vendasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as VendaFirestore[];

      // Aplicar filtro de período se definido
      if (periodoImportacao.inicio && periodoImportacao.fim) {
        vendas = vendas.filter((venda) => {
          const dataVenda = venda.createdAt as Date | undefined;
          if (!dataVenda) return false;
          return dataVenda >= periodoImportacao.inicio! && dataVenda <= periodoImportacao.fim!;
        });
      }

      // Mapear para o formato DadosExcel
      interface VendaFirestore {
        id: string;
        clienteId: string;
        produtoId: string;
        funcionarioId: string;
        valorContrato: number;
        comissao?: number;
        comissaoPercentual?: number;
        prazo?: number;
        status?: string;
        observacoes?: string;
        createdAt?: Date;
      }

      const dadosFormatados: DadosExcel[] = vendas.map((venda: VendaFirestore) => {
        const cliente = clientes.find(c => c.id === venda.clienteId);
        const produto = produtos.find(p => p.id === venda.produtoId);
        const funcionario = funcionarios.find(f => f.id === venda.funcionarioId);
        const fornecedor = fornecedoresData.find(f => f.id === produto?.fornecedorId);

        // Usar comissão salva na venda (já calculada corretamente no PDV)
        // Ou calcular baseado no produto se não houver comissão salva
        let valorComissao = venda.comissao || 0;
        let comissaoPercentual = venda.comissaoPercentual || 0;
        
        if (!venda.comissao && produto) {
          // Se a venda não tem comissão salva, calcular usando tabela de faixas ou percentual fixo
          if (produto.comissoes && produto.comissoes.length > 0) {
            const faixaAplicavel = produto.comissoes.find(
              faixa => venda.valorContrato >= faixa.valorMin && venda.valorContrato <= faixa.valorMax
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
          
          valorComissao = venda.valorContrato * (comissaoPercentual / 100);
        }

        return {
          contrato: venda.id || "",
          cliente: cliente?.nome || "",
          cpfCliente: cliente?.cpf || "",
          fornecedor: fornecedor?.nomeFantasia || "",
          funcionario: funcionario?.nome || "",
          cpfFuncionario: funcionario?.cpf || "",
          produto: produto?.nome || "",
          prazo: venda.prazo || 0,
          valorComissao: valorComissao,
          valorProduto: venda.valorContrato || 0,
          dataVenda: venda.createdAt || new Date(),
          dataPagamento: undefined,
          status: venda.status || "pendente",
          observacoes: `Comissão: ${comissaoPercentual.toFixed(2)}% | ${venda.observacoes || ""}`,
        };
      });

      setDadosInternos(dadosFormatados);
      const mensagem = periodoImportacao.inicio && periodoImportacao.fim
        ? `${dadosFormatados.length} vendas carregadas (${format(periodoImportacao.inicio, "dd/MM/yyyy")} - ${format(periodoImportacao.fim, "dd/MM/yyyy")})`
        : `${dadosFormatados.length} vendas carregadas do sistema`;
      toast.success(mensagem);
      
      if (dadosFormatados.length > 0) {
        setEtapaAtual(2); // Avança para importar extrato bancário
      }
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
        "Valor do Produto": venda.valorProduto,
        "Comissão": venda.valorComissao,
        "Data da Venda": venda.dataVenda ? format(new Date(venda.dataVenda), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-",
        "Data de Pagamento": venda.dataPagamento ? format(new Date(venda.dataPagamento), "dd/MM/yyyy", { locale: ptBR }) : "-",
        "Status": venda.status || "-",
        "Observações": venda.observacoes || "-",
      }));

      // Criar workbook e worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dadosExport);

      // Definir largura das colunas
      ws['!cols'] = [
        { wch: 15 },  // Contrato
        { wch: 25 },  // Cliente
        { wch: 15 },  // CPF Cliente
        { wch: 30 },  // Produto
        { wch: 12 },  // Prazo
        { wch: 25 },  // Fornecedor
        { wch: 25 },  // Funcionário
        { wch: 15 },  // CPF Funcionário
        { wch: 15 },  // Valor do Produto
        { wch: 15 },  // Comissão
        { wch: 18 },  // Data da Venda
        { wch: 18 },  // Data de Pagamento
        { wch: 12 },  // Status
        { wch: 30 },  // Observações
      ];

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, "Vendas");

      // Exportar arquivo
      XLSX.writeFile(wb, `vendas_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);

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

      {/* Indicador de Etapas */}
      <Card className="p-6">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex flex-col items-center flex-1">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-semibold",
              etapaAtual >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              1
            </div>
            <p className={cn(
              "text-sm mt-2 font-medium",
              etapaAtual >= 1 ? "text-foreground" : "text-muted-foreground"
            )}>
              Filtrar Vendas
            </p>
            {dadosInternos.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {dadosInternos.length} vendas
              </p>
            )}
          </div>
          
          <div className={cn(
            "flex-1 h-0.5 mx-4",
            etapaAtual >= 2 ? "bg-primary" : "bg-muted"
          )} />
          
          <div className="flex flex-col items-center flex-1">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-semibold",
              etapaAtual >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              2
            </div>
            <p className={cn(
              "text-sm mt-2 font-medium",
              etapaAtual >= 2 ? "text-foreground" : "text-muted-foreground"
            )}>
              Importar Extrato
            </p>
            {dadosFornecedor.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {dadosFornecedor.length} lançamentos
              </p>
            )}
          </div>
          
          <div className={cn(
            "flex-1 h-0.5 mx-4",
            etapaAtual >= 3 ? "bg-primary" : "bg-muted"
          )} />
          
          <div className="flex flex-col items-center flex-1">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-semibold",
              etapaAtual >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              3
            </div>
            <p className={cn(
              "text-sm mt-2 font-medium",
              etapaAtual >= 3 ? "text-foreground" : "text-muted-foreground"
            )}>
              Resultado
            </p>
            {divergencias.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {divergencias.length} análises
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Etapa 1: Filtrar e Carregar Vendas */}
      {etapaAtual === 1 && (
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Etapa 1: Carregar Vendas do Sistema</h3>
                <p className="text-sm text-muted-foreground">
                  Selecione o período e fornecedor para filtrar as vendas que serão conciliadas
                </p>
              </div>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
              <div className="space-y-2">
                <Label>Período</Label>
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

              <div className="space-y-2">
                <Label>Fornecedor (opcional)</Label>
                <Select value={fornecedorFiltro} onValueChange={setFornecedorFiltro}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os fornecedores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os fornecedores</SelectItem>
                    {fornecedores.map((fornecedor) => (
                      <SelectItem key={fornecedor.id} value={fornecedor.nomeFantasia}>
                        {fornecedor.nomeFantasia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Como funciona?</AlertTitle>
              <AlertDescription>
                Carregue as vendas do sistema ou importe uma planilha Excel com seus dados. 
                As vendas serão comparadas com o extrato bancário na próxima etapa.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                onClick={handleCarregarDoSistema}
                disabled={carregandoSistema}
                className="flex-1 gap-2 h-12"
                size="lg"
              >
                {carregandoSistema ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <Database className="w-5 h-5" />
                    Carregar Vendas do Sistema
                  </>
                )}
              </Button>
              <ImportarExcel tipo="interno" onImport={handleImportarInterno} apenasButton={true} />
              <ImportarPDF tipo="interno" onImport={handleImportarInterno} apenasButton={true} />
            </div>

            {/* Preview das Vendas Carregadas */}
            {dadosInternos.length > 0 && (
              <Card className="bg-green-50 border-green-200">
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-green-900">Vendas Carregadas do Sistema</h4>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEtapaAtual(2)}
                      className="gap-2"
                    >
                      Próxima Etapa →
                    </Button>
                  </div>
                  
                  <div className="bg-white p-3 rounded border border-green-300">
                    <div className="grid grid-cols-3 gap-4 mb-3 text-center">
                      <div>
                        <p className="text-2xl font-bold text-primary">{dadosInternos.length}</p>
                        <p className="text-xs text-muted-foreground">Vendas</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          R$ {dadosInternos.reduce((sum, v) => sum + v.valorComissao, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Comissões</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          R$ {dadosInternos.reduce((sum, v) => sum + v.valorProduto, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Produtos</p>
                      </div>
                    </div>

                    <div className="text-sm font-semibold mb-2">Primeiras 5 vendas:</div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Contrato</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Produto</TableHead>
                            <TableHead>Fornecedor</TableHead>
                            <TableHead className="text-right">Valor Produto</TableHead>
                            <TableHead className="text-right">Comissão</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dadosInternos.slice(0, 5).map((venda, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-mono text-xs">{venda.contrato || "-"}</TableCell>
                              <TableCell className="text-xs">{venda.cliente || "-"}</TableCell>
                              <TableCell className="text-xs">{venda.produto || "-"}</TableCell>
                              <TableCell className="text-xs">{venda.fornecedor || "-"}</TableCell>
                              <TableCell className="text-right font-medium text-blue-700">
                                R$ {venda.valorProduto?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "0,00"}
                              </TableCell>
                              <TableCell className="text-right font-bold text-green-700">
                                R$ {venda.valorComissao?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "0,00"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log("Vendas do Sistema (todas):", dadosInternos);
                        toast.success("Vendas exibidas no console (F12)");
                      }}
                    >
                      Ver todas no console ({dadosInternos.length})
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDadosInternos([]);
                        setEtapaAtual(1);
                      }}
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </Card>
      )}

      {/* Etapa 2: Importar Extrato Bancário */}
      {etapaAtual === 2 && (
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Etapa 2: Importar Extrato Bancário</h3>
                  <p className="text-sm text-muted-foreground">
                    Importe o extrato bancário para conciliar com as {dadosInternos.length} vendas carregadas
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setEtapaAtual(1)}>
                ← Voltar
              </Button>
            </div>

            {/* Resumo das vendas carregadas */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{dadosInternos.length}</p>
                  <p className="text-sm text-muted-foreground">Vendas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {dadosInternos.reduce((sum, v) => sum + v.valorComissao, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Comissões</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    R$ {dadosInternos.reduce((sum, v) => sum + v.valorProduto, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Produtos</p>
                </div>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Próximo passo</AlertTitle>
              <AlertDescription>
                Importe o arquivo de extrato bancário (Excel ou PDF) para que o sistema possa 
                identificar automaticamente as divergências entre suas vendas e os pagamentos recebidos.
                <br /><br />
                <strong>Campos necessários no extrato:</strong> Contrato, Cliente, CPF Cliente, Valor do Produto, Comissão
              </AlertDescription>
            </Alert>

            {/* Preview dos dados do extrato se já foi importado */}
            {dadosFornecedor.length > 0 && (
              <Card className="bg-yellow-50 border-yellow-200">
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <h4 className="font-semibold text-yellow-900">Preview do Extrato Importado</h4>
                  </div>
                  <div className="text-sm space-y-2">
                    <p className="text-yellow-800">
                      <strong>{dadosFornecedor.length} registros</strong> importados do extrato bancário.
                    </p>
                    <div className="bg-white p-3 rounded border border-yellow-300 space-y-3">
                      {dadosFornecedor.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="text-xs font-mono pb-2 border-b last:border-b-0">
                          <div className="font-bold mb-1">Registro {idx + 1}:</div>
                          <div><strong>Contrato:</strong> {item.contrato || "(vazio)"}</div>
                          <div><strong>Cliente:</strong> {item.cliente || "(vazio)"}</div>
                          <div><strong>CPF Cliente:</strong> {item.cpfCliente || "(vazio)"}</div>
                          <div className="text-blue-700"><strong>Valor Produto:</strong> R$ {item.valorProduto?.toFixed(2) || "0.00"}</div>
                          <div className={`font-bold ${item.valorComissao > 0 ? 'text-green-700' : 'text-red-700'}`}>
                            <strong>Comissão:</strong> R$ {item.valorComissao?.toFixed(2) || "0.00"}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          console.log("Dados do Extrato (todos):", dadosFornecedor);
                          toast.success("Dados do extrato exibidos no console (F12)");
                        }}
                      >
                        Ver todos no console
                      </Button>
                      {dadosFornecedor.filter(d => d.valorComissao === 0).length > 0 && (
                        <Badge variant="destructive">
                          {dadosFornecedor.filter(d => d.valorComissao === 0).length} comissões zeradas
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="font-medium">Importar Excel</h4>
                      <p className="text-xs text-muted-foreground">Arquivo .xlsx ou .xls</p>
                    </div>
                  </div>
                  <ImportarExcel tipo="fornecedor" onImport={handleImportarFornecedor} apenasButton={true} />
                </div>
              </Card>

              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-red-600" />
                    <div>
                      <h4 className="font-medium">Importar PDF</h4>
                      <p className="text-xs text-muted-foreground">Extrato em formato PDF</p>
                    </div>
                  </div>
                  <ImportarPDF tipo="fornecedor" onImport={handleImportarFornecedor} apenasButton={true} />
                </div>
              </Card>
            </div>
          </div>
        </Card>
      )}

      {/* Etapa 3: Visualizar Resultados - Só quando houver divergências */}
      {etapaAtual === 3 && divergencias.length > 0 && (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Resultado da Conciliação</h3>
              <p className="text-sm text-muted-foreground">
                Análise completa entre vendas e extrato bancário
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEtapaAtual(1)}>
                Nova Conciliação
              </Button>
              <Button
                onClick={handleGerarPDF}
                disabled={processando}
                className="gap-2"
                size="sm"
              >
                {processando ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Baixar PDF
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <p className="text-sm font-medium text-muted-foreground">Comissões Internas</p>
                <h3 className="text-xl font-bold mt-2 text-blue-600">
                  R$ {divergenciasFiltradas.reduce((sum, d) => sum + d.valorComissaoInterno, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Conforme cadastro
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
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

        {/* Filtros */}
        <FiltrosInteligentesConciliacao
          filtros={filtros}
          onFiltrosChange={setFiltros}
          fornecedores={fornecedoresUnicos}
          funcionarios={funcionariosUnicos}
        />

        {/* Tabela de Divergências */}
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
        </>
      )}
    </div>
  );
}
