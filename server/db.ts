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
  if (_connected) return mongoose.connection;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("[Database] MONGODB_URI is not defined in environment variables!");
    return mongoose.connection;
  }

  try {
    // Adicionando opções de timeout para evitar que o servidor trave esperando o banco
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    _connected = true;
    console.log("[Database] Connected to MongoDB");
  } catch (error) {
    console.error("[Database] Failed to connect to MongoDB:", error);
    // Não lançamos erro aqui para permitir que o servidor HTTP suba e responda (evita 502)
  }
  
  return mongoose.connection;
}

// --- Users ---
export async function upsertUser(userData: any): Promise<void> {
  await getDb();
  const { openId, ...rest } = userData;
  if (!openId) throw new Error("User openId is required for upsert");
  
  if (!rest.role && openId === ENV.ownerOpenId) {
    rest.role = "admin";
  }

  await User.findOneAndUpdate(
    { openId },
    { $set: { ...rest, lastSignedIn: new Date() } },
    { upsert: true, new: true }
  );
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
