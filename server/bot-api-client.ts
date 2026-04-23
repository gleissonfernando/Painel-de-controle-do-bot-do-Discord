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
