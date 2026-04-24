import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { trpc } from '@/lib/trpc';

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  botPresent: boolean;
  config?: any;
}

interface UseGuildSelectorReturn {
  selectedGuildId: string | null;
  selectedGuild: Guild | null;
  guilds: Guild[];
  isLoading: boolean;
  error: string | null;
  selectGuild: (guildId: string) => void;
  refreshGuilds: () => void;
  clearSelection: () => void;
}

export function useGuildSelector(): UseGuildSelectorReturn {
  const [selectedGuildId, setSelectedGuildId] = useLocalStorage<string | null>('selectedGuildId', null);
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Buscar lista de servidores válidos
  const { data: guildsData, isLoading, refetch } = trpc.guilds.list.useQuery();
  const guilds = guildsData || [];

  // Sincronizar seleção com localStorage
  useEffect(() => {
    if (guilds.length > 0) {
      // Se não há seleção, selecionar o primeiro servidor
      if (!selectedGuildId) {
        const firstGuild = guilds[0];
        setSelectedGuildId(firstGuild.id);
        setSelectedGuild(firstGuild);
        return;
      }

      // Se há seleção, verificar se o servidor ainda existe
      const guild = guilds.find(g => g.id === selectedGuildId);
      if (guild) {
        setSelectedGuild(guild);
        setError(null);
      } else {
        // Se o servidor não existe mais, selecionar o primeiro
        const firstGuild = guilds[0];
        setSelectedGuildId(firstGuild.id);
        setSelectedGuild(firstGuild);
        setError('Servidor anterior não encontrado. Selecionando outro.');
      }
    }
  }, [guilds, selectedGuildId, setSelectedGuildId]);

  const selectGuild = useCallback((guildId: string) => {
    const guild = guilds.find(g => g.id === guildId);
    if (guild) {
      setSelectedGuildId(guildId);
      setSelectedGuild(guild);
      setError(null);
    } else {
      setError('Servidor não encontrado');
    }
  }, [guilds, setSelectedGuildId]);

  const refreshGuilds = useCallback(() => {
    refetch();
  }, [refetch]);

  const clearSelection = useCallback(() => {
    setSelectedGuildId(null);
    setSelectedGuild(null);
  }, [setSelectedGuildId]);

  return {
    selectedGuildId: selectedGuildId || null,
    selectedGuild,
    guilds,
    isLoading,
    error,
    selectGuild,
    refreshGuilds,
    clearSelection
  };
}
