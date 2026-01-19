import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { collection, query, where, orderBy, limit, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Notificacao } from "@/types/financeiro";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface UserWithCargo {
  uid: string;
  cargo?: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [open, setOpen] = useState(false);

  const carregarNotificacoes = useCallback(async () => {
    if (!user) return;

    try {
      // Buscar notificações do usuário ou gerais
      const q = query(
        collection(db, "notificacoes"),
        where("lida", "==", false),
        orderBy("criadoEm", "desc"),
        limit(10)
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
        !n.destinatarioCargo || n.destinatarioCargo === user.role
      );

      setNotificacoes(minhasNotifs);
      setNaoLidas(minhasNotifs.filter(n => !n.lida).length);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    }
  }, [user]);

  const marcarComoLida = async (notifId: string) => {
    try {
      await updateDoc(doc(db, "notificacoes", notifId), {
        lida: true,
        dataLeitura: new Date(),
      });
      
      setNotificacoes(prev => prev.filter(n => n.id !== notifId));
      setNaoLidas(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
    }
  };

  const handleNotificacaoClick = (notif: Notificacao) => {
    marcarComoLida(notif.id!);
    setOpen(false);
    
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    const colors = {
      urgente: "text-red-600 bg-red-50",
      alta: "text-orange-600 bg-orange-50",
      media: "text-blue-600 bg-blue-50",
      baixa: "text-gray-600 bg-gray-50",
    };
    return colors[prioridade as keyof typeof colors] || colors.media;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {naoLidas > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {naoLidas > 9 ? '9+' : naoLidas}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notificações</h3>
          {naoLidas > 0 && (
            <Badge variant="secondary">{naoLidas} não lidas</Badge>
          )}
        </div>

        <ScrollArea className="h-96">
          {notificacoes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notificacoes.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 hover:bg-accent cursor-pointer transition-colors ${
                    !notif.lida ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => handleNotificacaoClick(notif)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      notif.prioridade === 'urgente' ? 'bg-red-500' :
                      notif.prioridade === 'alta' ? 'bg-orange-500' :
                      notif.prioridade === 'media' ? 'bg-blue-500' : 'bg-gray-400'
                    }`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">{notif.titulo}</h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPrioridadeColor(notif.prioridade)}`}
                        >
                          {notif.prioridade}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {notif.mensagem}
                      </p>
                      
                      <p className="text-xs text-muted-foreground">
                        {format(notif.criadoEm, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notificacoes.length > 0 && (
          <div className="p-3 border-t">
            <Button 
              variant="ghost" 
              className="w-full text-sm"
              onClick={() => {
                setOpen(false);
                navigate('/notificacoes');
              }}
            >
              Ver todas as notificações
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
