import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Activity, 
  Terminal, 
  ShieldAlert, 
  UserPlus, 
  UserMinus, 
  Globe, 
  Power,
  ArrowLeft,
  Bell,
  Lock,
  Unlock,
  Info,
  RefreshCw,
  Loader2,
  Wifi,
  AlertTriangle,
  CheckCircle,
  FlaskConical
} from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import RealTimeLogsPage from "./RealTimeLogsPage";
import MonitorPage from "./MonitorPage";
import DevsPage from "./DevsPage";

export default function DevCentralPage() {
  const [activeTab, setActiveTab] = useState("logs");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();

  // Estados para Manutenção e Testes
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [targetGuildId, setTargetGuildId] = useState("");
  const [targetChannelId, setTargetChannelId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [debugResult, setDebugResult] = useState<any>(null);
  const [isDebugging, setIsDebugging] = useState(false);

  const { data: guilds = [] } = trpc.guilds.list.useQuery();
  const { data: globalConfig } = trpc.maintenance.getGlobal.useQuery();
  const { data: syncedUsers = [], isLoading: isLoadingSync } = trpc.userSync.list.useQuery();
  
  const { data: channels } = trpc.guilds.channels.useQuery(
    { guildId: targetGuildId },
    { enabled: !!targetGuildId }
  );

  const updateGlobalMutation = trpc.maintenance.updateGlobal.useMutation({
    onSuccess: () => {
      utils.maintenance.getGlobal.invalidate();
    },
    onError: (err) => toast.error(`Erro ao atualizar status: ${err.message}`)
  });

  const sendBroadcastMutation = trpc.broadcast.sendGlobal.useMutation();
  
  const sendTestMutation = trpc.welcomeGoodbye.sendTest.useMutation({
    onSuccess: () => toast.success("🧪 Teste enviado com sucesso!"),
    onError: (err) => toast.error(`Erro no teste: ${err.message}`)
  });

  const sendAlertTestMutation = trpc.monitor.testAlert.useMutation({
    onSuccess: () => toast.success("🧪 Alerta de teste enviado!"),
    onError: (err) => toast.error(`Erro no alerta: ${err.message}`)
  });

  const testConnectionMutation = trpc.debug.testBotConnection.useMutation({
    onSuccess: (data) => {
      setDebugResult(data);
      if (data.success) {
        toast.success("Conexão com o Bot estabelecida!");
      } else {
        toast.error("Falha na conexão com o Bot.");
      }
    },
    onError: (err) => {
      setDebugResult({ success: false, error: err.message });
      toast.error("Erro ao tentar conectar.");
    }
  });

  useEffect(() => {
    if (globalConfig) {
      setMaintenanceMode(globalConfig.maintenanceGlobalEnabled);
    }
  }, [globalConfig]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "04042003") {
      setIsAuthenticated(true);
      toast.success("Acesso autorizado, Bem-vindo Vilão!");
    } else {
      toast.error("Senha incorreta!");
    }
  };

  const handleToggleMaintenance = async () => {
    const newStatus = !maintenanceMode;
    const action = newStatus ? "ATIVAR MANUTENÇÃO GLOBAL" : "DESATIVAR MANUTENÇÃO (SISTEMA ON)";
    
    if (!window.confirm(`Deseja realmente ${action}?\n\nIsso afetará TODOS os servidores e enviará alertas para os canais configurados.`)) return;

    setIsProcessing(true);
    try {
      // 1. Atualiza o status global no banco
      await updateGlobalMutation.mutateAsync({
        maintenanceGlobalEnabled: newStatus,
        maintenanceMessage: newStatus 
          ? "⚠️ O bot está em manutenção global. Aguarde, já voltamos." 
          : "✅ O sistema está ONLINE e pronto para uso!",
      });

      // 2. Dispara o alerta para TODOS os servidores (usando os canais configurados na aba usuário)
      const message = newStatus 
        ? "🚨 **ALERTA MAGNATAS: MANUTENÇÃO GLOBAL INICIADA**\n\nO sistema entrou em modo de manutenção para atualizações críticas. Todos os comandos estão temporariamente suspensos em todos os servidores."
        : "✅ **SISTEMA RESTAURADO: MAGNATAS ONLINE**\n\nO sistema foi restaurado com sucesso e todos os serviços estão operacionais. Obrigado pela paciência!";

      // Envia para todas as guilds da lista
      await sendBroadcastMutation.mutateAsync({
        guildIds: guilds.map(g => g.id),
        message: message
      });

      setMaintenanceMode(newStatus);
      toast.success(`Sistema ${newStatus ? "em Manutenção" : "Online"}! Alertas enviados.`);
    } catch (error: any) {
      toast.error(`Erro ao processar manutenção: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const runTest = (type: "WELCOME" | "EXIT" | "ALERT") => {
    if (!targetGuildId || !targetChannelId) {
      toast.error("Selecione um servidor e um canal na seção de Testes Rápidos");
      return;
    }

    if (type === "ALERT") {
      sendAlertTestMutation.mutate({
        guildId: targetGuildId,
        channelId: targetChannelId
      });
    } else {
      sendTestMutation.mutate({
        guildId: targetGuildId,
        channelId: targetChannelId,
        type,
        imageUrl: "https://i.imgur.com/8nNfQfR.png"
      });
    }
  };

  const handleTestConnection = async () => {
    setIsDebugging(true);
    setDebugResult(null);
    try {
      await testConnectionMutation.mutateAsync();
    } finally {
      setIsDebugging(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-in fade-in duration-500">
        <Card className="w-full max-w-md border-primary/20 bg-[#0A0A0A] shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Lock className="text-primary" size={32} />
            </div>
            <CardTitle className="text-2xl font-black uppercase italic tracking-tighter">Acesso Restrito</CardTitle>
            <CardDescription className="font-bold">Digite a senha mestre para acessar a Central Dev</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Senha de Desenvolvedor</Label>
                <Input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#050505] border-border h-12 text-center text-lg font-bold tracking-[0.5em]"
                  placeholder="••••••••"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black uppercase italic">
                Desbloquear Central
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="text-muted-foreground hover:text-primary">
              <ArrowLeft size={14} className="mr-2" /> Voltar ao Início
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation("/")}
            className="w-fit h-8 gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 -ml-2"
          >
            <ArrowLeft size={14} />
            Voltar ao Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2 uppercase italic font-black">
            <Terminal size={32} />
            Central Dev
          </h1>
          <p className="text-muted-foreground">Ferramentas técnicas e testes de sistema</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
          <Unlock size={14} className="text-green-500" />
          <span className="text-xs font-black text-green-500 uppercase tracking-wider">Vilão Autenticado</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar de Controle e Testes */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card de Manutenção Global */}
          <Card className="bg-[#0A0A0A] border-primary/20 shadow-lg overflow-hidden">
            <div className={`h-1 w-full ${maintenanceMode ? "bg-red-500" : "bg-green-500"}`} />
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Power size={14} className={maintenanceMode ? "text-red-500" : "text-green-500"} />
                Status Global
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#050505] border border-border">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold uppercase">Manutenção</p>
                  <p className="text-[9px] text-muted-foreground">{maintenanceMode ? "Ativado" : "Desativado"}</p>
                </div>
                <Switch 
                  checked={maintenanceMode} 
                  onCheckedChange={handleToggleMaintenance}
                  disabled={isProcessing}
                  className="data-[state=checked]:bg-red-500"
                />
              </div>
              
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 flex gap-2">
                <Info size={14} className="text-primary shrink-0 mt-0.5" />
                <p className="text-[9px] text-muted-foreground leading-relaxed">
                  Ao ativar, o bot enviará automaticamente alertas para os <strong>canais de alerta</strong> configurados em cada servidor.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card de Diagnóstico de Conexão */}
          <Card className="bg-[#0A0A0A] border-border shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Wifi size={14} className="text-primary" />
                Conexão Bot API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleTestConnection} 
                disabled={isDebugging}
                className="w-full h-10 bg-[#111111] hover:bg-[#151515] border border-border text-[10px] font-black uppercase italic"
              >
                {isDebugging ? <Loader2 className="animate-spin mr-2" size={14} /> : <Activity className="mr-2" size={14} />}
                Testar Conexão IP
              </Button>

              {debugResult && (
                <div className={`p-3 rounded-xl border text-[10px] font-bold uppercase space-y-2 ${debugResult.success ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500"}`}>
                  <div className="flex items-center gap-2">
                    {debugResult.success ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                    <span>{debugResult.success ? "Conectado!" : "Erro de Conexão"}</span>
                  </div>
                  <div className="space-y-1 font-mono text-[9px] lowercase normal-case">
                    <p className="opacity-70">URL: {debugResult.botUrl}</p>
                    {debugResult.duration && <p className="opacity-70">Latência: {debugResult.duration}ms</p>}
                    {debugResult.error && <p className="text-red-400 mt-1 font-bold">Erro: {debugResult.error}</p>}
                    {debugResult.code && <p className="text-red-400">Código: {debugResult.code}</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card de Testes Rápidos */}
          <Card className="bg-[#0A0A0A] border-border shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <FlaskConical size={14} className="text-primary" />
                Testes Rápidos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Servidor Alvo</Label>
                <Select value={targetGuildId} onValueChange={setTargetGuildId}>
                  <SelectTrigger className="bg-[#050505] border-border h-10 text-xs font-bold">
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-border">
                    {guilds.map((g: any) => (
                      <SelectItem key={g.id} value={g.id} className="font-bold">{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Canal Alvo</Label>
                <Select value={targetChannelId} onValueChange={setTargetChannelId}>
                  <SelectTrigger className="bg-[#050505] border-border h-10 text-xs font-bold">
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-border">
                    {channels?.filter(c => c.type === 0).map((c: any) => (
                      <SelectItem key={c.id} value={c.id} className="font-bold"># {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2 grid grid-cols-1 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="justify-start gap-2 text-[10px] font-black uppercase italic h-9 border-green-500/30 hover:bg-green-500/10"
                  onClick={() => runTest("WELCOME")}
                >
                  <UserPlus size={14} className="text-green-500" /> Testar Entrada
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="justify-start gap-2 text-[10px] font-black uppercase italic h-9 border-red-500/30 hover:bg-red-500/10"
                  onClick={() => runTest("EXIT")}
                >
                  <UserMinus size={14} className="text-red-500" /> Testar Saída
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="justify-start gap-2 text-[10px] font-black uppercase italic h-9 border-yellow-500/30 hover:bg-yellow-500/10"
                  onClick={() => runTest("ALERT")}
                >
                  <Bell size={14} className="text-yellow-500" /> Testar Alerta
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Área Principal */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-[#0A0A0A] border border-border p-1 h-auto flex-wrap justify-start gap-1">
              <TabsTrigger value="logs" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2 px-4 text-xs font-bold uppercase">
                <Activity size={14} /> Logs
              </TabsTrigger>
              <TabsTrigger value="monitor" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2 px-4 text-xs font-bold uppercase">
                <ShieldAlert size={14} /> NOC
              </TabsTrigger>
              <TabsTrigger value="sync" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2 px-4 text-xs font-bold uppercase">
                <RefreshCw size={14} /> Steam Sync
              </TabsTrigger>
              <TabsTrigger value="broadcast" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2 px-4 text-xs font-bold uppercase">
                <Globe size={14} /> Global
              </TabsTrigger>
            </TabsList>

            <TabsContent value="logs" className="mt-0 border-none p-0 outline-none">
              <RealTimeLogsPage />
            </TabsContent>

            <TabsContent value="monitor" className="mt-0 border-none p-0 outline-none">
              <MonitorPage />
            </TabsContent>

            <TabsContent value="broadcast" className="mt-0 border-none p-0 outline-none">
              <DevsPage />
            </TabsContent>

            <TabsContent value="sync" className="mt-0 border-none p-0 outline-none">
              <Card className="bg-[#0A0A0A] border-border shadow-xl min-h-[500px]">
                <CardHeader className="border-b border-border bg-[#050505]/50">
                  <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
                    <RefreshCw size={16} className="text-primary" />
                    Sincronização Steam & Discord
                  </CardTitle>
                  <CardDescription className="font-bold">Visualize os usuários verificados e seus vínculos Steam Hex</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-[#050505]">
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Usuário</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Discord ID</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Steam Hex</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Sincronizado em</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoadingSync ? (
                          <tr>
                            <td colSpan={5} className="p-10 text-center">
                              <Loader2 className="animate-spin text-primary mx-auto mb-2" size={24} />
                              <p className="text-xs text-muted-foreground font-bold">Carregando vínculos...</p>
                            </td>
                          </tr>
                        ) : syncedUsers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-10 text-center">
                              <Info className="text-muted-foreground mx-auto mb-2" size={24} />
                              <p className="text-xs text-muted-foreground font-bold">Nenhum usuário sincronizado encontrado.</p>
                            </td>
                          </tr>
                        ) : (
                          syncedUsers.map((u: any) => (
                            <tr key={u.id} className="border-b border-border/50 hover:bg-white/5 transition-colors group">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-8 h-8 border border-primary/20">
                                    <AvatarImage src={u.avatar} />
                                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                                      {u.name?.[0]?.toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-bold text-white">{u.name}</span>
                                </div>
                              </td>
                              <td className="p-4 font-mono text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                                {u.discordId}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <div className="px-2 py-1 rounded bg-primary/10 border border-primary/20 text-[10px] font-black text-primary font-mono">
                                    {u.steamHex}
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 w-fit">
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                  <span className="text-[9px] font-black text-green-500 uppercase">Sincronizado</span>
                                </div>
                              </td>
                              <td className="p-4 text-right text-[10px] text-muted-foreground font-bold">
                                {new Date(u.updatedAt).toLocaleString("pt-BR")}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
