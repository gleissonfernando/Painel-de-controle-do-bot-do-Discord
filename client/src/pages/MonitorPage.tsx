import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Settings, 
  Bell, 
  FlaskConical, 
  Save,
  History,
  Server,
  Database,
  Globe,
  Bot,
  UserCheck,
  TrendingUp,
  Zap,
  Cpu,
  HardDrive,
  Terminal,
  ChevronRight,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function MonitorPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const { user } = useAuth();
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [isTestValidated, setIsTestValidated] = useState(false);
  const [activeService, setActiveService] = useState<string>("Bot");

  const { data: channels } = trpc.guilds.channels.useQuery(
    { guildId: guildId || "" },
    { enabled: !!guildId }
  );

  const { data: config, refetch: refetchConfig } = trpc.monitor.getConfig.useQuery(
    { guildId: guildId || "" },
    { enabled: !!guildId }
  );

  const { data: status } = trpc.monitor.getStatus.useQuery(undefined, {
    refetchInterval: 10000
  });

  const { data: metrics } = trpc.monitor.getMetrics.useQuery(
    { service: activeService, hours: 6 },
    { refetchInterval: 30000 }
  );

  const { data: commands } = trpc.monitor.listCommands.useQuery();

  const { data: logs } = trpc.monitor.getLogs.useQuery(
    { guildId: guildId || "", limit: 20 },
    { enabled: !!guildId, refetchInterval: 30000 }
  );

  useEffect(() => {
    if (config?.alertChannelId) {
      setSelectedChannel(config.alertChannelId);
      setIsTestValidated(true);
    }
  }, [config]);

  const chartData = useMemo(() => {
    if (!metrics) return [];
    return metrics.map(m => ({
      time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      latency: m.latency,
      cpu: m.cpu || 0,
      ram: m.ram || 0
    }));
  }, [metrics]);

  const updateConfigMutation = trpc.monitor.updateConfig.useMutation({
    onSuccess: () => {
      toast.success("✅ Configurações de monitoramento salvas!");
      refetchConfig();
    },
    onError: (error) => {
      toast.error(`❌ Erro ao salvar: ${error.message}`);
    }
  });

  const sendTestMutation = trpc.monitor.sendTest.useMutation({
    onSuccess: () => {
      toast.success("🧪 Alerta de teste enviado com sucesso!");
      setIsTestValidated(true);
    },
    onError: (error) => {
      toast.error(`❌ Erro no teste: ${error.message}`);
      setIsTestValidated(false);
    }
  });

  const handleSave = () => {
    if (!selectedChannel) {
      toast.error("Selecione um canal de alerta");
      return;
    }
    if (!isTestValidated) {
      toast.error("Você deve realizar um teste de envio antes de salvar");
      return;
    }

    updateConfigMutation.mutate({
      guildId: guildId || "",
      alertChannelId: selectedChannel,
      enabled: true
    });
  };

  const handleTest = () => {
    if (!selectedChannel) {
      toast.error("Selecione um canal para o teste");
      return;
    }
    sendTestMutation.mutate({
      guildId: guildId || "",
      channelId: selectedChannel
    });
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "Online": return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 font-black uppercase italic">Online</Badge>;
      case "Offline": return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 font-black uppercase italic">Offline</Badge>;
      case "Instável": return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 font-black uppercase italic">Instável</Badge>;
      default: return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getServiceIcon = (name: string) => {
    switch (name) {
      case "Dashboard": return <Globe size={20} />;
      case "Bot": return <Bot size={20} />;
      case "Database": return <Database size={20} />;
      case "Discord API": return <Server size={20} />;
      case "Verificador": return <UserCheck size={20} />;
      default: return <Activity size={20} />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-white flex items-center gap-3 tracking-tighter italic uppercase">
            <ShieldAlert size={40} className="text-primary drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]" />
            NOC Magnatas
          </h1>
          <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Monitoramento de Hardware e Comandos</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status Global</span>
            <span className={`text-sm font-black uppercase italic ${status?.Bot?.status === "Online" ? "text-green-500" : "text-red-500"}`}>
              {status?.Bot?.status === "Online" ? "Sistemas Operacionais" : "Sistemas Offline"}
            </span>
          </div>
          <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${status?.Bot?.status === "Online" ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
            <Activity className={`${status?.Bot?.status === "Online" ? "text-green-500 animate-pulse" : "text-red-500"}`} size={24} />
          </div>
        </div>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {status && Object.values(status).map((service: any) => (
          <Card 
            key={service.name} 
            onClick={() => setActiveService(service.name)}
            className={`bg-[#0A0A0A] border-border/50 shadow-xl transition-all cursor-pointer hover:scale-[1.02] active:scale-95 ${activeService === service.name ? 'border-primary ring-1 ring-primary/30' : 'hover:border-primary/30'}`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${activeService === service.name ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                  {getServiceIcon(service.name)}
                </div>
                {getStatusBadge(service.status)}
              </div>
              <h3 className="text-lg font-black text-white uppercase italic">{service.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Zap size={12} className="text-yellow-500" />
                <span className="text-xs font-bold text-white">{service.latency}ms</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Hardware Metrics (CPU/RAM) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#0A0A0A] border-border shadow-2xl">
          <CardHeader className="bg-[#050505] border-b border-border/50 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Cpu className="text-primary" size={24} />
              <div>
                <CardTitle className="text-lg font-black text-white uppercase italic">Uso de CPU</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase">Carga do Processador (%)</CardDescription>
              </div>
            </div>
            <span className="text-2xl font-black text-primary italic">{status?.Dashboard?.cpu || 0}%</span>
          </CardHeader>
          <CardContent className="pt-6 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF0000" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF0000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050505', border: '1px solid #333' }}
                  itemStyle={{ color: '#FF0000' }}
                />
                <Area type="monotone" dataKey="cpu" stroke="#FF0000" fill="url(#colorCpu)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#0A0A0A] border-border shadow-2xl">
          <CardHeader className="bg-[#050505] border-b border-border/50 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <HardDrive className="text-blue-500" size={24} />
              <div>
                <CardTitle className="text-lg font-black text-white uppercase italic">Uso de RAM</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase">Memória Consumida (MB)</CardDescription>
              </div>
            </div>
            <span className="text-2xl font-black text-blue-500 italic">{status?.Dashboard?.ram || 0}MB</span>
          </CardHeader>
          <CardContent className="pt-6 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050505', border: '1px solid #333' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area type="monotone" dataKey="ram" stroke="#3b82f6" fill="url(#colorRam)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Commands & Logs Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Commands List */}
        <Card className="xl:col-span-2 bg-[#0A0A0A] border-border shadow-2xl">
          <CardHeader className="bg-[#050505] border-b border-border/50">
            <CardTitle className="text-xl flex items-center gap-2 text-white uppercase italic font-black">
              <Terminal className="h-5 w-5 text-primary" />
              Comandos Registrados
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Lista de comandos ativos no bot</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                {commands?.map((cmd) => (
                  <div key={cmd.name} className="group p-4 bg-[#111] border border-white/5 rounded-xl hover:border-primary/50 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <code className="text-primary font-black text-sm uppercase italic">/{cmd.name}</code>
                      <Badge variant="outline" className="text-[8px] uppercase font-black opacity-50">{cmd.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium line-clamp-2">{cmd.description}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Configuration & Logs */}
        <div className="space-y-6">
          <Card className="bg-[#0A0A0A] border-border shadow-2xl">
            <CardHeader className="bg-[#050505] border-b border-border/50">
              <CardTitle className="text-xl flex items-center gap-2 text-white uppercase italic font-black">
                <Settings className="h-5 w-5 text-primary" />
                Configurar Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Bell size={14} className="text-primary" /> Canal de Alerta
                </label>
                <Select value={selectedChannel || ""} onValueChange={(v) => { setSelectedChannel(v); setIsTestValidated(false); }}>
                  <SelectTrigger className="bg-[#111] border-border/50 h-12 font-bold">
                    <SelectValue placeholder="Escolha o canal..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-border">
                    {channels?.filter(c => c.type === 0).map((channel) => (
                      <SelectItem key={channel.id} value={channel.id} className="font-bold">
                        # {channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleTest}
                  disabled={sendTestMutation.isPending}
                  className="h-12 border-primary text-primary hover:bg-primary/10 font-black uppercase italic gap-2"
                >
                  <FlaskConical size={18} /> Testar Canal
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={updateConfigMutation.isPending || !isTestValidated}
                  className="h-12 bg-primary hover:bg-primary/90 text-white font-black uppercase italic gap-2 shadow-lg shadow-primary/20"
                >
                  <Save size={18} /> Salvar Configuração
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0A0A0A] border-border shadow-2xl">
            <CardHeader className="bg-[#050505] border-b border-border/50">
              <CardTitle className="text-sm flex items-center gap-2 text-white uppercase italic font-black">
                <History className="h-4 w-4 text-primary" />
                Logs Recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[200px]">
                <div className="p-4 space-y-3">
                  {logs && logs.slice(0, 10).map((log: any) => (
                    <div key={log._id} className="flex items-center gap-3 p-2 bg-[#111] rounded-lg border border-white/5 group relative">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${log.status === "Online" ? "bg-green-500" : "bg-red-500"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-white uppercase truncate">{log.service}</p>
                          <p className="text-[9px] text-muted-foreground uppercase">{new Date(log.createdAt).toLocaleTimeString()}</p>
                        </div>
                        <p className="text-[9px] text-muted-foreground truncate">{log.message}</p>
                      </div>
                      {log.errorDetail && (
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help text-red-500/50 hover:text-red-500 transition-colors">
                                <Info size={12} />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-[#050505] border-red-500/50 text-white text-[10px] max-w-[200px] break-words">
                              <p className="font-black text-red-500 uppercase mb-1">Causa do Erro:</p>
                              {log.errorDetail}
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
