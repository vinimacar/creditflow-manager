import { useState, useMemo } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Conciliacao() {
  const { hasPermission } = useAuth();
  const [dadosInternos, setDadosInternos] = useState<DadosExcel[]>([]);
  const [dadosFornecedor, setDadosFornecedor] = useState<DadosExcel[]>([]);
  const [filtros, setFiltros] = useState<FiltrosConciliacao>({});
  const [processando, setProcessando] = useState(false);

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
        <ImportarExcel tipo="interno" onImport={handleImportarInterno} />
        <ImportarExcel tipo="fornecedor" onImport={handleImportarFornecedor} />
      </div>

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
              <Button
                onClick={handleGerarPDF}
                disabled={processando || divergenciasFiltradas.length === 0}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                {processando ? "Gerando PDF..." : "Gerar Relatório PDF"}
              </Button>
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
                    <TableHead className="text-right">Diferença</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {divergenciasFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                          <span className={div.diferencaComissao > 0.01 ? "text-red-600 font-semibold" : "text-green-600"}>
                            R$ {div.diferencaComissao.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(div.status)}
                          {div.tiposDivergencia.length > 0 && (
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
