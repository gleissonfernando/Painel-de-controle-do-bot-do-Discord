export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID || "1492325134550302952";
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  
  // Se você tiver um portal de OAuth externo configurado
  if (oauthPortalUrl && oauthPortalUrl.startsWith("http")) {
    try {
      const state = btoa(redirectUri);
      const url = new URL(`${oauthPortalUrl}/app-auth`);
      url.searchParams.set("appId", appId || "");
      url.searchParams.set("redirectUri", redirectUri);
      url.searchParams.set("state", state);
      url.searchParams.set("type", "signIn");
      return url.toString();
    } catch (e) {
      console.error("Failed to construct portal URL:", e);
    }
  }

  // FALLBACK: Se não houver portal, vai direto para o OAuth do Discord
  // Isso garante que o botão SEMPRE funcione.
  // IMPORTANTE: Adicionado o escopo 'guilds' para permitir listar os servidores do usuário.
  // Fixado o redirectUri para o domínio de produção para evitar erros de "invalid redirect_uri" no Discord.
  const currentRedirectUri = encodeURIComponent(`https://magnatas-dashboard.shardweb.app/api/oauth/callback`);
  const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${currentRedirectUri}&scope=identify+email+guilds`;
  return discordAuthUrl;
};
