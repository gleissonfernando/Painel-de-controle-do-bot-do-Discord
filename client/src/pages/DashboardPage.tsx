import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useSocket } from "@/hooks/useSocket";
import { getBotInviteUrl } from "@/const";
import {
  Activity,
  Bot,
  Clock,
  Hash,
  Terminal,
  Users,
  Zap,
  MessageSquare,
  AlertCircle,
  Hand
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardPageProps {
  guildId: string;
}

export default function DashboardPage({ guildId }: DashboardPageProps) {
  const utils = trpc.useUtils();
  const [selectedHelloChannel, setSelectedHelloChannel] = useState<string | null>(null);
  
  const { isConnected } = useSocket(guildId, (data) => {
    utils.guilds.details.invalidate({ guildId });
  });

  const { data: guildDetails } = trpc.guilds.details.useQuery(
    { guildId },
    { refetchInterval: 15000 }
  );
  
  const { data: settings } = trpc.settings.get.useQuery({ guildId });
  
  const { data: botStatus } = trpc.guilds.checkBotStatus.useQuery(
    { guildId },
    { refetchInterval: 30000 }
  );

  const { data: channels } = trpc.guilds.channels.useQuery(
    { guildId },
    { enabled: !!guildId }
  );

  const sendHelloMutation = trpc.broadcast.sendGlobal.useMutation({
    onSuccess: () => toast.success("👋 Mensagem 'Olá' enviada com sucesso!"),
    onError: (err) => toast.error(`Erro ao enviar: ${err.message}`)
  });

  const isBotPresent = botStatus?.botInGuild ?? false;
  const guildName = guildDetails?.name ?? settings?.guildName ?? "Servidor";

  const handleSendHello = () => {
    if (!selectedHelloChannel) {
      toast.error("Selecione um canal para enviar o Olá");
      return;
    }
    sendHelloMutation.mutate({
      guildIds: [guildId],
      message: "👋 **Olá!** O sistema Magnatas está operacional neste canal."
    });
  };

  const STAT_CARDS = [
    {
      label: "Membros",
      value: guildDetails?.member_count?.toLocaleString() || "0",
      icon: <Users size={20} />,
      color: "text-blue-500",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Canais de Texto",
      value: guildDetails?.channels?.filter((c: any) => c.type === 0).length.toString() || "0",
      icon: <Hash size={20} />,
      color: "text-green-500",
      bg: "bg-green-500/10 border-green-500/20",
    },
    {
      label: "Comandos Ativos",
      value: "12", // Valor simulado ou vindo de config
      icon: <Terminal size={20} />,
      color: "text-purple-500",
      bg: "bg-purple-500/10 border-purple-500/20",
    },
    {
      label: "Status do Bot",
      value: isBotPresent ? "Online" : "Offline",
      icon: <Bot size={20} />,
      color: isBotPresent ? "text-primary" : "text-red-500",
      bg: isBotPresent ? "bg-primary/10 border-primary/20" : "bg-red-500/10 border-red-500/20",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Bot Presence Warning */}
      {!isBotPresent && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-full">
              <AlertCircle className="text-red-500" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-red-500 uppercase italic">Bot não detectado</h3>
              <p className="text-sm text-red-500/80 font-bold">O bot precisa estar no servidor para que as configurações funcionem.</p>
            </div>
          </div>
          <Button asChild className="bg-red-500 hover:bg-red-600 text-white font-black uppercase italic">
            <a href={getBotInviteUrl(guildId)}>Adicionar Bot Agora</a>
          </Button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-primary tracking-tighter italic uppercase flex items-center gap-3">
            <Zap className="fill-primary" />
            Início
          </h1>
          <p className="text-muted-foreground font-medium">Visão geral do servidor: <span className="text-white font-bold">{guildName}</span></p>
        </div>
        <div className="flex items-center gap-3 bg-[#0A0A0A] border border-border p-2 rounded-xl">
          <Clock size={18} className="text-primary" />
          <span className="text-sm font-black uppercase italic">
            {new Date().toLocaleDateString("pt-BR", { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STAT_CARDS.map(card => (
          <Card key={card.label} className={`border-none ${card.bg} shadow-xl`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-black/20 ${card.color}`}>
                  {card.icon}
                </div>
                <Badge variant="outline" className="border-white/10 text-[10px] font-black uppercase">Real-time</Badge>
              </div>
              <p className="text-3xl font-black text-white tracking-tighter">{card.value}</p>
              <p className="text-xs font-black uppercase text-muted-foreground tracking-widest mt-1">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Server Info Details */}
        <Card className="lg:col-span-2 border-border bg-[#0A0A0A] shadow-2xl">
          <CardHeader className="bg-[#050505] border-b border-border/50">
            <CardTitle className="text-xl font-black uppercase italic flex items-center gap-2">
              <Activity className="text-primary" size={20} />
              Server Info
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#111] border border-border/50">
                  <span className="text-xs font-black uppercase text-muted-foreground">ID do Servidor</span>
                  <span className="text-xs font-mono font-bold text-primary">{guildId}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#111] border border-border/50">
                  <span className="text-xs font-black uppercase text-muted-foreground">Nome</span>
                  <span className="text-xs font-bold text-white">{guildName}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#111] border border-border/50">
                  <span className="text-xs font-black uppercase text-muted-foreground">Idioma</span>
                  <span className="text-xs font-bold text-white">Português (BR)</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#111] border border-border/50">
                  <span className="text-xs font-black uppercase text-muted-foreground">Prefixo</span>
                  <span className="text-xs font-bold text-primary">/ (Slash)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#111] border border-border/50">
                  <span className="text-xs font-black uppercase text-muted-foreground">Dono</span>
                  <span className="text-xs font-bold text-white">Magnatas Dev</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#111] border border-border/50">
                  <span className="text-xs font-black uppercase text-muted-foreground">Região</span>
                  <span className="text-xs font-bold text-white">Brazil</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Action: Say Hello */}
        <Card className="border-border bg-[#0A0A0A] shadow-2xl">
          <CardHeader className="bg-[#050505] border-b border-border/50">
            <CardTitle className="text-xl font-black uppercase italic flex items-center gap-2">
              <Hand className="text-primary" size={20} />
              Ação do Bot
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Canal para o "Olá"</label>
              <Select value={selectedHelloChannel || ""} onValueChange={setSelectedHelloChannel}>
                <SelectTrigger className="bg-[#111] border-border/50 font-bold">
                  <SelectValue placeholder="Escolha o canal..." />
                </SelectTrigger>
                <SelectContent className="bg-[#111] border-border">
                  {channels?.filter((c: any) => c.type === 0).map((channel: any) => (
                    <SelectItem key={channel.id} value={channel.id} className="font-bold">
                      # {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleSendHello}
              disabled={sendHelloMutation.isPending || !isBotPresent}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase italic text-lg gap-3 shadow-xl shadow-primary/20"
            >
              <MessageSquare size={20} /> Enviar "Olá"
            </Button>
            <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-tighter">
              O bot enviará uma saudação oficial no canal selecionado.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Badge({ children, variant, className }: any) {
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${className}`}>
      {children}
    </span>
  );
}
