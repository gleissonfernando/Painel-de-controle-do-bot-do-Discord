import { LogConfig, GuildEventLog, ILogConfig, IGuildEventLog } from "./models";

/**
 * Obter configuração de logs de um servidor
 */
export async function getLogConfig(guildId: string): Promise<ILogConfig | null> {
  try {
    return await LogConfig.findOne({ guildId });
  } catch (error) {
    console.error("[DB Logs] Erro ao obter config de logs:", error);
    return null;
  }
}

/**
 * Atualizar configuração de logs
 */
export async function updateLogConfig(
  guildId: string,
  config: Partial<ILogConfig>
): Promise<ILogConfig | null> {
  try {
    return await LogConfig.findOneAndUpdate(
      { guildId },
      { ...config, guildId },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error("[DB Logs] Erro ao atualizar config de logs:", error);
    return null;
  }
}

/**
 * Registrar um evento de log
 */
export async function logGuildEvent(
  guildId: string,
  eventType: "MESSAGE_DELETE" | "MESSAGE_EDIT" | "MEMBER_JOIN" | "MEMBER_LEAVE" | "BOT_MESSAGE",
  details: Record<string, any>,
  userId?: string,
  userName?: string,
  userAvatar?: string
): Promise<IGuildEventLog | null> {
  try {
    const log = new GuildEventLog({
      guildId,
      eventType,
      userId,
      userName,
      userAvatar,
      details,
      timestamp: new Date(),
    });

    await log.save();
    return log;
  } catch (error) {
    console.error("[DB Logs] Erro ao registrar evento:", error);
    return null;
  }
}

/**
 * Obter logs de um servidor
 */
export async function getGuildLogs(
  guildId: string,
  eventType?: string,
  limit: number = 50
): Promise<IGuildEventLog[]> {
  try {
    const query: any = { guildId };
    if (eventType) {
      query.eventType = eventType;
    }

    return await GuildEventLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit);
  } catch (error) {
    console.error("[DB Logs] Erro ao obter logs:", error);
    return [];
  }
}

/**
 * Obter logs de um tipo específico
 */
export async function getLogsByType(
  guildId: string,
  eventType: string,
  limit: number = 50
): Promise<IGuildEventLog[]> {
  try {
    return await GuildEventLog.find({ guildId, eventType })
      .sort({ timestamp: -1 })
      .limit(limit);
  } catch (error) {
    console.error("[DB Logs] Erro ao obter logs por tipo:", error);
    return [];
  }
}

/**
 * Limpar logs antigos
 */
export async function clearOldLogs(guildId: string, daysOld: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await GuildEventLog.deleteMany({
      guildId,
      timestamp: { $lt: cutoffDate },
    });

    return result.deletedCount || 0;
  } catch (error) {
    console.error("[DB Logs] Erro ao limpar logs antigos:", error);
    return 0;
  }
}

/**
 * Obter estatísticas de logs
 */
export async function getLogStats(guildId: string) {
  try {
    const stats = await GuildEventLog.aggregate([
      { $match: { guildId } },
      {
        $group: {
          _id: "$eventType",
          count: { $sum: 1 },
        },
      },
    ]);

    return stats;
  } catch (error) {
    console.error("[DB Logs] Erro ao obter estatísticas:", error);
    return [];
  }
}
