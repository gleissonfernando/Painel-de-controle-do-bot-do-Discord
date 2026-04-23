import axios from "axios";
import { getGuildSettings } from "./db";

const DISCORD_API = "https://discord.com/api/v10";
const DEFAULT_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

/**
 * Resolve o melhor token para um servidor específico.
 * Prioridade: 1. Token no Banco de Dados | 2. Variável de Ambiente
 */
async function resolveBotToken(guildId?: string): Promise<string | undefined> {
  if (guildId) {
    try {
      const settings = await getGuildSettings(guildId);
      if (settings?.botToken) {
        return settings.botToken;
      }
    } catch (err) {
      console.error(`[Discord] Erro ao buscar token no DB para guild ${guildId}:`, err);
    }
  }
  return DEFAULT_BOT_TOKEN;
}

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
  const token = await resolveBotToken(guildId);
  if (!token) return getMockGuildDetails(guildId);
  
  try {
    const res = await axios.get(
      `${DISCORD_API}/guilds/${guildId}?with_counts=true`,
      {
        headers: { Authorization: `Bot ${token}` },
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
  } catch (error: any) {
    console.error(`[Discord] Erro ao buscar detalhes da guild ${guildId}:`, error.response?.status || error.message);
    return getMockGuildDetails(guildId);
  }
}

export async function fetchGuildChannels(guildId: string) {
  const token = await resolveBotToken(guildId);
  if (!token) return getMockChannels(guildId);
  
  try {
    const res = await axios.get(`${DISCORD_API}/guilds/${guildId}/channels`, {
      headers: { Authorization: `Bot ${token}` },
    });
    return (
      res.data as Array<{ id: string; name: string; type: number }>
    ).filter(
      c => c.type === 0 // text channels only
    );
  } catch (error: any) {
    console.error(`[Discord] Erro ao buscar canais da guild ${guildId}:`, error.response?.status || error.message);
    return getMockChannels(guildId);
  }
}

export async function fetchGuildRoles(guildId: string) {
  const token = await resolveBotToken(guildId);
  if (!token) return getMockRoles(guildId);
  
  try {
    const res = await axios.get(`${DISCORD_API}/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${token}` },
    });
    return res.data as Array<{ id: string; name: string; color: number }>;
  } catch (error: any) {
    console.error(`[Discord] Erro ao buscar cargos da guild ${guildId}:`, error.response?.status || error.message);
    return getMockRoles(guildId);
  }
}

export async function checkBotInGuild(guildId: string) {
  const token = await resolveBotToken(guildId);
  if (!token) return false;
  
  try {
    const res = await axios.get(
      `${DISCORD_API}/guilds/${guildId}/members/me`,
      {
        headers: { Authorization: `Bot ${token}` },
      }
    );
    return res.status === 200;
  } catch (error: any) {
    if (error.response?.status === 404 || error.response?.status === 401) {
      return false;
    }
    console.error(`[Discord] Erro ao verificar bot na guild ${guildId}:`, error.response?.status || error.message);
    return false;
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
    name: "Server (Desconectado)",
    icon: null,
    owner_id: "0",
    approximate_member_count: 0,
    approximate_presence_count: 0,
  };
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
  ];
}

export async function sendMessageToChannel(channelId: string, message: string) {
  const token = await resolveBotToken(); // Tenta o token global se não houver guildId específico
  if (!token) throw new Error("Bot token not configured");

  try {
    await axios.post(
      `${DISCORD_API}/channels/${channelId}/messages`,
      { content: message },
      {
        headers: { Authorization: `Bot ${token}` },
      }
    );
  } catch (error: any) {
    console.error(`[Discord] Erro ao enviar mensagem para canal ${channelId}:`, error.response?.status || error.message);
    throw error;
  }
}

/**
 * Envia um alerta global de manutenção para todos os servidores onde o bot está presente.
 */
export async function sendGlobalMaintenanceAlert() {
  const token = await resolveBotToken();
  if (!token) return;

  try {
    // 1. Buscar todas as guildas onde o bot está
    const guildsRes = await axios.get(`${DISCORD_API}/users/@me/guilds`, {
      headers: { Authorization: `Bot ${token}` },
    });
    
    const guilds = guildsRes.data;

    // 2. Preparar o Embed de Manutenção
    const maintenanceEmbed = {
      title: "🚨 COMUNICADO OFICIAL - MANUTENÇÃO GLOBAL",
      description: "Atenção! O sistema **Magnatas.gg** está entrando em manutenção global para atualizações críticas.\n\n" +
                   "Durante este período, as funcionalidades do bot e do painel podem ficar indisponíveis.\n\n" +
                   "**Previsão de Retorno:** Em breve!\n" +
                   "Agradecemos a compreensão de todos os membros.",
      color: 0xFFAA00,
      image: { url: "https://i.imgur.com/x9n7S6L.png" },
      footer: { text: "Equipe de Desenvolvimento Magnatas.gg" },
      timestamp: new Date().toISOString()
    };

    // 3. Enviar para o canal principal de cada guilda
    for (const guild of guilds) {
      try {
        const channelsRes = await axios.get(`${DISCORD_API}/guilds/${guild.id}/channels`, {
          headers: { Authorization: `Bot ${token}` },
        });
        
        const channels = channelsRes.data;
        
        // Prioriza canais com nomes comuns de avisos ou o primeiro canal de texto
        const targetChannel = channels.find((c: any) => 
          c.type === 0 && (c.name.includes("avisos") || c.name.includes("geral") || c.name.includes("anúncios"))
        ) || channels.find((c: any) => c.type === 0);

        if (targetChannel) {
          await axios.post(
            `${DISCORD_API}/channels/${targetChannel.id}/messages`,
            { embeds: [maintenanceEmbed] },
            { headers: { Authorization: `Bot ${token}` } }
          );
        }
      } catch (e) {
        console.error(`[Maintenance] Erro ao enviar alerta para guilda ${guild.id}`);
      }
    }
  } catch (error) {
    console.error("[Maintenance] Erro no sistema de alerta global:", error);
  }
}
