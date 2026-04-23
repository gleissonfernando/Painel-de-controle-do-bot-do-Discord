import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertCircle, 
  Bell, 
  CheckCircle2, 
  Info, 
  ShieldCheck,
  User,
  Calendar
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function AlertBotPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const [alertChannelId, setAlertChannelId] = useState<string>("");
  const utils = trpc.useUtils();

  const { data: settings, isLoading: settingsLoading } = trpc.settings.get.useQuery(
    { guildId: guildId || "" },
    { enabled: !!guildId }
  );

  const { data: channels, isLoading: channelsLoading } = trpc.guilds.channels.useQuery(
    { guildId: guildId || "" },
    { enabled: !!guildId }
  );

  const updateMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("✅ Canal de alerta configurado com sucesso!");
      utils.settings.get.invalidate({ guildId });
    },
    onError: (error) => {
      toast.error(`❌ Erro ao salvar: ${error.message}`);
    },
  });

  useEffect(() => {
    if (settings?.alertChannelId) {
      setAlertChannelId(settings.alertChannelId);
    }
  }, [settings]);

  const handleSave = () => {
    if (!guildId) return;
    if (!alertChannelId) {
      toast.error("⚠️ Selecione um canal de alerta!");
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Bell size={32} />
            Alerta Bot
          </h1>
          <p className="text-muted-foreground">Configure onde o bot enviará avisos e notificações importantes</p>
        </div>
        <Badge variant="outline" className="border-primary text-primary px-3 py-1">
          Configuração de Canal
        </Badge>
      </div>

      {!settings?.alertChannelId && (
        <Alert className="bg-yellow-500/10 border-yellow-500/50 text-yellow-600">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="font-bold">Atenção!</AlertTitle>
          <AlertDescription>
            Este servidor ainda não possui canal de alerta configurado. Selecione um canal abaixo para receber avisos do bot.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Seleção de Canal
            </CardTitle>
            <CardDescription>Escolha o canal de texto oficial para o bot</CardDescription>
          </Header>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Canal de Texto</label>
                <Select value={alertChannelId} onValueChange={setAlertChannelId}>
                  <SelectTrigger className="bg-input border-border h-12">
                    <SelectValue placeholder="Selecione um canal..." />
                  </SelectTrigger>
                  <SelectContent>
                    {channels?.filter(c => c.type === 0).map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        #{channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  O bot enviará mensagens globais e avisos de manutenção neste canal.
                </p>
              </div>
            </div>

            <Button 
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-lg font-bold shadow-lg shadow-primary/20"
            >
              {updateMutation.isPending ? "Salvando..." : "Salvar Configuração"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Status Atual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Bell size={16} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Canal Ativo</p>
                  <p className="text-sm font-medium text-foreground">
                    {settings?.alertChannelName ? `#${settings.alertChannelName}` : "Não configurado"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <User size={16} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Configurado por</p>
                  <p className="text-sm font-medium text-foreground">{settings?.updatedBy || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Calendar size={16} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Última Atualização</p>
                  <p className="text-sm font-medium text-foreground">
                    {settings?.updatedAt ? new Date(settings.updatedAt).toLocaleDateString("pt-BR") : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert className="bg-primary/5 border-primary/20">
            <Info className="h-5 w-5 text-primary" />
            <AlertTitle className="text-primary font-bold">Importante</AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground leading-relaxed">
              As mensagens globais e avisos de manutenção **só serão enviados** se este canal estiver configurado corretamente.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
