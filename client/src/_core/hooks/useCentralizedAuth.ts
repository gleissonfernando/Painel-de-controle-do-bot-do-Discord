import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  getDiscordLoginUrl,
  isUserAuthenticated,
  getAccessToken,
  getRefreshToken,
  getUserData,
  clearSession,
  SESSION_CONFIG,
} from "@/config/auth.config";
import { REDIRECT_CONFIG } from "@/config/auth.config";

interface UseCentralizedAuthOptions {
  requireAuth?: boolean;
  redirectTo?: string;
}

export function useCentralizedAuth(options?: UseCentralizedAuthOptions) {
  const { requireAuth = false, redirectTo = REDIRECT_CONFIG.LOGIN_PATH } = options ?? {};
  const [, navigate] = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Query para verificar autenticação
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Mutation para logout
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      clearSession();
      navigate(REDIRECT_CONFIG.LOGIN_PATH);
    },
  });

  // Verificar autenticação ao montar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Se não há token, redirecionar para login
        if (!isUserAuthenticated()) {
          if (requireAuth) {
            navigate(REDIRECT_CONFIG.LOGIN_PATH);
          }
          setIsCheckingAuth(false);
          return;
        }

        // Se há token, verificar se ainda é válido
        await meQuery.refetch();
      } catch (error) {
        console.error("[Auth] Erro ao verificar autenticação:", error);
        clearSession();
        navigate(REDIRECT_CONFIG.LOGIN_PATH);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [requireAuth, navigate, meQuery]);

  // Logout
  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error("[Auth] Erro ao fazer logout:", error);
      clearSession();
      navigate(REDIRECT_CONFIG.LOGIN_PATH);
    }
  }, [logoutMutation, navigate]);

  // Login (redirecionar para Discord)
  const login = useCallback(() => {
    const loginUrl = getDiscordLoginUrl();
    window.location.href = loginUrl;
  }, []);

  return {
    user: meQuery.data ?? null,
    isAuthenticated: !!meQuery.data,
    isLoading: isCheckingAuth || meQuery.isLoading,
    error: meQuery.error ?? logoutMutation.error ?? null,
    login,
    logout,
    refresh: () => meQuery.refetch(),
  };
}
