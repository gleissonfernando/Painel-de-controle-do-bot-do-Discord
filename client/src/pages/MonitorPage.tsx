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
  Zap
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
  LineChart,
  Line
} from "recharts";

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
    refetchInterval: 30000
  });

  const { data: metrics } = trpc.monitor.getMetrics.useQuery(
    { service: activeService, hours: 6 },
    { refetchInterval: 60000 }
  );

  const { data: logs } = trpc.monitor.getLogs.useQuery(
    { guildId: guildId || "", limit: 20 },
    { enabled: !!guildId, refetchInterval: 60000 }
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
      status: m.status === "Online" ? 1 : 0
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
          <p className="text-muted-foreground font-medium">Centro de Operações e Performance em Tempo Real</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status Global</span>
            <span className="text-sm font-black text-green-500 uppercase italic">Sistemas Operacionais</span>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-green-500/20 flex items-center justify-center bg-green-500/5">
            <Activity className="text-green-500 animate-pulse" size={24} />
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

      {/* Main Analytics Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Real-Time Graph */}
        <Card className="xl:col-span-2 bg-[#0A0A0A] border-border shadow-2xl overflow-hidden">
          <CardHeader className="bg-[#050505] border-b border-border/50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2 text-white uppercase italic font-black">
                <TrendingUp className="h-5 w-5 text-primary" />
                Performance: {activeService}
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Latência em milissegundos (ms)</CardDescription>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20">Tempo Real</Badge>
          </CardHeader>
          <CardContent className="pt-10 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF0000" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF0000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#666" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#666" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `${value}ms`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050505', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#FF0000', fontWeight: 'bold' }}
                  labelStyle={{ color: '#fff', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="latency" 
                  stroke="#FF0000" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorLatency)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Configuration & Alerts */}
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
              {!isTestValidated && selectedChannel && (
                <p className="text-[10px] text-yellow-500 font-black uppercase text-center animate-pulse">
                  ⚠️ Realize o teste antes de salvar
                </p>
              )}
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
                  {logs && logs.slice(0, 5).map((log: any) => (
                    <div key={log._id} className="flex items-center gap-3 p-2 bg-[#111] rounded-lg border border-white/5">
                      <div className={`w-1.5 h-1.5 rounded-full ${log.status === "Online" ? "bg-green-500" : "bg-red-500"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-white uppercase truncate">{log.service}</p>
                        <p className="text-[9px] text-muted-foreground uppercase">{new Date(log.createdAt).toLocaleTimeString()}</p>
                      </div>
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
