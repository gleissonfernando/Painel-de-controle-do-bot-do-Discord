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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  AlertCircle, 
  Send, 
  Power, 
  AlertTriangle, 
  Settings2, 
  Globe, 
  Video,
  Info,
  MessageSquare,
  ShieldAlert
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

export default function BotControlPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // Verificar se o usuário é desenvolvedor
  const isDeveloper = user?.openId === "761011766440230932";

  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceGlobalEnabled, setMaintenanceGlobalEnabled] = useState(false);
  const [alertMessage, setAlertMessage] = useState("⚠️ O bot está em manutenção. Aguarde, já voltamos.");
  const [mediaUrl, setMediaUrl] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { data: settings, isLoading: settingsLoading } = trpc.settings.get.useQuery(
    { guildId: guildId || "" },
    { enabled: !!guildId }
  );

  const { data: globalConfig, isLoading: globalLoading } = trpc.maintenance.getGlobal.useQuery();

  const updateSettingsMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("✅ Configurações locais atualizadas!");
      utils.settings.get.invalidate({ guildId });
    },
    onError: (error) => {
      toast.error(`❌ Erro: ${error.message}`);
    },
  });

  const updateGlobalMutation = trpc.maintenance.updateGlobal.useMutation({
    onSuccess: () => {
      toast.success("🌍 Configurações globais atualizadas!");
      utils.maintenance.getGlobal.invalidate();
    },
    onError: (error) => {
      toast.error(`❌ Erro: ${error.message}`);
    },
  });

  const sendAlertMutation = trpc.maintenance.sendAlert.useMutation();

  useEffect(() => {
    if (settings) {
      setMaintenanceEnabled(settings.maintenanceEnabled);
      setAlertMessage(settings.maintenanceMessage || "⚠️ O bot está em manutenção. Aguarde, já voltamos.");
      setMediaUrl(settings.maintenanceVideoUrl || "");
    }
  }, [settings]);

  useEffect(() => {
    if (globalConfig) {
      setMaintenanceGlobalEnabled(globalConfig.maintenanceGlobalEnabled);
    }
  }, [globalConfig]);

  if (!isDeveloper) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={20} />
              Acesso Restrito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Esta página é exclusiva para desenvolvedores. Você não tem permissão para acessar este recurso.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSaveLocal = () => {
    if (!guildId) return;
    updateSettingsMutation.mutate({
      guildId,
      maintenanceEnabled,
      maintenanceMessage: alertMessage,
      maintenanceVideoUrl: mediaUrl,
    });
  };

  const handleSaveGlobal = () => {
    updateGlobalMutation.mutate({
      maintenanceGlobalEnabled,
      maintenanceMessage: alertMessage,
      maintenanceVideoUrl: mediaUrl,
    });
  };

  const handleSendAlert = async (type: "local" | "global") => {
    if (!guildId) return;
    
    const confirmMsg = type === "local" 
      ? "Deseja enviar o aviso de manutenção para o servidor atual?"
      : "⚠️ AVISO: Enviar aviso de manutenção para TODOS os servidores com canal configurado?";

    if (!window.confirm(confirmMsg)) return;

    setIsSending(true);
    try {
      const results = await sendAlertMutation.mutateAsync({
        guildId,
        type,
        message: alertMessage,
        mediaUrl,
      });
      
      const successCount = results.filter((r: any) => r.success).length;
      const skipCount = results.filter((r: any) => !r.success && r.error === "Canal de alerta não configurado").length;
      
      toast.success(`✅ Alerta enviado para ${successCount} servidor(es). ${skipCount} pulados.`);
    } catch (error: any) {
      toast.error(`❌ Erro ao disparar alerta: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  if (settingsLoading || globalLoading) {
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
            <Settings2 size={32} />
            Modo Controle
          </h1>
          <p className="text-muted-foreground">Gerencie o estado operacional e avisos de manutenção</p>
        </div>
        <Badge variant="outline" className="border-primary text-primary px-3 py-1">
          Painel Master
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Configurações de Manutenção */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-yellow-500" />
                    Estado de Manutenção
                  </CardTitle>
                  <CardDescription>O bot continuará online, mas bloqueará comandos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className="space-y-0.5">
                    <Label className="text-base">Manutenção Local</Label>
                    <p className="text-xs text-muted-foreground">Apenas para este servidor</p>
                  </div>
                  <Switch 
                    checked={maintenanceEnabled} 
                    onCheckedChange={setMaintenanceEnabled}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="space-y-0.5">
                    <Label className="text-base text-primary">Manutenção Global</Label>
                    <p className="text-xs text-muted-foreground">Todos os servidores do bot</p>
                  </div>
                  <Switch 
                    checked={maintenanceGlobalEnabled} 
                    onCheckedChange={setMaintenanceGlobalEnabled}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Mensagem de Manutenção</Label>
                  <Textarea 
                    value={alertMessage}
                    onChange={(e) => setAlertMessage(e.target.value)}
                    placeholder="Digite a mensagem que aparecerá no embed..."
                    className="min-h-[100px] bg-input border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Video size={14} />
                    URL de Vídeo/Imagem (Opcional)
                  </Label>
                  <Input 
                    value={mediaUrl || ""}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://exemplo.com/video.mp4 ou imagem.png"
                    className="bg-input border-border h-12"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={handleSaveLocal}
                  disabled={updateSettingsMutation.isPending}
                  variant="outline"
                  className="flex-1 border-border hover:bg-muted"
                >
                  Salvar Local
                </Button>
                <Button 
                  onClick={handleSaveGlobal}
                  disabled={updateGlobalMutation.isPending}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Salvar Global
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Ações de Disparo */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Disparar Avisos
              </CardTitle>
              <CardDescription>Envie o embed de manutenção para os canais configurados</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button 
                variant="outline" 
                onClick={() => handleSendAlert("local")}
                disabled={isSending}
                className="flex-1 gap-2 border-primary/20 hover:bg-primary/5 h-12"
              >
                <MessageSquare size={18} />
                Enviar Teste Local
              </Button>
              <Button 
                onClick={() => handleSendAlert("global")}
                disabled={isSending}
                className="flex-1 gap-2 bg-yellow-600 hover:bg-yellow-700 text-white h-12"
              >
                <Globe size={18} />
                Ativar Manutenção Global
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  setMaintenanceEnabled(false);
                  setMaintenanceGlobalEnabled(false);
                  handleSaveGlobal();
                  handleSaveLocal();
                }}
                className="flex-1 gap-2 h-12"
              >
                <Power size={18} />
                Desativar Tudo
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Preview do Embed */}
          <Card className="border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/50 border-b border-border/50">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Preview do Aviso
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="border-l-4 border-red-600 bg-[#121212] rounded-r-lg p-4 space-y-3 shadow-xl">
                <h4 className="font-bold text-white flex items-center gap-2">
                  🛠️ Bot em manutenção
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {alertMessage}
                </p>
                {mediaUrl && (
                  <div className="aspect-video bg-black/40 rounded border border-white/10 flex items-center justify-center overflow-hidden">
                    <Video size={24} className="text-white/20" />
                  </div>
                )}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-medium">
                    Magnatas.gg • Sistema de manutenção
                  </span>
                  <span className="text-[10px] text-gray-600">Agora</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Regras de Manutenção */}
          <Alert className="bg-blue-500/5 border-blue-500/20">
            <Info className="h-5 w-5 text-blue-500" />
            <AlertTitle className="text-blue-500 font-bold">Regras do Sistema</AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground space-y-2 mt-2">
              <p>• O bot **NUNCA** desliga durante a manutenção.</p>
              <p>• Comandos serão interceptados e responderão com o embed acima.</p>
              <p>• O envio global respeita apenas servidores com canal de alerta configurado.</p>
              <p>• Se a manutenção global estiver ativa, ela sobrepõe a local.</p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
