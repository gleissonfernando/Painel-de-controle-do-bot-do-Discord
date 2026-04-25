import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SocialNotificationsPageProps {
  guildId: string;
}

type Platform = "youtube" | "twitch" | "tiktok";

const PLATFORM_CONFIG = {
  youtube: {
    label: "YouTube",
    color: "text-red-500",
    bg: "bg-red-500/10 border-red-500/20",
    activeBg: "bg-red-500/20 border-red-500/40",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  twitch: {
    label: "Twitch",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
    activeBg: "bg-purple-500/20 border-purple-500/40",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
      </svg>
    ),
  },
  tiktok: {
    label: "TikTok",
    color: "text-pink-400",
    bg: "bg-pink-500/10 border-pink-500/20",
    activeBg: "bg-pink-500/20 border-pink-500/40",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
};

interface AddFormState {
  platform: Platform;
  channelUsername: string;
  discordChannelId: string;
  message: string;
}

export default function SocialNotificationsPage({
  guildId,
}: SocialNotificationsPageProps) {
  const { data: notifications, isLoading } = trpc.notifications.list.useQuery({
    guildId,
  });
  const { data: channels } = trpc.guilds.channels.useQuery({ guildId });
  const utils = trpc.useUtils();

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<AddFormState>({
    platform: "twitch",
    channelUsername: "",
    discordChannelId: "",
    message: "",
  });

  const createMutation = trpc.notifications.create.useMutation({
    onSuccess: () => {
      toast.success("Notification added!");
      utils.notifications.list.invalidate({ guildId });
      setShowAddForm(false);
      setAddForm({
        platform: "twitch",
        channelUsername: "",
        discordChannelId: "",
        message: "",
      });
    },
    onError: err => toast.error(`Failed: ${err.message}`),
  });

  const updateMutation = trpc.notifications.update.useMutation({
    onSuccess: () => {
      toast.success("Updated!");
      utils.notifications.list.invalidate({ guildId });
    },
    onError: err => toast.error(`Failed: ${err.message}`),
  });

  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      toast.success("Notification removed!");
      utils.notifications.list.invalidate({ guildId });
    },
    onError: err => toast.error(`Failed: ${err.message}`),
  });

  const byPlatform = (platform: Platform) =>
    (notifications ?? []).filter(n => n.platform === platform);

  const PlatformSection = ({ platform }: { platform: Platform }) => {
    const cfg = PLATFORM_CONFIG[platform];
    const items = byPlatform(platform);

    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Platform Header */}
        <div
          className={`flex items-center gap-3 px-5 py-4 border-b border-border ${cfg.bg}`}
        >
          <span className={cfg.color}>{cfg.icon}</span>
          <h2 className={`font-semibold ${cfg.color}`}>{cfg.label}</h2>
          <span className="ml-auto text-xs text-muted-foreground">
            {items.length} canal{items.length !== 1 ? "is" : ""}
          </span>
          <button
            onClick={() => {
              setAddForm({ ...addForm, platform });
              setShowAddForm(true);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${cfg.bg} ${cfg.color} hover:opacity-80`}
          >
            <Plus size={12} />
            Adicionar
          </button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum canal de {cfg.label} configurado
            </p>
            <button
              onClick={() => {
                setAddForm({ ...addForm, platform });
                setShowAddForm(true);
              }}
              className="mt-2 text-xs text-primary hover:underline"
            >
              Adicione seu primeiro canal
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {items.map(notif => (
              <div key={notif.id} className="flex items-center gap-4 px-5 py-4">
                <div
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.color}`}
                >
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-foreground">
                      @{notif.channelUsername}
                    </p>
                    {notif.isLive && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/10 text-red-400 text-xs rounded-full border border-red-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    → #
                    {(channels ?? []).find(
                      (c: { id: string; name: string }) =>
                        c.id === notif.discordChannelId
                    )?.name ?? notif.discordChannelId}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateMutation.mutate({
                        id: notif.id,
                        enabled: !notif.enabled,
                      })
                    }
                    title={notif.enabled ? "Disable" : "Enable"}
                  >
                    {notif.enabled ? (
                      <ToggleRight size={24} className="text-primary" />
                    ) : (
                      <ToggleLeft size={24} className="text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate({ id: notif.id })}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell size={22} className="text-primary" />
            Notificações Sociais
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Seja notificado quando streamers entrarem ao vivo ou postarem novos conteúdos
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          <Plus size={14} />
          Adicionar Canal
        </Button>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-foreground">
                Adicionar Notificação
              </h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Platform */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Plataforma
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["youtube", "twitch", "tiktok"] as Platform[]).map(p => {
                    const cfg = PLATFORM_CONFIG[p];
                    return (
                      <button
                        key={p}
                        onClick={() => setAddForm({ ...addForm, platform: p })}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border text-xs font-medium transition-colors ${
                          addForm.platform === p
                            ? cfg.activeBg + " " + cfg.color
                            : "bg-input border-border text-muted-foreground hover:border-primary/20"
                        }`}
                      >
                        <span
                          className={
                            addForm.platform === p
                              ? cfg.color
                              : "text-muted-foreground"
                          }
                        >
                          {cfg.icon}
                        </span>
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Channel Username */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Usuário do {PLATFORM_CONFIG[addForm.platform].label}
                </label>
                <input
                  type="text"
                  placeholder={`e.g. ${addForm.platform === "youtube" ? "MrBeast" : addForm.platform === "twitch" ? "ninja" : "charlidamelio"}`}
                  value={addForm.channelUsername}
                  onChange={e =>
                    setAddForm({ ...addForm, channelUsername: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Discord Channel */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Canal do Discord
                </label>
                <select
                  value={addForm.discordChannelId}
                  onChange={e =>
                    setAddForm({ ...addForm, discordChannelId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Selecione um canal...</option>
                  {(channels ?? []).map((c: { id: string; name: string }) => (
                    <option key={c.id} value={c.id}>
                      #{c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Message */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Mensagem de Anúncio{" "}
                  <span className="text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </label>
                <textarea
                  placeholder={`{streamer} está ao vivo! 🔴 {url}`}
                  value={addForm.message}
                  onChange={e =>
                    setAddForm({ ...addForm, message: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAddForm(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={
                  !addForm.channelUsername ||
                  !addForm.discordChannelId ||
                  createMutation.isPending
                }
                onClick={() => createMutation.mutate({ guildId, ...addForm })}
              >
                {createMutation.isPending ? "Adicionando..." : "Adicionar Canal"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-5 animate-pulse"
            >
              <div className="h-5 bg-muted rounded w-1/4 mb-3" />
              <div className="h-12 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <PlatformSection platform="twitch" />
          <PlatformSection platform="youtube" />
          <PlatformSection platform="tiktok" />
        </div>
      )}
    </div>
  );
}
