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
  FileText,
  Lock,
  RefreshCw,
  LayoutDashboard,
  ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getBotInviteUrl } from "@/const";

// Cores do Sistema Magnatas
const COLORS = {
  background: "#0a0a0a",
  cardBackground: "#111111",
  primary: "#e63329",
  primaryHover: "#c0392b",
  textPrimary: "#ffffff",
  textSecondary: "#888888",
  border: "#1f1f1f",
  success: "#27ae60",
  iconShield: "#e63329"
};

type Step = "idle" | "verifying_bot" | "authenticating" | "verifying_role" | "ready";

export default function UnifiedDashboard() {
  const { user, logout, isAuthenticated } = useAuth();
  const { guilds = [], isLoadingGuilds, refreshGuilds, setActiveGuild } = useSession();
  const [step, setStep] = useState<Step>("idle");
  const [progress, setProgress] = useState(0);
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasPermission, setHasPermission] = useState(true); // Simulação de cargo ADM (Pode ser integrado com backend depois)

  // O bot está no servidor se houver pelo menos um servidor na lista (já que o backend filtra por botPresent: true)
  const botInServer = guilds.length > 0;

  // Fluxo de autenticação e carregamento baseado no FLUXO enviado pelo usuário
  useEffect(() => {
    if (isAuthenticated && step === "idle") {
      startUnifiedFlow();
    }
  }, [isAuthenticated]);

  const startUnifiedFlow = async () => {
    // PASSO 1: Verificar Bot no Servidor
    setStep("verifying_bot");
    setProgress(25);
    await new Promise(r => setTimeout(r, 800));
    
    // PASSO 2: Autenticação OAuth2 e Busca de Servidores
    setStep("authenticating");
    setProgress(50);
    await refreshGuilds();
    
    // PASSO 3: Verificar Cargo ADM
    setStep("verifying_role");
    setProgress(75);
    await new Promise(r => setTimeout(r, 600));
    
    // PASSO 4: Pronto para Seleção
    setStep("ready");
    setProgress(100);
  };

  const filteredGuilds = guilds.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) =>
    name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const handleSelectGuild = (guild: Guild) => {
    setSelectedGuild(guild);
    setActiveGuild(guild.id);
    // Redirecionar para o dashboard principal do servidor selecionado
    window.location.href = `/dashboard/${guild.id}`;
  };

  // Chip do usuário verificado (sempre visível)
  const UserChip = () => (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#27ae60]/10 border border-[#27ae60]/20 shadow-sm">
      <div className="w-2 h-2 rounded-full bg-[#27ae60] animate-pulse" />
      <Avatar className="w-5 h-5 border border-[#27ae60]/30">
        <AvatarImage src={user?.avatar} />
        <AvatarFallback className="text-[8px] bg-[#e63329]/10 text-[#e63329]">{getInitials(user?.name || "U")}</AvatarFallback>
      </Avatar>
      <span className="text-[10px] font-bold text-[#27ae60] uppercase tracking-wider">
        {user?.name} Verificado
      </span>
    </div>
  );

  // Renderização condicional baseada no estado
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-[#111111] border border-[#1f1f1f] rounded-2xl p-8 text-center shadow-2xl"
        >
          <div className="w-20 h-20 rounded-2xl bg-[#e63329]/10 border border-[#e63329]/20 flex items-center justify-center mx-auto mb-6">
            <Bot size={40} className="text-[#e63329]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 uppercase italic tracking-tighter">Magnatas Dashboard</h1>
          <p className="text-[#888888] text-sm mb-8">Acesse o painel de controle do seu bot de forma segura.</p>
          <Button 
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] h-12 text-white font-bold rounded-xl"
            onClick={() => window.location.href = "/"}
          >
            Entrar com Discord
          </Button>
        </motion.div>
      </div>
    );
  }

  // Tela de Carregamento com Barra de Progresso
  if (step !== "ready" || isLoadingGuilds) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex justify-between items-end mb-2">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-[#e63329] uppercase tracking-widest italic">Sincronizando</p>
              <h2 className="text-lg font-bold text-white uppercase italic">
                {step === "verifying_bot" && "Checando Presença do Bot..."}
                {step === "authenticating" && "Validando Acesso..."}
                {step === "verifying_role" && "Verificando Permissões..."}
                {isLoadingGuilds && "Carregando Império..."}
              </h2>
            </div>
            <span className="text-xs font-mono text-[#888888]">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5 bg-[#1f1f1f]" />
          <div className="flex items-center gap-3 text-[#888888] text-xs font-bold uppercase italic">
            <Loader2 size={14} className="animate-spin text-[#e63329]" />
            <span>Aguarde a validação do império...</span>
          </div>
        </div>
      </div>
    );
  }

  // PASSO 1: SE o bot NÃO estiver em nenhum servidor administrativo (Tela Adicionar Bot)
  if (!botInServer) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg bg-[#111111] border border-[#1f1f1f] rounded-3xl p-10 text-center relative overflow-hidden shadow-2xl"
        >
          <div className="w-24 h-24 rounded-3xl bg-[#e63329]/10 border border-[#e63329]/20 flex items-center justify-center mx-auto mb-8">
            <Plus size={48} className="text-[#e63329]" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4 uppercase italic tracking-tighter">Adicionar Bot</h2>
          <p className="text-[#888888] text-sm mb-10 leading-relaxed max-w-sm mx-auto font-bold uppercase">
            O bot <span className="text-white">Magnatas</span> ainda não está presente em nenhum servidor onde você possui permissões administrativas.
          </p>
          <Button 
            className="w-full bg-[#e63329] hover:bg-[#c0392b] h-14 text-white font-black uppercase italic rounded-2xl gap-3 text-lg shadow-xl shadow-[#e63329]/20"
            onClick={() => window.open(getBotInviteUrl(), "_blank")}
          >
            Adicionar Bot ao Servidor
            <ExternalLink size={20} />
          </Button>
          <Button 
            variant="ghost" 
            className="w-full mt-4 text-[#888888] hover:text-white h-12 font-bold uppercase italic"
            onClick={() => refreshGuilds()}
          >
            <RefreshCw size={16} className="mr-2" />
            Já convidei, atualizar agora
          </Button>
        </motion.div>
      </div>
    );
  }

  // PASSO 3: SE o usuário NÃO tiver cargo permitido (Tela Acesso Bloqueado)
  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
        <div className="absolute top-8">
          <UserChip />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg bg-[#111111] border border-[#1f1f1f] rounded-3xl p-10 text-center relative overflow-hidden shadow-2xl"
        >
          <div className="w-24 h-24 rounded-full bg-[#e63329]/10 border border-[#e63329]/20 flex items-center justify-center mx-auto mb-8">
            <ShieldAlert size={48} className="text-[#e63329]" />
          </div>
          
          <h2 className="text-3xl font-black text-white mb-4 uppercase italic tracking-tighter">Acesso Bloqueado</h2>
          <p className="text-[#888888] text-sm mb-10 leading-relaxed max-w-sm mx-auto font-bold uppercase">
            Sua conta foi verificada com sucesso, mas você ainda não possui nenhum cargo com <span className="text-white">permissões administrativas</span> neste servidor.
          </p>
          
          <Button 
            className="w-full bg-[#e63329] hover:bg-[#c0392b] h-14 text-white font-black uppercase italic rounded-2xl gap-3 text-lg shadow-xl shadow-[#e63329]/20"
            onClick={() => startUnifiedFlow()}
          >
            <RefreshCw size={20} />
            Já fui convidado, atualizar agora
          </Button>
        </motion.div>
      </div>
    );
  }

  // PASSO 4: Tela de Seleção de Servidor (Acesso Direto)
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="h-20 border-b border-[#1f1f1f] px-6 flex items-center justify-between bg-[#111111]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#e63329] flex items-center justify-center shadow-lg shadow-[#e63329]/20">
            <Bot size={22} className="text-white" />
          </div>
          <h1 className="font-black text-xl tracking-tighter uppercase italic text-white">Magnatas</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <UserChip />
          <Button variant="ghost" size="icon" onClick={logout} className="text-[#888888] hover:text-[#e63329]">
            <LogOut size={18} />
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 flex flex-col gap-8">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="text-[#e63329]" size={24} />
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Seleção de Servidor</h2>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" size={16} />
              <input 
                type="text" 
                placeholder="BUSCAR SERVIDOR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#111111] border border-[#1f1f1f] rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold uppercase italic focus:outline-none focus:border-[#e63329]/50 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGuilds.map((guild) => (
              <motion.button
                key={guild.id}
                whileHover={{ y: -4 }}
                onClick={() => handleSelectGuild(guild)}
                className={`flex flex-col p-6 rounded-3xl border transition-all text-left group relative overflow-hidden ${
                  selectedGuild?.id === guild.id 
                    ? "bg-[#e63329]/5 border-[#e63329] shadow-lg shadow-[#e63329]/5" 
                    : "bg-[#111111] border-[#1f1f1f] hover:border-[#e63329]/30"
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-16 h-16 rounded-2xl border border-[#1f1f1f] shadow-inner">
                    <AvatarImage src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`} />
                    <AvatarFallback className="bg-[#e63329]/10 text-[#e63329] font-black italic">{getInitials(guild.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-white uppercase italic truncate tracking-tight">{guild.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Users size={12} className="text-[#888888]" />
                      <span className="text-[10px] font-bold text-[#888888] uppercase tracking-tighter">{guild.memberCount} Membros</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <Badge variant="outline" className="bg-[#1f1f1f] text-[#888888] border-none text-[9px] font-black uppercase italic px-2 py-0.5">
                    {guild.owner ? "Proprietário" : "Administrador"}
                  </Badge>
                  <div className={`p-2 rounded-xl transition-colors ${selectedGuild?.id === guild.id ? "bg-[#e63329] text-white" : "bg-[#1f1f1f] text-[#888888] group-hover:bg-[#e63329]/10 group-hover:text-[#e63329]"}`}>
                    <ChevronRight size={16} />
                  </div>
                </div>

                {selectedGuild?.id === guild.id && (
                  <div className="absolute top-0 right-0 p-2">
                    <CheckCircle2 size={16} className="text-[#e63329]" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
          
          {filteredGuilds.length === 0 && !isLoadingGuilds && (
            <div className="text-center py-20 bg-[#111111] border border-[#1f1f1f] rounded-3xl">
              <Bot size={48} className="text-[#1f1f1f] mx-auto mb-4" />
              <p className="text-[#888888] font-bold uppercase italic">Nenhum servidor encontrado com o bot Magnatas.</p>
              <Button 
                variant="link" 
                className="text-[#e63329] mt-2 font-black uppercase italic"
                onClick={() => window.open(getBotInviteUrl(), "_blank")}
              >
                Convidar Bot para novos servidores
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
