import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  Package,
  UserCog,
  ShoppingCart,
  FileBarChart,
  Scale,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Wallet,
  Shield,
  DollarSign,
  Receipt,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  Target,
  UserCheck,
  FileText,
  PieChart,
  Database,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", roles: ["admin", "gerente"] },
  { icon: Users, label: "Clientes", path: "/clientes", roles: ["admin", "gerente", "agente", "atendente"] },
  { icon: Building2, label: "Fornecedores", path: "/fornecedores", roles: ["admin", "gerente", "agente", "atendente"] },
  { icon: Package, label: "Produtos", path: "/produtos", roles: ["admin", "gerente"] },
  { icon: UserCog, label: "Funcionários", path: "/funcionarios", roles: ["admin", "gerente", "agente", "atendente"] },
  { icon: DollarSign, label: "Folha de Pagamento", path: "/folha-pagamento", roles: ["admin", "gerente"] },
  { icon: Receipt, label: "Despesas", path: "/despesas", roles: ["admin", "gerente"] },
  { icon: TrendingUp, label: "Fluxo de Caixa", path: "/fluxo-caixa", roles: ["admin", "gerente"] },
  { icon: ArrowDownCircle, label: "Comissões a Receber", path: "/comissoes-receber", roles: ["admin", "gerente"] },
  { icon: ArrowUpCircle, label: "Comissões a Pagar", path: "/comissoes-pagar", roles: ["admin", "gerente"] },
  { icon: Target, label: "Metas", path: "/metas", roles: ["admin", "gerente"] },
  { icon: PieChart, label: "Rentabilidade", path: "/rentabilidade", roles: ["admin", "gerente"] },
  { icon: ShoppingCart, label: "PDV", path: "/pdv", roles: ["admin", "gerente", "agente", "atendente"] },
  { icon: FileBarChart, label: "Relatórios", path: "/relatorios", roles: ["admin", "gerente"] },
  { icon: Scale, label: "Conciliação", path: "/conciliacao", roles: ["admin", "gerente"] },
  { icon: DollarSign, label: "Calculadora", path: "/calculadora", roles: ["admin", "gerente", "agente", "atendente"] },
];

const bottomMenuItems = [
  { icon: FileText, label: "Auditoria", path: "/auditoria", roles: ["admin"] },
  { icon: Database, label: "Backup", path: "/backup", roles: ["admin"] },
  { icon: UserCheck, label: "Usuários", path: "/usuarios", roles: ["admin"] },
  { icon: Settings, label: "Configurações", path: "/configuracoes", roles: ["admin", "gerente", "agente", "atendente"] },
];

interface AppSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  mobileOpen: boolean;
  onMobileToggle: (open: boolean) => void;
}

export function AppSidebar({ collapsed, onCollapse, mobileOpen, onMobileToggle }: AppSidebarProps) {
  const location = useLocation();
  const { user, hasPermission, signOut } = useAuth();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:fixed lg:flex left-0 top-0 z-40 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex-col shadow-xl",
          collapsed ? "w-[70px]" : "w-[260px]"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="animate-fade-in">
                <h1 className="text-base font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  CréditoGestor
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Gestão de Consignados</p>
              </div>
            )}
          </div>
        </div>

        {/* User Info - quando não collapsed */}
        {!collapsed && user && (
          <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md">
                {user.displayName?.substring(0, 2).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {user.displayName || "Usuário"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize truncate">
                  {user.role || "Agente"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {menuItems
              .filter((item) => hasPermission(item.roles as any))
              .map((item) => {
                // Suporte para HashRouter: considera hash na URL para rotas SPA
                const currentPath = location.pathname + (location.hash || "");
                const isActive = currentPath === item.path || location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                      "hover:bg-blue-50 dark:hover:bg-blue-900/20",
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30"
                        : "text-slate-700 dark:text-slate-300"
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 shrink-0 transition-transform group-hover:scale-110",
                      isActive && "drop-shadow-sm"
                    )} />
                    {!collapsed && (
                      <span className="text-sm font-medium animate-fade-in">{item.label}</span>
                    )}
                    {isActive && !collapsed && (
                      <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white/80" />
                    )}
                  </Link>
                );
              })}
          </nav>
        </ScrollArea>

        {/* Bottom section */}
        <div className="px-3 pb-4 border-t border-slate-200 dark:border-slate-800 pt-4">
          <div className="space-y-1">
            {bottomMenuItems
              .filter((item) => hasPermission(item.roles as any))
              .map((item) => {
                // Suporte para HashRouter: considera hash na URL para rotas SPA
                const currentPath = location.pathname + (location.hash || "");
                const isActive = currentPath === item.path || location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                      "hover:bg-slate-100 dark:hover:bg-slate-800",
                      isActive
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                        : "text-slate-600 dark:text-slate-400"
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {!collapsed && (
                      <span className="text-sm font-medium animate-fade-in">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            <button
              onClick={signOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium animate-fade-in">Sair</span>
              )}
            </button>
          </div>
        </div>

        {/* Collapse toggle - Desktop */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-md hover:bg-slate-100 dark:hover:bg-slate-700 z-50"
          onClick={() => onCollapse(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </Button>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed left-0 top-0 z-40 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 flex flex-col w-[280px] shadow-2xl",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                CréditoGestor
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Gestão de Consignados</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMobileToggle(false)}
            className="lg:hidden"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* User Info */}
        {user && (
          <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-md">
                {user.displayName?.substring(0, 2).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {user.displayName || "Usuário"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize truncate">
                  {user.role || "Agente"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {menuItems
              .filter((item) => hasPermission(item.roles as any))
              .map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => onMobileToggle(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                      "hover:bg-blue-50 dark:hover:bg-blue-900/20",
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                        : "text-slate-700 dark:text-slate-300"
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
          </nav>
        </ScrollArea>

        {/* Bottom section */}
        <div className="px-3 pb-4 border-t border-slate-200 dark:border-slate-800 pt-4">
          <div className="space-y-1">
            {bottomMenuItems
              .filter((item) => hasPermission(item.roles as any))
              .map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => onMobileToggle(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                      "hover:bg-slate-100 dark:hover:bg-slate-800",
                      isActive
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                        : "text-slate-600 dark:text-slate-400"
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            <button
              onClick={signOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">Sair</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
