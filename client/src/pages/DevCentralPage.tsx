import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Activity, 
  Terminal, 
  ShieldAlert, 
  Send, 
  UserPlus, 
  UserMinus, 
  AlertTriangle,
  Cpu,
  Database,
  Globe,
  Power,
  MessageSquare,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import RealTimeLogsPage from "./RealTimeLogsPage";
import MonitorPage from "./MonitorPage";
import WelcomeMagnatasPage from "./WelcomeMagnatasPage";
import ExitMagnatasPage from "./ExitMagnatasPage";
import DevsPage from "./DevsPage";

export default function DevCentralPage() {
  const [activeTab, setActiveTab] = useState("logs");
  const utils = trpc.useUtils();

  // Estados para Manutenção
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [targetGuildId, setTargetGuildId] = useState("");
  const [targetChannelId, setTargetChannelId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: guilds = [] } = trpc.guilds.list.useQuery();
  const { data: globalConfig } = trpc.maintenance.getGlobal.useQuery();
  
  const { data: guildSettings } = trpc.settings.get.useQuery(
    { guildId: targetGuildId },
    { enabled: !!targetGuildId }
  );

  const updateGlobalMutation = trpc.maintenance.updateGlobal.useMutation({
    onSuccess: () => {
      toast.success("🌍 Status global atualizado!");
      utils.maintenance.getGlobal.invalidate();
    },
    onError: (err) => toast.error(`Erro: ${err.message}`)
  });

  const sendBroadcastMutation = trpc.broadcast.sendGlobal.useMutation();

  useEffect(() => {
    if (globalConfig) {
      setMaintenanceMode(globalConfig.maintenanceGlobalEnabled);
    }
  }, [globalConfig]);

  useEffect(() => {
    if (guildSettings?.alertChannelId) {
      setTargetChannelId(guildSettings.alertChannelId);
    }
  }, [guildSettings]);

  const handleToggleMaintenance = async () => {
    if (!targetGuildId && !maintenanceMode) {
      toast.error("Selecione um servidor para enviar o aviso");
      return;
    }

    const newStatus = !maintenanceMode;
    const action = newStatus ? "ATIVAR MANUTENÇÃO" : "DESATIVAR MANUTENÇÃO (SISTEMA ON)";
    
    if (!window.confirm(`Deseja realmente ${action}?`)) return;

    setIsProcessing(true);
    try {
      // 1. Atualizar status global
      await updateGlobalMutation.mutateAsync({
        maintenanceGlobalEnabled: newStatus,
        maintenanceMessage: newStatus 
          ? "⚠️ O bot está em manutenção. Aguarde, já voltamos." 
          : "✅ O sistema está ONLINE e pronto para uso!",
      });

      // 2. Enviar mensagem oficial no canal selecionado
      const message = newStatus 
        ? "🚨 **ALERTA MAGNATAS: MANUTENÇÃO INICIADA**\n\nO sistema entrou em modo de manutenção para atualizações. Todos os comandos estão temporariamente suspensos."
        : "✅ **SISTEMA RESTAURADO: MAGNATAS ONLINE**\n\nO sistema foi restaurado com sucesso e todos os serviços estão operacionais. Obrigado pela paciência!";

      await sendBroadcastMutation.mutateAsync({
        guildIds: [targetGuildId],
        message: message
      });

      setMaintenanceMode(newStatus);
      toast.success(`Sistema ${newStatus ? "em Manutenção" : "Online"}!`);
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Terminal size={32} />
            Central do Desenvolvedor
          </h1>
          <p className="text-muted-foreground">Gerenciamento técnico, logs em tempo real e ferramentas de teste</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
          <Activity size={14} className="text-primary animate-pulse" />
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Acesso Master</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar de Controle Rápido */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-[#0A0A0A] border-primary/20 shadow-lg shadow-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Power size={16} className={maintenanceMode ? "text-red-500" : "text-green-500"} />
                Status Global
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#050505] border border-border">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold uppercase">Manutenção</p>
                  <p className="text-[10px] text-muted-foreground">{maintenanceMode ? "Ativado" : "Desativado"}</p>
                </div>
                <Switch 
                  checked={maintenanceMode} 
                  onCheckedChange={handleToggleMaintenance}
                  disabled={isProcessing}
                  className="data-[state=checked]:bg-red-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Servidor para Aviso</Label>
                <Select value={targetGuildId} onValueChange={setTargetGuildId}>
                  <SelectTrigger className="bg-[#050505] border-border h-10 text-xs">
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0A0A] border-border">
                    {guilds.map((g: any) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Canal de Texto</Label>
                <div className="p-2 rounded-lg bg-[#050505] border border-border text-[10px] font-mono truncate">
                  {targetChannelId || "Nenhum canal configurado"}
                </div>
              </div>

              <Button 
                onClick={handleToggleMaintenance}
                disabled={isProcessing || !targetGuildId}
                variant={maintenanceMode ? "outline" : "default"}
                className={`w-full h-10 text-xs font-black uppercase tracking-widest ${
                  maintenanceMode 
                  ? "border-green-500 text-green-500 hover:bg-green-500/10" 
                  : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                {isProcessing ? "Processando..." : maintenanceMode ? "Colocar Online" : "Colocar em Manutenção"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Card className="bg-[#0A0A0A] border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <Cpu size={18} />
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">Sistema</p>
                  <p className="text-xs font-bold">Operacional</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#0A0A0A] border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                  <Database size={18} />
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">Database</p>
                  <p className="text-xs font-bold">Conectado</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Área Principal de Conteúdo */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-[#0A0A0A] border border-border p-1 h-auto flex-wrap justify-start gap-1">
              <TabsTrigger value="logs" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2 px-4 text-xs font-bold uppercase">
                <Activity size={14} />
                Logs
              </TabsTrigger>
              <TabsTrigger value="monitor" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2 px-4 text-xs font-bold uppercase">
                <ShieldAlert size={14} />
                NOC
              </TabsTrigger>
              <TabsTrigger value="broadcast" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2 px-4 text-xs font-bold uppercase">
                <Globe size={14} />
                Global
              </TabsTrigger>
              <TabsTrigger value="test-welcome" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2 px-4 text-xs font-bold uppercase">
                <UserPlus size={14} />
                Entrada
              </TabsTrigger>
              <TabsTrigger value="test-exit" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 py-2 px-4 text-xs font-bold uppercase">
                <UserMinus size={14} />
                Saída
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

            <TabsContent value="test-welcome" className="mt-0 border-none p-0 outline-none">
              <WelcomeMagnatasPage />
            </TabsContent>

            <TabsContent value="test-exit" className="mt-0 border-none p-0 outline-none">
              <ExitMagnatasPage />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
