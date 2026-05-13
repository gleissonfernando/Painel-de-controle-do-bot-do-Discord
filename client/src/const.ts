export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Gera a URL de login do Discord em tempo de execução.
 * Escopos otimizados para evitar "Invalid Form Body".
 */
export const getLoginUrl = () => {
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID || "1492325134550302952";
  const redirectUri = encodeURIComponent(`${window.location.origin}/auth/discord/callback`);
  
  // Escopos estáveis e necessários para o dashboard
  const scope = encodeURIComponent("identify guilds email");
  
  return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&prompt=consent`;
};

/**
 * Gera a URL de convite do bot.
 * Removidos escopos problemáticos como rpc.notifications.read e connections.
 */
export const getBotInviteUrl = (guildId?: string) => {
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID || "1492325134550302952";
  const redirectUri = encodeURIComponent(`${window.location.origin}/auth/discord/callback`);
  
  // Escopos corretos para adicionar o bot e identificar o usuário
  // Removido: connections, rpc.notifications.read (causam erros se não autorizados)
  const scope = encodeURIComponent("identify guilds email bot applications.commands");
  const permissions = "8"; // Administrador
  
  let url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&prompt=consent`;
  
  if (guildId) {
    url += `&guild_id=${guildId}`;
  }
  return url;
};
