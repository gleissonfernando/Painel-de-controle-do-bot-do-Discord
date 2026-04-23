import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useSocket } from "@/hooks/useSocket";
import { getBotInviteUrl } from "@/const";
import AlertChannelSetupModal from "@/components/AlertChannelSetupModal";
import {
  Activity,
  Bell,
  Bot,
  Clock,
  Hash,
  MessageSquare,
  Shield,
  Terminal,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

interface DashboardPageProps {
  guildId: string;
}

const RECENT_EVENTS = [
  {
    type: "member_join",
    user: "UsuarioLegal#1234",
    time: "2 min atrás",
    icon: <Users size={14} />,
    color: "text-primary bg-primary/10",
  },
  {
    type: "command_used",
    user: "OutroUsuario#5678",
    time: "5 min atrás",
    icon: <Terminal size={14} />,
    color: "text-primary bg-primary/10",
    detail: "!help",
  },
  {
    type: "member_ban",
    user: "Malfeitor#0001",
    time: "12 min atrás",
    icon: <Shield size={14} />,
    color: "text-red-500 bg-red-500/10",
    detail: "Spam",
  },
  {
    type: "message_delete",
    user: "AlgumUsuario#9999",
    time: "18 min atrás",
    icon: <MessageSquare size={14} />,
    color: "text-red-400 bg-red-400/10",
  },
  {
    type: "live_notification",
    user: "StreamerXYZ",
    time: "1 h atrás",
    icon: <Activity size={14} />,
    color: "text-primary bg-primary/10",
    detail: "Twitch",
  },
];

const EVENT_LABELS: Record<string, string> = {
  member_join: "Entrada de Membro",
  command_used: "Comando Utilizado",
  member_ban: "Membro Banido",
  message_delete: "Mensagem Deletada",
  live_notification: "Notificação ao Vivo",
};

export default function DashboardPage({ guildId }: DashboardPageProps) {
  const utils = trpc.useUtils();
  const [showAlertChannelModal, setShowAlertChannelModal] = useState(false);
  const { isConnected, botStatus: socketBotStatus } = useSocket(guildId, (data) => {
    console.log("[WebSocket] Real-time update received:", data);
    utils.guilds.details.invalidate({ guildId });
    utils.logs.list.invalidate({ guildId });
  });

  // Busca detalhes do servidor com atualização automática a cada 15 segundos (Polling como fallback)
  const { data: guildDetails } = trpc.guilds.details.useQuery(
    { guildId },
    { refetchInterval: 15000, staleTime: 10000 }
  );
  
  const { data: settings } = trpc.settings.get.useQuery({ guildId });
  
  // Busca logs recentes com atualização a cada 10 segundos para ver eventos em tempo real
  const { data: logs } = trpc.logs.list.useQuery(
    { guildId, limit: 5 },
    { refetchInterval: 10000, staleTime: 5000 }
  );
  
  const { data: botStatus } = trpc.guilds.checkBotStatus.useQuery(
    { guildId },
    { refetchInterval: 30000 }
  );

  const guildName = guildDetails?.name ?? settings?.guildName ?? "Seu Servidor";
  const isBotPresent = botStatus?.botInGuild ?? false;

  // Verificar se o canal de alerta está configurado
  useEffect(() => {
    if (isBotPresent && !settings?.alertChannelId) {
      setShowAlertChannelModal(true);
    }
  }, [isBotPresent, settings?.alertChannelId]);

  const STAT_CARDS = [
    {
      label: "Total de Membros",
      value: guildDetails?.member_count?.toLocaleString() || "0",
      change: isBotPresent ? "Tempo Real" : "Bot Necessário",
      icon: <Users size={20} />,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
    },
    {
      label: "Canais de Texto",
      value: (settings as any)?.channelsCount?.toString() || "0",
      change: "Ativo",
      icon: <Hash size={20} />,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
    },
    {
      label: "Comandos Ativos",
      value: (settings as any)?.commandsCount?.toString() || "0",
      change: "Total",
      icon: <Terminal size={20} />,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
    },
    {
      label: "Status",
      value: isBotPresent ? "Online" : "Offline",
      change: isConnected ? "WS Conectado" : "Polling Ativo",
      icon: <Activity size={20} />,
      color: isBotPresent ? "text-primary" : "text-muted-foreground",
      bg: isBotPresent ? "bg-primary/10 border-primary/20" : "bg-muted/10 border-muted/20",
    },
  ];

  // WebSocket Event Listeners
  useEffect(() => {
    // O hook useSocket agora gerencia os listeners automaticamente
  }, [guildId, utils]);

  // Redirecionamento automático desativado para permitir navegação mesmo sem o bot ou banco de dados
  useEffect(() => {
    console.log("Verificação de bot ativa, mas redirecionamento automático desativado por solicitação do usuário.");
  }, [botStatus, guildId]);

  return (
    <>
      <AlertChannelSetupModal
        open={showAlertChannelModal}
        onOpenChange={setShowAlertChannelModal}
        guildId={guildId}
        guildName={guildName}
      />
      <div className="space-y-6">
      {/* Aviso de Canal de Alerta Não Configurado */}
      {isBotPresent && !settings?.alertChannelId && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <AlertCircle className="text-amber-500" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-500">⚠️ Canal de alerta não configurado</h3>
              <p className="text-xs text-amber-500/80">Configure um canal em Alerta Bot para receber avisos do bot.</p>
            </div>
          </div>
          <a href={`/dashboard/${guildId}/alerts`} className="w-full md:w-auto">
            <button className="w-full px-4 py-2 bg-amber-500 text-black text-xs font-bold rounded-lg hover:bg-amber-600 transition-colors">
              Configurar Alerta Bot
            </button>
          </a>
        </div>
      )}

      {/* Aviso de Setup de Logs */}
      {isBotPresent && settings?.alertChannelId && !settings?.logsChannelId && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <MessageSquare className="text-primary" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary">Configuração de Logs Necessária</h3>
              <p className="text-xs text-primary/80">Para monitorar as atividades do Dashboard, configure uma call ou canal de logs.</p>
            </div>
          </div>
          <a href={`/dashboard/${guildId}/general`} className="w-full md:w-auto">
            <button className="w-full px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors">
              Configurar Agora
            </button>
          </a>
        </div>
      )}

      {!isBotPresent && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Bot className="text-amber-500" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-500">Bot não detectado</h3>
              <p className="text-xs text-amber-500/80">O bot precisa estar no servidor para que as configurações funcionem.</p>
            </div>
          </div>
          <a href={getBotInviteUrl(guildId)} className="w-full md:w-auto">
            <button className="w-full px-4 py-2 bg-amber-500 text-black text-xs font-bold rounded-lg hover:bg-amber-600 transition-colors">
              Adicionar Bot Agora
            </button>
          </a>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{guildName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visão geral e estatísticas do servidor
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
          <Clock size={14} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(card => (
          <div
            key={card.label}
            className={`bg-card border rounded-xl p-4 transition-all duration-200 hover:scale-[1.02] ${card.bg}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg border ${card.bg} ${card.color}`}>
                {card.icon}
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-medium opacity-70`}>
                {card.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Events */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground text-sm">
              Eventos Recentes
            </h2>
            <span className="text-xs text-muted-foreground">Últimas 24h</span>
          </div>
          <div className="space-y-2">
            {(logs && logs.length > 0 ? logs : RECENT_EVENTS).map(
              (event, i) => {
                const isLog = logs && logs.length > 0;
                const eventType = isLog
                  ? (event as { eventType: string }).eventType
                  : (event as { type: string }).type;
                const user = isLog
                  ? ((event as { userName?: string | null }).userName ??
                    "Unknown")
                  : (event as { user: string }).user;
                const time = isLog
                  ? new Date(
                      (event as { createdAt: Date }).createdAt
                    ).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : (event as { time: string }).time;
                const detail = isLog
                  ? null
                  : (event as { detail?: string }).detail;

                const colorMap: Record<string, string> = {
                  member_join: "text-primary bg-primary/10",
                  member_leave: "text-muted-foreground bg-muted/10",
                  member_ban: "text-red-500 bg-red-500/10",
                  member_unban: "text-primary bg-primary/10",
                  message_delete: "text-red-400 bg-red-400/10",
                  message_edit: "text-primary bg-primary/10",
                  command_used: "text-primary bg-primary/10",
                  live_notification: "text-primary bg-primary/10",
                };

                const iconMap: Record<string, React.ReactNode> = {
                  member_join: <Users size={14} />,
                  member_leave: <Users size={14} />,
                  member_ban: <Shield size={14} />,
                  member_unban: <Shield size={14} />,
                  message_delete: <MessageSquare size={14} />,
                  message_edit: <MessageSquare size={14} />,
                  command_used: <Terminal size={14} />,
                  live_notification: <Activity size={14} />,
                };

                const colorClass =
                  colorMap[eventType] ?? "text-muted-foreground bg-muted";
                const icon = iconMap[eventType] ?? <Zap size={14} />;

                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                  >
                    <div className={`p-1.5 rounded-md ${colorClass}`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium">
                        {EVENT_LABELS[eventType] ??
                          eventType.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user}
                        {detail ? ` — ${detail}` : ""}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {time}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Server Info */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground text-sm">
              Server Info
            </h2>
            <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isBotPresent ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
              {isBotPresent ? 'Online' : 'Offline'}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Server ID</span>
              <span className="text-foreground font-mono">{guildId}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Owner</span>
              <span className="text-foreground">{settings?.ownerId || "Unknown"}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Prefix</span>
              <span className="bg-muted px-1.5 py-0.5 rounded text-primary font-bold">{settings?.prefix || "!"}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Language</span>
              <span className="text-foreground uppercase">{settings?.language || "en"}</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center gap-2 p-2 bg-muted hover:bg-muted/80 rounded-lg text-[10px] font-bold transition-colors">
                <Bell size={12} />
                Alerts
              </button>
              <button className="flex items-center justify-center gap-2 p-2 bg-muted hover:bg-muted/80 rounded-lg text-[10px] font-bold transition-colors">
                <TrendingUp size={12} />
                Growth
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
