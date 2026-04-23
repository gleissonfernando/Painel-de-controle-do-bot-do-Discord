import { useLanguage } from "@/contexts/LanguageContext";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Send, Power, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function BotControlPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const { t } = useLanguage();
  const { user } = useAuth();

  // Verificar se o usuário é desenvolvedor
  const isDeveloper = user?.openId === "761011766440230932";
  
  // DEBUG: Log do ID do usuário para verificação
  useEffect(() => {
    if (user) {
      console.log("[DEV DEBUG] User openId:", user.openId);
      console.log("[DEV DEBUG] Is Developer:", isDeveloper);
      console.log("[DEV DEBUG] Full user object:", user);
    }
  }, [user, isDeveloper]);

  if (!isDeveloper) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [testMessage, setTestMessage] = useState<string>("");
  const [botEnabled, setBotEnabled] = useState<boolean>(true);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);

  const { data: channels } = trpc.guilds.channels.useQuery(
    { guildId: guildId || "" },
    {
      enabled: !!guildId,
    }
  );

  const { data: settings } = trpc.settings.get.useQuery(
    { guildId: guildId || "" },
    {
      enabled: !!guildId,
    }
  );

  // Sincronizar estado do bot com as configurações salvas
  useEffect(() => {
    if (settings) {
      setBotEnabled(settings.botEnabled ?? true);
      setMaintenanceMode((settings as any).maintenanceMode ?? false);
    }
  }, [settings]);

  const sendTestMutation = trpc.settings.testMessage.useMutation({
    onSuccess: () => {
      const channelName = channels?.find(ch => ch.id === selectedChannel)?.name || "canal";
      toast.success(`✅ Mensagem enviada para #${channelName}!`);
      setTestMessage("");
    },
    onError: (error: any) => {
      console.error("Erro ao enviar mensagem:", error);
      toast.error(`❌ Erro ao enviar: ${error.message || "Tente novamente"}`);
    },
  });

  const updateSettingsMutation = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("⚙️ Configurações atualizadas!");
    },
    onError: (error: any) => {
      toast.error(`❌ Erro: ${error.message || "Tente novamente"}`);
    },
  });

  const handleSendTest = () => {
    if (!selectedChannel || !testMessage.trim()) {
      toast.error("⚠️ Selecione um canal e digite uma mensagem");
      return;
    }

    const selectedChannelName = channels?.find(ch => ch.id === selectedChannel)?.name || "desconhecido";
    
    console.log(`📤 Enviando mensagem para canal: #${selectedChannelName} (ID: ${selectedChannel})`);
    console.log(`📝 Mensagem: ${testMessage}`);
    
    sendTestMutation.mutate({
      guildId: guildId || "",
      channelId: selectedChannel,
      message: testMessage,
    });
  };

  const handleToggleBot = () => {
    if (!guildId) return;
    const newState = !botEnabled;
    setBotEnabled(newState);
    updateSettingsMutation.mutate({
      guildId,
      botEnabled: newState,
    });
  };

  const handleToggleMaintenance = () => {
    if (!guildId) return;
    const newState = !maintenanceMode;
    setMaintenanceMode(newState);
    updateSettingsMutation.mutate({
      guildId,
      maintenanceMode: newState,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          🎮 Controle e Testes do Bot
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie o estado do bot, ative modo de manutenção e envie mensagens de teste
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bot Status */}
        <Card className={botEnabled ? "border-green-500" : "border-red-500"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Power size={20} />
              Estado do Bot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {botEnabled ? "✅ Bot Ativo" : "❌ Bot Desativado"}
              </span>
              <Button
                onClick={handleToggleBot}
                variant={botEnabled ? "destructive" : "default"}
                size="sm"
                disabled={updateSettingsMutation.isPending}
              >
                {botEnabled ? "Desativar" : "Ativar"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Desative o bot para parar todas as suas funcionalidades temporariamente.
            </p>
          </CardContent>
        </Card>

        {/* Maintenance Mode */}
        <Card className={maintenanceMode ? "border-yellow-500" : "border-gray-500"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle size={20} />
              Modo de Manutenção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {maintenanceMode ? "🔧 Manutenção Ativa" : "✅ Operacional"}
              </span>
              <Button
                onClick={handleToggleMaintenance}
                variant={maintenanceMode ? "default" : "outline"}
                size="sm"
                disabled={updateSettingsMutation.isPending}
              >
                {maintenanceMode ? "Desativar" : "Ativar"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Ative para notificar usuários que o bot está em manutenção.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Test Message Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send size={20} />
            Enviar Mensagem de Teste
          </CardTitle>
          <CardDescription>
            Selecione um canal e envie uma mensagem para testar o bot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Channel Select */}
          <div className="space-y-2">
            <Label htmlFor="testChannel">Selecione um Canal</Label>
            <Select value={selectedChannel} onValueChange={setSelectedChannel}>
              <SelectTrigger id="testChannel">
                <SelectValue placeholder="Escolha um canal..." />
              </SelectTrigger>
              <SelectContent>
                {!channels || channels.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Nenhum canal encontrado
                  </div>
                ) : (
                  channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      #{channel.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedChannel && (
              <div className="p-2 rounded bg-green-500/10 border border-green-500/30">
                <p className="text-xs text-green-600 font-medium">
                  ✓ Canal selecionado: <strong>#{channels?.find(ch => ch.id === selectedChannel)?.name}</strong>
                </p>
                <p className="text-[10px] text-green-600/70 mt-1">
                  ID: {selectedChannel}
                </p>
              </div>
            )}
          </div>

          {/* Message Textarea */}
          <div className="space-y-2">
            <Label htmlFor="testMsg">Mensagem</Label>
            <Textarea
              id="testMsg"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Digite a mensagem de teste..."
              className="min-h-[100px]"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Máximo de 2000 caracteres (limite do Discord)
              </p>
              <p className="text-xs text-muted-foreground">
                {testMessage.length}/2000
              </p>
            </div>
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendTest}
            disabled={sendTestMutation.isPending || !selectedChannel || !testMessage.trim()}
            className="w-full gap-2"
          >
            <Send size={16} />
            {sendTestMutation.isPending ? "Enviando..." : "Enviar Teste"}
          </Button>
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <p className="font-semibold mb-2">💡 Dicas:</p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Selecione o canal onde deseja enviar a mensagem de teste</li>
            <li>O ID do canal é capturado automaticamente e enviado ao bot</li>
            <li>Use o teste para validar que o bot está respondendo corretamente</li>
            <li>Desative o bot se precisar fazer manutenção ou atualizações</li>
            <li>O modo de manutenção notifica os usuários sobre indisponibilidade temporária</li>
            <li>Todas as alterações são salvas automaticamente</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
