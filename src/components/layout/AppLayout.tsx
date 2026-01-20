import { ReactNode, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <AppSidebar 
        collapsed={sidebarCollapsed} 
        onCollapse={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileToggle={setMobileSidebarOpen}
      />
      
      {/* Overlay para mobile */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-[70px]' : 'lg:pl-[260px]'} pl-0`}>
        <AppHeader 
          onMenuClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className="p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
