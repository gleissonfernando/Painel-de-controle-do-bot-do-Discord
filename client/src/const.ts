export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Gera a URL de login do Discord em tempo de execução.
 * O redirect_uri reflete a origem atual da janela.
 */
export const getLoginUrl = () => {
  // Prioriza a variável de ambiente, mas garante que não seja undefined
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID || "1234567890";
  
  // A URL de redirecionamento deve estar EXATAMENTE igual no Discord Developer Portal
  const redirectUri = encodeURIComponent(`${window.location.origin}/auth/discord/callback`);
  
  // Escopos necessários: identify (perfil), guilds (servidores), email (opcional mas comum)
  const scope = encodeURIComponent("identify guilds email");
  
  // Construção da URL com parâmetros limpos para evitar "Invalid Form Body"
  return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&prompt=consent`;
};

/**
 * Gera a URL de convite do bot.
 */
export const getBotInviteUrl = (guildId?: string) => {
  const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID || "1234567890";
  const redirectUri = encodeURIComponent(`${window.location.origin}/auth/discord/callback`);
  
  // Escopos para adicionar o bot e identificar o usuário
  const scope = encodeURIComponent("identify guilds bot applications.commands");
  const permissions = "8"; // Administrador
  
  let url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}&prompt=consent`;
  
  if (guildId) {
    url += `&guild_id=${guildId}`;
  }
  return url;
};
