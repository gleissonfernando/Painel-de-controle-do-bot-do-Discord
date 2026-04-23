import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertCircle, Send, Zap, MessageSquare, Globe } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BroadcastResult {
  guildId: string;
  guildName: string;
  success: boolean;
  error?: string;
}

export function DevsPage() {
  const [activeGuildId, setActiveGuildId] = useState<string>("");
  const [localMessage, setLocalMessage] = useState("");
  const [localChannel, setLocalChannel] = useState("");
  const [localMessageError, setLocalMessageError] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [testChannel, setTestChannel] = useState("");
  const [globalMessage, setGlobalMessage] = useState("");
  const [isSendingLocal, setIsSendingLocal] = useState(false);
  const [isTestingMessage, setIsTestingMessage] = useState(false);
  const [isSendingGlobal, setIsSendingGlobal] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState(0);
  const [broadcastResults, setBroadcastResults] = useState<BroadcastResult[]>([]);
  const [history, setHistory] = useState<Array<{ title: string; description: string; timestamp: string }>>([]);

  const { data: guilds = [] } = useQuery({
    queryKey: ["user-guilds"],
    queryFn: async () => {
      const response = await trpc.guild.list.query();
      return response.filter((g: any) => g.hasBot);
    },
  });

  const { data: channels = [] } = useQuery({
    queryKey: ["guild-channels", activeGuildId],
    queryFn: async () => {
      if (!activeGuildId) return [];
      const response = await trpc.guild.channels.query({ guildId: activeGuildId });
      return response.filter((c: any) => c.type === 0);
    },
    enabled: !!activeGuildId,
  });

  const sendLocalMessageMutation = trpc.dev.sendLocalMessage.useMutation();
  const sendTestMessageMutation = trpc.dev.sendTestMessage.useMutation();
  const sendGlobalMessageMutation = trpc.broadcast.sendGlobal.useMutation();

  const addToHistory = (title: string, description: string) => {
    const now = new Date();
    setHistory((prev) => [
      { title, description, timestamp: now.toLocaleTimeString("pt-BR") },
      ...prev,
    ].slice(0, 10));
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
      const channelName = channels.find((ch: any) => ch.id === localChannel)?.name || "desconhecido";
      console.log(`Enviando mensagem local para #${channelName}`);
      
      await sendLocalMessageMutation.mutateAsync({
        guildId: activeGuildId || "",
        channelId: localChannel,
        message: localMessage,
      });
      
      addToHistory("Mensagem Local", `Enviado para #${channelName}`);
      toast.success(`✅ Mensagem enviada para #${channelName}`);
      setLocalMessage("");
      setLocalChannel("");
    } catch (error: any) {
      const errorMsg = error.message || "Erro ao enviar mensagem";
      setLocalMessageError(errorMsg);
      toast.error(`❌ Erro: ${errorMsg}`);
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
      const channelName = channels.find((ch: any) => ch.id === testChannel)?.name || "desconhecido";
      console.log(`📤 Enviando mensagem de teste para #${channelName}`);
      
      await sendTestMessageMutation.mutateAsync({
        guildId: activeGuildId || "",
        channelId: testChannel,
        message: testMessage,
      });
      
      addToHistory("Teste de Mensagem", `Enviado para #${channelName}`);
      toast.success(`✅ Mensagem de teste enviada para #${channelName}`);
      setTestMessage("");
    } catch (error: any) {
      toast.error(`❌ Erro ao enviar mensagem de teste: ${error.message}`);
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

    const confirmed = window.confirm(
      `⚠️ AVISO: Você está prestes a enviar uma mensagem GLOBAL para ${guilds.length} servidor(es).\n\nCada servidor precisa ter um canal de alerta configurado para receber a mensagem.\n\nDeseja continuar?`
    );
    if (!confirmed) return;

    setIsSendingGlobal(true);
    setBroadcastProgress(0);
    setBroadcastResults([]);

    try {
      await sendGlobalMessageMutation.mutateAsync({
        message: globalMessage,
        guildIds: guilds.map((g: any) => g.id),
      });
      
      const results: BroadcastResult[] = guilds.map((guild: any) => ({
        guildId: guild.id,
        guildName: guild.name,
        success: true,
      }));
      
      for (let i = 0; i < guilds.length; i++) {
        setBroadcastProgress(Math.round(((i + 1) / guilds.length) * 100));
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setBroadcastResults(results);
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      addToHistory(
        "Mensagem Global",
        `✅ Enviado para ${successCount} servidor(es). Falhas: ${failCount}`
      );

      toast.success(`✅ Mensagem enviada para ${successCount}/${guilds.length} servidor(es)`);
      setGlobalMessage("");
    } catch (error: any) {
      toast.error(`❌ Erro ao enviar mensagem global: ${error.message}`);
    } finally {
      setIsSendingGlobal(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-red-600">🔧 Painel de Desenvolvedores</h1>
        <p className="text-gray-400">Controle total sobre mensagens e configurações globais</p>
      </div>

      <Alert className="border-red-500 bg-red-950">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <AlertDescription className="text-red-200">
          ⚠️ Este painel é restrito apenas para desenvolvedores. Use com cuidado!
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-red-500 bg-black">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <MessageSquare className="h-5 w-5" />
              Mensagem Local
            </CardTitle>
            <CardDescription>Enviar mensagem em um canal específico</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Servidor</label>
              <Select value={activeGuildId} onValueChange={setActiveGuildId}>
                <SelectTrigger className="border-red-500">
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

            <div>
              <label className="text-sm font-medium">Canal</label>
              <Select value={localChannel} onValueChange={setLocalChannel}>
                <SelectTrigger className="border-red-500">
                  <SelectValue placeholder="Selecione um canal" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((channel: any) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      #{channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Mensagem</label>
              <Textarea
                value={localMessage}
                onChange={(e) => setLocalMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="border-red-500 bg-gray-900"
                maxLength={2000}
              />
              <p className="text-xs text-gray-400 mt-1">{localMessage.length}/2000</p>
            </div>

            {localMessageError && (
              <Alert className="border-red-500 bg-red-950">
                <AlertDescription className="text-red-200">{localMessageError}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleSendLocalMessage}
              disabled={isSendingLocal}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSendingLocal ? "Enviando..." : "Enviar Mensagem"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-red-500 bg-black">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Zap className="h-5 w-5" />
              Teste de Mensagem
            </CardTitle>
            <CardDescription>Testar envio antes de ir para produção</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Servidor</label>
              <Select value={activeGuildId} onValueChange={setActiveGuildId}>
                <SelectTrigger className="border-red-500">
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

            <div>
              <label className="text-sm font-medium">Canal de Teste</label>
              <Select value={testChannel} onValueChange={setTestChannel}>
                <SelectTrigger className="border-red-500">
                  <SelectValue placeholder="Selecione um canal" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((channel: any) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      #{channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Mensagem de Teste</label>
              <Textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Digite a mensagem de teste..."
                className="border-red-500 bg-gray-900"
                maxLength={2000}
              />
              <p className="text-xs text-gray-400 mt-1">{testMessage.length}/2000</p>
            </div>

            <Button
              onClick={handleSendTestMessage}
              disabled={isTestingMessage}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              {isTestingMessage ? "Testando..." : "Enviar Teste"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-red-500 bg-black">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Globe className="h-5 w-5" />
            Mensagem Global
          </CardTitle>
          <CardDescription>Enviar mensagem para todos os servidores</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-yellow-500 bg-yellow-950">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-200">
              ⚠️ Mensagens globais serão enviadas para {guilds.length} servidor(es). Certifique-se de que cada um tem um canal de alerta configurado!
            </AlertDescription>
          </Alert>

          <div>
            <label className="text-sm font-medium">Mensagem Global</label>
            <Textarea
              value={globalMessage}
              onChange={(e) => setGlobalMessage(e.target.value)}
              placeholder="Digite a mensagem que será enviada para todos os servidores..."
              className="border-red-500 bg-gray-900"
              maxLength={2000}
            />
            <p className="text-xs text-gray-400 mt-1">{globalMessage.length}/2000</p>
          </div>

          <Button
            onClick={handleSendGlobalMessage}
            disabled={isSendingGlobal}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            <Globe className="h-4 w-4 mr-2" />
            {isSendingGlobal ? `Enviando... ${broadcastProgress}%` : "Enviar para Todos"}
          </Button>

          {broadcastProgress > 0 && broadcastProgress < 100 && (
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all"
                style={{ width: `${broadcastProgress}%` }}
              />
            </div>
          )}

          {broadcastResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-red-600">Resultados:</h3>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {broadcastResults.map((result) => (
                  <div
                    key={result.guildId}
                    className={`text-sm p-2 rounded ${
                      result.success ? "bg-green-950 text-green-200" : "bg-red-950 text-red-200"
                    }`}
                  >
                    {result.success ? "✅" : "❌"} {result.guildName}
                    {result.error && ` - ${result.error}`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-red-500 bg-black">
        <CardHeader>
          <CardTitle className="text-red-600">Histórico de Ações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhuma ação registrada</p>
            ) : (
              history.map((item, idx) => (
                <div key={idx} className="text-sm border-l-2 border-red-500 pl-3 py-1">
                  <p className="font-semibold text-red-400">{item.title}</p>
                  <p className="text-gray-400">{item.description}</p>
                  <p className="text-xs text-gray-500">{item.timestamp}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DevsPage;
