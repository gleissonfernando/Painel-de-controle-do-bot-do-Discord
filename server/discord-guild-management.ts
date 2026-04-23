import axios from "axios";
import { getGuildSettings } from "./db";

const DISCORD_API = "https://discord.com/api/v10";
const DEFAULT_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

/**
 * Resolve o melhor token para um servidor específico
 */
async function resolveBotToken(guildId?: string): Promise<string | undefined> {
  if (guildId) {
    try {
      const settings = await getGuildSettings(guildId);
      if (settings?.botToken) {
        return settings.botToken;
      }
    } catch (err) {
      console.error(`[Guild Management] Erro ao buscar token no DB para guild ${guildId}:`, err);
    }
  }
  return DEFAULT_BOT_TOKEN;
}

/**
 * Expulsa o bot de um servidor
 */
export async function removeGuildBot(
  guildId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await resolveBotToken(guildId);
    if (!token) {
      return {
        success: false,
        error: "Token do bot não configurado",
      };
    }

    // Obter informações do bot
    const meResponse = await axios.get(`${DISCORD_API}/users/@me`, {
      headers: {
        Authorization: `Bot ${token}`,
      },
    });

    const botId = meResponse.data.id;

    // Remover o bot do servidor
    await axios.delete(`${DISCORD_API}/guilds/${guildId}/members/${botId}`, {
      headers: {
        Authorization: `Bot ${token}`,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("[Guild Management] Erro ao remover bot:", error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return {
          success: false,
          error: "Servidor ou bot não encontrado",
        };
      }
      if (error.response?.status === 403) {
        return {
          success: false,
          error: "Bot não tem permissão para sair do servidor",
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Obter informações do servidor
 */
export async function getGuildInfo(guildId: string) {
  try {
    const token = await resolveBotToken(guildId);
    if (!token) {
      return null;
    }

    const response = await axios.get(
      `${DISCORD_API}/guilds/${guildId}?with_counts=true`,
      {
        headers: {
          Authorization: `Bot ${token}`,
        },
      }
    );

    return {
      id: response.data.id,
      name: response.data.name,
      icon: response.data.icon,
      owner_id: response.data.owner_id,
      member_count: response.data.approximate_member_count,
    };
  } catch (error) {
    console.error("[Guild Management] Erro ao obter info do servidor:", error);
    return null;
  }
}

/**
 * Enviar mensagem de despedida antes de sair
 */
export async function sendGoodbyeMessage(
  guildId: string,
  channelId: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await resolveBotToken(guildId);
    if (!token) {
      return {
        success: false,
        error: "Token do bot não configurado",
      };
    }

    await axios.post(
      `${DISCORD_API}/channels/${channelId}/messages`,
      { content: message },
      {
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return { success: true };
  } catch (error) {
    console.error("[Guild Management] Erro ao enviar mensagem de despedida:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
