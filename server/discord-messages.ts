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
      console.error(`[Discord Messages] Erro ao buscar token no DB para guild ${guildId}:`, err);
    }
  }
  return DEFAULT_BOT_TOKEN;
}

/**
 * Envia uma mensagem para um canal específico
 */
export async function sendMessageToChannel(
  guildId: string,
  channelId: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const token = await resolveBotToken(guildId);
    if (!token) {
      return {
        success: false,
        error: "Token do bot não configurado",
      };
    }

    const response = await axios.post(
      `${DISCORD_API}/channels/${channelId}/messages`,
      { content: message },
      {
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      messageId: response.data.id,
    };
  } catch (error) {
    console.error("[Discord Messages] Erro ao enviar mensagem:", error);
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 403) {
        return {
          success: false,
          error: "Bot não tem permissão para enviar mensagens neste canal",
        };
      }
      if (error.response?.status === 404) {
        return {
          success: false,
          error: "Canal não encontrado",
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
 * Obtém os canais de texto de um servidor
 */
export async function getGuildTextChannels(guildId: string) {
  try {
    const token = await resolveBotToken(guildId);
    if (!token) {
      return [];
    }

    const response = await axios.get(
      `${DISCORD_API}/guilds/${guildId}/channels`,
      {
        headers: {
          Authorization: `Bot ${token}`,
        },
      }
    );

    // Filtrar apenas canais de texto (type 0)
    return response.data
      .filter((ch: any) => ch.type === 0)
      .map((ch: any) => ({
        id: ch.id,
        name: ch.name,
        position: ch.position,
      }))
      .sort((a: any, b: any) => a.position - b.position);
  } catch (error) {
    console.error("[Discord Messages] Erro ao obter canais:", error);
    return [];
  }
}
