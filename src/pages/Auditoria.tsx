import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, FileText, Edit, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AuditLog } from "@/types/financeiro";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Auditoria() {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filtroEntidade, setFiltroEntidade] = useState("todos");
  const [filtroAcao, setFiltroAcao] = useState("todos");
  const [filtroUsuario, setFiltroUsuario] = useState("");

  useEffect(() => {
    carregarLogs();
  }, []);

  const carregarLogs = async () => {
    try {
      setLoading(true);
      
      const q = query(
        collection(db, "auditLogs"),
        orderBy("timestamp", "desc"),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as AuditLog[];

      setLogs(logsData);
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
      toast.error("Erro ao carregar logs de auditoria");
    } finally {
      setLoading(false);
    }
  };

  const getAcaoBadge = (acao: string) => {
    const badges = {
      criar: { variant: "default" as const, icon: Plus, label: "Criar" },
      editar: { variant: "secondary" as const, icon: Edit, label: "Editar" },
      deletar: { variant: "destructive" as const, icon: Trash2, label: "Deletar" },
    };
    const config = badges[acao as keyof typeof badges] || badges.criar;
    const Icon = config.icon;
    return <Badge variant={config.variant} className="gap-1"><Icon className="w-3 h-3" />{config.label}</Badge>;
  };

  if (!hasPermission(["admin"])) {
    return (
      <div className="space-y-6">
        <PageHeader title="Auditoria" description="Acesso restrito" />
        <Card className="p-6"><p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p></Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Auditoria" description="Carregando..." />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const logsFiltrados = logs.filter(log => {
    if (filtroEntidade !== "todos" && log.entidade !== filtroEntidade) return false;
    if (filtroAcao !== "todos" && log.acao !== filtroAcao) return false;
    if (filtroUsuario && !log.usuario.toLowerCase().includes(filtroUsuario.toLowerCase())) return false;
    return true;
  });

  const entidades = [...new Set(logs.map(l => l.entidade))];

  return (
    <div className="space-y-6">
      <PageHeader title="Auditoria" description="Logs de alterações do sistema" />

      <Card className="p-6 bg-blue-50">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h3 className="font-semibold text-blue-900">Rastreabilidade Completa</h3>
            <p className="text-sm text-blue-700">Todas as operações críticas são registradas com usuário, data/hora e detalhes da alteração.</p>
          </div>
        </div>
      </Card>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Entidade</Label>
            <Select value={filtroEntidade} onValueChange={setFiltroEntidade}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                {entidades.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ação</Label>
            <Select value={filtroAcao} onValueChange={setFiltroAcao}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="criar">Criar</SelectItem>
                <SelectItem value="editar">Editar</SelectItem>
                <SelectItem value="deletar">Deletar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Usuário</Label>
            <Input value={filtroUsuario} onChange={(e) => setFiltroUsuario(e.target.value)} placeholder="Buscar por usuário" />
          </div>
        </div>
      </Card>

      {/* Tabela de Logs */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Campo</TableHead>
              <TableHead>Valor Anterior</TableHead>
              <TableHead>Valor Novo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logsFiltrados.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs">{format(log.timestamp, "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</TableCell>
                <TableCell className="font-medium">{log.usuario}</TableCell>
                <TableCell className="capitalize">{log.entidade}</TableCell>
                <TableCell>{getAcaoBadge(log.acao)}</TableCell>
                <TableCell className="text-sm">{log.campo || "-"}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{log.valorAnterior ? JSON.stringify(log.valorAnterior) : "-"}</TableCell>
                <TableCell className="text-xs font-medium max-w-[150px] truncate">{log.valorNovo ? JSON.stringify(log.valorNovo) : "-"}</TableCell>
              </TableRow>
            ))}
            {logsFiltrados.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum log encontrado</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {logsFiltrados.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Exibindo {logsFiltrados.length} de {logs.length} registros (últimos 100)
        </div>
      )}
    </div>
  );
}
