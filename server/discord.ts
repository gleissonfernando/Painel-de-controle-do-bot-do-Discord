import axios from "axios";

const DISCORD_API = "https://discord.com/api/v10";
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// ─── User-level calls (uses user access token) ────────────────────────────────

export async function fetchDiscordGuilds(accessToken: string) {
  const res = await axios.get(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data as Array<{
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
    permissions: string;
  }>;
}

// ─── Bot-level calls (uses bot token) ────────────────────────────────────────

export async function fetchGuildDetails(guildId: string) {
  if (!BOT_TOKEN) return getMockGuildDetails(guildId);
  try {
    const res = await axios.get(
      `${DISCORD_API}/guilds/${guildId}?with_counts=true`,
      {
        headers: { Authorization: `Bot ${BOT_TOKEN}` },
      }
    );
    return res.data as {
      id: string;
      name: string;
      icon: string | null;
      owner_id: string;
      approximate_member_count?: number;
      approximate_presence_count?: number;
      channels?: unknown[];
    };
  } catch {
    return getMockGuildDetails(guildId);
  }
}

export async function fetchGuildChannels(guildId: string) {
  if (!BOT_TOKEN) return getMockChannels(guildId);
  try {
    const res = await axios.get(`${DISCORD_API}/guilds/${guildId}/channels`, {
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    });
    return (
      res.data as Array<{ id: string; name: string; type: number }>
    ).filter(
      c => c.type === 0 // text channels only
    );
  } catch {
    return getMockChannels(guildId);
  }
}

export async function fetchGuildRoles(guildId: string) {
  if (!BOT_TOKEN) return getMockRoles(guildId);
  try {
    const res = await axios.get(`${DISCORD_API}/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${BOT_TOKEN}` },
    });
    return res.data as Array<{ id: string; name: string; color: number }>;
  } catch {
    return getMockRoles(guildId);
  }
}

// ─── Mock data for demo mode (when no bot token) ──────────────────────────────

function getMockChannels(_guildId: string) {
  return [
    { id: "111111111111111111", name: "general", type: 0 },
    { id: "222222222222222222", name: "announcements", type: 0 },
    { id: "333333333333333333", name: "bot-commands", type: 0 },
    { id: "444444444444444444", name: "logs", type: 0 },
    { id: "555555555555555555", name: "music", type: 0 },
  ];
}

function getMockRoles(_guildId: string) {
  return [
    { id: "666666666666666666", name: "Admin", color: 0xff0000 },
    { id: "777777777777777777", name: "Moderator", color: 0xff6600 },
    { id: "888888888888888888", name: "Member", color: 0x00ff00 },
    { id: "999999999999999999", name: "VIP", color: 0xffff00 },
  ];
}

function getMockGuildDetails(guildId: string) {
  return {
    id: guildId,
    name: "Demo Server",
    icon: null,
    owner_id: "123456789",
    approximate_member_count: 1500,
    approximate_presence_count: 450,
  };
}

// ─── Mock guilds for demo mode ────────────────────────────────────────────────

export async function checkBotInGuild(guildId: string) {
  if (!BOT_TOKEN) return true; // Return true in demo mode
  try {
    const res = await axios.get(
      `${DISCORD_API}/guilds/${guildId}/members/me`,
      {
        headers: { Authorization: `Bot ${BOT_TOKEN}` },
      }
    );
    return res.status === 200; // Bot is in the guild
  } catch (error: any) {
    if (error.response?.status === 404) {
      return false; // Bot is not in the guild
    }
    console.error("Error checking bot in guild:", error);
    return false;
  }
}

export function getMockGuilds() {
  return [
    {
      id: "1001",
      name: "My Awesome Server",
      icon: null,
      owner: true,
      permissions: "8",
      memberCount: 1247,
      botPresent: true,
    },
    {
      id: "1002",
      name: "Gaming Community",
      icon: null,
      owner: false,
      permissions: "8",
      memberCount: 5832,
      botPresent: true,
    },
    {
      id: "1003",
      name: "Dev Hub",
      icon: null,
      owner: false,
      permissions: "8",
      memberCount: 342,
      botPresent: false,
    },
  ];
}
