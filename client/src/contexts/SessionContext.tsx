import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export interface Guild {
  id: string;
  name: string;
  icon?: string | null;
  owner: boolean;
  permissions: string;
  memberCount: number;
  channels: number;
  roles: number;
  botPresent: boolean;
}

export interface SessionContextType {
  // Dados do usuário autenticado
  user: any;
  
  // Lista de todos os servidores do usuário
  guilds: Guild[];
  isLoadingGuilds: boolean;
  
  // Servidor ativo atualmente
  activeGuildId: string | null;
  activeGuild: Guild | null;
  
  // Funções para gerenciar a sessão
  setActiveGuild: (guildId: string) => void;
  refreshGuilds: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: guilds = [], isLoading: isLoadingGuilds, refetch: refetchGuilds } = trpc.guilds.list.useQuery(
    undefined,
    {
      enabled: !!user,
    }
  );

  // Recuperar o servidor ativo do localStorage
  const [activeGuildId, setActiveGuildId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("active_guild_id");
    }
    return null;
  });

  // Se não houver servidor ativo e houver servidores disponíveis, ativar o primeiro
  useEffect(() => {
    if (!activeGuildId && guilds.length > 0) {
      const firstGuild = guilds[0];
      setActiveGuildId(firstGuild.id);
      localStorage.setItem("active_guild_id", firstGuild.id);
    }
  }, [guilds, activeGuildId]);

  // Encontrar o servidor ativo na lista
  const activeGuild = activeGuildId
    ? guilds.find(g => g.id === activeGuildId) || null
    : null;

  // Função para mudar o servidor ativo
  const handleSetActiveGuild = (guildId: string) => {
    // Validar se o servidor existe na lista do usuário
    const guildExists = guilds.some(g => g.id === guildId);
    if (!guildExists) {
      console.error(`[SessionContext] Guild ${guildId} not found in user's guilds`);
      return;
    }

    setActiveGuildId(guildId);
    localStorage.setItem("active_guild_id", guildId);
  };

  // Função para recarregar a lista de servidores
  const handleRefreshGuilds = async () => {
    await refetchGuilds();
  };

  const value: SessionContextType = {
    user,
    guilds,
    isLoadingGuilds,
    activeGuildId,
    activeGuild,
    setActiveGuild: handleSetActiveGuild,
    refreshGuilds: handleRefreshGuilds,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
