import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Database, FileText, Calendar, Shield, AlertTriangle } from "lucide-react";
import { exportarBackupCompleto, exportarColecao, exportarPorPeriodo } from "@/lib/backup";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export default function Backup() {
  const { hasPermission } = useAuth();
  const [carregando, setCarregando] = useState(false);
  const [colecaoSelecionada, setColecaoSelecionada] = useState("vendas");
  const [periodoSelecionado, setPeriodoSelecionado] = useState("mes_atual");

  const colecoes = [
    { value: "vendas", label: "Vendas", icon: "💰" },
    { value: "clientes", label: "Clientes", icon: "👥" },
    { value: "fornecedores", label: "Fornecedores", icon: "🏢" },
    { value: "produtos", label: "Produtos", icon: "📦" },
    { value: "funcionarios", label: "Funcionários", icon: "👨‍💼" },
    { value: "despesas", label: "Despesas", icon: "💸" },
    { value: "folhas_pagamento", label: "Folha de Pagamento", icon: "📊" },
    { value: "usuarios", label: "Usuários", icon: "🔐" },
    { value: "notificacoes", label: "Notificações", icon: "🔔" },
  ];

  const periodos = [
    { value: "mes_atual", label: "Mês Atual" },
    { value: "mes_anterior", label: "Mês Anterior" },
    { value: "ultimos_3_meses", label: "Últimos 3 Meses" },
    { value: "ultimos_6_meses", label: "Últimos 6 Meses" },
    { value: "ano_atual", label: "Ano Atual (2026)" },
  ];

  if (!hasPermission(["admin"])) {
    return (
      <div className="space-y-6">
        <PageHeader title="Backup e Exportação" description="Acesso restrito" />
        <Card className="p-6">
          <div className="flex items-center gap-2 text-amber-600">
            <Shield className="w-5 h-5" />
            <p>Apenas administradores podem acessar esta página.</p>
          </div>
        </Card>
      </div>
    );
  }

  const handleBackupCompleto = async () => {
    setCarregando(true);
    try {
      await exportarBackupCompleto();
    } finally {
      setCarregando(false);
    }
  };

  const handleExportarColecao = async () => {
    setCarregando(true);
    try {
      await exportarColecao(colecaoSelecionada);
    } finally {
      setCarregando(false);
    }
  };

  const handleExportarPorPeriodo = async () => {
    setCarregando(true);
    try {
      let dataInicio: Date;
      let dataFim: Date = new Date();

      switch (periodoSelecionado) {
        case "mes_atual":
          dataInicio = startOfMonth(new Date());
          dataFim = endOfMonth(new Date());
          break;
        case "mes_anterior": {
          const mesAnterior = subMonths(new Date(), 1);
          dataInicio = startOfMonth(mesAnterior);
          dataFim = endOfMonth(mesAnterior);
          break;
        }
        case "ultimos_3_meses":
          dataInicio = startOfMonth(subMonths(new Date(), 3));
          dataFim = endOfMonth(new Date());
          break;
        case "ultimos_6_meses":
          dataInicio = startOfMonth(subMonths(new Date(), 6));
          dataFim = endOfMonth(new Date());
          break;
        case "ano_atual":
          dataInicio = new Date("2026-01-01");
          dataFim = new Date("2026-12-31");
          break;
        default:
          dataInicio = startOfMonth(new Date());
          dataFim = endOfMonth(new Date());
      }

      // Determinar campo de data baseado na coleção
      const campoData = colecaoSelecionada === "vendas" || colecaoSelecionada === "despesas" 
        ? "createdAt" 
        : "criadoEm";

      await exportarPorPeriodo(colecaoSelecionada, campoData, dataInicio, dataFim);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Backup e Exportação" 
        description="Exporte seus dados em CSV para backup ou análise externa" 
      />

      {/* Alerta Importante */}
      <Card className="p-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-900 dark:text-amber-100">
            <p className="font-semibold mb-1">Recomendações de Backup</p>
            <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-200">
              <li>Realize backups completos semanalmente</li>
              <li>Armazene os arquivos em local seguro (nuvem ou disco externo)</li>
              <li>Teste a integridade dos backups periodicamente</li>
              <li>Mantenha pelo menos 3 cópias de segurança</li>
            </ul>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Backup Completo */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Database className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Backup Completo</h3>
                <p className="text-sm text-muted-foreground">Todas as tabelas do sistema</p>
              </div>
            </div>
            
            <div className="flex-1 mb-4">
              <p className="text-sm text-muted-foreground">
                Exporta todos os dados do sistema em um único arquivo CSV com múltiplas seções.
                Inclui: clientes, fornecedores, produtos, vendas, despesas, folha, usuários e notificações.
              </p>
            </div>

            <Button 
              onClick={handleBackupCompleto} 
              disabled={carregando}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Download className="w-4 h-4 mr-2" />
              {carregando ? "Exportando..." : "Exportar Tudo"}
            </Button>
          </div>
        </Card>

        {/* Exportação por Coleção */}
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Exportar Tabela</h3>
                <p className="text-sm text-muted-foreground">Exportar dados específicos</p>
              </div>
            </div>
            
            <div className="flex-1 mb-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Exporta apenas uma tabela específica do sistema para análise detalhada.
              </p>
              
              <Select value={colecaoSelecionada} onValueChange={setColecaoSelecionada}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colecoes.map(col => (
                    <SelectItem key={col.value} value={col.value}>
                      {col.icon} {col.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleExportarColecao} 
              disabled={carregando}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Download className="w-4 h-4 mr-2" />
              {carregando ? "Exportando..." : "Exportar Tabela"}
            </Button>
          </div>
        </Card>

        {/* Exportação por Período */}
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Exportar por Período</h3>
                <p className="text-sm text-muted-foreground">Filtrar por data</p>
              </div>
            </div>
            
            <div className="flex-1 mb-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Exporta dados de uma tabela específica filtrados por período de tempo.
              </p>
              
              <Select value={colecaoSelecionada} onValueChange={setColecaoSelecionada}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colecoes.map(col => (
                    <SelectItem key={col.value} value={col.value}>
                      {col.icon} {col.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map(per => (
                    <SelectItem key={per.value} value={per.value}>
                      {per.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleExportarPorPeriodo} 
              disabled={carregando}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              <Download className="w-4 h-4 mr-2" />
              {carregando ? "Exportando..." : "Exportar Período"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Informações Adicionais */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-3">📋 Informações Sobre os Backups</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">Formato dos Arquivos</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Arquivos em formato CSV (compatível com Excel)</li>
              <li>Codificação UTF-8 com BOM</li>
              <li>Data e hora incluídas no nome do arquivo</li>
              <li>Timestamps convertidos para formato legível</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Segurança e Privacidade</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Senhas de usuários NÃO são exportadas</li>
              <li>Dados sensíveis mantêm criptografia</li>
              <li>Apenas administradores podem fazer backup</li>
              <li>Logs de exportação são registrados</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Backup Automático (Firebase Functions) */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-950">
        <div className="flex items-start gap-3">
          <Shield className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-lg mb-2">🔄 Backup Automático (Em Desenvolvimento)</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Para configurar backups automáticos diários, você precisará configurar Firebase Functions.
              Os backups serão salvos automaticamente no Cloud Storage todos os dias às 3h da manhã.
            </p>
            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
              <p className="text-xs font-mono text-muted-foreground">
                📂 firebase/functions/index.js → função scheduleBackup()<br/>
                ☁️ Armazenamento: Firebase Cloud Storage<br/>
                🕒 Frequência: Diária (3h AM)<br/>
                📦 Retenção: 30 dias
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
