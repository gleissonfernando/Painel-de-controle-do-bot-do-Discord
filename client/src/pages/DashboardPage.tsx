import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
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

const STAT_CARDS = [
  {
    label: "Total Members",
    value: "1,247",
    change: "+12",
    icon: <Users size={20} />,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    label: "Text Channels",
    value: "24",
    change: "+2",
    icon: <Hash size={20} />,
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
  },
  {
    label: "Active Commands",
    value: "12",
    change: "0",
    icon: <Terminal size={20} />,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
  },
  {
    label: "Live Monitors",
    value: "3",
    change: "+1",
    icon: <Activity size={20} />,
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
  },
  {
    label: "Mod Actions",
    value: "47",
    change: "+5",
    icon: <Shield size={20} />,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
  },
  {
    label: "Messages Today",
    value: "3,891",
    change: "+284",
    icon: <MessageSquare size={20} />,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
];

const RECENT_EVENTS = [
  {
    type: "member_join",
    user: "CoolUser#1234",
    time: "2 min ago",
    icon: <Users size={14} />,
    color: "text-green-400 bg-green-500/10",
  },
  {
    type: "command_used",
    user: "AnotherUser#5678",
    time: "5 min ago",
    icon: <Terminal size={14} />,
    color: "text-blue-400 bg-blue-500/10",
    detail: "!help",
  },
  {
    type: "member_ban",
    user: "BadActor#0001",
    time: "12 min ago",
    icon: <Shield size={14} />,
    color: "text-red-400 bg-red-500/10",
    detail: "Spam",
  },
  {
    type: "message_delete",
    user: "SomeUser#9999",
    time: "18 min ago",
    icon: <MessageSquare size={14} />,
    color: "text-yellow-400 bg-yellow-500/10",
  },
  {
    type: "live_notification",
    user: "StreamerXYZ",
    time: "1 hr ago",
    icon: <Activity size={14} />,
    color: "text-primary bg-primary/10",
    detail: "Twitch",
  },
];

const EVENT_LABELS: Record<string, string> = {
  member_join: "Member Joined",
  command_used: "Command Used",
  member_ban: "Member Banned",
  message_delete: "Message Deleted",
  live_notification: "Live Notification",
};

export default function DashboardPage({ guildId }: DashboardPageProps) {
  const { data: guildDetails } = trpc.guilds.details.useQuery({ guildId });
  const { data: settings } = trpc.settings.get.useQuery({ guildId });
  const { data: logs } = trpc.logs.list.useQuery({ guildId, limit: 5 });
  const { data: botStatus } = trpc.guilds.checkBotStatus.useQuery({ guildId });

  const guildName = guildDetails?.name ?? settings?.guildName ?? "Your Server";
  const isBotPresent = botStatus?.botInGuild ?? false;

  const STAT_CARDS = [
    {
      label: "Total Members",
      value: guildDetails?.member_count?.toLocaleString() || "0",
      change: isBotPresent ? "Real-time" : "Bot Required",
      icon: <Users size={20} />,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Text Channels",
      value: (settings as any)?.channelsCount?.toString() || "0",
      change: "Active",
      icon: <Hash size={20} />,
      color: "text-green-400",
      bg: "bg-green-500/10 border-green-500/20",
    },
    {
      label: "Active Commands",
      value: (settings as any)?.commandsCount?.toString() || "0",
      change: "Total",
      icon: <Terminal size={20} />,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/20",
    },
    {
      label: "Status",
      value: isBotPresent ? "Online" : "Offline",
      change: isBotPresent ? "Connected" : "Not Linked",
      icon: <Activity size={20} />,
      color: isBotPresent ? "text-primary" : "text-red-400",
      bg: isBotPresent ? "bg-primary/10 border-primary/20" : "bg-red-500/10 border-red-500/20",
    },
  ];

  const getBotInviteUrl = () => {
    const clientId = "1492325134550302952";
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/discord/callback`);
    return `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&response_type=code&redirect_uri=${redirectUri}&integration_type=0&scope=identify+bot&guild_id=${guildId}`;
  };

  // Redirecionamento automático desativado para permitir navegação mesmo sem o bot ou banco de dados
  useEffect(() => {
    console.log("Verificação de bot ativa, mas redirecionamento automático desativado por solicitação do usuário.");
  }, [botStatus, guildId]);

  return (
    <div className="space-y-6">
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
          <a href={getBotInviteUrl()} className="w-full md:w-auto">
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
            Server overview and statistics
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
          <Clock size={14} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
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
              Recent Events
            </h2>
            <span className="text-xs text-muted-foreground">Last 24h</span>
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
                    ).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : (event as { time: string }).time;
                const detail = isLog
                  ? null
                  : (event as { detail?: string }).detail;

                const colorMap: Record<string, string> = {
                  member_join: "text-green-400 bg-green-500/10",
                  member_leave: "text-yellow-400 bg-yellow-500/10",
                  member_ban: "text-red-400 bg-red-500/10",
                  member_unban: "text-blue-400 bg-blue-500/10",
                  message_delete: "text-orange-400 bg-orange-500/10",
                  message_edit: "text-purple-400 bg-purple-500/10",
                  command_used: "text-blue-400 bg-blue-500/10",
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
          <h2 className="font-semibold text-foreground text-sm mb-4">
            Server Info
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-xs text-muted-foreground">Prefix</span>
              <code className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                {settings?.prefix ?? "!"}
              </code>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-xs text-muted-foreground">Language</span>
              <span className="text-xs text-foreground font-medium uppercase">
                {settings?.language ?? "EN"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-xs text-muted-foreground">Timezone</span>
              <span className="text-xs text-foreground font-medium">
                {settings?.timezone ?? "UTC"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-xs text-muted-foreground">Bot Status</span>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${isBotPresent ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                <span className={`text-xs font-medium ${isBotPresent ? "text-green-400" : "text-red-400"}`}>
                  {isBotPresent ? "Online" : "Offline / Not Added"}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-muted-foreground">Bot Enabled</span>
              <span
                className={`text-xs font-medium ${settings?.botEnabled !== false ? "text-green-400" : "text-red-400"}`}
              >
                {settings?.botEnabled !== false ? "Yes" : "No"}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              Quick Actions
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button className="flex flex-col items-center gap-1 p-2 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors">
                <Bot size={16} className="text-primary" />
                <span className="text-xs text-primary">Restart</span>
              </button>
              <button className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted border border-border hover:bg-accent transition-colors">
                <Bell size={16} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Alerts</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
