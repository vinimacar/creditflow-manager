import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AguardandoAprovacao() {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
            <Clock className="w-10 h-10 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Cadastro Pendente</h1>
          <p className="text-muted-foreground">
            Olá, <span className="font-semibold">{user?.displayName}</span>!
          </p>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <p className="text-sm">
            Seu cadastro está aguardando aprovação de um administrador ou diretor.
          </p>
          <p className="text-sm font-medium">
            Você receberá acesso ao sistema assim que seu cadastro for aprovado.
          </p>
        </div>

        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            <p>Email cadastrado: <span className="font-medium">{user?.email}</span></p>
            <p>Função atribuída: <span className="font-medium capitalize">{user?.role}</span></p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={signOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Se você acredita que isso seja um erro, entre em contato com o administrador do sistema.
        </p>
      </Card>
    </div>
  );
}
