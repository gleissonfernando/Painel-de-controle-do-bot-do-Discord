import React, { useState, useEffect } from "react";
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
  UserCheck
} from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function MonitorPage() {
  const { guildId } = useParams<{ guildId: string }>();
  const { user } = useAuth();
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [isTestValidated, setIsTestValidated] = useState(false);

  const { data: channels } = trpc.guilds.channels.useQuery(
    { guildId: guildId || "" },
    { enabled: !!guildId }
  );

  const { data: config, refetch: refetchConfig } = trpc.monitor.getConfig.useQuery(
    { guildId: guildId || "" },
    { enabled: !!guildId }
  );

  const { data: status } = trpc.monitor.getStatus.useQuery(undefined, {
    refetchInterval: 30000 // Atualizar a cada 30s
  });

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
      case "Dashboard": return <Globe className="text-primary" size={20} />;
      case "Bot": return <Bot className="text-primary" size={20} />;
      case "Database": return <Database className="text-primary" size={20} />;
      case "Discord API": return <Server className="text-primary" size={20} />;
      case "Verificador": return <UserCheck className="text-primary" size={20} />;
      default: return <Activity className="text-primary" size={20} />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-white flex items-center gap-3 tracking-tighter italic uppercase">
            <ShieldAlert size={40} className="text-primary drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]" />
            Monitoramento Magnatas
          </h1>
          <p className="text-muted-foreground font-medium">Status em tempo real e alertas de queda</p>
        </div>
        <Badge variant="outline" className="border-primary/50 text-primary bg-primary/5 px-4 py-1.5 text-sm font-bold uppercase tracking-widest">
          Sistema de Alerta Ativo
        </Badge>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {status && Object.values(status).map((service: any) => (
          <Card key={service.name} className="bg-[#0A0A0A] border-border/50 shadow-xl hover:border-primary/30 transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {getServiceIcon(service.name)}
                </div>
                {getStatusBadge(service.status)}
              </div>
              <h3 className="text-lg font-black text-white uppercase italic">{service.name}</h3>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                Último Check: {new Date(service.lastCheck).toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Configuration */}
        <div className="xl:col-span-1 space-y-6">
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
        </div>

        {/* History */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="bg-[#0A0A0A] border-border shadow-2xl h-full">
            <CardHeader className="bg-[#050505] border-b border-border/50">
              <CardTitle className="text-xl flex items-center gap-2 text-white uppercase italic font-black">
                <History className="h-5 w-5 text-primary" />
                Histórico de Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="p-6 space-y-4">
                  {logs && logs.length > 0 ? logs.map((log: any) => (
                    <div key={log._id} className="flex items-start gap-4 p-4 bg-[#111] rounded-xl border border-white/5 hover:border-primary/20 transition-all">
                      <div className={`p-2 rounded-lg ${log.status === "Online" ? "bg-green-500/10" : "bg-red-500/10"}`}>
                        {log.status === "Online" ? <CheckCircle2 className="text-green-500" size={20} /> : <AlertCircle className="text-red-500" size={20} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-black text-white uppercase italic text-sm">{log.service} - {log.status}</h4>
                          <span className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1">
                            <Clock size={10} /> {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium mt-1">{log.message}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                      <Activity size={48} className="opacity-20" />
                      <p className="font-black uppercase italic text-sm">Nenhum alerta registrado</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
