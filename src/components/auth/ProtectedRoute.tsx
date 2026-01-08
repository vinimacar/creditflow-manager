import { ReactNode } from "react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, hasPermission } = useAuth();

  if (!user) {
    return null; // AuthProvider já redireciona para login
  }

  if (allowedRoles && !hasPermission(allowedRoles)) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Você não tem permissão para acessar esta página. Entre em contato com o administrador.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
