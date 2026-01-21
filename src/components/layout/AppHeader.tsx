import { User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "./NotificationBell";
import { GlobalSearch } from "./GlobalSearch";

interface AppHeaderProps {
  onMenuClick: () => void;
  sidebarCollapsed: boolean;
}

export function AppHeader({ onMenuClick, sidebarCollapsed }: AppHeaderProps) {
  const { user, signOut } = useAuth();

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { label: string; variant: any }> = {
      admin: { label: "Administrador", variant: "default" },
      gerente: { label: "Gerente", variant: "secondary" },
      agente: { label: "Agente", variant: "outline" },
      atendente: { label: "Atendente", variant: "outline" },
    };
    return badges[role] || badges.agente;
  };

  const roleInfo = user ? getRoleBadge(user.role) : null;
  
  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 shadow-sm">
      {/* Left section */}
      <div className="flex items-center gap-3 md:gap-4 flex-1">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Search */}
        <GlobalSearch />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 md:gap-3">

        {/* Notifications */}
        <NotificationBell />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-slate-100 dark:hover:bg-slate-800">
              <Avatar className="w-8 h-8 border-2 border-blue-500 shadow-sm">
                <AvatarImage src={user?.photoURL} />
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white text-xs font-semibold">
                  {user?.displayName?.split(" ").map(n => n[0]).join("").slice(0, 2) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden lg:block">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.displayName || "Usuário"}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{roleInfo?.label}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.displayName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 break-all">{user?.email}</p>
                {roleInfo && (
                  <Badge variant={roleInfo.variant} className="w-fit">
                    {roleInfo.label}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
              Sair do Sistema
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
