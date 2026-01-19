import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getVendas, getDespesas, getProdutos } from "@/lib/firestore";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FolhaPagamento } from "@/types/folhaPagamento";
import { ProjecaoFluxoCaixa } from "@/types/financeiro";
import { calcularComissoes } from "@/lib/calculos-comissoes";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

export default function FluxoCaixa() {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [projecoes, setProjecoes] = useState<ProjecaoFluxoCaixa[]>([]);
  const [mesAtual, setMesAtual] = useState(new Date());
  const [saldoAtual, setSaldoAtual] = useState(0);

  useEffect(() => {
    carregarDados();
  }, [mesAtual]);

  const carregarDados = async () => {
    try {
      setLoading(true);

      const [vendas, despesas, produtos, folhasSnapshot] = await Promise.all([
        getVendas(),
        getDespesas(),
        getProdutos(),
        getDocs(collection(db, "folhaPagamento")),
      ]);

      const folhasPagamento = folhasSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        criadoEm: doc.data().criadoEm?.toDate(),
        atualizadoEm: doc.data().atualizadoEm?.toDate(),
        dataPagamento: doc.data().dataPagamento?.toDate(),
      })) as FolhaPagamento[];

      // Gerar projeções para os próximos 6 meses
      const projecoesMeses: ProjecaoFluxoCaixa[] = [];
      let saldoAcumulado = 0;

      for (let i = -1; i <= 5; i++) {
        const mesReferencia = addMonths(mesAtual, i);
        const inicioMes = startOfMonth(mesReferencia);
        const fimMes = endOfMonth(mesReferencia);
        const periodo = format(mesReferencia, "yyyy-MM");

        // ENTRADAS: Comissões dos fornecedores
        const vendasMes = vendas.filter((v) => {
          const dataVenda = v.createdAt?.toDate?.() || new Date(v.createdAt);
          return dataVenda >= inicioMes && dataVenda <= fimMes;
        });

        let entradasPrevistas = 0;
        let entradasRealizadas = 0;

        vendasMes.forEach((venda) => {
          const produto = produtos.find(p => p.id === venda.produtoId);
          const comissoes = calcularComissoes(venda, produto);
          const valorComissao = comissoes.comissaoFornecedor;

          entradasPrevistas += valorComissao;

          // Se a venda é antiga, considerar como realizada
          if (venda.status === "aprovada" && i <= 0) {
            entradasRealizadas += valorComissao;
          }
        });

        // SAÍDAS: Despesas + Folhas + Comissões aos Agentes
        const despesasMes = despesas.filter((d) => {
          const dataDespesa = new Date(d.dataVencimento);
          return dataDespesa >= inicioMes && dataDespesa <= fimMes;
        });

        const folhasMes = folhasPagamento.filter((f) => {
          const mesRef = f.mesReferencia + "-01";
          const dataFolha = new Date(mesRef);
          return dataFolha >= inicioMes && dataFolha <= fimMes;
        });

        let saidasPrevistas = 0;
        let saidasRealizadas = 0;

        // Despesas operacionais
        despesasMes.forEach((despesa) => {
          saidasPrevistas += despesa.valor;
          if (despesa.status === "Pago") {
            saidasRealizadas += despesa.valor;
          }
        });

        // Folhas de pagamento
        folhasMes.forEach((folha) => {
          saidasPrevistas += folha.salarioLiquido;
          if (folha.status === "paga") {
            saidasRealizadas += folha.salarioLiquido;
          }
        });

        // Comissões aos agentes (previstas)
        vendasMes.forEach((venda) => {
          const produto = produtos.find(p => p.id === venda.produtoId);
          const comissoes = calcularComissoes(venda, produto);
          saidasPrevistas += comissoes.comissaoAgente;
        });

        const saldoPrevisto = entradasPrevistas - saidasPrevistas;
        const saldoRealizado = entradasRealizadas - saidasRealizadas;
        saldoAcumulado += i <= 0 ? saldoRealizado : saldoPrevisto;

        projecoesMeses.push({
          periodo,
          entradasPrevistas,
          entradasRealizadas,
          saidasPrevistas,
          saidasRealizadas,
          saldoPrevisto,
          saldoRealizado,
          saldoAcumulado,
        });
      }

      setProjecoes(projecoesMeses);
      
      // Saldo atual é o acumulado do último mês realizado
      const mesAtualProjecao = projecoesMeses.find(p => p.periodo === format(mesAtual, "yyyy-MM"));
      setSaldoAtual(mesAtualProjecao?.saldoAcumulado || 0);

    } catch (error) {
      console.error("Erro ao carregar fluxo de caixa:", error);
      toast.error("Erro ao carregar dados do fluxo de caixa");
    } finally {
      setLoading(false);
    }
  };

  const mesAnterior = () => setMesAtual(prev => subMonths(prev, 1));
  const proximoMes = () => setMesAtual(prev => addMonths(prev, 1));

  if (!hasPermission(["admin", "gerente"])) {
    return (
      <div className="space-y-6">
        <PageHeader title="Fluxo de Caixa" description="Acesso restrito" />
        <Card className="p-6">
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Fluxo de Caixa" description="Projeções e controle financeiro" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const mesAtualProjecao = projecoes.find(p => p.periodo === format(mesAtual, "yyyy-MM"));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fluxo de Caixa"
        description="Projeções de entradas e saídas - Controle financeiro"
      />

      {/* Cards Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Saldo Atual</p>
              <h3 className={`text-2xl font-bold mt-2 ${saldoAtual >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                R$ {saldoAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">Entradas Previstas</p>
              <h3 className="text-2xl font-bold mt-2 text-green-700">
                R$ {mesAtualProjecao?.entradasPrevistas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <ArrowUpCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-900 dark:text-red-100">Saídas Previstas</p>
              <h3 className="text-2xl font-bold mt-2 text-red-700">
                R$ {mesAtualProjecao?.saidasPrevistas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <ArrowDownCircle className="w-8 h-8 text-red-600" />
          </div>
        </Card>

        <Card className={`p-6 bg-gradient-to-br ${mesAtualProjecao && mesAtualProjecao.saldoPrevisto >= 0 ? 'from-emerald-50 to-emerald-100' : 'from-orange-50 to-orange-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Saldo Previsto</p>
              <h3 className={`text-2xl font-bold mt-2 ${mesAtualProjecao && mesAtualProjecao.saldoPrevisto >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>
                R$ {mesAtualProjecao?.saldoPrevisto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
            </div>
            {mesAtualProjecao && mesAtualProjecao.saldoPrevisto >= 0 ? (
              <TrendingUp className="w-8 h-8 text-emerald-600" />
            ) : (
              <TrendingDown className="w-8 h-8 text-orange-600" />
            )}
          </div>
        </Card>
      </div>

      {/* Alertas */}
      {mesAtualProjecao && mesAtualProjecao.saldoPrevisto < 0 && (
        <Card className="p-4 border-orange-500 bg-orange-50 dark:bg-orange-950">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <div>
              <p className="font-semibold text-orange-900 dark:text-orange-100">Atenção: Saldo Negativo Previsto</p>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                As saídas previstas superam as entradas neste mês. Revise despesas ou busque antecipação de recebimentos.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Navegação de Mês */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={mesAnterior}>
            Mês Anterior
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span className="font-semibold text-lg">
              {format(mesAtual, "MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>
          <Button variant="outline" onClick={proximoMes}>
            Próximo Mês
          </Button>
        </div>
      </Card>

      {/* Tabela de Projeções */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Período</TableHead>
              <TableHead className="text-right">Entradas Previstas</TableHead>
              <TableHead className="text-right">Entradas Realizadas</TableHead>
              <TableHead className="text-right">Saídas Previstas</TableHead>
              <TableHead className="text-right">Saídas Realizadas</TableHead>
              <TableHead className="text-right">Saldo Previsto</TableHead>
              <TableHead className="text-right">Saldo Acumulado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projecoes.map((proj) => {
              const isFuturo = new Date(proj.periodo + "-01") > mesAtual;
              return (
                <TableRow key={proj.periodo} className={proj.periodo === format(mesAtual, "yyyy-MM") ? "bg-blue-50 dark:bg-blue-950" : ""}>
                  <TableCell className="font-medium">
                    {format(new Date(proj.periodo + "-01"), "MMMM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    R$ {proj.entradasPrevistas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right text-green-700 font-semibold">
                    {!isFuturo && `R$ ${proj.entradasRealizadas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                    {isFuturo && "-"}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    R$ {proj.saidasPrevistas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right text-red-700 font-semibold">
                    {!isFuturo && `R$ ${proj.saidasRealizadas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                    {isFuturo && "-"}
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${proj.saldoPrevisto >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                    R$ {proj.saldoPrevisto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className={`text-right font-bold ${proj.saldoAcumulado >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    R$ {proj.saldoAcumulado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
