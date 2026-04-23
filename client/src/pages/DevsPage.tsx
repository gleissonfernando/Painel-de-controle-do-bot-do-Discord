import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  AlertCircle, 
  Send, 
  MessageSquare, 
  Globe, 
  CheckCircle2, 
  XCircle, 
  SkipForward,
  Info,
  History,
  LayoutList
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
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
  const [broadcastProgress, setBroadcastProgress] = useState(0);
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

    const targetCount = sendType === "local" ? 1 : guilds.length;
    const confirmMsg = sendType === "local" 
      ? `Deseja enviar esta mensagem para o canal de alerta do servidor selecionado?`
      : `⚠️ AVISO: Você está prestes a enviar uma mensagem GLOBAL para ${guilds.length} servidor(es).\n\nEsta mensagem será enviada apenas para servidores que possuem canal de alerta configurado. Servidores sem canal serão ignorados.\n\nDeseja continuar?`;

    if (!window.confirm(confirmMsg)) return;

    setIsSending(true);
    setBroadcastProgress(0);
    setBroadcastResults([]);

    try {
      const targetGuildIds = sendType === "local" ? [activeGuildId] : guilds.map((g: any) => g.id);
      
      const results = await sendGlobalMessageMutation.mutateAsync({
        message: globalMessage,
        guildIds: targetGuildIds,
      });
      
      setBroadcastResults(results);
      setBroadcastProgress(100);
      
      const successCount = results.filter(r => r.success).length;
      const skipCount = results.filter(r => !r.success && r.error === "Canal de alerta não configurado").length;
      const failCount = results.length - successCount - skipCount;

      addToHistory(
        sendType === "local" ? "Mensagem Local" : "Mensagem Global",
        `Sucesso: ${successCount} | Pulados: ${skipCount} | Falhas: ${failCount}`
      );

      if (sendType === "local" && successCount === 0) {
        toast.error("❌ O servidor selecionado não possui canal de alerta configurado!");
      } else {
        toast.success(`✅ Processamento concluído! ${successCount} enviados.`);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Globe size={32} />
            Mensagem Global
          </h1>
          <p className="text-muted-foreground">Gerencie avisos e notificações em todos os servidores</p>
        </div>
        <Badge variant="outline" className="border-primary text-primary px-3 py-1">
          Painel Restrito
        </Badge>
      </div>

      <Alert className="bg-primary/5 border-primary/20">
        <Info className="h-5 w-5 text-primary" />
        <AlertTitle className="text-primary font-bold">Como funciona?</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          Esta mensagem será enviada apenas para servidores que possuem canal de alerta configurado. Servidores sem canal serão ignorados.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border bg-card shadow-sm">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Compor Mensagem
            </CardTitle>
            <CardDescription>Digite o conteúdo e escolha o tipo de envio</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Envio</label>
                  <Select value={sendType} onValueChange={(v: any) => setSendType(v)}>
                    <SelectTrigger className="bg-input border-border h-12">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local / Teste (Servidor Ativo)</SelectItem>
                      <SelectItem value="global">Global (Todos os Servidores)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {sendType === "local" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Servidor Alvo</label>
                    <Select value={activeGuildId} onValueChange={setActiveGuildId}>
                      <SelectTrigger className="bg-input border-border h-12">
                        <SelectValue placeholder="Selecione um servidor" />
                      </SelectTrigger>
                      <SelectContent>
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
                <label className="text-sm font-medium">Conteúdo da Mensagem</label>
                <Textarea
                  value={globalMessage}
                  onChange={(e) => setGlobalMessage(e.target.value)}
                  placeholder="Digite a mensagem que será enviada aos canais de alerta..."
                  className="min-h-[150px] bg-input border-border focus:ring-primary"
                  maxLength={2000}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    {globalMessage.length}/2000 caracteres
                  </p>
                  {sendType === "local" && activeGuildId && (
                    <p className="text-xs font-medium">
                      Status: {settings?.alertChannelId ? 
                        <span className="text-green-500">Canal Configurado</span> : 
                        <span className="text-red-500">Sem Canal de Alerta</span>}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleSendMessage}
                disabled={isSending}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-lg font-bold shadow-lg shadow-primary/20"
              >
                {isSending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    {sendType === "local" ? "Enviar Teste Local" : "Disparar Mensagem Global"}
                  </div>
                )}
              </Button>
            </div>

            {isSending && (
              <div className="space-y-2 animate-in fade-in">
                <div className="flex justify-between text-xs font-medium">
                  <span>Progresso do Envio</span>
                  <span>{broadcastProgress}%</span>
                </div>
                <Progress value={broadcastProgress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Histórico Recente
              </CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 italic">Nenhum envio registrado</p>
              ) : (
                history.map((item, i) => (
                  <div key={i} className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50 border border-border/50">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-primary">{item.title}</span>
                      <span className="text-[10px] text-muted-foreground">{item.timestamp}</span>
                    </div>
                    <p className="text-xs text-foreground">{item.description}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {broadcastResults.length > 0 && (
            <Card className="border-border bg-card shadow-sm max-h-[400px] overflow-hidden flex flex-col">
              <CardHeader className="shrink-0 flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Relatório de Envio
                </CardTitle>
                <LayoutList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="overflow-y-auto space-y-2 pt-0">
                {broadcastResults.map((res, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded border border-border/30 text-xs">
                    <span className="truncate max-w-[120px] font-medium">{res.guildName}</span>
                    {res.success ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 gap-1">
                        <CheckCircle2 size={10} /> Enviado
                      </Badge>
                    ) : res.error === "Canal de alerta não configurado" ? (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1">
                        <SkipForward size={10} /> Pulado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 gap-1" title={res.error}>
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
