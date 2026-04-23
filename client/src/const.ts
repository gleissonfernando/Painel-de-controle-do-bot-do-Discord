export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const clientId = "1492325134550302952";
  const redirectUri = encodeURIComponent("https://magnatas-dashboard.shardweb.app/api/oauth/callback");
  // Escopos mínimos necessários para identificar o usuário e ver seus servidores
  const scope = encodeURIComponent("identify email guilds");
  return `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}`;
};

export const getBotInviteUrl = (guildId?: string) => {
  const clientId = "1492325134550302952";
  const redirectUri = encodeURIComponent("https://magnatas-dashboard.shardweb.app/api/oauth/callback");
  // Escopos para adicionar o bot e identificar o usuário ao mesmo tempo
  const scope = encodeURIComponent("identify email guilds bot applications.commands");
  const permissions = "8"; // Administrador
  
  let url = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}`;
  
  if (guildId) {
    url += `&guild_id=${guildId}`;
  }
  return url;
};
