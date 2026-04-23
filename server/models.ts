import mongoose, { Schema, Document } from "mongoose";

// --- Users ---
export interface IUser extends Document {
  openId: string;
  discordId?: string;
  name?: string;
  email?: string;
  avatar?: string;
  accessToken?: string;
  refreshToken?: string;
  loginMethod?: string;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

const UserSchema = new Schema<IUser>(
  {
    openId: { type: String, required: true, unique: true },
    discordId: String,
    name: String,
    email: String,
    avatar: String,
    accessToken: String,
    refreshToken: String,
    loginMethod: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
    lastSignedIn: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);

// --- Guild Settings ---
export interface IGuildSettings extends Document {
  guildId: string;
  guildName?: string;
  guildIcon?: string;
  ownerId?: string;
  prefix: string;
  language: string;
  timezone: string;
  adminRoleId?: string;
  welcomeChannelId?: string;
  logsChannelId?: string;
  botToken?: string;
  botEnabled: boolean;
  maintenanceMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GuildSettingsSchema = new Schema<IGuildSettings>(
  {
    guildId: { type: String, required: true, unique: true },
    guildName: String,
    guildIcon: String,
    ownerId: String,
    prefix: { type: String, default: "!" },
    language: { type: String, default: "en" },
    timezone: { type: String, default: "UTC" },
    adminRoleId: String,
    welcomeChannelId: String,
    logsChannelId: String,
    botToken: String,
    botEnabled: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const GuildSettings = mongoose.model<IGuildSettings>("GuildSettings", GuildSettingsSchema);

// --- Auto Moderation ---
export interface IAutoModSettings extends Document {
  guildId: string;
  antiSpamEnabled: boolean;
  antiSpamThreshold: number;
  antiSpamInterval: number;
  antiLinkEnabled: boolean;
  antiLinkWhitelist: string[];
  wordFilterEnabled: boolean;
  wordFilterList: string[];
  antiCapsEnabled: boolean;
  antiCapsThreshold: number;
  punishmentType: "warn" | "mute" | "kick" | "ban";
  punishmentDuration: number;
  logChannelId?: string;
  exemptRoles: string[];
  exemptChannels: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AutoModSettingsSchema = new Schema<IAutoModSettings>(
  {
    guildId: { type: String, required: true, unique: true },
    antiSpamEnabled: { type: Boolean, default: false },
    antiSpamThreshold: { type: Number, default: 5 },
    antiSpamInterval: { type: Number, default: 5 },
    antiLinkEnabled: { type: Boolean, default: false },
    antiLinkWhitelist: { type: [String], default: [] },
    wordFilterEnabled: { type: Boolean, default: false },
    wordFilterList: { type: [String], default: [] },
    antiCapsEnabled: { type: Boolean, default: false },
    antiCapsThreshold: { type: Number, default: 70 },
    punishmentType: { type: String, enum: ["warn", "mute", "kick", "ban"], default: "warn" },
    punishmentDuration: { type: Number, default: 10 },
    logChannelId: String,
    exemptRoles: { type: [String], default: [] },
    exemptChannels: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const AutoModSettings = mongoose.model<IAutoModSettings>("AutoModSettings", AutoModSettingsSchema);

// --- Social Notifications ---
export interface ISocialNotification extends Document {
  guildId: string;
  platform: "youtube" | "twitch" | "tiktok";
  channelUsername: string;
  channelId?: string;
  channelDisplayName?: string;
  discordChannelId: string;
  message?: string;
  enabled: boolean;
  isLive: boolean;
  lastNotifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SocialNotificationSchema = new Schema<ISocialNotification>(
  {
    guildId: { type: String, required: true },
    platform: { type: String, enum: ["youtube", "twitch", "tiktok"], required: true },
    channelUsername: { type: String, required: true },
    channelId: String,
    channelDisplayName: String,
    discordChannelId: { type: String, required: true },
    message: String,
    enabled: { type: Boolean, default: true },
    isLive: { type: Boolean, default: false },
    lastNotifiedAt: Date,
  },
  { timestamps: true }
);

export const SocialNotification = mongoose.model<ISocialNotification>("SocialNotification", SocialNotificationSchema);

// --- Server Logs ---
export interface IServerLog extends Document {
  guildId: string;
  eventType: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  targetId?: string;
  targetName?: string;
  details?: Record<string, any>;
  channelId?: string;
  channelName?: string;
  createdAt: Date;
}

const ServerLogSchema = new Schema<IServerLog>(
  {
    guildId: { type: String, required: true },
    eventType: { type: String, required: true },
    userId: String,
    userName: String,
    userAvatar: String,
    targetId: String,
    targetName: String,
    details: Schema.Types.Mixed,
    channelId: String,
    channelName: String,
    createdAt: { type: Date, default: Date.now },
  }
);

export const ServerLog = mongoose.model<IServerLog>("ServerLog", ServerLogSchema);

// --- Command Settings ---
export interface ICommandSetting extends Document {
  guildId: string;
  commandName: string;
  enabled: boolean;
  cooldown: number;
  requiredRoleId?: string;
  allowedChannels: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CommandSettingSchema = new Schema<ICommandSetting>(
  {
    guildId: { type: String, required: true },
    commandName: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    cooldown: { type: Number, default: 0 },
    requiredRoleId: String,
    allowedChannels: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const CommandSetting = mongoose.model<ICommandSetting>("CommandSetting", CommandSettingSchema);

// --- Welcome Messages ---
export interface IWelcomeMessage extends Document {
  guildId: string;
  welcomeEnabled: boolean;
  welcomeChannelId?: string;
  welcomeMessage?: string;
  goodbyeEnabled: boolean;
  goodbyeChannelId?: string;
  goodbyeMessage?: string;
  dmWelcome: boolean;
  dmMessage?: string;
  welcomeBanner?: string;
  goodbyeBanner?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WelcomeMessageSchema = new Schema<IWelcomeMessage>(
  {
    guildId: { type: String, required: true, unique: true },
    welcomeEnabled: { type: Boolean, default: false },
    welcomeChannelId: String,
    welcomeMessage: String,
    goodbyeEnabled: { type: Boolean, default: false },
    goodbyeChannelId: String,
    goodbyeMessage: String,
    dmWelcome: { type: Boolean, default: false },
    dmMessage: String,
    welcomeBanner: String,
    goodbyeBanner: String,
  },
  { timestamps: true }
);

export const WelcomeMessage = mongoose.model<IWelcomeMessage>("WelcomeMessage", WelcomeMessageSchema);

// --- Maintenance Settings ---
export interface IMaintenanceSettings extends Document {
  guildId: string;
  maintenanceEnabled: boolean;
  alertChannelId?: string;
  alertMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceSettingsSchema = new Schema<IMaintenanceSettings>(
  {
    guildId: { type: String, required: true, unique: true },
    maintenanceEnabled: { type: Boolean, default: false },
    alertChannelId: String,
    alertMessage: { type: String, default: "Sistema em manutenção" },
  },
  { timestamps: true }
);

export const MaintenanceSettings = mongoose.model<IMaintenanceSettings>("MaintenanceSettings", MaintenanceSettingsSchema);
