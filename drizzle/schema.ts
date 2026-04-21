import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  discordId: varchar("discordId", { length: 64 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Guild settings per server
export const guildSettings = mysqlTable("guild_settings", {
  id: int("id").autoincrement().primaryKey(),
  guildId: varchar("guildId", { length: 64 }).notNull().unique(),
  guildName: text("guildName"),
  guildIcon: text("guildIcon"),
  ownerId: varchar("ownerId", { length: 64 }),
  prefix: varchar("prefix", { length: 16 }).default("!").notNull(),
  language: varchar("language", { length: 16 }).default("en").notNull(),
  timezone: varchar("timezone", { length: 64 }).default("UTC").notNull(),
  adminRoleId: varchar("adminRoleId", { length: 64 }),
  welcomeChannelId: varchar("welcomeChannelId", { length: 64 }),
  logsChannelId: varchar("logsChannelId", { length: 64 }),
  botEnabled: boolean("botEnabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GuildSettings = typeof guildSettings.$inferSelect;
export type InsertGuildSettings = typeof guildSettings.$inferInsert;

// Auto moderation settings
export const autoModSettings = mysqlTable("auto_mod_settings", {
  id: int("id").autoincrement().primaryKey(),
  guildId: varchar("guildId", { length: 64 }).notNull().unique(),
  antiSpamEnabled: boolean("antiSpamEnabled").default(false).notNull(),
  antiSpamThreshold: int("antiSpamThreshold").default(5),
  antiSpamInterval: int("antiSpamInterval").default(5),
  antiLinkEnabled: boolean("antiLinkEnabled").default(false).notNull(),
  antiLinkWhitelist: json("antiLinkWhitelist").$type<string[]>(),
  wordFilterEnabled: boolean("wordFilterEnabled").default(false).notNull(),
  wordFilterList: json("wordFilterList").$type<string[]>(),
  antiCapsEnabled: boolean("antiCapsEnabled").default(false).notNull(),
  antiCapsThreshold: int("antiCapsThreshold").default(70),
  punishmentType: mysqlEnum("punishmentType", ["warn", "mute", "kick", "ban"]).default("warn").notNull(),
  punishmentDuration: int("punishmentDuration").default(10),
  logChannelId: varchar("logChannelId", { length: 64 }),
  exemptRoles: json("exemptRoles").$type<string[]>(),
  exemptChannels: json("exemptChannels").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AutoModSettings = typeof autoModSettings.$inferSelect;
export type InsertAutoModSettings = typeof autoModSettings.$inferInsert;

// Social notifications (YouTube, Twitch, TikTok)
export const socialNotifications = mysqlTable("social_notifications", {
  id: int("id").autoincrement().primaryKey(),
  guildId: varchar("guildId", { length: 64 }).notNull(),
  platform: mysqlEnum("platform", ["youtube", "twitch", "tiktok"]).notNull(),
  channelUsername: varchar("channelUsername", { length: 128 }).notNull(),
  channelId: varchar("channelId", { length: 128 }),
  channelDisplayName: text("channelDisplayName"),
  discordChannelId: varchar("discordChannelId", { length: 64 }).notNull(),
  message: text("message"),
  enabled: boolean("enabled").default(true).notNull(),
  isLive: boolean("isLive").default(false).notNull(),
  lastNotifiedAt: timestamp("lastNotifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SocialNotification = typeof socialNotifications.$inferSelect;
export type InsertSocialNotification = typeof socialNotifications.$inferInsert;

// Server logs
export const serverLogs = mysqlTable("server_logs", {
  id: int("id").autoincrement().primaryKey(),
  guildId: varchar("guildId", { length: 64 }).notNull(),
  eventType: mysqlEnum("eventType", [
    "member_join",
    "member_leave",
    "member_ban",
    "member_unban",
    "message_delete",
    "message_edit",
    "channel_create",
    "channel_delete",
    "role_create",
    "role_delete",
    "voice_join",
    "voice_leave",
    "command_used",
  ]).notNull(),
  userId: varchar("userId", { length: 64 }),
  userName: text("userName"),
  userAvatar: text("userAvatar"),
  targetId: varchar("targetId", { length: 64 }),
  targetName: text("targetName"),
  details: json("details").$type<Record<string, unknown>>(),
  channelId: varchar("channelId", { length: 64 }),
  channelName: text("channelName"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ServerLog = typeof serverLogs.$inferSelect;
export type InsertServerLog = typeof serverLogs.$inferInsert;

// Bot commands configuration
export const commandSettings = mysqlTable("command_settings", {
  id: int("id").autoincrement().primaryKey(),
  guildId: varchar("guildId", { length: 64 }).notNull(),
  commandName: varchar("commandName", { length: 64 }).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  cooldown: int("cooldown").default(0),
  requiredRoleId: varchar("requiredRoleId", { length: 64 }),
  allowedChannels: json("allowedChannels").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CommandSetting = typeof commandSettings.$inferSelect;
export type InsertCommandSetting = typeof commandSettings.$inferInsert;

// Welcome messages
export const welcomeMessages = mysqlTable("welcome_messages", {
  id: int("id").autoincrement().primaryKey(),
  guildId: varchar("guildId", { length: 64 }).notNull().unique(),
  welcomeEnabled: boolean("welcomeEnabled").default(false).notNull(),
  welcomeChannelId: varchar("welcomeChannelId", { length: 64 }),
  welcomeMessage: text("welcomeMessage"),
  goodbyeEnabled: boolean("goodbyeEnabled").default(false).notNull(),
  goodbyeChannelId: varchar("goodbyeChannelId", { length: 64 }),
  goodbyeMessage: text("goodbyeMessage"),
  dmWelcome: boolean("dmWelcome").default(false).notNull(),
  dmMessage: text("dmMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WelcomeMessage = typeof welcomeMessages.$inferSelect;
export type InsertWelcomeMessage = typeof welcomeMessages.$inferInsert;
