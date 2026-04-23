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

// --- Guild Config (Antigo GuildSettings) ---
export interface IGuildConfig extends Document {
  guildId: string;
  guildName?: string;
  guildIcon?: string;
  ownerId?: string;
  alertChannelId: string | null;
  alertChannelName: string | null;
  maintenanceEnabled: boolean;
  maintenanceMessage: string;
  maintenanceVideoUrl: string | null;
  updatedBy: string;
  updatedAt: Date;
}

const GuildConfigSchema = new Schema<IGuildConfig>(
  {
    guildId: { type: String, required: true, unique: true },
    guildName: String,
    guildIcon: String,
    ownerId: String,
    alertChannelId: { type: String, default: null },
    alertChannelName: { type: String, default: null },
    maintenanceEnabled: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: "⚠️ O bot está em manutenção. Aguarde, já voltamos." },
    maintenanceVideoUrl: { type: String, default: null },
    updatedBy: String,
  },
  { timestamps: true }
);

export const GuildConfig = mongoose.model<IGuildConfig>("GuildConfig", GuildConfigSchema);

// --- Global Config ---
export interface IGlobalConfig extends Document {
  maintenanceGlobalEnabled: boolean;
  maintenanceMessage: string;
  maintenanceVideoUrl: string | null;
  updatedBy: string;
  updatedAt: Date;
}

const GlobalConfigSchema = new Schema<IGlobalConfig>(
  {
    maintenanceGlobalEnabled: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: "⚠️ O bot está em manutenção global. Aguarde, já voltamos." },
    maintenanceVideoUrl: { type: String, default: null },
    updatedBy: String,
  },
  { timestamps: true }
);

export const GlobalConfig = mongoose.model<IGlobalConfig>("GlobalConfig", GlobalConfigSchema);

// --- Manter compatibilidade com modelos antigos se necessário ---
export const GuildSettings = GuildConfig;
export const MaintenanceSettings = GuildConfig;

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

// --- Dev Audit Log ---
export interface IDevAuditLog extends Document {
  devUserId: string;
  action: string;
  details: Record<string, any>;
  timestamp: Date;
}

