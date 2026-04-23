import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  Bell,
  Bot,
  ChevronLeft,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Server,
  Settings,
  Shield,
  Terminal,
  X,
  Lock,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface DiscordDashboardLayoutProps {
  guildId: string;
  children: React.ReactNode;
}

interface NavItemWithPermission extends NavItem {
  devOnly?: boolean;
}

const navItems: NavItemWithPermission[] = [
  { label: "Início", icon: <LayoutDashboard size={18} />, path: "" },
  { label: "Configurações", icon: <Settings size={18} />, path: "/general" },
  { label: "Alerta Bot", icon: <Bell size={18} />, path: "/alerts" },
  { label: "Comandos", icon: <Terminal size={18} />, path: "/commands" },
  { label: "Mensagens", icon: <MessageSquare size={18} />, path: "/messages" },
  { label: "Boas-vindas", icon: <Activity size={18} />, path: "/welcome" },
  { label: "Auto Moderação", icon: <Shield size={18} />, path: "/automod" },
  {
    label: "Notificações",
    icon: <Bell size={18} />,
    path: "/notifications",
  },
  { label: "Logs", icon: <FileText size={18} />, path: "/logs" },
];

export default function DiscordDashboardLayout({
  guildId,
  children,
}: DiscordDashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: settings } = trpc.settings.get.useQuery({ guildId });
  const { data: guilds } = trpc.guilds.list.useQuery();

  const guildName = settings?.guildName ?? "Server";
  const guildIcon = settings?.guildIcon;

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map(w => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const isActive = (path: string) => {
    const fullPath = `/dashboard/${guildId}${path}`;
    if (path === "") return location === `/dashboard/${guildId}`;
    return location.startsWith(fullPath);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0A0A0A]" translate="no">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border bg-[#050505]">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
          <Bot size={20} className="text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Magnatas</p>
          <p className="text-xs text-muted-foreground">Dashboard</p>
        </div>
      </div>

      {/* Server Selector */}
      <div className="px-3 py-3 border-b border-sidebar-border">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 mb-1">
            Servidor Atual
          </p>
          <div className="relative group">
            <Link href="/servers">
              <div className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-sidebar-accent cursor-pointer transition-colors border border-transparent hover:border-sidebar-border">
                <Avatar className="w-8 h-8">
                  {guildIcon ? (
                    <AvatarImage
                      src={`https://cdn.discordapp.com/icons/${guildId}/${guildIcon}.png`}
                      alt={guildName}
                    />
                  ) : null}
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                    {getInitials(guildName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {guildName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Trocar servidor</p>
                </div>
                <ChevronLeft size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {/* Other Servers Quick Access */}
        {guilds && guilds.length > 1 && (
          <div className="mb-6">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">
              Seus Outros Servidores
            </p>
            <div className="space-y-1">
              {guilds
                .filter(g => g.id !== guildId && g.botPresent)
                .slice(0, 3)
                .map(otherGuild => (
                  <Link key={otherGuild.id} href={`/dashboard/${otherGuild.id}`}>
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-sidebar-accent cursor-pointer transition-colors group">
                      <Avatar className="w-6 h-6">
                        {otherGuild.icon ? (
                          <AvatarImage
                            src={`https://cdn.discordapp.com/icons/${otherGuild.id}/${otherGuild.icon}.png`}
                            alt={otherGuild.name}
                          />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                          {getInitials(otherGuild.name)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground truncate">
                        {otherGuild.name}
                      </p>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        )}

        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
          Gerenciamento
        </p>
        {navItems.map(item => {
          // Esconder itens exclusivos de dev se o usuário não for o desenvolvedor
          if (item.devOnly && user?.openId !== "761011766440230932") {
            return null;
          }
          const active = isActive(item.path);
          return (
            <Link key={item.path} href={`/dashboard/${guildId}${item.path}`}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-150 group ${
                  active
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <span
                  className={`transition-colors ${
                    active
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  {item.icon}
                </span>
                <span className="text-sm font-medium">{item.label}</span>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Devs Button */}
      <div className="px-3 py-2 border-t border-sidebar-border">
        <Link href="/devs/login">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary transition-colors">
            <Lock size={16} />
            <span className="text-xs font-bold">Devs</span>
          </button>
        </Link>
      </div>

      {/* User Profile */}
      <div className="px-3 py-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2 rounded-md bg-sidebar-accent/50 border border-sidebar-border/50">
          <Avatar className="w-8 h-8 border border-primary/20">
            {user?.avatar ? (
              <AvatarImage
                src={user.avatar}
                alt={user?.name ?? ""}
              />
            ) : null}
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
              {getInitials(user?.name ?? "U")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-foreground truncate">
              {user?.name ?? "User"}
            </p>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <p className="text-[10px] text-muted-foreground">Conectado</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={logout}
            title="Sair"
          >
            <LogOut size={14} />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#050505] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col bg-[#0A0A0A] border-r border-sidebar-border flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-60 bg-sidebar border-r border-sidebar-border flex flex-col z-10">
            <button
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden" translate="no">
        {/* Top Header */}
        <header className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-border bg-[#0A0A0A]/80 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} />
            </Button>
            <div className="flex items-center gap-2">
              <Server size={16} className="text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">
                {guildName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
              <Activity size={12} className="text-primary" />
              <span className="text-xs font-medium text-primary">
                Bot Online
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 w-full bg-[#050505]">{children}</main>
      </div>
    </div>
  );
}
