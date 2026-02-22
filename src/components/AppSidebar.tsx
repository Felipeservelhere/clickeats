import { useState } from "react";
import { Flame, BookOpen, MapPin, Grid3X3, Printer, LogOut, Smartphone, Sun, Moon } from "lucide-react";
import logo from "@/assets/logo.svg";
import { NavLink } from "@/components/NavLink";
import { PrinterSettings } from "@/components/PrinterSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Pedidos", url: "/", icon: Flame },
  { title: "Cardápio", url: "/cardapio", icon: BookOpen },
  { title: "Taxa de Entrega", url: "/taxas", icon: MapPin },
  { title: "Mesas", url: "/mesas", icon: Grid3X3 },
  { title: "App", url: "/app", icon: Smartphone },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { user, logout } = useAuth();
  const collapsed = state === "collapsed";
  const [showPrinterSettings, setShowPrinterSettings] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-border bg-card">
        <div className="p-3 flex items-center justify-center border-b border-border">
          {collapsed
            ? <img src={logo} alt="Logo" className="h-8 w-8 object-contain" />
            : <img src={logo} alt="Logo" className="h-10 object-contain" />
          }
        </div>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-colors"
                        activeClassName="bg-primary/10 text-primary font-semibold"
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Printer config at bottom */}
        <div className="mt-auto p-2 border-t border-border space-y-1">
          {!collapsed && user && (
            <div className="px-3 py-1 text-xs text-muted-foreground truncate">
              {user.display_name}
            </div>
          )}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-colors w-full"
            title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
            {!collapsed && <span className="text-sm">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>}
          </button>
          <button
            onClick={() => setShowPrinterSettings(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-colors w-full"
          >
            <Printer className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="text-sm">Impressora</span>}
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="text-sm">Sair</span>}
          </button>
        </div>
      </Sidebar>

      <PrinterSettings open={showPrinterSettings} onClose={() => setShowPrinterSettings(false)} />
    </>
  );
}