const DevAuditLogSchema = new Schema<IDevAuditLog>(
  {
    devUserId: { type: String, required: true },
    action: { type: String, required: true },
    details: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const DevAuditLog = mongoose.model<IDevAuditLog>("DevAuditLog", DevAuditLogSchema);

// --- Guild Removal Log ---
export interface IGuildRemovalLog extends Document {
  guildId: string;
  guildName?: string;
  removedBy: string;
  reason?: string;
  timestamp: Date;
}

const GuildRemovalLogSchema = new Schema<IGuildRemovalLog>(
  {
    guildId: { type: String, required: true },
    guildName: String,
    removedBy: { type: String, required: true },
    reason: String,
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const GuildRemovalLog = mongoose.model<IGuildRemovalLog>("GuildRemovalLog", GuildRemovalLogSchema);

// --- Dev Users ---
export type DevRole = "master" | "creator" | "helper";

export interface IDevUser extends Document {
  userId: string;
  username: string;
  email?: string;
  avatar?: string;
  role: DevRole;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DevUserSchema = new Schema<IDevUser>(
  {
    userId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    email: String,
    avatar: String,
    role: { type: String, enum: ["master", "creator", "helper"], default: "helper" },
    createdBy: String,
  },
  { timestamps: true }
);

export const DevUser = mongoose.model<IDevUser>("DevUser", DevUserSchema);

// --- Log Configuration ---
export interface ILogConfig extends Document {
  guildId: string;
  messageDeleteChannelId?: string;
  messageEditChannelId?: string;
  memberJoinChannelId?: string;
  memberLeaveChannelId?: string;
  botMessageChannelId?: string;
  moderationChannelId?: string;
  logsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LogConfigSchema = new Schema<ILogConfig>(
  {
    guildId: { type: String, required: true, unique: true },
    messageDeleteChannelId: String,
    messageEditChannelId: String,
    memberJoinChannelId: String,
    memberLeaveChannelId: String,
    botMessageChannelId: String,
    moderationChannelId: String,
    logsEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const LogConfig = mongoose.model<ILogConfig>("LogConfig", LogConfigSchema);

// --- Guild Event Logs ---
export interface IGuildEventLog extends Document {
  guildId: string;
  eventType: "MESSAGE_DELETE" | "MESSAGE_EDIT" | "MEMBER_JOIN" | "MEMBER_LEAVE" | "BOT_MESSAGE";
  userId?: string;
  userName?: string;
  userAvatar?: string;
  details: Record<string, any>;
  timestamp: Date;
}

const GuildEventLogSchema = new Schema<IGuildEventLog>(
  {
    guildId: { type: String, required: true, index: true },
    eventType: {
      type: String,
      enum: ["MESSAGE_DELETE", "MESSAGE_EDIT", "MEMBER_JOIN", "MEMBER_LEAVE", "BOT_MESSAGE"],
      index: true,
    },
    userId: String,
    userName: String,
    userAvatar: String,
    details: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

export const GuildEventLog = mongoose.model<IGuildEventLog>("GuildEventLog", GuildEventLogSchema);

// --- Real-Time Logs ---
export interface IRealTimeLog extends Document {
  guildId: string;
  channelId?: string;
  title: string;
  description: string;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  imageUrl?: string;
  footer?: string;
  color?: number;
  type?: string;
  createdAt: Date;
}

const RealTimeLogSchema = new Schema<IRealTimeLog>(
  {
    guildId: { type: String, required: true, index: true },
    channelId: String,
    title: { type: String, required: true },
    description: { type: String, required: true },
    fields: [{ name: String, value: String, inline: Boolean }],
    imageUrl: String,
    footer: String,
    color: { type: Number, default: 0x000000 },
    type: { type: String, index: true },
  },
  { timestamps: true }
);

export const RealTimeLog = mongoose.model<IRealTimeLog>("RealTimeLog", RealTimeLogSchema);

// --- Real-Time Log Configuration ---
export interface IRealTimeLogConfig extends Document {
  guildId: string;
  logChannelId: string | null;
  enabled: boolean;
  updatedBy: string;
  updatedAt: Date;
}

const RealTimeLogConfigSchema = new Schema<IRealTimeLogConfig>(
  {
    guildId: { type: String, required: true, unique: true },
    logChannelId: { type: String, default: null },
    enabled: { type: Boolean, default: true },
    updatedBy: String,
  },
  { timestamps: true }
);

export const RealTimeLogConfig = mongoose.model<IRealTimeLogConfig>("RealTimeLogConfig", RealTimeLogConfigSchema);

// --- Monitor Config ---
export interface IMonitorConfig extends Document {
  guildId: string;
  alertChannelId: string | null;
  enabled: boolean;
  updatedBy: string;
  updatedAt: Date;
}

const MonitorConfigSchema = new Schema<IMonitorConfig>(
  {
    guildId: { type: String, required: true, unique: true },
    alertChannelId: { type: String, default: null },
    enabled: { type: Boolean, default: true },
    updatedBy: { type: String, default: "N/A" },
  },
  { timestamps: true }
);

export const MonitorConfig = mongoose.model<IMonitorConfig>("MonitorConfig", MonitorConfigSchema);

// --- Monitor Log ---
export interface IMonitorLog extends Document {
  guildId: string;
  service: string;
  status: string;
  message?: string;
  createdAt: Date;
}

const MonitorLogSchema = new Schema<IMonitorLog>(
  {
    guildId: { type: String, required: true },
    service: { type: String, required: true },
    status: { type: String, required: true },
    message: String,
    createdAt: { type: Date, default: Date.now },
  }
);

export const MonitorLog = mongoose.model<IMonitorLog>("MonitorLog", MonitorLogSchema);
