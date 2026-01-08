import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Clientes", path: "/clientes" },
  { icon: Building2, label: "Fornecedores", path: "/fornecedores" },
  { icon: Package, label: "Produtos", path: "/produtos" },
  { icon: UserCog, label: "Funcionários", path: "/funcionarios" },
  { icon: ShoppingCart, label: "PDV", path: "/pdv" },
  { icon: FileBarChart, label: "Relatórios", path: "/relatorios" },
  { icon: Scale, label: "Conciliação", path: "/conciliacao" },
];

const bottomMenuItems = [
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-[70px]" : "w-[260px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
            <Wallet className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-base font-bold text-sidebar-foreground">CréditoGestor</h1>
              <p className="text-xs text-sidebar-foreground/60">Gestão de Consignados</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                      : "text-sidebar-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 shrink-0", isActive && "drop-shadow-sm")} />
                  {!collapsed && (
                    <span className="text-sm font-medium animate-fade-in">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4">
        <Separator className="mb-4 bg-sidebar-border" />
        <ul className="space-y-1">
          {bottomMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && (
                    <span className="text-sm font-medium animate-fade-in">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium animate-fade-in">Sair</span>
              )}
            </button>
          </li>
        </ul>
      </div>

      {/* Collapse toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border shadow-md hover:bg-secondary"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </Button>
    </aside>
  );
}
