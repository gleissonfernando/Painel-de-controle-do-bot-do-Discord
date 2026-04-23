import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "./useAuth";

/**
 * Hook que força OAuth2 obrigatório
 * Redireciona para login se não autenticado
 * Redireciona para seleção de servidor se autenticado mas sem servidor ativo
 */
export function useProtectedRoute(options?: {
  requireGuild?: boolean;
  redirectTo?: string;
}) {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (loading) return;

    // Se não autenticado, redirecionar para login
    if (!isAuthenticated) {
      setLocation("/");
      return;
    }

    // Se requer guild e não tem servidor ativo, redirecionar para seleção
    if (options?.requireGuild) {
      const activeGuildId = localStorage.getItem("active_guild_id");
      if (!activeGuildId) {
        setLocation("/servers");
        return;
      }
    }
  }, [isAuthenticated, loading, setLocation, options?.requireGuild]);

  return {
    isAuthenticated,
    loading,
  };
}
