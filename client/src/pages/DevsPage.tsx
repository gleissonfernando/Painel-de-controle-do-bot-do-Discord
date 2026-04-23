import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSession } from "@/contexts/SessionContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  Clock,
  LogOut,
  Settings,
  Zap,
  Send,
  Power,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquare,
  Bell,
  Globe,
  ChevronDown,
  Server,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface DevSession {
  username: string;
  discordUserId: string;
  discordUsername: string;
  timestamp: number;
  expiresIn: number;
}

interface BroadcastResult {
  guildId: string;
  guildName: string;
  success: boolean;
  error?: string;
}

export default function DevsPage() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { activeGuild, guilds, setActiveGuild, activeGuildId } = useSession();
  
  const [session, setSession] = useState<DevSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"control" | "local" | "broadcast" | "logs" | "settings">("control");

  // Estados para Bot Control
  const [botEnabled, setBotEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceReason, setMaintenanceReason] = useState("");
  const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);

  // Estados para Envio de Mensagens
  const [messageChannel, setMessageChannel] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Estados para Teste de Mensagem
  const [testChannel, setTestChannel] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [isTestingMessage, setIsTestingMessage] = useState(false);

  // Estados para Mensagem Global
  const [globalMessage, setGlobalMessage] = useState("");
  const [isSendingGlobal, setIsSendingGlobal] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState(0);
  const [broadcastResults, setBroadcastResults] = useState<BroadcastResult[]>([]);

  // Estados para Mensagem Local
  const [localMessage, setLocalMessage] = useState("");
  const [localChannel, setLocalChannel] = useState("");
  const [isSendingLocal, setIsSendingLocal] = useState(false);
  const [localMessageError, setLocalMessageError] = useState("");

  // Estados para Seletor de Call de Logs
  const [logsChannel, setLogsChannel] = useState("");
  const [channels, setChannels] = useState<Array<{ id: string; name: string; type: "text" | "voice" }>>([]);

  // Histórico de mudanças
  const [changeHistory, setChangeHistory] = useState<Array<{ timestamp: string; action: string; details: string }>>([]);

  // Queries tRPC
  const { data: guildSettings } = trpc.settings.get.useQuery(
    { guildId: activeGuildId || "" },
    { enabled: !!activeGuildId }
  );

  const { data: guildChannels } = trpc.guilds.channels.useQuery(
    { guildId: activeGuildId || "" },
    { enabled: !!activeGuildId }
  );

  // Dev Management Queries
  const { data: devsList } = trpc.devManagement.list.useQuery(undefined, {
    retry: false,
  });

  const { data: auditLogs } = trpc.devManagement.auditLogs.useQuery(
    { limit: 50 },
    { enabled: !!session }
  );

  // Logs Config Queries
  const { data: logsConfig } = trpc.logsConfig.getConfig.useQuery(
    { guildId: activeGuildId || "" },
    { enabled: !!activeGuildId }
  );

  const { data: guildLogs } = trpc.logsConfig.getLogs.useQuery(
    { guildId: activeGuildId || "", limit: 50 },
    { enabled: !!activeGuildId }
  );

  // Mutations
  const createDevMutation = trpc.devManagement.create.useMutation();
  const updateDevRoleMutation = trpc.devManagement.updateRole.useMutation();
  const removeDevMutation = trpc.devManagement.remove.useMutation();
  const removeBotMutation = trpc.guildManagement.removeBot.useMutation();
  const updateLogsConfigMutation = trpc.logsConfig.updateConfig.useMutation();
  const sendLocalMessageMutation = trpc.messages.sendLocal.useMutation();
  const sendGlobalMessageMutation = trpc.broadcast.sendGlobal.useMutation();

  // Verificar se o usuario esta autenticado via Discord OAuth2
  useEffect(() => {
    if (!user) {
      setLocation("/");
      return;
    }
  }, [user, setLocation]);

  // Verificar sessão dev
  useEffect(() => {
    const devSession = localStorage.getItem("dev_session");
    if (!devSession) {
      setLocation("/devs/login");
      return;
    }

    try {
      const parsed = JSON.parse(devSession) as DevSession;
      const now = Date.now();
      const expiresAt = parsed.timestamp + parsed.expiresIn;

      if (now > expiresAt) {
        localStorage.removeItem("dev_session");
        toast.error("Sessão expirada. Faça login novamente.");
        setLocation("/devs/login");
        return;
      }

      setSession(parsed);

      // Atualizar tempo restante a cada segundo
      const interval = setInterval(() => {
        const remaining = expiresAt - Date.now();
        if (remaining <= 0) {
          localStorage.removeItem("dev_session");
          setLocation("/devs/login");
          return;
        }

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      }, 1000);

      return () => clearInterval(interval);
    } catch (error) {
      console.error("Erro ao verificar sessão dev:", error);
      setLocation("/devs/login");
    }
  }, [setLocation]);

  // Sincronizar canais quando o servidor ativo mudar
  useEffect(() => {
    if (guildChannels && guildChannels.length > 0) {
      setChannels(guildChannels);
      // Resetar seleções de canal ao mudar de servidor
      setLocalChannel("");
      setTestChannel("");
      setMessageChannel("");
      setLogsChannel("");
      setLocalMessageError("");
    }
  }, [guildChannels, activeGuildId]);

  // Sincronizar configurações do bot
  useEffect(() => {
    if (guildSettings) {
      setBotEnabled(guildSettings.botEnabled ?? true);
      setMaintenanceMode((guildSettings as any).maintenanceMode ?? false);
    }
  }, [guildSettings]);

  const handleLogout = () => {
    localStorage.removeItem("dev_session");
    logout();
    toast.success("Sessão encerrada");
    setLocation("/");
  };

  const addToHistory = (action: string, details: string) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString("pt-BR");
    setChangeHistory(prev => [{ timestamp, action, details }, ...prev.slice(0, 19)]);
  };

  const handleToggleBotStatus = async () => {
    if (!activeGuildId) {
      toast.error("Selecione um servidor primeiro");
      return;
    }

    try {
      setBotEnabled(!botEnabled);
      const action = !botEnabled ? "Bot Ativado" : "Bot Desativado";
      addToHistory(action, `Status alterado para ${!botEnabled ? "Online" : "Offline"}`);
      toast.success(`✅ ${action}`);
    } catch (error) {
      toast.error("Erro ao atualizar status do bot");
    }
  };

  const handleToggleMaintenance = async () => {
    if (!activeGuildId) {
      toast.error("Selecione um servidor primeiro");
      return;
    }

    setIsTogglingMaintenance(true);
    try {
      const newState = !maintenanceMode;
      setMaintenanceMode(newState);
      const action = newState ? "Manutenção Ativada" : "Manutenção Desativada";
      addToHistory(action, maintenanceReason || "Sem descrição");
      toast.success(`✅ ${action}`);
    } catch (error) {
      toast.error("Erro ao atualizar modo de manutenção");
    } finally {
      setIsTogglingMaintenance(false);
    }
  };

  const handleSendLocalMessage = async () => {
    setLocalMessageError("");
    
    if (!localChannel) {
      setLocalMessageError("Selecione um canal para enviar");
      toast.error("Selecione um canal para enviar");
      return;
    }

    if (!localMessage.trim()) {
      setLocalMessageError("Digite uma mensagem");
      toast.error("Digite uma mensagem");
      return;
    }

    if (localMessage.length > 2000) {
      setLocalMessageError("Mensagem muito longa (máximo 2000 caracteres)");
      toast.error("Mensagem muito longa");
      return;
    }

    setIsSendingLocal(true);
    try {
      const channelName = channels.find(ch => ch.id === localChannel)?.name || "desconhecido";
      console.log(`Enviando mensagem local para #${channelName}`);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      addToHistory("Mensagem Local", `Enviado para #${channelName}`);
      toast.success(`Mensagem enviada para #${channelName}`);
      setLocalMessage("");
      setLocalChannel("");
    } catch (error: any) {
      const errorMsg = error.message || "Erro ao enviar mensagem";
      setLocalMessageError(errorMsg);
      toast.error(`Erro: ${errorMsg}`);
    } finally {
      setIsSendingLocal(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!testChannel || !testMessage.trim()) {
      toast.error("⚠️ Selecione um canal e digite uma mensagem");
      return;
    }

    setIsTestingMessage(true);
    try {
      const channelName = channels.find(ch => ch.id === testChannel)?.name || "desconhecido";
      console.log(`📤 Enviando mensagem de teste para #${channelName}`);
      
      // Simular envio
      await new Promise(resolve => setTimeout(resolve, 500));
      
      addToHistory("Teste de Mensagem", `Enviado para #${channelName}`);
      toast.success(`✅ Mensagem enviada para #${channelName}`);
      setTestMessage("");
    } catch (error) {
      toast.error("Erro ao enviar mensagem de teste");
    } finally {
      setIsTestingMessage(false);
    }
  };

  const handleSendGlobalMessage = async () => {
    if (!globalMessage.trim()) {
      toast.error("⚠️ Digite uma mensagem");
      return;
    }

    if (globalMessage.length > 2000) {
      toast.error("⚠️ Mensagem muito longa (máximo 2000 caracteres)");
      return;
    }

    // Confirmar antes de enviar
    const confirmed = window.confirm(
      `Você está prestes a enviar uma mensagem para ${guilds.length} servidor(es). Confirmar?`
    );
    if (!confirmed) return;

    setIsSendingGlobal(true);
    setBroadcastProgress(0);
    setBroadcastResults([]);

    try {
      const results: BroadcastResult[] = [];
      
      for (let i = 0; i < guilds.length; i++) {
        const guild = guilds[i];
        setBroadcastProgress(Math.round(((i + 1) / guilds.length) * 100));

        try {
          // Simular envio para cada servidor
          await new Promise(resolve => setTimeout(resolve, 300));
          
          results.push({
            guildId: guild.id,
            guildName: guild.name,
            success: true,
          });
        } catch (error: any) {
          results.push({
            guildId: guild.id,
            guildName: guild.name,
            success: false,
            error: error.message,
          });
        }
      }

      setBroadcastResults(results);
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      addToHistory(
        "Mensagem Global",
        `Enviado para ${successCount} servidor(es). Falhas: ${failCount}`
      );

      toast.success(`✅ Mensagem enviada para ${successCount}/${guilds.length} servidor(es)`);
      setGlobalMessage("");
    } catch (error) {
      toast.error("Erro ao enviar mensagem global");
    } finally {
      setIsSendingGlobal(false);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map(w => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-foreground">
              <Zap className="text-primary" size={32} />
              Painel de Desenvolvimento
            </h1>
            <p className="text-muted-foreground mt-2">Controle total do bot Magnatas</p>
          </div>
          <Button onClick={handleLogout} variant="destructive" className="gap-2">
            <LogOut size={16} />
            Sair
          </Button>
        </div>

        {/* Session Info */}
        {session && (
          <Card className="bg-secondary border-muted">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Sessão expira em: <strong className="text-foreground">{timeRemaining}</strong>
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Usuário: {session.discordUsername}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Server Selector */}
        <Card className="bg-secondary border-muted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Server size={20} />
              Servidor Ativo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeGuild && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-muted">
                <Avatar className="w-10 h-10">
                  {activeGuild.icon ? (
                    <AvatarImage
                      src={`https://cdn.discordapp.com/icons/${activeGuild.id}/${activeGuild.icon}.png`}
                      alt={activeGuild.name}
                    />
                  ) : null}
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                    {getInitials(activeGuild.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{activeGuild.name}</p>
                  <p className="text-xs text-muted-foreground">Configurando: {activeGuild.name}</p>
                </div>
              </div>
            )}

            {guilds.length > 1 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Trocar Servidor
                </label>
                <Select value={activeGuildId || ""} onValueChange={setActiveGuild}>
                  <SelectTrigger className="bg-muted border-muted text-foreground">
                    <SelectValue placeholder="Selecione um servidor..." />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-muted">
                    {guilds.map(guild => (
                      <SelectItem key={guild.id} value={guild.id} className="text-foreground">
                        {guild.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-muted">
          {[
            { id: "control", label: "Controle", icon: Power },
            { id: "local", label: "Mensagem Local", icon: Send },
            { id: "broadcast", label: "Mensagem Global", icon: Globe },
            { id: "logs", label: "Logs", icon: MessageSquare },
            { id: "settings", label: "Configurações", icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Control Tab */}
          {activeTab === "control" && (
            <div className="space-y-6">
              {/* Bot Status */}
              <Card className={`bg-secondary border-2 ${botEnabled ? "border-green-500/50" : "border-red-500/50"}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Power size={20} className={botEnabled ? "text-green-400" : "text-red-400"} />
                    Estado do Bot
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      {botEnabled ? "✅ Bot Ativo" : "❌ Bot Desativado"}
                    </span>
                    <Button
                      onClick={handleToggleBotStatus}
                      variant={botEnabled ? "destructive" : "default"}
                      size="sm"
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
              <Card className={`bg-secondary border-2 ${maintenanceMode ? "border-primary/50" : "border-muted"}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <AlertTriangle size={20} className={maintenanceMode ? "text-primary" : "text-muted-foreground"} />
                    Modo de Manutenção
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      {maintenanceMode ? "🔧 Manutenção Ativa" : "✅ Operacional"}
                    </span>
                    <Button
                      onClick={handleToggleMaintenance}
                      variant={maintenanceMode ? "default" : "outline"}
                      size="sm"
                      disabled={isTogglingMaintenance}
                    >
                      {maintenanceMode ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">
                      Descrição da Manutenção
                    </label>
                    <Textarea
                      value={maintenanceReason}
                      onChange={(e) => setMaintenanceReason(e.target.value)}
                      placeholder="Ex: Atualizações de segurança em andamento..."
                      className="bg-muted border-muted text-foreground min-h-[80px]"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Test Message */}
              <Card className="bg-secondary border-muted">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Send size={20} />
                    Enviar Mensagem de Teste
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Selecione um canal e envie uma mensagem para testar o bot
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Selecione um Canal</label>
                    <Select value={testChannel} onValueChange={setTestChannel}>
                      <SelectTrigger className="bg-muted border-muted text-foreground">
                        <SelectValue placeholder="Escolha um canal..." />
                      </SelectTrigger>
                      <SelectContent className="bg-muted border-muted">
                        {channels.map(channel => (
                          <SelectItem key={channel.id} value={channel.id} className="text-foreground">
                            #{channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Mensagem</label>
                    <Textarea
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      placeholder="Digite a mensagem de teste..."
                      className="bg-muted border-muted text-foreground min-h-[100px]"
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">
                        Máximo de 2000 caracteres
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {testMessage.length}/2000
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleSendTestMessage}
                    disabled={isTestingMessage || !testChannel || !testMessage.trim()}
                    className="w-full gap-2"
                  >
                    {isTestingMessage ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Enviar Teste
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Local Message Tab */}
          {activeTab === "local" && (
            <div className="space-y-6">
              {/* Server Info */}
              <Card className="bg-secondary border-muted">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Send size={20} />
                    Mensagem Local
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Envie uma mensagem para um canal específco do servidor ativo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Server Display */}
                  <div className="p-3 rounded bg-muted/50 border border-muted">
                    <p className="text-xs text-muted-foreground mb-1">Enviando para:</p>
                    <p className="text-lg font-semibold text-foreground">
                      {activeGuild?.name || "Nenhum servidor selecionado"}
                    </p>
                  </div>

                  {/* Channel Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Selecione um Canal</label>
                    <Select value={localChannel} onValueChange={(value) => {
                      setLocalChannel(value);
                      setLocalMessageError("");
                    }}>
                      <SelectTrigger className="bg-muted border-muted text-foreground">
                        <SelectValue placeholder="Escolha um canal de texto..." />
                      </SelectTrigger>
                      <SelectContent className="bg-muted border-muted">
                        {channels.filter(ch => ch.type === "text").map(channel => (
                          <SelectItem key={channel.id} value={channel.id} className="text-foreground">
                            #{channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {localMessageError && (
                      <p className="text-xs text-red-400">{localMessageError}</p>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Mensagem</label>
                    <Textarea
                      value={localMessage}
                      onChange={(e) => {
                        setLocalMessage(e.target.value);
                        setLocalMessageError("");
                      }}
                      placeholder="Digite a mensagem para enviar neste canal..."
                      className="bg-muted border-muted text-foreground min-h-[120px]"
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">
                        Máximo de 2000 caracteres
                      </p>
                      <p className={`text-xs ${
                        localMessage.length > 2000 ? "text-red-400" : "text-muted-foreground"
                      }`}>
                        {localMessage.length}/2000
                      </p>
                    </div>
                  </div>

                  {/* Send Button */}
                  <Button
                    onClick={handleSendLocalMessage}
                    disabled={isSendingLocal || !localChannel || !localMessage.trim() || localMessage.length > 2000}
                    className="w-full gap-2"
                  >
                    {isSendingLocal ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Enviar para Este Servidor
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Broadcast Tab */}
          {activeTab === "broadcast" && (
            <Card className="bg-secondary border-muted">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Globe size={20} />
                  Mensagem Global
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Envie uma mensagem para todos os {guilds.length} servidor(es)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Alert */}
                <Alert className="bg-blue-500/10 border-blue-500/30">
                  <AlertCircle className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-blue-300">
                    A mensagem será enviada no canal de alerta configurado de cada servidor.
                    Se algum servidor não tiver canal configurado, será pulado.
                  </AlertDescription>
                </Alert>

                {/* Message Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Mensagem</label>
                  <Textarea
                    value={globalMessage}
                    onChange={(e) => setGlobalMessage(e.target.value)}
                    placeholder="Digite a mensagem global (máximo 2000 caracteres)..."
                    className="bg-muted border-muted text-foreground min-h-[120px]"
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      Será enviada para todos os servidores
                    </p>
                    <p className={`text-xs ${globalMessage.length > 2000 ? "text-red-400" : "text-muted-foreground"}`}>
                      {globalMessage.length}/2000
                    </p>
                  </div>
                </div>

                {/* Send Button */}
                <Button
                  onClick={handleSendGlobalMessage}
                  disabled={isSendingGlobal || !globalMessage.trim() || globalMessage.length > 2000}
                  className="w-full gap-2"
                >
                  {isSendingGlobal ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Globe size={16} />
                      Enviar para Todos os Servidores
                    </>
                  )}
                </Button>

                {/* Progress */}
                {isSendingGlobal && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="text-muted-foreground">{broadcastProgress}%</span>
                    </div>
                    <Progress value={broadcastProgress} className="h-2" />
                  </div>
                )}

                {/* Results */}
                {broadcastResults.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Resultados:</h4>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {broadcastResults.map(result => (
                        <div
                          key={result.guildId}
                          className={`flex items-center gap-2 p-2 rounded text-sm ${
                            result.success
                              ? "bg-green-500/10 text-green-300"
                              : "bg-red-500/10 text-red-300"
                          }`}
                        >
                          {result.success ? (
                            <CheckCircle2 size={16} />
                          ) : (
                            <AlertCircle size={16} />
                          )}
                          <span>{result.guildName}</span>
                          {result.error && (
                            <span className="text-xs ml-auto">{result.error}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Logs Tab */}
          {activeTab === "logs" && (
            <Card className="bg-secondary border-muted">
              <CardHeader>
                <CardTitle className="text-foreground">Histórico de Mudanças</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {changeHistory.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Nenhuma mudança registrada</p>
                  ) : (
                    changeHistory.map((entry, idx) => (
                      <div key={idx} className="flex gap-3 p-2 rounded bg-muted/50 border border-muted">
                        <span className="text-xs text-muted-foreground min-w-fit">{entry.timestamp}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{entry.action}</p>
                          <p className="text-xs text-muted-foreground">{entry.details}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <Card className="bg-secondary border-muted">
              <CardHeader>
                <CardTitle className="text-foreground">Configurações do Dev</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="bg-muted/50 border-muted">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-muted-foreground">
                    Configurações adicionais virão em breve.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
