import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Save, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface WelcomeGoodbyeConfig {
  welcomeEnabled: boolean;
  welcomeChannelId: string | null;
  welcomeMessage: string | null;
  goodbyeEnabled: boolean;
  goodbyeChannelId: string | null;
  goodbyeMessage: string | null;
}

const PLACEHOLDER_VARIABLES = [
  { name: "{user}", description: "Menção do usuário" },
  { name: "{username}", description: "Nome do usuário" },
  { name: "{server}", description: "Nome do servidor" },
  { name: "{memberCount}", description: "Total de membros" },
  {
    name: "{joinPosition}",
    description: "Posição de entrada (ex: 42º membro)",
  },
];

export default function WelcomeGoodbyePage() {
  const { guildId } = useParams<{ guildId: string }>();
  const { t } = useLanguage();
  const [config, setConfig] = useState<WelcomeGoodbyeConfig>({
    welcomeEnabled: true,
    welcomeChannelId: null,
    welcomeMessage:
      "Bem-vindo {user}! 👋 Você é o {joinPosition} membro de {server}",
    goodbyeEnabled: true,
    goodbyeChannelId: null,
    goodbyeMessage: "{user} saiu do servidor. Até logo! 👋",
  });

  const { data: channels } = trpc.guilds.channels.useQuery(
    { guildId: guildId || "" },
    {
      enabled: !!guildId,
    }
  );

  const { data: savedConfig } = trpc.welcomeGoodbye.get.useQuery(
    { guildId: guildId || "" },
    {
      enabled: !!guildId,
    }
  );

  const saveMutation = trpc.welcomeGoodbye.save.useMutation({
    onSuccess: () => {
      toast.success(t("common.saved") || "Configurações salvas!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar");
    },
  });

  useEffect(() => {
    if (savedConfig) {
      setConfig({
        welcomeEnabled: savedConfig.welcomeEnabled ?? false,
        welcomeChannelId: savedConfig.welcomeChannelId ?? null,
        welcomeMessage: savedConfig.welcomeMessage ?? null,
        goodbyeEnabled: savedConfig.goodbyeEnabled ?? false,
        goodbyeChannelId: savedConfig.goodbyeChannelId ?? null,
        goodbyeMessage: savedConfig.goodbyeMessage ?? null,
      });
    }
  }, [savedConfig]);

  const handleSave = () => {
    if (!guildId) return;
    saveMutation.mutate({
      guildId,
      config: {
        welcomeEnabled: config.welcomeEnabled,
        welcomeChannelId: config.welcomeChannelId || "",
        welcomeMessage: config.welcomeMessage || "",
        goodbyeEnabled: config.goodbyeEnabled,
        goodbyeChannelId: config.goodbyeChannelId || "",
        goodbyeMessage: config.goodbyeMessage || "",
      },
    });
  };

  const replaceVariables = (message: string | null): string => {
    if (!message) return "";
    return message
      .replace("{user}", "@Usuário")
      .replace("{username}", "Usuário")
      .replace("{server}", "Meu Servidor")
      .replace("{memberCount}", "150")
      .replace("{joinPosition}", "42º");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Mensagens de Entrada e Saída
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure mensagens personalizadas para quando usuários entram ou saem
          do servidor
        </p>
      </div>

      {/* Variables Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <p className="font-semibold mb-2">Variáveis disponíveis:</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {PLACEHOLDER_VARIABLES.map(v => (
              <div key={v.name}>
                <code className="bg-muted px-2 py-1 rounded">{v.name}</code>
                <p className="text-xs text-muted-foreground">{v.description}</p>
              </div>
            ))}
          </div>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="welcome" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="welcome">Mensagem de Entrada</TabsTrigger>
          <TabsTrigger value="goodbye">Mensagem de Saída</TabsTrigger>
        </TabsList>

        {/* Welcome Tab */}
        <TabsContent value="welcome" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurar Mensagem de Boas-vindas</CardTitle>
              <CardDescription>
                Mensagem enviada quando um novo usuário entra no servidor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Enable Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="welcomeEnabled"
                  checked={config.welcomeEnabled}
                  onChange={e =>
                    setConfig({ ...config, welcomeEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-border bg-background cursor-pointer"
                />
                <Label htmlFor="welcomeEnabled" className="cursor-pointer">
                  Ativar mensagens de boas-vindas
                </Label>
              </div>

              {config.welcomeEnabled && (
                <>
                  {/* Channel Select */}
                  <div className="space-y-2">
                    <Label htmlFor="welcomeChannel">Canal de Destino</Label>
                    <Select
                      value={config.welcomeChannelId || ""}
                      onValueChange={value =>
                        setConfig({ ...config, welcomeChannelId: value })
                      }
                    >
                      <SelectTrigger id="welcomeChannel">
                        <SelectValue placeholder="Selecione um canal" />
                      </SelectTrigger>
                      <SelectContent>
                        {channels?.map(channel => (
                          <SelectItem key={channel.id} value={channel.id}>
                            #{channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Message Textarea */}
                  <div className="space-y-2">
                    <Label htmlFor="welcomeMessage">Mensagem</Label>
                    <Textarea
                      id="welcomeMessage"
                      value={config.welcomeMessage || ""}
                      onChange={e =>
                        setConfig({ ...config, welcomeMessage: e.target.value })
                      }
                      placeholder="Digite a mensagem de boas-vindas..."
                      className="min-h-[120px]"
                    />
                  </div>

                  {/* Preview */}
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="bg-card border border-border rounded-lg p-4">
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {replaceVariables(config.welcomeMessage)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goodbye Tab */}
        <TabsContent value="goodbye" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurar Mensagem de Despedida</CardTitle>
              <CardDescription>
                Mensagem enviada quando um usuário sai do servidor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Enable Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="goodbyeEnabled"
                  checked={config.goodbyeEnabled}
                  onChange={e =>
                    setConfig({ ...config, goodbyeEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-border bg-background cursor-pointer"
                />
                <Label htmlFor="goodbyeEnabled" className="cursor-pointer">
                  Ativar mensagens de despedida
                </Label>
              </div>

              {config.goodbyeEnabled && (
                <>
                  {/* Channel Select */}
                  <div className="space-y-2">
                    <Label htmlFor="goodbyeChannel">Canal de Destino</Label>
                    <Select
                      value={config.goodbyeChannelId || ""}
                      onValueChange={value =>
                        setConfig({ ...config, goodbyeChannelId: value })
                      }
                    >
                      <SelectTrigger id="goodbyeChannel">
                        <SelectValue placeholder="Selecione um canal" />
                      </SelectTrigger>
                      <SelectContent>
                        {channels?.map(channel => (
                          <SelectItem key={channel.id} value={channel.id}>
                            #{channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Message Textarea */}
                  <div className="space-y-2">
                    <Label htmlFor="goodbyeMessage">Mensagem</Label>
                    <Textarea
                      id="goodbyeMessage"
                      value={config.goodbyeMessage || ""}
                      onChange={e =>
                        setConfig({ ...config, goodbyeMessage: e.target.value })
                      }
                      placeholder="Digite a mensagem de despedida..."
                      className="min-h-[120px]"
                    />
                  </div>

                  {/* Preview */}
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="bg-card border border-border rounded-lg p-4">
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {replaceVariables(config.goodbyeMessage)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="gap-2"
        >
          <Save size={16} />
          {saveMutation.isPending ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
}
