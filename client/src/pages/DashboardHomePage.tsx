import React, { useState } from 'react';
import { useGuildSelector } from '@/hooks/useGuildSelector';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Server, 
  Settings, 
  Users, 
  MessageSquare, 
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Plus,
  Zap
} from 'lucide-react';

export default function DashboardHomePage() {
  const navigate = useNavigate();
  const { selectedGuild, guilds, isLoading, error } = useGuildSelector();
  const [hoveredGuild, setHoveredGuild] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="bg-red-500/10 border-red-500/20">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <AlertDescription className="text-red-500">{error}</AlertDescription>
      </Alert>
    );
  }

  if (guilds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Server size={48} className="text-muted-foreground" />
        <h2 className="text-2xl font-bold">Nenhum Servidor Encontrado</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Convide o bot para um servidor onde você tem permissão de administrador para começar.
        </p>
        <Button className="gap-2 mt-4">
          <Plus size={14} />
          Convidar Bot
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold uppercase italic mb-2 flex items-center gap-3">
          <Zap size={40} className="text-primary" />
          Painel de Controle
        </h1>
        <p className="text-muted-foreground">
          Bem-vindo! Selecione um servidor para gerenciar suas configurações.
        </p>
      </div>

      {/* Servidor Selecionado Atualmente */}
      {selectedGuild && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedGuild.icon && (
                  <img
                    src={`https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png`}
                    alt={selectedGuild.name}
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div>
                  <CardTitle className="text-xl">{selectedGuild.name}</CardTitle>
                  <CardDescription>Servidor atualmente selecionado</CardDescription>
                </div>
              </div>
              <CheckCircle size={24} className="text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-[9px] font-bold uppercase text-muted-foreground">ID</p>
                <p className="font-mono text-xs break-all">{selectedGuild.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold uppercase text-muted-foreground">Membros</p>
                <p className="font-bold text-sm">{selectedGuild.config?.memberCount || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold uppercase text-muted-foreground">Canais</p>
                <p className="font-bold text-sm">{selectedGuild.config?.channelCount || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold uppercase text-muted-foreground">Status</p>
                <Badge className={selectedGuild.config?.botEnabled ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                  {selectedGuild.config?.botEnabled ? '✓ Ativo' : '✗ Inativo'}
                </Badge>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => navigate(`/settings/${selectedGuild.id}`)}
              className="w-full gap-2"
            >
              <Settings size={14} />
              Configurar Servidor
              <ArrowRight size={14} />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Grid de Servidores */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Server size={24} className="text-primary" />
          Seus Servidores ({guilds.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {guilds.map((guild) => (
            <Card
              key={guild.id}
              className={`bg-[#0A0A0A] border-border cursor-pointer transition-all hover:border-primary/50 ${
                hoveredGuild === guild.id ? 'shadow-lg shadow-primary/20' : ''
              } ${selectedGuild?.id === guild.id ? 'border-primary/50 ring-1 ring-primary/20' : ''}`}
              onMouseEnter={() => setHoveredGuild(guild.id)}
              onMouseLeave={() => setHoveredGuild(null)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1">
                    {guild.icon && (
                      <img
                        src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                        alt={guild.name}
                        className="w-10 h-10 rounded-full"
                      />
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-base truncate">{guild.name}</CardTitle>
                      <CardDescription className="text-[9px] font-mono">{guild.id}</CardDescription>
                    </div>
                  </div>
                  {selectedGuild?.id === guild.id && (
                    <Badge className="bg-primary text-primary-foreground">Selecionado</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-[9px]">
                    <Users size={12} className="text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {guild.config?.memberCount || 'N/A'} membros
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px]">
                    <MessageSquare size={12} className="text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {guild.config?.channelCount || 'N/A'} canais
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={guild.config?.botEnabled ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}
                  >
                    {guild.config?.botEnabled ? '✓ Bot Ativo' : '✗ Bot Inativo'}
                  </Badge>
                  {guild.config?.maintenanceEnabled && (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                      ⚠️ Manutenção
                    </Badge>
                  )}
                </div>

                {guild.config?.language && (
                  <div className="text-[9px] text-muted-foreground">
                    Idioma: <span className="font-bold">{guild.config.language}</span>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex gap-2">
                <Button
                  onClick={() => navigate(`/settings/${guild.id}`)}
                  className="flex-1 h-8 text-xs gap-1"
                >
                  <Settings size={12} />
                  Configurar
                </Button>
                {selectedGuild?.id !== guild.id && (
                  <Button
                    onClick={() => {
                      // Trigger seleção do servidor
                      window.dispatchEvent(new CustomEvent('selectGuild', { detail: { guildId: guild.id } }));
                    }}
                    variant="outline"
                    className="flex-1 h-8 text-xs"
                  >
                    Selecionar
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Dicas Rápidas */}
      <Card className="bg-[#0A0A0A] border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle size={18} className="text-primary" />
            Dicas Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            • Clique em "Configurar" para acessar as configurações detalhadas do servidor
          </p>
          <p className="text-sm text-muted-foreground">
            • Use o seletor no sidebar para trocar rapidamente entre servidores
          </p>
          <p className="text-sm text-muted-foreground">
            • Acesse a aba de Logs para visualizar o histórico de eventos
          </p>
          <p className="text-sm text-muted-foreground">
            • Configure canais de boas-vindas, saída e alertas nas configurações
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
