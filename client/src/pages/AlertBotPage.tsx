import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  Bell, 
  Save, 
  AlertCircle, 
  Hash, 
  User, 
  Clock,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AlertBotPageProps {
  guildId: string;
}

export default function AlertBotPage({ guildId }: AlertBotPageProps) {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: settings, isLoading: settingsLoading } = trpc.settings.get.useQuery({ guildId });
  const { data: channels, isLoading: channelsLoading } = trpc.guilds.channels.useQuery({ guildId });

  const [alertChannelId, setAlertChannelId] = useState<string>("");

  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Configurações de alerta atualizadas!");
      utils.settings.get.invalidate({ guildId });
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });

  useEffect(() => {
    if (settings?.alertChannelId) {
      setAlertChannelId(settings.alertChannelId);
    }
  }, [settings]);

  const handleSave = () => {
    if (!alertChannelId) {
      toast.error("Selecione um canal de alerta!");
      return;
    }

    const channelName = channels?.find(c => c.id === alertChannelId)?.name || "desconhecido";

    updateMutation.mutate({
      guildId,
      alertChannelId,
      alertChannelName: channelName,
    });
  };

  const isLoading = settingsLoading || channelsLoading;
  const selectedChannel = channels?.find(c => c.id === alertChannelId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="text-primary" size={24} />
            Alerta Bot
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure o canal onde o bot enviará avisos e notificações importantes.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={updateMutation.isLoading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          <Save size={18} />
          Salvar Alterações
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Config */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Hash size={18} className="text-primary" />
              <h2 className="font-semibold text-foreground">Canal de Texto</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Selecionar Canal
                </label>
                <select
                  value={alertChannelId}
                  onChange={(e) => setAlertChannelId(e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                >
                  <option value="">Selecione um canal...</option>
                  {channels?.filter(c => c.type === 0).map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      #{channel.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1.5">
                  <AlertCircle size={12} className="mt-0.5 shrink-0" />
                  O bot enviará mensagens globais e alertas de manutenção apenas neste canal.
                </p>
              </div>

              {alertChannelId && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <CheckCircle2 className="text-primary" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Canal Configurado</p>
                    <p className="text-xs text-muted-foreground">
                      O bot está pronto para enviar alertas em <span className="text-primary font-bold">#{selectedChannel?.name}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-amber-500 shrink-0" size={20} />
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider">Importante</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Se este canal não for configurado, este servidor será <span className="text-foreground font-bold">pulado</span> durante o envio de mensagens globais. Certifique-se de que o bot tenha permissão para enviar mensagens no canal selecionado.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-foreground mb-4">Informações do Registro</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <User size={16} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Configurado por</p>
                  <p className="text-sm font-medium text-foreground">{settings?.configuredBy || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Clock size={16} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Última Atualização</p>
                  <p className="text-sm font-medium text-foreground">
                    {settings?.updatedAt ? new Date(settings.updatedAt).toLocaleString('pt-BR') : "Nunca"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-xl p-6">
            <h3 className="text-sm font-bold text-primary mb-2">Dica</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Recomendamos criar um canal exclusivo chamado <code className="bg-primary/10 text-primary px-1 rounded">#avisos-bot</code> para manter seus membros informados sem poluir outros canais.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
