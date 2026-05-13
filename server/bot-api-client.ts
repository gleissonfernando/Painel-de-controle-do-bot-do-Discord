import axios from "axios";

/**
 * Cliente para comunicação com a API do Bot
 * Envia comandos do painel para o bot executar
 */

const BOT_API_URL = process.env.BOT_API_URL || "http://localhost:3000";

interface SendMessagePayload {
  guildId: string;
  channelId: string;
  message: string;
  embeds?: any[];
}

interface TestWelcomePayload {
  guildId: string;
  channelId: string;
}

interface TestGoodbyePayload {
  guildId: string;
  channelId: string;
}

/**
 * Envia uma mensagem através do bot
 */
export async function sendMessageViaBot(payload: SendMessagePayload) {
  try {
    const response = await axios.post(`${BOT_API_URL}/api/panel/send-message`, payload, {
      timeout: 10000,
    });
    return response.data;
  } catch (error: any) {
    console.error("[Bot API Client] Erro ao enviar mensagem:", error.message);
    throw new Error(
      error.response?.data?.error || "Falha ao enviar mensagem através do bot"
    );
  }
}

/**
 * Obtém as configurações de um servidor do bot
 */
export async function getGuildSettingsFromBot(guildId: string) {
  try {
    const response = await axios.get(`${BOT_API_URL}/api/panel/guild/${guildId}`, {
      timeout: 10000,
    });
    return response.data;
  } catch (error: any) {
    console.error("[Bot API Client] Erro ao obter configurações:", error.message);
    throw new Error(
      error.response?.data?.error || "Falha ao obter configurações do bot"
    );
  }
}

/**
 * Atualiza as configurações de um servidor no bot
 */
export async function updateGuildSettingsInBot(guildId: string, settings: any) {
  try {
    const response = await axios.put(
      `${BOT_API_URL}/api/panel/guild/${guildId}`,
      settings,
      {
        timeout: 10000,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("[Bot API Client] Erro ao atualizar configurações:", error.message);
    throw new Error(
      error.response?.data?.error || "Falha ao atualizar configurações do bot"
    );
  }
}

/**
 * Envia uma mensagem de boas-vindas de teste
 */
export async function testWelcomeMessageViaBot(payload: TestWelcomePayload) {
  try {
    const response = await axios.post(
      `${BOT_API_URL}/api/panel/test-welcome`,
      payload,
      {
        timeout: 10000,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("[Bot API Client] Erro ao enviar mensagem de teste:", error.message);
    throw new Error(
      error.response?.data?.error || "Falha ao enviar mensagem de boas-vindas de teste"
    );
  }
}

/**
 * Envia uma mensagem de despedida de teste
 */
export async function testGoodbyeMessageViaBot(payload: TestGoodbyePayload) {
  try {
    const response = await axios.post(
      `${BOT_API_URL}/api/panel/test-goodbye`,
      payload,
      {
        timeout: 10000,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("[Bot API Client] Erro ao enviar mensagem de teste:", error.message);
    throw new Error(
      error.response?.data?.error || "Falha ao enviar mensagem de despedida de teste"
    );
  }
}

/**
 * Verifica se o bot está disponível
 */
export async function checkBotAvailability() {
  try {
    const response = await axios.get(`${BOT_API_URL}/api/panel/guild/test`, {
      timeout: 5000,
    });
    return true;
  } catch (error: any) {
    console.warn("[Bot API Client] Bot não está disponível:", error.message);
    return false;
  }
}

/**
 * Lista todos os servidores onde o bot está presente
 */
export async function fetchBotGuilds() {
  try {
    const response = await axios.get(`${BOT_API_URL}/api/panel/guilds`, {
      timeout: 10000,
    });
    return response.data;
  } catch (error: any) {
    console.error("[Bot API Client] Erro ao listar servidores do bot:", error.message);
    return { success: false, guilds: [] };
  }
}

// ─── Integração de Logs ───────────────────────────────────────────────────────

export interface BotLogEntry {
  _id: string;
  guildId: string;
  type: string;
  title: string;
  description?: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  channelId?: string;
  channelName?: string;
  metadata?: Record<string, any>;
  severity: "low" | "medium" | "high" | "critical";
  createdAt: string;
}

export interface BotLogsResponse {
  logs: BotLogEntry[];
  total: number;
  limit: number;
  skip: number;
  hasMore: boolean;
}

export interface BotLogStatsEntry {
  _id: string;   // tipo do log
  count: number;
  lastOccurrence: string;
}

export interface BotLogStatsResponse {
  guildId: string;
  total: number;
  byType: BotLogStatsEntry[];
}

/**
 * Busca os logs de um servidor diretamente da API do bot.
 * Equivalente a GET /api/panel/logs/:guildId
 */
export async function fetchLogsFromBot(
  guildId: string,
  options: {
    type?: string;
    userId?: string;
    limit?: number;
    skip?: number;
    startDate?: string;
    endDate?: string;
  } = {}
): Promise<BotLogsResponse> {
  try {
    const params = new URLSearchParams();
    if (options.type)      params.set("type",      options.type);
    if (options.userId)    params.set("userId",    options.userId);
    if (options.limit)     params.set("limit",     String(options.limit));
    if (options.skip)      params.set("skip",      String(options.skip));
    if (options.startDate) params.set("startDate", options.startDate);
    if (options.endDate)   params.set("endDate",   options.endDate);

    const url = `${BOT_API_URL}/api/panel/logs/${guildId}?${params.toString()}`;
    const response = await axios.get(url, { timeout: 10000 });
    return response.data;
  } catch (error: any) {
    console.error("[Bot API Client] Erro ao buscar logs do bot:", error.message);
    return { logs: [], total: 0, limit: 50, skip: 0, hasMore: false };
  }
}

/**
 * Busca estatísticas de logs de um servidor diretamente da API do bot.
 * Equivalente a GET /api/panel/logs/:guildId/stats
 */
export async function fetchLogStatsFromBot(
  guildId: string
): Promise<BotLogStatsResponse> {
  try {
    const response = await axios.get(
      `${BOT_API_URL}/api/panel/logs/${guildId}/stats`,
      { timeout: 10000 }
    );
    return response.data;
  } catch (error: any) {
    console.error("[Bot API Client] Erro ao buscar estatísticas de logs:", error.message);
    return { guildId, total: 0, byType: [] };
  }
}

/**
 * Exporta os logs de um servidor em CSV diretamente da API do bot.
 * Equivalente a GET /api/panel/logs/:guildId/export
 */
export async function exportLogsFromBot(
  guildId: string,
  options: { type?: string; startDate?: string; endDate?: string } = {}
): Promise<string> {
  try {
    const params = new URLSearchParams();
    if (options.type)      params.set("type",      options.type);
    if (options.startDate) params.set("startDate", options.startDate);
    if (options.endDate)   params.set("endDate",   options.endDate);

    const url = `${BOT_API_URL}/api/panel/logs/${guildId}/export?${params.toString()}`;
    const response = await axios.get(url, { timeout: 30000, responseType: "text" });
    return response.data;
  } catch (error: any) {
    console.error("[Bot API Client] Erro ao exportar logs:", error.message);
    throw new Error(error.response?.data?.error || "Falha ao exportar logs do bot");
  }
}
