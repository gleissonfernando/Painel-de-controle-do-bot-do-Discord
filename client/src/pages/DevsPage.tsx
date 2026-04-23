import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Activity,
  BarChart3,
  Database,
  LogOut,
  Settings,
  Zap,
  AlertTriangle,
  Clock,
  Users,
  Server,
  Shield,
  Send,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquare,
  Bell,
} from "lucide-react";
import { toast } from "sonner";

interface DevSession {
  username: string;
  discordUserId: string;
  discordUsername: string;
  timestamp: number;
  expiresIn: number;
}

export default function DevsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [session, setSession] = useState<DevSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"control" | "messages" | "logs" | "settings">("control");

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

  // Estados para Teste Geral
  const [isRunningGeneralTest, setIsRunningGeneralTest] = useState(false);
  const [testResults, setTestResults] = useState<Array<{ name: string; status: "success" | "error" | "pending" }>>([]);

  // Estados para Seletor de Call de Logs
  const [logsChannel, setLogsChannel] = useState("");
  const [channels, setChannels] = useState<Array<{ id: string; name: string; type: "text" | "voice" }>>([]);

  // Histórico de mudanças
  const [changeHistory, setChangeHistory] = useState<Array<{ timestamp: string; action: string; details: string }>>([]);

  // Verificar se o usuario esta autenticado via Discord OAuth2
  useEffect(() => {
    if (!user) {
      setLocation("/");
      return;
    }
  }, [user, setLocation]);

  useEffect(() => {
    // Verificar sessão dev
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

      // Simular carregamento de canais
      setChannels([
        { id: "1", name: "general", type: "text" },
        { id: "2", name: "announcements", type: "text" },
        { id: "3", name: "voice-general", type: "voice" },
        { id: "4", name: "logs-audit", type: "text" },
        { id: "5", name: "dev-logs", type: "text" },
      ]);

      return () => clearInterval(interval);
    } catch (error) {
      console.error("Erro ao verificar sessão dev:", error);
      setLocation("/devs/login");
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("dev_session");
    toast.success("Sessão encerrada");
    setLocation("/");
  };

  const addToHistory = (action: string, details: string) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString("pt-BR");
    setChangeHistory(prev => [{ timestamp, action, details }, ...prev.slice(0, 19)]);
  };

  const handleToggleBotStatus = async () => {
    try {
      setBotEnabled(!botEnabled);
      const action = !botEnabled ? "Bot Ativado" : "Bot Desativado";
      addToHistory(action, `Status alterado para ${!botEnabled ? "Online" : "Offline"}`);
      toast.success(`Bot ${!botEnabled ? "ativado" : "desativado"} com sucesso!`);
    } catch (error) {
      toast.error("Erro ao alterar status do bot");
    }
  };

  const handleToggleMaintenance = async () => {
    if (!maintenanceMode && !maintenanceReason.trim()) {
      toast.error("Descreva o motivo da manutenção");
      return;
    }

    setIsTogglingMaintenance(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const action = !maintenanceMode ? "Manutenção Ativada" : "Manutenção Desativada";
      const details = !maintenanceMode 
        ? `Motivo: ${maintenanceReason}` 
        : "Sistema retornou ao normal";
      
      addToHistory(action, details);
      setMaintenanceMode(!maintenanceMode);
      
      if (!maintenanceMode) {
        toast.success(`✅ Modo de manutenção ativado!\nMensagem: ${maintenanceReason}`);
      } else {
        toast.success("✅ Modo de manutenção desativado!");
      }
      
      setMaintenanceReason("");
    } catch (error) {
      toast.error("Erro ao alterar modo de manutenção");
    } finally {
      setIsTogglingMaintenance(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageChannel || !messageContent.trim()) {
      toast.error("Selecione um canal e digite uma mensagem");
      return;
    }

    setIsSendingMessage(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      addToHistory("Mensagem Enviada", `Canal: #${messageChannel} | Conteúdo: ${messageContent.substring(0, 50)}...`);
      toast.success(`✅ Mensagem enviada para #${messageChannel}!`);
      setMessageContent("");
    } catch (error) {
      toast.error("Erro ao enviar mensagem");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!testChannel || !testMessage.trim()) {
      toast.error("Selecione um canal e digite uma mensagem");
      return;
    }

    setIsTestingMessage(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      addToHistory("Teste de Mensagem", `Canal: #${testChannel}`);
      toast.success(`✅ Mensagem de teste enviada para #${testChannel}!`);
      setTestMessage("");
    } catch (error) {
      toast.error("Erro ao enviar mensagem de teste");
    } finally {
      setIsTestingMessage(false);
    }
  };

  const handleRunGeneralTest = async () => {
    setIsRunningGeneralTest(true);
    setTestResults([
      { name: "Conexão com Discord", status: "pending" },
      { name: "Banco de Dados", status: "pending" },
      { name: "API de Comandos", status: "pending" },
      { name: "Sistema de Voz", status: "pending" },
      { name: "Verificação de Permissões", status: "pending" },
    ]);

    try {
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setTestResults(prev => {
          const newResults = [...prev];
          newResults[i].status = Math.random() > 0.1 ? "success" : "error";
          return newResults;
        });
      }

      const allPassed = testResults.every(r => r.status === "success");
      addToHistory("Teste Geral Executado", allPassed ? "Todos os testes passaram ✅" : "Alguns testes falharam ⚠️");
      
      if (allPassed) {
        toast.success("✅ Todos os testes passaram!");
      } else {
        toast.warning("⚠️ Alguns testes falharam. Verifique os detalhes.");
      }
    } catch (error) {
      toast.error("Erro ao executar testes");
    } finally {
      setIsRunningGeneralTest(false);
    }
  };

  const handleSaveLogsChannel = async () => {
    if (!logsChannel) {
      toast.error("Selecione um canal para os logs");
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      addToHistory("Canal de Logs Configurado", `Canal: #${logsChannel}`);
      toast.success(`✅ Canal de logs configurado para #${logsChannel}!`);
    } catch (error) {
      toast.error("Erro ao configurar canal de logs");
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <Shield className="text-primary" size={32} />
              Painel de Controle - Devs
            </h1>
            <p className="text-muted-foreground mt-1">Bem-vindo, {session.discordUsername} 🔐</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-card border border-border rounded-lg">
              <p className="text-xs text-muted-foreground">Sessão expira em:</p>
              <p className="text-lg font-bold text-primary">{timeRemaining}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="gap-2"
            >
              <LogOut size={16} />
              Sair
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Status do Bot</p>
                  <p className={`text-3xl font-bold mt-1 ${botEnabled ? "text-green-500" : "text-red-500"}`}>
                    {botEnabled ? "🟢 Online" : "🔴 Offline"}
                  </p>
                </div>
                <Server className={botEnabled ? "text-green-500/50" : "text-red-500/50"} size={32} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Modo Manutenção</p>
                  <p className={`text-3xl font-bold mt-1 ${maintenanceMode ? "text-yellow-500" : "text-gray-500"}`}>
                    {maintenanceMode ? "🟡 Ativo" : "⚫ Inativo"}
                  </p>
                </div>
                <AlertTriangle className={maintenanceMode ? "text-yellow-500/50" : "text-gray-500/50"} size={32} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                  <p className="text-3xl font-bold text-foreground mt-1">99.8%</p>
                </div>
                <Activity className="text-green-500/50" size={32} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mudanças (24h)</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{changeHistory.length}</p>
                </div>
                <AlertCircle className="text-yellow-500/50" size={32} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border overflow-x-auto">
          {[
            { id: "control", label: "Controle do Bot", icon: Zap },
            { id: "messages", label: "Mensagens", icon: MessageSquare },
            { id: "logs", label: "Logs de Eventos", icon: Database },
            { id: "settings", label: "Configurações", icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {/* Control Tab */}
          {activeTab === "control" && (
            <div className="space-y-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Controle do Bot</CardTitle>
                  <CardDescription>Gerencie o estado operacional do bot</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-semibold">Status do Bot</p>
                      <p className="text-sm text-muted-foreground">Ativar ou desativar o bot</p>
                    </div>
                    <Button
                      onClick={handleToggleBotStatus}
                      className={botEnabled ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                    >
                      {botEnabled ? "Desativar" : "Ativar"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-semibold">Modo de Manutenção</p>
                      <p className="text-sm text-muted-foreground">Avisa usuários sobre atualizações</p>
                    </div>
                    <Button
                      onClick={handleToggleMaintenance}
                      disabled={isTogglingMaintenance || (!maintenanceMode && !maintenanceReason.trim())}
                      className={maintenanceMode ? "bg-yellow-600 hover:bg-yellow-700" : "bg-gray-600 hover:bg-gray-700"}
                    >
                      {isTogglingMaintenance ? (
                        <>
                          <Loader2 size={16} className="animate-spin mr-2" />
                          Processando...
                        </>
                      ) : maintenanceMode ? (
                        "Desativar"
                      ) : (
                        "Ativar"
                      )}
                    </Button>
                  </div>

                  {!maintenanceMode && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Descreva o que foi mudado:</label>
                      <Textarea
                        placeholder="Ex: Atualizando sistema de verificação, corrigindo bugs de voz, etc..."
                        value={maintenanceReason}
                        onChange={(e) => setMaintenanceReason(e.target.value)}
                        className="min-h-20"
                      />
                      <p className="text-xs text-muted-foreground">
                        Esta descrição será enviada como alerta para todos os servidores
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Teste Geral */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Teste Geral do Bot</CardTitle>
                  <CardDescription>Execute testes em todos os sistemas do bot</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={handleRunGeneralTest}
                    disabled={isRunningGeneralTest}
                    className="w-full gap-2"
                  >
                    {isRunningGeneralTest ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Executando Testes...
                      </>
                    ) : (
                      <>
                        <Play size={16} />
                        Executar Teste Geral
                      </>
                    )}
                  </Button>

                  {testResults.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {testResults.map((result, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          {result.status === "pending" && (
                            <Loader2 size={18} className="text-blue-500 animate-spin" />
                          )}
                          {result.status === "success" && (
                            <CheckCircle2 size={18} className="text-green-500" />
                          )}
                          {result.status === "error" && (
                            <AlertCircle size={18} className="text-red-500" />
                          )}
                          <span className="text-sm font-medium">{result.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === "messages" && (
            <div className="space-y-4">
              {/* Envio de Mensagem Oficial */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Enviar Mensagem Oficial</CardTitle>
                  <CardDescription>Envie uma mensagem para um canal específico</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Selecione o Canal</label>
                    <Select value={messageChannel} onValueChange={setMessageChannel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um canal..." />
                      </SelectTrigger>
                      <SelectContent>
                        {channels.filter(ch => ch.type === "text").map(ch => (
                          <SelectItem key={ch.id} value={ch.name}>
                            #{ch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Conteúdo da Mensagem</label>
                    <Textarea
                      placeholder="Digite a mensagem que será enviada..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      className="min-h-24"
                    />
                  </div>

                  <Button
                    onClick={handleSendMessage}
                    disabled={isSendingMessage || !messageChannel || !messageContent.trim()}
                    className="w-full gap-2"
                  >
                    {isSendingMessage ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Enviar Mensagem
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Teste de Mensagem */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Teste de Mensagem</CardTitle>
                  <CardDescription>Envie uma mensagem de teste para validar o bot</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Selecione o Canal</label>
                    <Select value={testChannel} onValueChange={setTestChannel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um canal..." />
                      </SelectTrigger>
                      <SelectContent>
                        {channels.filter(ch => ch.type === "text").map(ch => (
                          <SelectItem key={ch.id} value={ch.name}>
                            #{ch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Mensagem de Teste</label>
                    <Textarea
                      placeholder="Digite a mensagem de teste..."
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      className="min-h-20"
                    />
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

          {/* Logs Tab */}
          {activeTab === "logs" && (
            <div className="space-y-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Configurar Canal de Logs</CardTitle>
                  <CardDescription>Selecione o canal onde os logs de eventos serão enviados</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Canal para Logs de Eventos</label>
                    <Select value={logsChannel} onValueChange={setLogsChannel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um canal para logs..." />
                      </SelectTrigger>
                      <SelectContent>
                        {channels.map(ch => (
                          <SelectItem key={ch.id} value={ch.name}>
                            {ch.type === "voice" ? "🔊" : "#"} {ch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Canal Selecionado:</p>
                    <p className="text-lg font-bold">{logsChannel ? `#${logsChannel}` : "Nenhum canal selecionado"}</p>
                  </div>

                  <Button
                    onClick={handleSaveLogsChannel}
                    disabled={!logsChannel}
                    className="w-full"
                  >
                    Salvar Configuração de Logs
                  </Button>

                  {/* Histórico de Mudanças */}
                  <div className="mt-6 pt-6 border-t border-border">
                    <h3 className="font-semibold mb-4">Histórico de Mudanças (Últimas 20)</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {changeHistory.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhuma mudança registrada ainda</p>
                      ) : (
                        changeHistory.map((change, idx) => (
                          <div key={idx} className="p-3 bg-muted/30 rounded-lg border border-border/50">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-sm">{change.action}</p>
                              <p className="text-xs text-muted-foreground">{change.timestamp}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">{change.details}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Configurações Avançadas</CardTitle>
                <CardDescription>Ajustes técnicos do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-semibold">Debug Mode</p>
                    <p className="text-sm text-muted-foreground">Ativa logs detalhados do sistema</p>
                  </div>
                  <Button variant="outline" size="sm">Ativar</Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-semibold">Limpar Cache</p>
                    <p className="text-sm text-muted-foreground">Remove cache do sistema</p>
                  </div>
                  <Button variant="destructive" size="sm">Limpar</Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-semibold">Sincronizar Dados</p>
                    <p className="text-sm text-muted-foreground">Força sincronização com Discord</p>
                  </div>
                  <Button variant="outline" size="sm">Sincronizar</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
