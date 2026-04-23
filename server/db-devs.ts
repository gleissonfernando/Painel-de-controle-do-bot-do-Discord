import { DevUser, DevAuditLog, GuildRemovalLog, DevRole, IDevUser } from "./models";

/**
 * Obter todos os devs
 */
export async function getAllDevs() {
  try {
    return await DevUser.find().sort({ createdAt: -1 });
  } catch (error) {
    console.error("[DB] Erro ao obter devs:", error);
    return [];
  }
}

/**
 * Obter um dev por ID
 */
export async function getDevById(userId: string) {
  try {
    return await DevUser.findOne({ userId });
  } catch (error) {
    console.error("[DB] Erro ao obter dev:", error);
    return null;
  }
}

/**
 * Criar um novo dev
 */
export async function createDev(
  userId: string,
  username: string,
  role: DevRole = "helper",
  createdBy?: string,
  email?: string,
  avatar?: string
) {
  try {
    const existingDev = await DevUser.findOne({ userId });
    if (existingDev) {
      throw new Error("Dev já existe");
    }

    const dev = new DevUser({
      userId,
      username,
      email,
      avatar,
      role,
      createdBy,
    });

    await dev.save();

    // Log de auditoria
    if (createdBy) {
      await createAuditLog(createdBy, "DEV_CREATED", {
        userId,
        username,
        role,
      });
    }

    return dev;
  } catch (error) {
    console.error("[DB] Erro ao criar dev:", error);
    throw error;
  }
}

/**
 * Atualizar role de um dev
 */
export async function updateDevRole(userId: string, newRole: DevRole, updatedBy?: string) {
  try {
    const dev = await DevUser.findOneAndUpdate(
      { userId },
      { role: newRole },
      { new: true }
    );

    if (dev && updatedBy) {
      await createAuditLog(updatedBy, "DEV_ROLE_UPDATED", {
        userId,
        newRole,
      });
    }

    return dev;
  } catch (error) {
    console.error("[DB] Erro ao atualizar role do dev:", error);
    throw error;
  }
}

/**
 * Remover um dev
 */
export async function removeDev(userId: string, removedBy?: string) {
  try {
    const dev = await DevUser.findOneAndDelete({ userId });

    if (dev && removedBy) {
      await createAuditLog(removedBy, "DEV_REMOVED", {
        userId,
        username: dev.username,
        role: dev.role,
      });
    }

    return dev;
  } catch (error) {
    console.error("[DB] Erro ao remover dev:", error);
    throw error;
  }
}

/**
 * Criar log de auditoria
 */
export async function createAuditLog(
  devUserId: string,
  action: string,
  details: Record<string, any> = {}
) {
  try {
    const log = new DevAuditLog({
      devUserId,
      action,
      details,
      timestamp: new Date(),
    });

    await log.save();
    return log;
  } catch (error) {
    console.error("[DB] Erro ao criar audit log:", error);
    return null;
  }
}

/**
 * Obter logs de auditoria
 */
export async function getAuditLogs(limit: number = 50) {
  try {
    return await DevAuditLog.find()
      .sort({ timestamp: -1 })
      .limit(limit);
  } catch (error) {
    console.error("[DB] Erro ao obter audit logs:", error);
    return [];
  }
}

/**
 * Registrar remoção de servidor
 */
export async function logGuildRemoval(
  guildId: string,
  guildName: string | undefined,
  removedBy: string,
  reason?: string
) {
  try {
    const log = new GuildRemovalLog({
      guildId,
      guildName,
      removedBy,
      reason,
      timestamp: new Date(),
    });

    await log.save();
    return log;
  } catch (error) {
    console.error("[DB] Erro ao registrar remoção de servidor:", error);
    return null;
  }
}

/**
 * Obter logs de remoção de servidores
 */
export async function getGuildRemovalLogs(limit: number = 50) {
  try {
    return await GuildRemovalLog.find()
      .sort({ timestamp: -1 })
      .limit(limit);
  } catch (error) {
    console.error("[DB] Erro ao obter guild removal logs:", error);
    return [];
  }
}

/**
 * Verificar se um usuário é dev
 */
export async function isUserDev(userId: string): Promise<boolean> {
  try {
    const dev = await DevUser.findOne({ userId });
    return !!dev;
  } catch (error) {
    console.error("[DB] Erro ao verificar se é dev:", error);
    return false;
  }
}

/**
 * Verificar se um usuário é master
 */
export async function isUserMaster(userId: string): Promise<boolean> {
  try {
    const dev = await DevUser.findOne({ userId });
    return dev?.role === "master";
  } catch (error) {
    console.error("[DB] Erro ao verificar se é master:", error);
    return false;
  }
}

/**
 * Verificar permissão para ação
 */
export async function canPerformAction(userId: string, requiredRole: DevRole): Promise<boolean> {
  try {
    const dev = await DevUser.findOne({ userId });
    if (!dev) return false;

    const roleHierarchy: Record<DevRole, number> = {
      master: 3,
      creator: 2,
      helper: 1,
    };

    const requiredHierarchy = roleHierarchy[requiredRole];
    const userHierarchy = roleHierarchy[dev.role];

    return userHierarchy >= requiredHierarchy;
  } catch (error) {
    console.error("[DB] Erro ao verificar permissão:", error);
    return false;
  }
}
