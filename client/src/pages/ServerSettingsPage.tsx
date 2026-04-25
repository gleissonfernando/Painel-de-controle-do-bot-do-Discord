import React, { useState, useEffect } from 'react';
import { useGuildSelector } from '@/hooks/useGuildSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Settings, Save, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export default function ServerSettingsPage() {
  const { selectedGuildId, selectedGuild } = useGuildSelector();
  const [formData, setFormData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // Buscar configurações do servidor
  const { data: configData, isLoading: isLoadingConfig } = trpc.guilds.getConfig.useQuery(
    { guildId: selectedGuildId! },
    { enabled: !!selectedGuildId }
  );

  // Buscar canais do servidor
  const { data: channelsData } = trpc.guilds.getChannels.useQuery(
    { guildId: selectedGuildId! },
    { enabled: !!selectedGuildId }
  );

  // Buscar cargos do servidor
  const { data: rolesData } = trpc.guilds.getRoles.useQuery(
    { guildId: selectedGuildId! },
    { enabled: !!selectedGuildId }
  );

  // Mutation para salvar configurações
  const updateConfigMutation = trpc.guilds.updateConfig.useMutation({
    onSuccess: () => {
      toast.success('✅ Configurações salvas com sucesso!');
      setIsSaving(false);
    },
    onError: (err) => {
      toast.error(`❌ Erro ao salvar: ${err.message}`);
      setIsSaving(false);
    }
  });

  // Sincronizar dados do servidor
  const syncMutation = trpc.guilds.syncData.useMutation({
    onSuccess: () => {
      toast.success('✅ Dados sincronizados!');
    },
    onError: (err) => {
      toast.error(`❌ Erro ao sincronizar: ${err.message}`);
    }
  });

  // Carregar configurações quando mudar de servidor
  useEffect(() => {
    if (configData) {
      setFormData(configData);
    }
  }, [configData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!selectedGuildId) return;
    
    setIsSaving(true);
    try {
      await updateConfigMutation.mutateAsync({
        guildId: selectedGuildId,
        ...formData
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  const handleSync = async () => {
    if (!selectedGuildId) return;
    await syncMutation.mutateAsync({ guildId: selectedGuildId });
  };

  if (!selectedGuildId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Alert className="max-w-md bg-yellow-500/10 border-yellow-500/20">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-500">
            Selecione um servidor para configurar.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoadingConfig || !formData) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  const channels = channelsData || [];
  const roles = rolesData || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 uppercase italic">
            <Settings size={32} className="text-primary" />
            Configurações do Servidor
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{selectedGuild?.name}</p>
        </div>
        <Button
          onClick={handleSync}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw size={14} />
          Sincronizar Dados
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-[#0A0A0A] border border-border">
          <TabsTrigger value="general" className="gap-2">
            <Settings size={14} /> Geral
          </TabsTrigger>
          <TabsTrigger value="channels" className="gap-2">
            <AlertCircle size={14} /> Canais
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-2">
            <AlertCircle size={14} /> Mensagens
          </TabsTrigger>
        </TabsList>

        {/* Aba Geral */}
        <TabsContent value="general" className="space-y-6">
          <Card className="bg-[#0A0A0A] border-border">
            <CardHeader>
              <CardTitle className="text-lg">Configurações Gerais</CardTitle>
              <CardDescription>Defina o idioma, prefixo e fuso horário do bot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) => handleInputChange('language', value)}
                  >
                    <SelectTrigger className="bg-[#050505] border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0A] border-border">
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Prefixo do Bot</Label>
                  <Input
                    value={formData.prefix}
                    onChange={(e) => handleInputChange('prefix', e.target.value)}
                    placeholder="!"
                    maxLength={3}
                    className="bg-[#050505] border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fuso Horário</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) => handleInputChange('timezone', value)}
                  >
                    <SelectTrigger className="bg-[#050505] border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0A] border-border">
                      <SelectItem value="America/Sao_Paulo">São Paulo (UTC-3)</SelectItem>
                      <SelectItem value="America/New_York">Nova York (UTC-5)</SelectItem>
                      <SelectItem value="Europe/London">Londres (UTC+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Canais */}
        <TabsContent value="channels" className="space-y-6">
          <Card className="bg-[#0A0A0A] border-border">
            <CardHeader>
              <CardTitle className="text-lg">Canais Configurados</CardTitle>
              <CardDescription>Selecione os canais para logs, boas-vindas e alertas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Canal de Logs</Label>
                  <Select
                    value={formData.logChannelId || ''}
                    onValueChange={(value) => handleInputChange('logChannelId', value)}
                  >
                    <SelectTrigger className="bg-[#050505] border-border">
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0A] border-border">
                      {channels.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          # {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Canal de Boas-vindas</Label>
                  <Select
                    value={formData.welcomeChannelId || ''}
                    onValueChange={(value) => handleInputChange('welcomeChannelId', value)}
                  >
                    <SelectTrigger className="bg-[#050505] border-border">
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0A] border-border">
                      {channels.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          # {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Canal de Saída</Label>
                  <Select
                    value={formData.leaveChannelId || ''}
                    onValueChange={(value) => handleInputChange('leaveChannelId', value)}
                  >
                    <SelectTrigger className="bg-[#050505] border-border">
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0A] border-border">
                      {channels.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          # {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Canal de Alertas</Label>
                  <Select
                    value={formData.alertChannelId || ''}
                    onValueChange={(value) => handleInputChange('alertChannelId', value)}
                  >
                    <SelectTrigger className="bg-[#050505] border-border">
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0A0A] border-border">
                      {channels.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          # {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Mensagens */}
        <TabsContent value="messages" className="space-y-6">
          <Card className="bg-[#0A0A0A] border-border">
            <CardHeader>
              <CardTitle className="text-lg">Mensagens Personalizadas</CardTitle>
              <CardDescription>Customize as mensagens de boas-vindas e saída</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mensagem de Boas-vindas</Label>
                <textarea
                  value={formData.welcomeMessage}
                  onChange={(e) => handleInputChange('welcomeMessage', e.target.value)}
                  className="w-full h-24 p-3 bg-[#050505] border border-border rounded-lg text-sm font-mono"
                  placeholder="{user}, bem-vindo(a) ao servidor!"
                />
                <p className="text-[9px] text-muted-foreground">
                  Variáveis disponíveis: {'{user}'}, {'{username}'}, {'{server}'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Mensagem de Saída</Label>
                <textarea
                  value={formData.leaveMessage}
                  onChange={(e) => handleInputChange('leaveMessage', e.target.value)}
                  className="w-full h-24 p-3 bg-[#050505] border border-border rounded-lg text-sm font-mono"
                  placeholder="{user} saiu do servidor."
                />
                <p className="text-[9px] text-muted-foreground">
                  Variáveis disponíveis: {'{user}'}, {'{username}'}, {'{server}'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botão Salvar */}
      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancelar</Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="gap-2 bg-primary hover:bg-primary/90"
        >
          <Save size={14} />
          {isSaving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}
