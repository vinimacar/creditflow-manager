import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/components/auth/LoginPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Fornecedores from "./pages/Fornecedores";
import Produtos from "./pages/Produtos";
import Funcionarios from "./pages/Funcionarios";
import PDV from "./pages/PDV";
import Relatorios from "./pages/Relatorios";
import Conciliacao from "./pages/Conciliacao";
import Configuracoes from "./pages/Configuracoes";
import Usuarios from "./pages/Usuarios";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <AppLayout>
            <Dashboard />
          </AppLayout>
        }
      />
      <Route
        path="/clientes"
        element={
          <AppLayout>
            <Clientes />
          </AppLayout>
        }
      />
      <Route
        path="/fornecedores"
        element={
          <AppLayout>
            <Fornecedores />
          </AppLayout>
        }
      />
      <Route
        path="/produtos"
        element={
          <AppLayout>
            <ProtectedRoute allowedRoles={["admin", "gerente"]}>
              <Produtos />
            </ProtectedRoute>
          </AppLayout>
        }
      />
      <Route
        path="/funcionarios"
        element={
          <AppLayout>
            <Funcionarios />
          </AppLayout>
        }
      />
      <Route
        path="/pdv"
        element={
          <AppLayout>
            <PDV />
          </AppLayout>
        }
      />
      <Route
        path="/relatorios"
        element={
          <AppLayout>
            <ProtectedRoute allowedRoles={["admin", "gerente"]}>
              <Relatorios />
            </ProtectedRoute>
          </AppLayout>
        }
      />
      <Route
        path="/conciliacao"
        element={
          <AppLayout>
            <ProtectedRoute allowedRoles={["admin", "gerente"]}>
              <Conciliacao />
            </ProtectedRoute>
          </AppLayout>
        }
      />
      <Route
        path="/usuarios"
        element={
          <AppLayout>
            <ProtectedRoute allowedRoles={["admin"]}>
              <Usuarios />
            </ProtectedRoute>
          </AppLayout>
        }
      />
      <Route
        path="/configuracoes"
        element={
          <AppLayout>
            <Configuracoes />
          </AppLayout>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename="/creditflow-manager">
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

