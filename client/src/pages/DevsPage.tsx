import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Send, 
  Globe, 
  CheckCircle2, 
  XCircle, 
  SkipForward,
  Info,
  History,
  LayoutList,
  Activity
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface BroadcastResult {
  guildId: string;
  guildName: string;
  success: boolean;
  error?: string;
}

export default function DevsPage() {
  const [activeGuildId, setActiveGuildId] = useState<string>("");
  const [globalMessage, setGlobalMessage] = useState("");
  const [sendType, setSendType] = useState<"local" | "global">("local");
  const [isSending, setIsSending] = useState(false);
  const [broadcastResults, setBroadcastResults] = useState<BroadcastResult[]>([]);
  const [history, setHistory] = useState<Array<{ title: string; description: string; timestamp: string }>>([]);

  const { data: guilds = [] } = useQuery({
    queryKey: ["user-guilds-dev"],
    queryFn: async () => {
      const response = await trpc.guilds.list.query();
      return response;
    },
  });

  const { data: settings } = trpc.settings.get.useQuery(
    { guildId: activeGuildId },
    { enabled: !!activeGuildId }
  );

  const sendGlobalMessageMutation = trpc.broadcast.sendGlobal.useMutation();

  const addToHistory = (title: string, description: string) => {
    const now = new Date();
    setHistory((prev) => [
      { title, description, timestamp: now.toLocaleTimeString("pt-BR") },
      ...prev,
    ].slice(0, 10));
  };

  const handleSendMessage = async () => {
    if (!globalMessage.trim()) {
      toast.error("⚠️ Digite uma mensagem");
      return;
    }

    if (sendType === "local" && !activeGuildId) {
      toast.error("⚠️ Selecione um servidor para o envio local");
      return;
    }

    const confirmMsg = sendType === "local" 
      ? `Deseja enviar esta mensagem REAL para o canal de alerta do servidor selecionado?`
      : `⚠️ AVISO: Você está prestes a enviar uma mensagem GLOBAL REAL para ${guilds.length} servidor(es).\n\nDeseja continuar?`;

    if (!window.confirm(confirmMsg)) return;

    setIsSending(true);
    setBroadcastResults([]);

    try {
      const targetGuildIds = sendType === "local" ? [activeGuildId] : guilds.map((g: any) => g.id);
      
      const results = await sendGlobalMessageMutation.mutateAsync({
        message: globalMessage,
        guildIds: targetGuildIds,
      });
      
      setBroadcastResults(results);
      
      const successCount = results.filter(r => r.success).length;
      const skipCount = results.filter(r => !r.success && r.error === "Canal de alerta não configurado").length;
      const failCount = results.length - successCount - skipCount;

      addToHistory(
        sendType === "local" ? "Mensagem Local" : "Mensagem Global",
        `Sucesso: ${successCount} | Pulados: ${skipCount} | Falhas: ${failCount}`
      );

      if (sendType === "local" && successCount === 0) {
        toast.error("❌ Falha ao enviar: Verifique se o canal de alerta está configurado.");
      } else {
        toast.success(`✅ Mensagem enviada com sucesso para ${successCount} servidor(es).`);
      }
      
      if (sendType === "global") setGlobalMessage("");
    } catch (error: any) {
      toast.error(`❌ Erro: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Alert className="bg-primary/5 border-primary/20">
        <Info className="h-5 w-5 text-primary" />
        <AlertTitle className="text-primary font-bold">Transmissão de Dados Reais</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          As mensagens enviadas através deste painel são processadas diretamente pelo bot e enviadas aos canais de alerta configurados.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border bg-[#0A0A0A] shadow-xl shadow-primary/5">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-xl flex items-center gap-2 text-primary">
              <Globe size={22} />
              Central de Transmissão
            </CardTitle>
            <CardDescription>Envie avisos oficiais e dados atualizados para os servidores</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo de Envio</label>
                  <Select value={sendType} onValueChange={(v: any) => setSendType(v)}>
                    <SelectTrigger className="bg-[#050505] border-border h-12 rounded-xl">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0A] border-border">
                      <SelectItem value="local">Local (Servidor Selecionado)</SelectItem>
                      <SelectItem value="global">Global (Todos os Servidores)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {sendType === "local" && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Servidor Alvo</label>
                    <Select value={activeGuildId} onValueChange={setActiveGuildId}>
                      <SelectTrigger className="bg-[#050505] border-border h-12 rounded-xl">
                        <SelectValue placeholder="Selecione um servidor" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0A0A0A] border-border">
                        {guilds.map((guild: any) => (
                          <SelectItem key={guild.id} value={guild.id}>
                            {guild.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conteúdo da Mensagem</label>
                <Textarea
                  value={globalMessage}
                  onChange={(e) => setGlobalMessage(e.target.value)}
                  placeholder="Digite a mensagem oficial que será enviada..."
                  className="min-h-[180px] bg-[#050505] border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                  maxLength={2000}
                />
                <div className="flex justify-between items-center px-1">
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {globalMessage.length}/2000
                  </p>
                  {sendType === "local" && activeGuildId && (
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${settings?.alertChannelId ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                      <p className="text-[10px] font-bold uppercase tracking-tighter">
                        {settings?.alertChannelId ? "Canal Pronto" : "Canal não configurado"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={isSending}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
            >
              {isSending ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-3 border-current border-t-transparent rounded-full animate-spin" />
                  Transmitindo...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  {sendType === "local" ? "Enviar Mensagem Real" : "Disparar Globalmente"}
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border bg-[#0A0A0A] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-border/30">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Últimos Envios
              </CardTitle>
              <History className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Sem histórico</p>
                </div>
              ) : (
                history.map((item, i) => (
                  <div key={i} className="flex flex-col gap-1 p-3 rounded-xl bg-[#050505] border border-border/50 hover:border-primary/30 transition-colors">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black text-primary uppercase tracking-tighter">{item.title}</span>
                      <span className="text-[9px] font-mono text-muted-foreground">{item.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-foreground/80 leading-tight">{item.description}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {broadcastResults.length > 0 && (
            <Card className="border-border bg-[#0A0A0A] shadow-sm max-h-[400px] overflow-hidden flex flex-col">
              <CardHeader className="shrink-0 flex flex-row items-center justify-between space-y-0 pb-3 border-b border-border/30 bg-[#050505]">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Relatório Real
                </CardTitle>
                <LayoutList className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent className="overflow-y-auto space-y-2 p-3">
                {broadcastResults.map((res, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-[#050505] border border-border/30 text-[10px] font-bold">
                    <span className="truncate max-w-[100px] uppercase tracking-tighter">{res.guildName}</span>
                    {res.success ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 gap-1 h-5 text-[9px] font-black uppercase">
                        <CheckCircle2 size={10} /> OK
                      </Badge>
                    ) : res.error === "Canal de alerta não configurado" ? (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1 h-5 text-[9px] font-black uppercase">
                        <SkipForward size={10} /> Pulo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 gap-1 h-5 text-[9px] font-black uppercase" title={res.error}>
                        <XCircle size={10} /> Erro
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
