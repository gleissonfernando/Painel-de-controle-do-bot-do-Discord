import axios from "axios";
import { getGuildSettings } from "./db";
import { getLogConfig } from "./db-logs";

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
      console.error(`[Discord Logs] Erro ao buscar token no DB para guild ${guildId}:`, err);
    }
  }
  return DEFAULT_BOT_TOKEN;
}

/**
 * Enviar log de exclusão de mensagem
 */
export async function logMessageDelete(
  guildId: string,
  messageId: string,
  authorId: string,
  authorName: string,
  channelId: string,
  content: string
) {
  try {
    const logConfig = await getLogConfig(guildId);
    if (!logConfig?.messageDeleteChannelId || !logConfig.logsEnabled) {
      return;
    }

    const token = await resolveBotToken(guildId);
    if (!token) return;

    const embed = {
      title: "📝 Mensagem Deletada",
      description: `**Autor:** <@${authorId}> (${authorName})\n**Canal:** <#${channelId}>\n**Conteúdo:**\n${content.substring(0, 1024)}`,
      color: 0xFF6B6B,
      timestamp: new Date().toISOString(),
      footer: {
        text: `ID: ${messageId}`,
      },
    };

    await axios.post(
      `${DISCORD_API}/channels/${logConfig.messageDeleteChannelId}/messages`,
      { embeds: [embed] },
      {
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("[Discord Logs] Erro ao enviar log de exclusão:", error);
  }
}

/**
 * Enviar log de edição de mensagem
 */
export async function logMessageEdit(
  guildId: string,
  messageId: string,
  authorId: string,
  authorName: string,
  channelId: string,
  oldContent: string,
  newContent: string
) {
  try {
    const logConfig = await getLogConfig(guildId);
    if (!logConfig?.messageEditChannelId || !logConfig.logsEnabled) {
      return;
    }

    const token = await resolveBotToken(guildId);
    if (!token) return;

    const embed = {
      title: "✏️ Mensagem Editada",
      description: `**Autor:** <@${authorId}> (${authorName})\n**Canal:** <#${channelId}>`,
      color: 0x4ECDC4,
      fields: [
        {
          name: "Antes",
          value: oldContent.substring(0, 1024),
          inline: false,
        },
        {
          name: "Depois",
          value: newContent.substring(0, 1024),
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: `ID: ${messageId}`,
      },
    };

    await axios.post(
      `${DISCORD_API}/channels/${logConfig.messageEditChannelId}/messages`,
      { embeds: [embed] },
      {
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("[Discord Logs] Erro ao enviar log de edição:", error);
  }
}

/**
 * Enviar log de entrada de membro
 */
export async function logMemberJoin(
  guildId: string,
  userId: string,
  userName: string,
  userAvatar: string
) {
  try {
    const logConfig = await getLogConfig(guildId);
    if (!logConfig?.memberJoinChannelId || !logConfig.logsEnabled) {
      return;
    }

    const token = await resolveBotToken(guildId);
    if (!token) return;

    const embed = {
      title: "👋 Membro Entrou",
      description: `<@${userId}> (${userName})`,
      color: 0x2ECC71,
      thumbnail: {
        url: userAvatar,
      },
      timestamp: new Date().toISOString(),
      footer: {
        text: `ID: ${userId}`,
      },
    };

    await axios.post(
      `${DISCORD_API}/channels/${logConfig.memberJoinChannelId}/messages`,
      { embeds: [embed] },
      {
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("[Discord Logs] Erro ao enviar log de entrada:", error);
  }
}

/**
 * Enviar log de saída de membro
 */
export async function logMemberLeave(
  guildId: string,
  userId: string,
  userName: string,
  userAvatar: string
) {
  try {
    const logConfig = await getLogConfig(guildId);
    if (!logConfig?.memberLeaveChannelId || !logConfig.logsEnabled) {
      return;
    }

    const token = await resolveBotToken(guildId);
    if (!token) return;

    const embed = {
      title: "👋 Membro Saiu",
      description: `<@${userId}> (${userName})`,
      color: 0xFF6B6B,
      thumbnail: {
        url: userAvatar,
      },
      timestamp: new Date().toISOString(),
      footer: {
        text: `ID: ${userId}`,
      },
    };

    await axios.post(
      `${DISCORD_API}/channels/${logConfig.memberLeaveChannelId}/messages`,
      { embeds: [embed] },
      {
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("[Discord Logs] Erro ao enviar log de saída:", error);
  }
}

/**
 * Enviar log de mensagem do bot
 */
export async function logBotMessage(
  guildId: string,
  channelId: string,
  messageId: string,
  content: string
) {
  try {
    const logConfig = await getLogConfig(guildId);
    if (!logConfig?.botMessageChannelId || !logConfig.logsEnabled) {
      return;
    }

    const token = await resolveBotToken(guildId);
    if (!token) return;

    const embed = {
      title: "🤖 Mensagem do Bot",
      description: `**Canal:** <#${channelId}>\n**Conteúdo:**\n${content.substring(0, 1024)}`,
      color: 0x5865F2,
      timestamp: new Date().toISOString(),
      footer: {
        text: `ID: ${messageId}`,
      },
    };

    await axios.post(
      `${DISCORD_API}/channels/${logConfig.botMessageChannelId}/messages`,
      { embeds: [embed] },
      {
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("[Discord Logs] Erro ao enviar log de mensagem do bot:", error);
  }
}
