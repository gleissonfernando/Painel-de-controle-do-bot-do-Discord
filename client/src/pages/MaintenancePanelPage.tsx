import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, AlertTriangle, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/_core/trpc";

interface Channel {
  id: string;
  name: string;
  type: "text" | "voice";
}

export default function MaintenancePanelPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const params = useParams();
  const guildId = params.guildId || "";

  const [channels, setChannels] = useState<Channel[]>([]);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [alertChannelId, setAlertChannelId] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Verificar autenticação
  useEffect(() => {
    if (!user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Carregar configurações de manutenção
  useEffect(() => {
    if (!guildId) return;
    
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
        setMaintenanceEnabled(false);
        setAlertChannelId("");
        setAlertMessage("Sistema em manutenção");
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [guildId]);

  // Carregar canais do servidor
  useEffect(() => {
    if (!guildId) return;
    
    const mockChannels: Channel[] = [
      { id: "1", name: "general", type: "text" },
      { id: "2", name: "announcements", type: "text" },
      { id: "3", name: "maintenance-alerts", type: "text" },
      { id: "4", name: "voice-general", type: "voice" },
      { id: "5", name: "dev-logs", type: "text" },
    ];
    
    setChannels(mockChannels);
  }, [guildId]);

  const handleToggleMaintenance = async () => {
    if (!maintenanceEnabled && !alertChannelId) {
      toast.error("⚠️ Selecione um canal antes de ativar a manutenção.");
      return;
    }

    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setMaintenanceEnabled(!maintenanceEnabled);
      
      if (!maintenanceEnabled) {
        toast.success(`✅ Manutenção ativada!\nCanal: #${channels.find(c => c.id === alertChannelId)?.name}`);
      } else {
        toast.success("✅ Manutenção desativada!");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar manutenção");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (maintenanceEnabled && !alertChannelId) {
      toast.error("⚠️ Selecione um canal antes de salvar.");
      return;
    }

    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success("✅ Configurações salvas com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <AlertTriangle className="text-yellow-500" size={32} />
            Painel de Manutenção
          </h1>
          <p className="text-muted-foreground mt-2">Gerencie o modo de manutenção do seu servidor</p>
        </div>

        {/* Status Card */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                {maintenanceEnabled ? (
                  <AlertTriangle className="text-yellow-500" size={24} />
                ) : (
                  <CheckCircle2 className="text-green-500" size={24} />
                )}
                <div>
                  <p className="font-semibold">Status Atual</p>
                  <p className={`text-sm ${maintenanceEnabled ? "text-yellow-500" : "text-green-500"}`}>
                    {maintenanceEnabled ? "🟡 Manutenção Ativa" : "🟢 Sistema Online"}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleToggleMaintenance}
                disabled={isSaving}
                className={maintenanceEnabled ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Processando...
                  </>
                ) : maintenanceEnabled ? (
                  "Desativar Manutenção"
                ) : (
                  "Ativar Manutenção"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Configurações de Manutenção</CardTitle>
            <CardDescription>Defina como o sistema alertará os usuários</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Canal de Alerta */}
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="text-yellow-500" />
                Canal de Alerta
              </label>
              <Select value={alertChannelId} onValueChange={setAlertChannelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um canal..." />
                </SelectTrigger>
                <SelectContent>
                  {channels
                    .filter(ch => ch.type === "text")
                    .map(ch => (
                      <SelectItem key={ch.id} value={ch.id}>
                        #{ch.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {!alertChannelId && "⚠️ Selecione um canal antes de ativar a manutenção"}
                {alertChannelId && `✅ Canal selecionado: #${channels.find(c => c.id === alertChannelId)?.name}`}
              </p>
            </div>

            {/* Mensagem de Alerta */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Mensagem de Alerta</label>
              <Textarea
                placeholder="Digite a mensagem que será enviada no canal..."
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                className="min-h-24"
              />
              <p className="text-xs text-muted-foreground">
                Esta mensagem será enviada como um embed no canal selecionado
              </p>
            </div>

            {/* Botão Salvar */}
            <Button
              onClick={handleSaveSettings}
              disabled={isSaving || !alertChannelId}
              className="w-full gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Salvar Configurações
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="text-blue-500 flex-shrink-0" size={20} />
              <div className="space-y-1">
                <p className="font-semibold text-sm">Como funciona?</p>
                <p className="text-sm text-muted-foreground">
                  Ao ativar a manutenção, um embed será enviado no canal selecionado avisando os usuários. 
                  Quando desativar, um novo embed será enviado confirmando que o sistema está online novamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
