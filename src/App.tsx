import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Fornecedores from "./pages/Fornecedores";
import Produtos from "./pages/Produtos";
import Funcionarios from "./pages/Funcionarios";
import PDV from "./pages/PDV";
import Relatorios from "./pages/Relatorios";
import Conciliacao from "./pages/Conciliacao";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
                <Produtos />
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
                <Relatorios />
              </AppLayout>
            }
          />
          <Route
            path="/conciliacao"
            element={
              <AppLayout>
                <Conciliacao />
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
