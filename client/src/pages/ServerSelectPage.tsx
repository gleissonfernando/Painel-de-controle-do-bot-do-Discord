import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronRight, Plus, LogOut, CheckCircle, X, AlertCircle } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";

// ID FIXO E REAL DO BOT DO USUÁRIO
const CLIENT_ID = "1492325134550302952";

export default function ServerSelectPage() {
  const { isAuthenticated, loading, logout, user } = useAuth();
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [showSuccess, setShowSuccess] = useState(false);
  const [botVerified, setBotVerified] = useState(false);

  // Link de convite estático para evitar erros de geração dinâmica
  const botInviteUrl = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://discord-verification.shardweb.app";
    const redirectUri = encodeURIComponent(`${origin}/api/discord/callback`);
    return `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&permissions=0&response_type=code&redirect_uri=${redirectUri}&integration_type=0&scope=identify+bot+applications.commands`;
  }, []);

  const { data: guilds, isLoading: guildsLoading, refetch: refetchGuilds } = trpc.guilds.list.useQuery(
    undefined,
    {
      enabled: !!isAuthenticated,
      retry: false,
    }
  );

  // Lógica de retorno do Discord (Sucesso)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("bot_added") === "true") {
      setShowSuccess(true);
      if (params.get("bot_verified") === "true") setBotVerified(true);
      
      // Limpa a URL e recarrega a lista
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => refetchGuilds(), 1000);
    }
  }, [refetchGuilds]);

  // Redirecionamento automático desativado
  useEffect(() => {
    console.log("Redirecionamentos automáticos desativados.");
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getInitials = (name: string) => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mensagem de Sucesso */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white p-4 rounded-lg shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle size={20} />
          <div>
            <p className="font-bold text-sm">Bot Adicionado!</p>
            {botVerified && <p className="text-xs opacity-90">Acesso liberado com sucesso.</p>}
          </div>
          <button onClick={() => setShowSuccess(false)} className="ml-2 hover:bg-white/20 rounded p-1">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-full md:w-80 border-r border-border bg-card flex flex-col h-screen">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.avatar || ""} />
              <AvatarFallback>{getInitials(user?.name || "U")}</AvatarFallback>
            </Avatar>
            <div className="truncate">
              <p className="text-xs text-muted-foreground">Logado como</p>
              <p className="text-sm font-bold truncate">{user?.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} title="Sair">
            <LogOut size={18} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {guildsLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : (guilds ?? []).length > 0 ? (
            guilds?.map((guild: any) => (
              <button
                key={guild.id}
                onClick={() => guild.botPresent ? navigate(`/dashboard/${guild.id}`) : window.location.href = botInviteUrl}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-all text-left group border border-transparent hover:border-primary/20"
              >
                <Avatar className="h-10 w-10 rounded-lg">
                  <AvatarImage src={guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : ""} />
                  <AvatarFallback className="rounded-lg">{getInitials(guild.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate group-hover:text-primary">{guild.name}</p>
                  {!guild.botPresent && <p className="text-[10px] text-amber-500 font-medium flex items-center gap-1"><AlertCircle size={10}/> Adicionar Bot</p>}
                </div>
                {guild.botPresent ? <ChevronRight size={16} className="text-muted-foreground" /> : <Plus size={16} className="text-amber-500" />}
              </button>
            ))
          ) : (
            <div className="p-6 text-center space-y-4">
              <p className="text-sm text-muted-foreground">Nenhum servidor com o bot encontrado.</p>
              <Button asChild className="w-full" variant="default">
                <a href={botInviteUrl}>Adicionar Bot</a>
              </Button>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border">
          <Button asChild variant="outline" className="w-full gap-2 border-primary/20 text-primary hover:bg-primary/5">
            <a href={botInviteUrl}><Plus size={16} /> Adicionar a outro servidor</a>
          </Button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex items-center justify-center p-8 bg-muted/30">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="bg-primary/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto border border-primary/20">
            <CheckCircle size={40} className="text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bem-vindo ao Painel</h1>
            <p className="text-muted-foreground mt-2">Selecione um servidor na barra lateral para começar a configurar seu bot.</p>
          </div>
          {(guilds ?? []).length === 0 && !guildsLoading && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 text-sm">
              Parece que você ainda não tem o bot em nenhum servidor que administra. 
              <a href={botInviteUrl} className="block mt-2 font-bold underline">Clique aqui para adicionar agora</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
