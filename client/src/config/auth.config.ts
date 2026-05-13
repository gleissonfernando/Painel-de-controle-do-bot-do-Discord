/**
 * Configuração Centralizada de Autenticação
 * Este arquivo centraliza todas as configurações de OAuth2 e fluxo de login
 */

// URLs de OAuth2
export const OAUTH_CONFIG = {
  // URL base do servidor Discord
  DISCORD_API: "https://discord.com/api/v10",
  
  // URL de autorização do Discord
  AUTHORIZE_URL: "https://discord.com/oauth2/authorize",
  
  // ID da aplicação Discord
  CLIENT_ID: import.meta.env.VITE_DISCORD_CLIENT_ID || "1234567890",
  
  // Redirect URI (deve estar registrado no Discord Developer Portal)
  REDIRECT_URI: `${window.location.origin}/auth/callback`,
  
  // Escopos necessários
  SCOPES: ["identify", "guilds", "email"],
  
  // Tipo de resposta
  RESPONSE_TYPE: "code",
  
  // Prompt
  PROMPT: "consent",
};

// Configuração de sessão
export const SESSION_CONFIG = {
  // Chave do localStorage para armazenar token
  TOKEN_KEY: "discord_access_token",
  
  // Chave do localStorage para armazenar refresh token
  REFRESH_TOKEN_KEY: "discord_refresh_token",
  
  // Chave do localStorage para armazenar dados do usuário
  USER_KEY: "discord_user_data",
  
  // Chave do localStorage para armazenar servidor ativo
  ACTIVE_GUILD_KEY: "active_guild_id",
  
  // Tempo de expiração da sessão (em minutos)
  SESSION_TIMEOUT: 60,
  
  // Renovar token antes de expirar (em minutos)
  REFRESH_BEFORE_EXPIRY: 5,
};

// Configuração de redirecionamentos
export const REDIRECT_CONFIG = {
  // Redirecionar para login se não autenticado
  LOGIN_PATH: "/",
  
  // Redirecionar para seleção de servidor após login
  SERVERS_PATH: "/servers",
  
  // Redirecionar para dashboard se servidor selecionado
  DASHBOARD_PATH: "/dashboard",
  
  // Redirecionar para callback de OAuth2
  CALLBACK_PATH: "/auth/callback",
};

// Configuração de validação
export const VALIDATION_CONFIG = {
  // Validar token a cada X minutos
  VALIDATE_INTERVAL: 5,
  
  // Tentar renovar token automaticamente
  AUTO_REFRESH: true,
  
  // Máximo de tentativas de renovação
  MAX_RETRY_ATTEMPTS: 3,
  
  // Delay entre tentativas (em ms)
  RETRY_DELAY: 1000,
};

/**
 * Gera a URL de login do Discord
 */
export function getDiscordLoginUrl(): string {
  const params = new URLSearchParams({
    client_id: OAUTH_CONFIG.CLIENT_ID,
    redirect_uri: OAUTH_CONFIG.REDIRECT_URI,
    response_type: OAUTH_CONFIG.RESPONSE_TYPE,
    scope: OAUTH_CONFIG.SCOPES.join(" "),
    prompt: OAUTH_CONFIG.PROMPT,
  });

  return `${OAUTH_CONFIG.AUTHORIZE_URL}?${params.toString()}`;
}

/**
 * Gera a URL de logout
 */
export function getDiscordLogoutUrl(): string {
  return `${OAUTH_CONFIG.DISCORD_API}/oauth2/token/revoke`;
}

/**
 * Verifica se o usuário está autenticado
 */
export function isUserAuthenticated(): boolean {
  const token = localStorage.getItem(SESSION_CONFIG.TOKEN_KEY);
  return !!token && token.length > 0;
}

/**
 * Obtém o token de acesso
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(SESSION_CONFIG.TOKEN_KEY);
}

/**
 * Obtém o refresh token
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(SESSION_CONFIG.REFRESH_TOKEN_KEY);
}

/**
 * Obtém os dados do usuário
 */
export function getUserData() {
  const userData = localStorage.getItem(SESSION_CONFIG.USER_KEY);
  return userData ? JSON.parse(userData) : null;
}

/**
 * Obtém o servidor ativo
 */
export function getActiveGuild(): string | null {
  return localStorage.getItem(SESSION_CONFIG.ACTIVE_GUILD_KEY);
}

/**
 * Define o servidor ativo
 */
export function setActiveGuild(guildId: string): void {
  localStorage.setItem(SESSION_CONFIG.ACTIVE_GUILD_KEY, guildId);
}

/**
 * Limpa a sessão
 */
export function clearSession(): void {
  localStorage.removeItem(SESSION_CONFIG.TOKEN_KEY);
  localStorage.removeItem(SESSION_CONFIG.REFRESH_TOKEN_KEY);
  localStorage.removeItem(SESSION_CONFIG.USER_KEY);
  localStorage.removeItem(SESSION_CONFIG.ACTIVE_GUILD_KEY);
}
