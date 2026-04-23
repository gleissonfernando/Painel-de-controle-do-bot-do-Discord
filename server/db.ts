import mongoose from "mongoose";
import { 
  User, 
  GuildSettings, 
  AutoModSettings, 
  SocialNotification, 
  ServerLog, 
  CommandSetting, 
  WelcomeMessage 
} from "./models";
import { ENV } from "./_core/env";

let _connected = false;

export async function getDb() {
  if (_connected && mongoose.connection.readyState === 1) return mongoose.connection;

  const uri = process.env.MONGODB_URI;
  if (!uri || uri === "undefined") {
    if (!_connected) {
      console.error("[Database] MONGODB_URI is missing! Please set it in Shard Cloud Environment Variables.");
      _connected = true; // Marca como "tentado" para evitar logs repetitivos
    }
    return null;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000, // Timeout mais rápido para não travar o app
      connectTimeoutMS: 5000,
    });
    _connected = true;
    console.log("[Database] Successfully connected to MongoDB");
    return mongoose.connection;
  } catch (error) {
    console.error("[Database] Connection error:", (error as Error).message);
    return null;
  }
}

// --- Users ---
export async function upsertUser(userData: any): Promise<void> {
  const db = await getDb();
  if (!db) return; // Ignora se o banco não estiver pronto

  const { openId, ...rest } = userData;
  if (!openId) return;
  
  if (!rest.role && openId === ENV.ownerOpenId) {
    rest.role = "admin";
  }

  try {
    await User.findOneAndUpdate(
      { openId },
      { $set: { ...rest, lastSignedIn: new Date() } },
      { upsert: true, returnDocument: 'after' }
    );
  } catch (e) {
    console.error("[Database] Failed to upsert user:", (e as Error).message);
  }
}

export async function getUserByOpenId(openId: string) {
  await getDb();
  return User.findOne({ openId }).lean();
}

// --- Guild Settings ---
export async function getGuildSettings(guildId: string) {
  await getDb();
  return GuildSettings.findOne({ guildId }).lean();
}

export async function upsertGuildSettings(data: any) {
  await getDb();
  const { guildId, ...rest } = data;
  
  // Se estiver ativando o modo de manutenção, dispara o alerta global
  if (rest.maintenanceMode === true) {
    try {
      const { sendGlobalMaintenanceAlert } = await import("./discord");
      await sendGlobalMaintenanceAlert();
    } catch (e) {
      console.error("[Maintenance] Erro ao disparar alerta global:", e);
    }
  }

  await GuildSettings.findOneAndUpdate(
    { guildId },
    { $set: rest },
    { upsert: true, new: true }
  );
}

// --- Auto Moderation ---
export async function getAutoModSettings(guildId: string) {
  await getDb();
  return AutoModSettings.findOne({ guildId }).lean();
}

export async function upsertAutoModSettings(data: any) {
  await getDb();
  const { guildId, ...rest } = data;
  await AutoModSettings.findOneAndUpdate(
    { guildId },
    { $set: rest },
    { upsert: true, new: true }
  );
}

// --- Social Notifications ---
export async function getSocialNotifications(guildId: string) {
  await getDb();
  const notifications = await SocialNotification.find({ guildId }).lean();
  // Map _id to id for frontend compatibility if needed
  return notifications.map(n => ({ ...n, id: n._id.toString() }));
}

export async function createSocialNotification(data: any) {
  await getDb();
  await SocialNotification.create(data);
}

export async function updateSocialNotification(id: string, data: any) {
  await getDb();
  await SocialNotification.findByIdAndUpdate(id, { $set: data });
}

export async function deleteSocialNotification(id: string) {
  await getDb();
  await SocialNotification.findByIdAndDelete(id);
}

// --- Server Logs ---
export async function getServerLogs(guildId: string, limit = 50) {
  await getDb();
  return ServerLog.find({ guildId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function createServerLog(data: any) {
  await getDb();
  await ServerLog.create(data);
}

// --- Command Settings ---
export async function getCommandSettings(guildId: string) {
  await getDb();
  return CommandSetting.find({ guildId }).lean();
}

export async function upsertCommandSetting(guildId: string, commandName: string, data: any) {
  await getDb();
  await CommandSetting.findOneAndUpdate(
    { guildId, commandName },
    { $set: data },
    { upsert: true, new: true }
  );
}

// --- Welcome Messages ---
export async function getWelcomeMessages(guildId: string) {
  await getDb();
  return WelcomeMessage.findOne({ guildId }).lean();
}

export async function upsertWelcomeMessages(data: any) {
  await getDb();
  const { guildId, ...rest } = data;
  await WelcomeMessage.findOneAndUpdate(
    { guildId },
    { $set: rest },
    { upsert: true, new: true }
  );
}
