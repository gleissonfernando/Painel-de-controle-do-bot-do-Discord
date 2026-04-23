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
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Settings, 
  Bell, 
  CheckCircle2, 
  Info, 
  ShieldCheck,
  User,
  Calendar,
  LayoutList,
  MessageSquare
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

export default function RealTimeLogConfigPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const [logChannelId, setLogChannelId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true);
  const utils = trpc.useUtils();

  const { data: config, isLoading: configLoading } = trpc.realTimeLogs.getConfig.useQuery(
    { guildId: guildId || "" },
    { enabled: !!guildId }
  );

  const { data: channels, isLoading: channelsLoading } = trpc.guilds.channels.useQuery(
    { guildId: guildId || "" },
    { enabled: !!guildId }
  );

  const updateMutation = trpc.realTimeLogs.updateConfig.useMutation({
    onSuccess: () => {
      toast.success("✅ Configurações de logs atualizadas!");
      utils.realTimeLogs.getConfig.invalidate({ guildId });
    },
    onError: (error) => {
      toast.error(`❌ Erro ao salvar: ${error.message}`);
    },
  });

  useEffect(() => {
    if (config) {
      setLogChannelId(config.logChannelId);
      setEnabled(config.enabled);
    }
  }, [config]);

  const handleSave = () => {
    if (!guildId) return;
    updateMutation.mutate({
      guildId,
      logChannelId,
      enabled,
    });
  };

  const isLoading = configLoading || channelsLoading;

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
            <Settings size={32} />
            Configuração de Logs
          </h1>
          <p className="text-muted-foreground">Defina o destino e o comportamento das logs do bot</p>
        </div>
        <Badge variant="outline" className="border-primary text-primary px-3 py-1">
          Configuração de Sistema
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Destino das Logs
            </CardTitle>
            <CardDescription>Escolha o canal do Discord onde as logs serão enviadas</CardDescription>
          </Header>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                <div className="space-y-0.5">
                  <Label className="text-base">Ativar Envio para o Discord</Label>
                  <p className="text-xs text-muted-foreground">As logs serão enviadas como embeds no canal selecionado</p>
                </div>
                <Switch 
                  checked={enabled} 
                  onCheckedChange={setEnabled}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare size={14} /> Canal de Logs
                </label>
                <Select value={logChannelId || "none"} onValueChange={(v) => setLogChannelId(v === "none" ? null : v)}>
                  <SelectTrigger className="bg-input border-border h-12">
                    <SelectValue placeholder="Selecione um canal..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum canal selecionado</SelectItem>
                    {channels?.filter(c => c.type === 0).map((channel) => (
                      <SelectItem key={channel.id} value={channel.id}>
                        #{channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Recomendamos um canal privado apenas para administradores.
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
                Informações de Registro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <LayoutList size={16} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Status de Envio</p>
                  <p className="text-sm font-medium text-foreground">
                    {enabled ? <span className="text-green-500">Ativado</span> : <span className="text-red-500">Desativado</span>}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <User size={16} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Última Alteração por</p>
                  <p className="text-sm font-medium text-foreground">{config?.updatedBy || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Calendar size={16} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Data da Atualização</p>
                  <p className="text-sm font-medium text-foreground">
                    {config?.updatedAt ? new Date(config.updatedAt).toLocaleDateString("pt-BR") : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert className="bg-primary/5 border-primary/20">
            <Info className="h-5 w-5 text-primary" />
            <AlertTitle className="text-primary font-bold">Dica de Segurança</AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground leading-relaxed">
              As logs em tempo real no painel web **sempre estarão ativas** para administradores, independentemente da configuração de envio para o Discord.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
