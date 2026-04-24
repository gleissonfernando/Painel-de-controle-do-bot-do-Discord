import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSession, Guild } from "@/contexts/SessionContext";
import { trpc } from "@/lib/trpc";
import { 
  Bot, 
  Shield, 
  Users, 
  ChevronRight, 
  Plus, 
  ExternalLink, 
  CheckCircle2, 
  Loader2,
  LogOut,
  Search,
  Settings,
  Terminal,
  Activity,
  UserPlus,
  Trash2,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getBotInviteUrl } from "@/const";

type Step = "idle" | "authenticating" | "fetching_guilds" | "verifying_bot" | "ready";

export default function UnifiedDashboard() {
  const { user, logout, isAuthenticated } = useAuth();
  const { guilds = [], isLoadingGuilds, refreshGuilds } = useSession();
  const [step, setStep] = useState<Step>("idle");
  const [progress, setProgress] = useState(0);
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fluxo de autenticação e carregamento
  useEffect(() => {
    if (isAuthenticated && step === "idle") {
      startAuthFlow();
    }
  }, [isAuthenticated]);

  const startAuthFlow = async () => {
    setStep("authenticating");
    setProgress(20);
    await new Promise(r => setTimeout(r, 800));
    
    setStep("fetching_guilds");
    setProgress(50);
    await refreshGuilds();
    
    setStep("verifying_bot");
    setProgress(80);
    await new Promise(r => setTimeout(r, 600));
    
    setStep("ready");
    setProgress(100);
  };

  const filteredGuilds = guilds.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) =>
    name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  // Chip do usuário verificado (sempre visível)
  const UserChip = () => (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 shadow-sm">
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      <Avatar className="w-5 h-5 border border-green-500/30">
        <AvatarImage src={user?.avatar} />
        <AvatarFallback className="text-[8px] bg-primary/10 text-primary">{getInitials(user?.name || "U")}</AvatarFallback>
      </Avatar>
      <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">
        {user?.name} Verificado
      </span>
    </div>
  );

  // Renderização condicional baseada no estado
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#18181c] border border-white/5 rounded-2xl p-8 text-center shadow-2xl"
        >
          <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
            <Bot size={40} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Magnatas Dashboard</h1>
          <p className="text-muted-foreground text-sm mb-8">Acesse o painel de controle do seu bot de forma segura.</p>
          <Button 
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] h-12 text-white font-bold"
            onClick={() => window.location.href = "/"}
          >
            Entrar com Discord
          </Button>
        </motion.div>
      </div>
    );
  }

  if (step !== "ready") {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex justify-between items-end mb-2">
            <div className="space-y-1">
              <p className="text-xs font-bold text-primary uppercase tracking-widest">Autenticando</p>
              <h2 className="text-lg font-semibold text-white">
                {step === "authenticating" && "Verificando Token..."}
                {step === "fetching_guilds" && "Buscando Servidores..."}
                {step === "verifying_bot" && "Cruzando Dados..."}
              </h2>
            </div>
            <span className="text-xs font-mono text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5 bg-white/5" />
          <div className="flex items-center gap-3 text-muted-foreground text-xs">
            <Loader2 size={14} className="animate-spin text-primary" />
            <span>Por favor, aguarde enquanto validamos seu acesso.</span>
          </div>
        </div>
      </div>
    );
  }

  // Se não houver servidores com o bot (Bloqueio)
  if (guilds.length === 0) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6">
        <div className="absolute top-8">
          <UserChip />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg bg-[#18181c] border border-white/5 rounded-3xl p-10 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
          
          <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-8 relative">
            <Shield size={48} className="text-primary" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#18181c] border border-white/5 flex items-center justify-center">
              <Plus size={16} className="text-white" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-4">Acesso Bloqueado</h2>
          <p className="text-muted-foreground text-sm mb-10 leading-relaxed max-w-sm mx-auto">
            Sua conta foi verificada com sucesso, mas o bot <span className="text-white font-bold">Magnatas</span> ainda não está presente em nenhum servidor onde você tem permissões administrativas.
          </p>
          
          <div className="space-y-4">
            <Button 
              className="w-full bg-primary hover:bg-primary/90 h-14 text-white font-bold rounded-2xl gap-3 text-lg shadow-xl shadow-primary/20 transition-all hover:-translate-y-1"
              onClick={() => window.open(getBotInviteUrl(), "_blank")}
            >
              Convidar Magnatas
              <ExternalLink size={20} />
            </Button>
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground hover:text-white h-12"
              onClick={refreshGuilds}
            >
              Já convidei, atualizar agora
            </Button>
          </div>
        </motion.div>
        
        <button onClick={logout} className="mt-8 flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors">
          <LogOut size={14} />
          Sair da conta
        </button>
      </div>
    );
  }

  // Dashboard Principal (Lista de Servidores)
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      {/* Header */}
      <header className="h-20 border-b border-white/5 px-6 flex items-center justify-between bg-[#18181c]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Bot size={22} className="text-white" />
          </div>
          <h1 className="font-bold text-xl tracking-tight hidden sm:block">Magnatas</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <UserChip />
          <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground hover:text-destructive">
            <LogOut size={18} />
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 flex flex-col lg:flex-row gap-8">
        {/* Lado Esquerdo: Lista de Servidores */}
        <div className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-white">Seus Servidores</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input 
                type="text" 
                placeholder="Filtrar servidores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#18181c] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGuilds.map((guild) => (
              <motion.button
                key={guild.id}
                whileHover={{ y: -4 }}
                onClick={() => setSelectedGuild(guild)}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                  selectedGuild?.id === guild.id 
                    ? "bg-primary/5 border-primary shadow-lg shadow-primary/5" 
                    : "bg-[#18181c] border-white/5 hover:border-white/10"
                }`}
              >
                <Avatar className="w-14 h-14 rounded-2xl border border-white/5">
                  <AvatarImage src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">{getInitials(guild.name)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{guild.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium uppercase">
                      <Users size={12} />
                      {guild.memberCount}
                    </div>
                    <div className="px-2 py-0.5 rounded bg-white/5 text-[9px] font-bold text-muted-foreground uppercase">
                      {guild.owner ? "Dono" : "Admin"}
                    </div>
                  </div>
                </div>
                
                <ChevronRight size={18} className={selectedGuild?.id === guild.id ? "text-primary" : "text-muted-foreground"} />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Lado Direito: Painel de Gerenciamento Inline */}
        <div className="w-full lg:w-80 shrink-0">
          <AnimatePresence mode="wait">
            {selectedGuild ? (
              <motion.div
                key={selectedGuild.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-[#18181c] border border-white/5 rounded-3xl p-6 sticky top-28 shadow-xl"
              >
                <div className="text-center mb-8">
                  <Avatar className="w-20 h-20 rounded-3xl border-2 border-primary/20 mx-auto mb-4">
                    <AvatarImage src={`https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png`} />
                    <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">{getInitials(selectedGuild.name)}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-white text-lg truncate px-2">{selectedGuild.name}</h3>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Bot Ativo</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-3">Ações Rápidas</p>
                  
                  <Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-white/5 hover:text-primary transition-all">
                    <UserPlus size={18} />
                    <span className="text-sm font-medium">Convidar Membro</span>
                  </Button>
                  
                  <Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-white/5 hover:text-primary transition-all">
                    <Users size={18} />
                    <span className="text-sm font-medium">Ver Membros</span>
                  </Button>
                  
                  <Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-white/5 hover:text-primary transition-all">
                    <Shield size={18} />
                    <span className="text-sm font-medium">Cargos</span>
                  </Button>
                  
                  <Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-white/5 hover:text-primary transition-all">
                    <FileText size={18} />
                    <span className="text-sm font-medium">Logs do Servidor</span>
                  </Button>
                  
                  <div className="pt-4 mt-4 border-t border-white/5">
                    <Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all">
                      <Trash2 size={18} />
                      <span className="text-sm font-medium">Remover Bot</span>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-[#18181c]/50 border border-dashed border-white/10 rounded-3xl p-10 text-center sticky top-28">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Activity size={32} className="text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">Selecione um servidor para ver as ações disponíveis.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
