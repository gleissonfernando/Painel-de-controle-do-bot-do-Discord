export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  return "https://discord.com/oauth2/authorize?client_id=1492325134550302952&permissions=8&response_type=code&redirect_uri=https%3A%2F%2Fmagnatas-dashboard.shardweb.app%2Fapi%2Foauth%2Fcallback&integration_type=0&scope=bot+email+gdm.join";
};

export const getBotInviteUrl = (guildId?: string) => {
  let url = "https://discord.com/oauth2/authorize?client_id=1492325134550302952&permissions=8&response_type=code&redirect_uri=https%3A%2F%2Fmagnatas-dashboard.shardweb.app%2Fapi%2Foauth%2Fcallback&integration_type=0&scope=bot+email+gdm.join";
  if (guildId) {
    url += `&guild_id=${guildId}`;
  }
  return url;
};
