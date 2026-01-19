import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, Trash2 } from "lucide-react";
import { collection, query, orderBy, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Notificacao } from "@/types/financeiro";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Notificacoes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [filtro, setFiltro] = useState<"todas" | "nao_lidas">("nao_lidas");

  useEffect(() => {
    carregarNotificacoes();
  }, [user]);

  const carregarNotificacoes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const q = query(
        collection(db, "notificacoes"),
        orderBy("criadoEm", "desc")
      );

      const snapshot = await getDocs(q);
      const notifs = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          criadoEm: doc.data().criadoEm?.toDate() || new Date(),
          dataLeitura: doc.data().dataLeitura?.toDate(),
        })) as Notificacao[];

      // Filtrar por destinatário
      const minhasNotifs = notifs.filter(n => 
        !n.destinatarioId || n.destinatarioId === user.uid ||
        !n.destinatarioCargo || n.destinatarioCargo === user.cargo
      );

      setNotificacoes(minhasNotifs);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
      toast.error("Erro ao carregar notificações");
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLida = async (notifId: string) => {
    try {
      await updateDoc(doc(db, "notificacoes", notifId), {
        lida: true,
        dataLeitura: new Date(),
      });
      
      setNotificacoes(prev => 
        prev.map(n => n.id === notifId ? { ...n, lida: true, dataLeitura: new Date() } : n)
      );
      
      toast.success("Marcada como lida");
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
      toast.error("Erro ao marcar como lida");
    }
  };

  const marcarTodasComoLidas = async () => {
    try {
      const naoLidas = notificacoes.filter(n => !n.lida);
      
      await Promise.all(
        naoLidas.map(n => 
          updateDoc(doc(db, "notificacoes", n.id!), {
            lida: true,
            dataLeitura: new Date(),
          })
        )
      );
      
      setNotificacoes(prev => 
        prev.map(n => ({ ...n, lida: true, dataLeitura: new Date() }))
      );
      
      toast.success(`${naoLidas.length} notificações marcadas como lidas`);
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
      toast.error("Erro ao marcar todas como lidas");
    }
  };

  const deletarNotificacao = async (notifId: string) => {
    try {
      await deleteDoc(doc(db, "notificacoes", notifId));
      setNotificacoes(prev => prev.filter(n => n.id !== notifId));
      toast.success("Notificação excluída");
    } catch (error) {
      console.error("Erro ao deletar notificação:", error);
      toast.error("Erro ao deletar notificação");
    }
  };

  const handleNotificacaoClick = (notif: Notificacao) => {
    if (!notif.lida) {
      marcarComoLida(notif.id!);
    }
    
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const badges = {
      urgente: { variant: "destructive" as const, label: "Urgente" },
      alta: { variant: "default" as const, label: "Alta" },
      media: { variant: "secondary" as const, label: "Média" },
      baixa: { variant: "outline" as const, label: "Baixa" },
    };
    const config = badges[prioridade as keyof typeof badges] || badges.media;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Notificações" description="Carregando..." />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const notificacoesFiltradas = filtro === "todas" 
    ? notificacoes 
    : notificacoes.filter(n => !n.lida);

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Notificações" 
        description="Alertas e avisos do sistema" 
      />

      <Card className="p-6 bg-blue-50 dark:bg-blue-950">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                {naoLidas} Notificação{naoLidas !== 1 ? 'ões' : ''} Não Lida{naoLidas !== 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Total de {notificacoes.length} notificações
              </p>
            </div>
          </div>
          
          {naoLidas > 0 && (
            <Button onClick={marcarTodasComoLidas} variant="outline">
              <CheckCircle className="w-4 h-4 mr-2" />
              Marcar Todas como Lidas
            </Button>
          )}
        </div>
      </Card>

      <div className="flex gap-2">
        <Button 
          variant={filtro === "nao_lidas" ? "default" : "outline"}
          onClick={() => setFiltro("nao_lidas")}
        >
          Não Lidas ({naoLidas})
        </Button>
        <Button 
          variant={filtro === "todas" ? "default" : "outline"}
          onClick={() => setFiltro("todas")}
        >
          Todas ({notificacoes.length})
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Mensagem</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notificacoesFiltradas.map((notif) => (
              <TableRow 
                key={notif.id}
                className={`${!notif.lida ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''} cursor-pointer hover:bg-accent`}
                onClick={() => handleNotificacaoClick(notif)}
              >
                <TableCell>
                  <div className={`w-3 h-3 rounded-full ${
                    !notif.lida ? 'bg-blue-500' : 'bg-gray-300'
                  }`} />
                </TableCell>
                <TableCell>{getPrioridadeBadge(notif.prioridade)}</TableCell>
                <TableCell className="font-medium">{notif.titulo}</TableCell>
                <TableCell className="max-w-md">
                  <p className="truncate">{notif.mensagem}</p>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(notif.criadoEm, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {!notif.lida && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          marcarComoLida(notif.id!);
                        }}
                        title="Marcar como lida"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletarNotificacao(notif.id!);
                      }}
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {notificacoesFiltradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Nenhuma notificação {filtro === "nao_lidas" ? "não lida" : ""}</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
