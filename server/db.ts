import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  autoModSettings,
  commandSettings,
  guildSettings,
  serverLogs,
  socialNotifications,
  users,
  welcomeMessages,
  type InsertAutoModSettings,
  type InsertGuildSettings,
  type InsertServerLog,
  type InsertSocialNotification,
  type InsertWelcomeMessage,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const fields = ["name", "email", "loginMethod", "discordId", "avatar", "accessToken", "refreshToken"] as const;
  for (const field of fields) {
    const value = (user as Record<string, unknown>)[field];
    if (value !== undefined) {
      (values as Record<string, unknown>)[field] = value ?? null;
      updateSet[field] = value ?? null;
    }
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }

  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Guild Settings ────────────────────────────────────────────────────────────

export async function getGuildSettings(guildId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(guildSettings).where(eq(guildSettings.guildId, guildId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertGuildSettings(data: InsertGuildSettings) {
  const db = await getDb();
  if (!db) return;
  const { guildId, ...rest } = data;
  await db
    .insert(guildSettings)
    .values(data)
    .onDuplicateKeyUpdate({ set: rest });
}

// ─── Auto Moderation ──────────────────────────────────────────────────────────

export async function getAutoModSettings(guildId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(autoModSettings).where(eq(autoModSettings.guildId, guildId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertAutoModSettings(data: InsertAutoModSettings) {
  const db = await getDb();
  if (!db) return;
  const { guildId, ...rest } = data;
  await db
    .insert(autoModSettings)
    .values(data)
    .onDuplicateKeyUpdate({ set: rest });
}

// ─── Social Notifications ─────────────────────────────────────────────────────

export async function getSocialNotifications(guildId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(socialNotifications).where(eq(socialNotifications.guildId, guildId));
}

export async function createSocialNotification(data: InsertSocialNotification) {
  const db = await getDb();
  if (!db) return;
  await db.insert(socialNotifications).values(data);
}

export async function updateSocialNotification(id: number, data: Partial<InsertSocialNotification>) {
  const db = await getDb();
  if (!db) return;
  await db.update(socialNotifications).set(data).where(eq(socialNotifications.id, id));
}

export async function deleteSocialNotification(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(socialNotifications).where(eq(socialNotifications.id, id));
}

// ─── Server Logs ──────────────────────────────────────────────────────────────

export async function getServerLogs(guildId: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(serverLogs)
    .where(eq(serverLogs.guildId, guildId))
    .orderBy(desc(serverLogs.createdAt))
    .limit(limit);
}

export async function createServerLog(data: InsertServerLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(serverLogs).values(data);
}

// ─── Command Settings ─────────────────────────────────────────────────────────

export async function getCommandSettings(guildId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(commandSettings).where(eq(commandSettings.guildId, guildId));
}

export async function upsertCommandSetting(guildId: string, commandName: string, data: Partial<typeof commandSettings.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(commandSettings)
    .values({ guildId, commandName, ...data })
    .onDuplicateKeyUpdate({ set: data });
}

// ─── Welcome Messages ─────────────────────────────────────────────────────────

export async function getWelcomeMessages(guildId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(welcomeMessages).where(eq(welcomeMessages.guildId, guildId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertWelcomeMessages(data: InsertWelcomeMessage) {
  const db = await getDb();
  if (!db) return;
  const { guildId, ...rest } = data;
  await db
    .insert(welcomeMessages)
    .values(data)
    .onDuplicateKeyUpdate({ set: rest });
}
