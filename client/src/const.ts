export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const DISCORD_AUTHORIZE_URL = "https://discord.com/oauth2/authorize";
const DEFAULT_DISCORD_CLIENT_ID = "1492325134550302952";
const DISCORD_CALLBACK_PATH = "/auth/discord/callback";
const BOT_PERMISSIONS = "8";

const getDiscordClientId = () =>
  import.meta.env.VITE_DISCORD_CLIENT_ID || DEFAULT_DISCORD_CLIENT_ID;

const getDiscordRedirectUri = () =>
  import.meta.env.VITE_DISCORD_REDIRECT_URI ||
  `${window.location.origin}${DISCORD_CALLBACK_PATH}`;

/**
 * Gera a URL de login do Discord em tempo de execução.
 * Escopos otimizados para evitar "Invalid Form Body".
 */
export const getLoginUrl = () => {
  const params = new URLSearchParams({
    client_id: getDiscordClientId(),
    redirect_uri: getDiscordRedirectUri(),
    response_type: "code",
    scope: "identify guilds email",
    prompt: "consent",
  });

  return `${DISCORD_AUTHORIZE_URL}?${params.toString()}`;
};

/**
 * Gera a URL de convite do bot.
 * Fluxo OAuth2 avançado: adiciona o bot e retorna code/guild_id no callback.
 */
export const getBotInviteUrl = (guildId?: string) => {
  const params = new URLSearchParams({
    client_id: getDiscordClientId(),
    permissions: BOT_PERMISSIONS,
    response_type: "code",
    redirect_uri: getDiscordRedirectUri(),
    integration_type: "0",
    scope: "bot guilds.join guilds identify",
    prompt: "consent",
  });

  if (guildId) {
    params.set("guild_id", guildId);
  }

  return `${DISCORD_AUTHORIZE_URL}?${params.toString()}`;
};
