import axios from "axios";
import { getGuildSettings } from "./db";

const DISCORD_API = "https://discord.com/api/v10";
const DEFAULT_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

/**
 * Resolve o melhor token para um servidor específico.
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

export interface BroadcastResult {
  guildId: string;
  guildName: string;
  success: boolean;
  error?: string;
  channelId?: string;
}

/**
 * Envia uma mensagem para todos os servidores usando seus canais de alerta configurados.
 * Retorna um array com o resultado de cada envio.
 */
export async function sendGlobalBroadcast(
  message: string,
  guildIds: string[],
  onProgress?: (current: number, total: number) => void
): Promise<BroadcastResult[]> {
  const token = await resolveBotToken();
  if (!token) {
    throw new Error("Bot token not configured");
  }

  const results: BroadcastResult[] = [];
  const total = guildIds.length;

  for (let i = 0; i < guildIds.length; i++) {
    const guildId = guildIds[i];
    
    try {
      // Buscar configurações do servidor
      const settings = await getGuildSettings(guildId);
      
      if (!settings) {
        results.push({
          guildId,
          guildName: `Guild ${guildId}`,
          success: false,
          error: "Configurações não encontradas",
        });
        onProgress?.(i + 1, total);
        continue;
      }

      const channelId = settings.alertChannelId;
      if (!channelId) {
        results.push({
          guildId,
          guildName: settings.guildName || `Guild ${guildId}`,
          success: false,
          error: "Canal de alerta não configurado",
        });
        onProgress?.(i + 1, total);
        continue;
      }

      // Enviar mensagem
      try {
        await axios.post(
          `${DISCORD_API}/channels/${channelId}/messages`,
          { content: message },
          {
            headers: { Authorization: `Bot ${token}` },
          }
        );

        results.push({
          guildId,
          guildName: settings.guildName || `Guild ${guildId}`,
          success: true,
          channelId,
        });
      } catch (error: any) {
        results.push({
          guildId,
          guildName: settings.guildName || `Guild ${guildId}`,
          success: false,
          error: error.response?.data?.message || error.message,
          channelId,
        });
      }
    } catch (error: any) {
      results.push({
        guildId,
        guildName: `Guild ${guildId}`,
        success: false,
        error: error.message,
      });
    }

    onProgress?.(i + 1, total);
  }

  return results;
}

/**
 * Envia uma mensagem global para todos os servidores onde o bot está presente.
 * Usa os canais de alerta configurados de cada servidor.
 */
export async function sendBroadcastToAllGuilds(
  message: string,
  allGuilds: Array<{ id: string; name: string }>,
  onProgress?: (current: number, total: number) => void
): Promise<BroadcastResult[]> {
  const guildIds = allGuilds.map(g => g.id);
  return sendGlobalBroadcast(message, guildIds, onProgress);
}
