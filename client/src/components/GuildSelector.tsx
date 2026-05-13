import React from 'react';
import { useGuildSelector } from '@/hooks/useGuildSelector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw, Server } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GuildSelectorProps {
  onGuildChange?: (guildId: string) => void;
}

export function GuildSelector({ onGuildChange }: GuildSelectorProps) {
  const { selectedGuildId, selectedGuild, guilds, isLoading, error, selectGuild, refreshGuilds } = useGuildSelector();

  const handleGuildChange = (guildId: string) => {
    selectGuild(guildId);
    onGuildChange?.(guildId);
  };

  if (isLoading) {
    return (
      <Card className="w-full bg-[#0A0A0A] border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-black uppercase tracking-widest">Seletor de Servidor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (guilds.length === 0) {
    return (
      <Card className="w-full bg-[#0A0A0A] border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-black uppercase tracking-widest">Seletor de Servidor</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-yellow-500/10 border-yellow-500/20">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-xs text-yellow-500">
              Nenhum servidor encontrado. Convide o bot para um servidor onde você tem permissão de administrador.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-[#0A0A0A] border-border shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <Server size={14} className="text-primary" />
            Seletor de Servidor
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshGuilds}
            className="h-6 w-6 p-0"
          >
            <RefreshCw size={12} />
          </Button>
        </div>
        <CardDescription className="text-[9px]">
          {guilds.length} servidor{guilds.length !== 1 ? 's' : ''} disponível{guilds.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <Alert className="bg-red-500/10 border-red-500/20 py-2">
            <AlertCircle className="h-3 w-3 text-red-500" />
            <AlertDescription className="text-[9px] text-red-500">{error}</AlertDescription>
          </Alert>
        )}

        <Select value={selectedGuildId || ''} onValueChange={handleGuildChange}>
          <SelectTrigger className="bg-[#050505] border-border h-10 text-xs font-bold">
            <SelectValue placeholder="Selecionar servidor..." />
          </SelectTrigger>
          <SelectContent className="bg-[#0A0A0A] border-border">
            {guilds.map((guild) => (
              <SelectItem key={guild.id} value={guild.id} className="font-bold">
                {guild.icon && (
                  <img
                    src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                    alt={guild.name}
                    className="w-4 h-4 rounded-full inline-block mr-2"
                  />
                )}
                {guild.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedGuild && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-2">
            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Servidor Selecionado
            </div>
            <div className="space-y-1 text-[10px]">
              <p className="font-bold text-foreground">{selectedGuild.name}</p>
              <p className="text-muted-foreground">ID: {selectedGuild.id}</p>
              {selectedGuild.config && (
                <>
                  <p className="text-muted-foreground">
                    Membros: {selectedGuild.config.memberCount || 'N/A'}
                  </p>
                  <p className="text-muted-foreground">
                    Canais: {selectedGuild.config.channelCount || 'N/A'}
                  </p>
                  <p className="text-muted-foreground">
                    Idioma: {selectedGuild.config.language || 'pt-BR'}
                  </p>
                  <div className="flex gap-1 pt-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                        selectedGuild.config.botEnabled
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-red-500/20 text-red-500'
                      }`}
                    >
                      {selectedGuild.config.botEnabled ? '✓ Bot Ativo' : '✗ Bot Inativo'}
                    </span>
                    {selectedGuild.config.maintenanceEnabled && (
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-yellow-500/20 text-yellow-500">
                        ⚠️ Manutenção
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
