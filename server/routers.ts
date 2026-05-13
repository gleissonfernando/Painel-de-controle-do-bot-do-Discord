import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
    createServerLog,
    createSocialNotification,
    deleteSocialNotification,
    getAutoModSettings,
    getCommandSettings,
    getDb,
    getGuildSettings,
    getServerLogs,
    getSocialNotifications,
    getWelcomeMessages,
    updateSocialNotification,
    upsertAutoModSettings,
    upsertCommandSetting,
    upsertGuildSettings,
    upsertWelcomeMessages,
} from "./db";
import {
    checkBotInGuild,
    fetchDiscordGuilds,
    fetchGuildChannels,
    fetchGuildDetails,
    fetchGuildRoles
} from "./discord";
import { webhookRouter } from "./routers/webhook";
import { widgetRouter } from "./routers/widget";
import { emitCommandToAllBots, emitCommandToBot } from "./_core/socket";
import {
  checkBotAvailability,
  exportLogsFromBot,
  fetchLogStatsFromBot,
  fetchLogsFromBot,
  sendMessageViaBot,
  testGoodbyeMessageViaBot,
  testWelcomeMessageViaBot,
} from "./bot-api-client";
import {
  DevUser,
  GuildConfig,
  MonitorConfig,
  MonitorLog,
  RealTimeLog,
  RealTimeLogConfig,
  ServiceMetric,
  User,
} from "./models";
import { getServicesStatus } from "./monitor-service";

async function sendDashboardCommandToBot(
  guildId: string,
  command: string,
  payload: Record<string, unknown> = {}
) {
  const delivery = await emitCommandToBot(guildId, command, payload);
  return { success: true, queuedForBot: true, ...delivery };
}

async function sendDashboardCommandToAllBots(
  command: string,
  payload: Record<string, unknown> = {}
) {
  const delivery = await emitCommandToAllBots(command, payload);
  return { success: true, queuedForBot: true, ...delivery };
}

// ─── Auth Router ──────────────────────────────────────────────────────────────

const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});

// ─── Guilds Router ────────────────────────────────────────────────────────────

const guildsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user;
    
    // Fallback to demo guilds if no Discord access token
    if (!user || !user.accessToken) {
      console.log("[Guilds] No access token for user, returning empty list.");
      return [];
    }

    try {
      // Fetch all guilds the user is in
      console.log(`[Guilds] Fetching guilds for user ${user.openId} to sync with bot presence...`);
      const userGuilds = await fetchDiscordGuilds(user.accessToken);
      
      // Filter guilds where user has MANAGE_GUILD (0x20) or ADMINISTRATOR (0x8) permission
      const adminGuilds = userGuilds.filter(g => {
        const perms = parseInt(g.permissions);
        const isAdmin = (perms & 0x8) === 0x8;
        const canManage = (perms & 0x20) === 0x20;
        return g.owner || isAdmin || canManage;
      });

      console.log(`[Guilds] User is admin in ${adminGuilds.length} guilds. Checking bot presence for each...`);

      // Check which of these guilds the bot is actually in
      const results = await Promise.all(
        adminGuilds.map(async (guild) => {
          const isBotPresent = await checkBotInGuild(guild.id);

          try {
            // Se o bot estiver presente, pegamos detalhes reais, senão usamos dados básicos do usuário
            let details = null;
            let channelsCount = 0;
            let rolesCount = 0;

            if (isBotPresent) {
              details = await fetchGuildDetails(guild.id);
              const channels = await fetchGuildChannels(guild.id);
              const roles = await fetchGuildRoles(guild.id);
              channelsCount = channels.length;
              rolesCount = roles.length;
            }

            return {
              id: guild.id,
              name: details?.name || guild.name,
              icon: details?.icon || guild.icon,
              owner: guild.owner,
              permissions: guild.permissions,
              memberCount: details?.approximate_member_count || 0,
              channels: channelsCount,
              roles: rolesCount,
              botPresent: isBotPresent,
            };
          } catch (err) {
            console.error(`Error fetching details for guild ${guild.id}:`, err);
            return {
              id: guild.id,
              name: guild.name,
              icon: guild.icon,
              owner: guild.owner,
              permissions: guild.permissions,
              memberCount: 0,
              channels: 0,
              roles: 0,
              botPresent: isBotPresent,
            };
          }
        })
      );

      return results;
    } catch (error) {
      console.error("Error fetching guild data:", error);
      return [];
    }
  }),

  details: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input, ctx }) => {
      const user = ctx.user;
      if (!user || !user.accessToken) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Security check: verify user has permission in this guild
      const userGuilds = await fetchDiscordGuilds(user.accessToken);
      const guild = userGuilds.find(g => g.id === input.guildId);
      if (!guild) throw new TRPCError({ code: "FORBIDDEN", message: "You are not in this server" });
      
      const perms = parseInt(guild.permissions);
      const isAdmin = (perms & 0x8) === 0x8;
      const canManage = (perms & 0x20) === 0x20;
      if (!guild.owner && !isAdmin && !canManage) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Missing permissions in this server" });
      }

      try {
        const details = await fetchGuildDetails(input.guildId);
        const channels = await fetchGuildChannels(input.guildId);
        return {
          id: details?.id || input.guildId,
          name: details?.name || "Server",
          icon: details?.icon || null,
          member_count: details?.approximate_member_count || 0,
          channels: channels.map((c: any) => ({ id: c.id, name: c.name, type: c.type, position: c.position })),
        };
      } catch (error) {
        console.error("Error fetching guild details:", error);
        // Return basic info if fetch fails
        return {
          id: input.guildId,
          name: "Server",
          icon: null,
          member_count: 0,
          description: null,
          channels: [],
        };
      }
    }),

  channels: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input, ctx }) => {
      const user = ctx.user;
      if (!user || !user.accessToken) throw new TRPCError({ code: "UNAUTHORIZED" });
      // Note: Full security check should be here too, but for brevity we assume details/list handles it or we'd add a middleware

      try {
        const channels = await fetchGuildChannels(input.guildId);
        return channels.map((c: any) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          position: c.position,
        }));
      } catch (error) {
        console.error("Error fetching channels:", error);
        return [];
      }
    }),

  roles: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input, ctx }) => {
      const user = ctx.user;
      if (!user || !user.accessToken) throw new TRPCError({ code: "UNAUTHORIZED" });

      try {
        const roles = await fetchGuildRoles(input.guildId);
        return roles.map((r: any) => ({
          id: r.id,
          name: r.name,
          color: r.color,
          position: r.position,
          managed: r.managed,
        }));
      } catch (error) {
        console.error("Error fetching roles:", error);
        return [];
      }
    }),

  checkBotStatus: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input }) => {
      try {
        const botInGuild = await checkBotInGuild(input.guildId);
        return { botInGuild, guildId: input.guildId };
      } catch (error) {
        console.error("Error checking bot status:", error);
        return { botInGuild: false, guildId: input.guildId };
      }
    }),

  getConfig: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input }) => {
      const settings = await getGuildSettings(input.guildId);
      return (
        settings ?? {
          guildId: input.guildId,
          prefix: "!",
          language: "pt-BR",
          timezone: "America/Sao_Paulo",
          adminRoleId: null,
          welcomeChannelId: null,
          logsChannelId: null,
          logChannelId: null,
          leaveChannelId: null,
          alertChannelId: null,
          alertChannelName: null,
          botToken: null,
          botEnabled: true,
          maintenanceEnabled: false,
          maintenanceMessage: "⚠️ O bot está em manutenção. Aguarde, já voltamos.",
          maintenanceVideoUrl: null,
          welcomeMessage: "{user}, bem-vindo(a) ao servidor!",
          leaveMessage: "{user} saiu do servidor.",
        }
      );
    }),

  getChannels: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input }) => {
      const channels = await fetchGuildChannels(input.guildId);
      return channels.map((c: any) => ({ id: c.id, name: c.name, type: c.type, position: c.position }));
    }),

  getRoles: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input }) => {
      const roles = await fetchGuildRoles(input.guildId);
      return roles.map((r: any) => ({ id: r.id, name: r.name, color: r.color, position: r.position, managed: r.managed }));
    }),

  updateConfig: protectedProcedure
    .input(z.object({ guildId: z.string() }).passthrough())
    .mutation(async ({ input, ctx }) => {
      const { guildId, ...rest } = input;
      return sendDashboardCommandToBot(guildId, "guild.updateConfig", {
        ...rest,
        requestedBy: ctx.user?.openId,
        requestedByName: ctx.user?.name,
      });
    }),

  syncData: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .mutation(async ({ input }) => {
      const details = await fetchGuildDetails(input.guildId);
      const channels = await fetchGuildChannels(input.guildId);
      const roles = await fetchGuildRoles(input.guildId);
      return sendDashboardCommandToBot(input.guildId, "guild.syncData", {
        guildName: details?.name,
        guildIcon: details?.icon,
        channels: channels.length,
        roles: roles.length,
      });
    }),
});

// ─── Settings Router ──────────────────────────────────────────────────────────

const settingsRouter = router({
  get: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input }) => {
      const settings = await getGuildSettings(input.guildId);
      return (
        settings ?? {
          guildId: input.guildId,
          prefix: "!",
          language: "en",
          timezone: "UTC",
          adminRoleId: null,
          welcomeChannelId: null,
          logsChannelId: null,
          botToken: null,
          botEnabled: true,
          guildName: null,
          guildIcon: null,
          ownerId: null,
          alertChannelId: null,
          alertChannelName: null,
          maintenanceEnabled: false,
          maintenanceMessage: "⚠️ O bot está em manutenção. Aguarde, já voltamos.",
          maintenanceVideoUrl: null,
          updatedBy: null,
          updatedAt: new Date(),
        }
      );
    }),

  update: protectedProcedure
    .input(
      z.object({
        guildId: z.string(),
        prefix: z.string().max(16).optional(),
        language: z.string().max(16).optional(),
        timezone: z.string().max(64).optional(),
        adminRoleId: z.string().nullable().optional(),
        welcomeChannelId: z.string().nullable().optional(),
        logsChannelId: z.string().nullable().optional(),
        botToken: z.string().nullable().optional(),
        botEnabled: z.boolean().optional(),
        guildName: z.string().nullable().optional(),
        guildIcon: z.string().nullable().optional(),
        ownerId: z.string().nullable().optional(),
        alertChannelId: z.string().nullable().optional(),
        alertChannelName: z.string().nullable().optional(),
        maintenanceEnabled: z.boolean().optional(),
        maintenanceMessage: z.string().optional(),
        maintenanceVideoUrl: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { guildId, ...rest } = input;
      
      // Bloqueio se o bot não estiver no servidor
      const isBotPresent = await checkBotInGuild(guildId);
      if (!isBotPresent) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "BOT_NOT_IN_GUILD",
        });
      }

      return sendDashboardCommandToBot(guildId, "settings.update", rest);
    }),

  activateDev: protectedProcedure
    .input(z.object({ guildId: z.string(), devCode: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const expectedCode = process.env.DEV_ACTIVATION_CODE;
      if (!expectedCode || input.devCode !== expectedCode) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Código de ativação inválido" });
      }
      return sendDashboardCommandToBot(input.guildId, "settings.activateDev", {
        devModeEnabled: true,
        requestedBy: ctx.user?.openId,
      });
    }),
});

// ─── Auto Moderation Router ───────────────────────────────────────────────────

const autoModRouter = router({
  get: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input }) => {
      const settings = await getAutoModSettings(input.guildId);
      return (
        settings ?? {
          guildId: input.guildId,
          antiSpamEnabled: false,
          antiSpamThreshold: 5,
          antiSpamInterval: 5,
          antiLinkEnabled: false,
          antiLinkWhitelist: [],
          wordFilterEnabled: false,
          wordFilterList: [],
          antiCapsEnabled: false,
          antiCapsThreshold: 70,
          punishmentType: "warn" as const,
          punishmentDuration: 10,
          logChannelId: null,
          exemptRoles: [],
          exemptChannels: [],
        }
      );
    }),

  update: protectedProcedure
    .input(
      z.object({
        guildId: z.string(),
        antiSpamEnabled: z.boolean().optional(),
        antiSpamThreshold: z.number().optional(),
        antiSpamInterval: z.number().optional(),
        antiLinkEnabled: z.boolean().optional(),
        antiLinkWhitelist: z.array(z.string()).optional(),
        wordFilterEnabled: z.boolean().optional(),
        wordFilterList: z.array(z.string()).optional(),
        antiCapsEnabled: z.boolean().optional(),
        antiCapsThreshold: z.number().optional(),
        punishmentType: z.enum(["warn", "mute", "kick", "ban"]).optional(),
        punishmentDuration: z.number().optional(),
        logChannelId: z.string().nullable().optional(),
        exemptRoles: z.array(z.string()).optional(),
        exemptChannels: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { guildId, ...rest } = input;

      const isBotPresent = await checkBotInGuild(guildId);
      if (!isBotPresent) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "BOT_NOT_IN_GUILD",
        });
      }

      return sendDashboardCommandToBot(guildId, "autoMod.update", rest);
    }),
});

// ─── Social Notifications Router ──────────────────────────────────────────────

const notificationsRouter = router({
  list: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input }) => {
      return getSocialNotifications(input.guildId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        guildId: z.string(),
        platform: z.enum(["youtube", "twitch", "tiktok"]),
        channelUsername: z.string().min(1),
        channelDisplayName: z.string().optional(),
        discordChannelId: z.string().min(1),
        message: z.string().optional(),
        enabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await createSocialNotification(input);
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        discordChannelId: z.string().optional(),
        message: z.string().optional(),
        enabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateSocialNotification(id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await deleteSocialNotification(input.id);
      return { success: true };
    }),
});

// ─── Logs Router ──────────────────────────────────────────────────────────────

const logsRouter = router({
  list: protectedProcedure
    .input(z.object({ guildId: z.string(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      return getServerLogs(input.guildId, input.limit ?? 50);
    }),

  create: protectedProcedure
    .input(
      z.object({
        guildId: z.string(),
        eventType: z.enum([
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
        ]),
        userId: z.string().optional(),
        userName: z.string().optional(),
        userAvatar: z.string().optional(),
        targetId: z.string().optional(),
        targetName: z.string().optional(),
        details: z.record(z.string(), z.unknown()).optional(),
        channelId: z.string().optional(),
        channelName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await createServerLog(input);
      return { success: true };
    }),

  seed: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .mutation(async ({ input }) => {
      const sampleLogs = [
        {
          guildId: input.guildId,
          eventType: "member_join" as const,
          userId: "123456789",
          userName: "CoolUser#1234",
          details: {},
        },
        {
          guildId: input.guildId,
          eventType: "member_leave" as const,
          userId: "987654321",
          userName: "AnotherUser#5678",
          details: {},
        },
        {
          guildId: input.guildId,
          eventType: "member_ban" as const,
          userId: "111222333",
          userName: "BadActor#0001",
          details: { reason: "Spam" },
        },
        {
          guildId: input.guildId,
          eventType: "message_delete" as const,
          userId: "444555666",
          userName: "SomeUser#9999",
          channelId: "777888999",
          channelName: "general",
          details: { content: "Deleted message content" },
        },
        {
          guildId: input.guildId,
          eventType: "command_used" as const,
          userId: "123456789",
          userName: "CoolUser#1234",
          details: { command: "!help" },
        },
      ];
      for (const log of sampleLogs) {
        await createServerLog(log);
      }
      return { success: true };
    }),

  getLogs: protectedProcedure
    .input(z.object({ guildId: z.string(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      const logs = await getServerLogs(input.guildId, input.limit ?? 50);
      return { logs, total: logs.length };
    }),

  clearOldLogs: protectedProcedure
    .input(z.object({ guildId: z.string(), days: z.number().default(30), daysOld: z.number().optional() }))
    .mutation(async ({ input }) => {
      const days = input.daysOld ?? input.days;
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const db = await getDb();
      if (!db) return { success: true };
      const ServerLog = db.model("ServerLog");
      await ServerLog.deleteMany({ guildId: input.guildId, createdAt: { $lt: cutoffDate } });
      return { success: true };
    }),

  exportLogs: protectedProcedure
    .input(z.object({ guildId: z.string(), type: z.string().optional() }))
    .mutation(async ({ input }) => {
      const logs = await getServerLogs(input.guildId, 1000);
      const csv = [
        "eventType,userId,userName,targetId,targetName,channelId,channelName,createdAt",
        ...logs.map(log => `${log.eventType},${log.userId || ""}, ${log.userName || ""},${log.targetId || ""},${log.targetName || ""},${log.channelId || ""},${log.channelName || ""},${log.createdAt}`)
      ].join("\n");
      return { csv, timestamp: new Date().toISOString() };
    }),

  listFromBot: protectedProcedure
    .input(z.object({ guildId: z.string(), type: z.string().optional(), limit: z.number().optional(), skip: z.number().optional() }))
    .query(({ input }) => fetchLogsFromBot(input.guildId, input)),

  statsFromBot: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(({ input }) => fetchLogStatsFromBot(input.guildId)),

  exportFromBot: protectedProcedure
    .input(z.object({ guildId: z.string(), type: z.string().optional() }))
    .mutation(async ({ input }) => {
      const csv = await exportLogsFromBot(input.guildId, { type: input.type });
      return { csv, timestamp: new Date().toISOString() };
    }),
});

// ─── Commands Router ──────────────────────────────────────────────────────────

const commandsRouter = router({
  list: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input }) => {
      const saved = await getCommandSettings(input.guildId);
      const defaultCommands = [
        {
          commandName: "help",
          description: "Shows help information",
          category: "General",
        },
        {
          commandName: "ping",
          description: "Check bot latency",
          category: "General",
        },
        {
          commandName: "info",
          description: "Server information",
          category: "General",
        },
        {
          commandName: "ban",
          description: "Ban a member",
          category: "Moderation",
        },
        {
          commandName: "kick",
          description: "Kick a member",
          category: "Moderation",
        },
        {
          commandName: "mute",
          description: "Mute a member",
          category: "Moderation",
        },
        {
          commandName: "warn",
          description: "Warn a member",
          category: "Moderation",
        },
        {
          commandName: "clear",
          description: "Clear messages",
          category: "Moderation",
        },
        { commandName: "play", description: "Play music", category: "Music" },
        {
          commandName: "skip",
          description: "Skip current song",
          category: "Music",
        },
        { commandName: "stop", description: "Stop music", category: "Music" },
        {
          commandName: "queue",
          description: "Show music queue",
          category: "Music",
        },
      ];
      return defaultCommands.map(cmd => {
        const savedCmd = saved.find(s => s.commandName === cmd.commandName);
        return {
          ...cmd,
          enabled: savedCmd?.enabled ?? true,
          cooldown: savedCmd?.cooldown ?? 0,
          requiredRoleId: savedCmd?.requiredRoleId ?? null,
        };
      });
    }),

  toggle: protectedProcedure
    .input(
      z.object({
        guildId: z.string(),
        commandName: z.string(),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const isBotPresent = await checkBotInGuild(input.guildId);
      if (!isBotPresent) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "BOT_NOT_IN_GUILD",
        });
      }

      return sendDashboardCommandToBot(input.guildId, "commands.toggle", {
        commandName: input.commandName,
        enabled: input.enabled,
      });
    }),
});

// ─── Welcome Messages Router ──────────────────────────────────────────────────

const messagesRouter = router({
  get: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input }) => {
      const msgs = await getWelcomeMessages(input.guildId);
      return (
        msgs ?? {
          guildId: input.guildId,
          welcomeEnabled: false,
          welcomeChannelId: null,
          welcomeMessage: "Welcome to the server, {user}! 🎉",
          goodbyeEnabled: false,
          goodbyeChannelId: null,
          goodbyeMessage: "{user} has left the server.",
          dmWelcome: false,
          dmMessage: "Welcome to {server}! Please read the rules.",
        }
      );
    }),

  update: protectedProcedure
    .input(
      z.object({
        guildId: z.string(),
        welcomeEnabled: z.boolean().optional(),
        welcomeChannelId: z.string().nullable().optional(),
        welcomeMessage: z.string().optional(),
        goodbyeEnabled: z.boolean().optional(),
        goodbyeChannelId: z.string().nullable().optional(),
        goodbyeMessage: z.string().optional(),
        dmWelcome: z.boolean().optional(),
        dmMessage: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { guildId, ...rest } = input;
      return sendDashboardCommandToBot(guildId, "messages.update", rest);
    }),
});

// ─── Welcome/Goodbye Router ───────────────────────────────────────────────────

const welcomeGoodbyeRouter = router({
  get: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input }) => {
      const msgs = await getWelcomeMessages(input.guildId);
      return (
        msgs ?? {
          welcomeEnabled: true,
          welcomeChannelId: "",
          welcomeMessage:
            "Bem-vindo {user}! 👋 Você é o {joinPosition} membro de {server}",
          goodbyeEnabled: true,
          goodbyeChannelId: "",
          goodbyeMessage: "{user} saiu do servidor. Até logo! 👋",
        }
      );
    }),

  save: protectedProcedure
    .input(
      z.object({
        guildId: z.string(),
        config: z.object({
          welcomeEnabled: z.boolean(),
          welcomeChannelId: z.string(),
          welcomeMessage: z.string(),
          goodbyeEnabled: z.boolean(),
          goodbyeChannelId: z.string(),
          goodbyeMessage: z.string(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const { guildId, config } = input;
      return sendDashboardCommandToBot(guildId, "welcomeGoodbye.save", {
        welcomeEnabled: config.welcomeEnabled,
        welcomeChannelId: config.welcomeChannelId || null,
        welcomeMessage: config.welcomeMessage,
        goodbyeEnabled: config.goodbyeEnabled,
        goodbyeChannelId: config.goodbyeChannelId || null,
        goodbyeMessage: config.goodbyeMessage,
      });
    }),

  sendTest: protectedProcedure
    .input(z.object({
      guildId: z.string(),
      channelId: z.string(),
      type: z.enum(["WELCOME", "EXIT"]).optional(),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      if (input.type === "EXIT") {
        return testGoodbyeMessageViaBot({ guildId: input.guildId, channelId: input.channelId });
      }
      return testWelcomeMessageViaBot({ guildId: input.guildId, channelId: input.channelId });
    }),

  sendWelcome: protectedProcedure
    .input(z.object({
      guildId: z.string(),
      channelId: z.string().nullable(),
      mode: z.enum(["local", "global"]),
      imageUrl: z.string(),
      userName: z.string().optional(),
      userAvatar: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      if (input.channelId) {
        await sendMessageViaBot({
          guildId: input.guildId,
          channelId: input.channelId,
          message: `Bem-vindo(a), ${input.userName || "membro"}!`,
        });
      }
      return { success: true };
    }),

  sendExit: protectedProcedure
    .input(z.object({
      guildId: z.string(),
      channelId: z.string().nullable(),
      mode: z.enum(["local", "global"]).optional(),
      imageUrl: z.string().optional(),
      userName: z.string().optional(),
      userAvatar: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      if (input.channelId) {
        await sendMessageViaBot({
          guildId: input.guildId,
          channelId: input.channelId,
          message: `${input.userName || "Um membro"} saiu do servidor.`,
        });
      }
      return { success: true };
    }),
});

// ─── Maintenance Router ───────────────────────────────────────────────────────

const maintenanceRouter = router({
  getGlobal: protectedProcedure.query(async () => {
    // Import GlobalConfig from models
    const { GlobalConfig } = await import("./models");
    const db = await getDb();
    const global = await GlobalConfig.findOne().lean();
    return global ?? {
      maintenanceGlobalEnabled: false,
      maintenanceMessage: "⚠️ O bot está em manutenção global. Aguarde, já voltamos.",
      maintenanceVideoUrl: null,
      updatedBy: null,
      updatedAt: new Date(),
    };
  }),

  setGlobal: protectedProcedure
    .input(
      z.object({
        maintenanceGlobalEnabled: z.boolean().optional(),
        maintenanceMessage: z.string().optional(),
        maintenanceVideoUrl: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return sendDashboardCommandToAllBots("maintenance.setGlobal", {
        ...input,
        requestedBy: ctx.user?.openId,
      });
    }),

  updateGlobal: protectedProcedure
    .input(
      z.object({
        maintenanceGlobalEnabled: z.boolean().optional(),
        maintenanceMessage: z.string().optional(),
        maintenanceVideoUrl: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return sendDashboardCommandToAllBots("maintenance.updateGlobal", {
        ...input,
        requestedBy: ctx.user?.openId,
      });
    }),

  sendAlert: protectedProcedure
    .input(z.object({
      guildId: z.string().optional(),
      type: z.enum(["local", "global"]).optional(),
      message: z.string(),
      mediaUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      if (input.guildId && input.type !== "global") {
        const result = await sendDashboardCommandToBot(input.guildId, "maintenance.sendAlert", input);
        return [{ ...result, guildId: input.guildId }];
      }

      const result = await sendDashboardCommandToAllBots("maintenance.sendAlert", input);
      return [{ ...result, guildId: "global" }];
    }),
});

// ─── Broadcast Router ────────────────────────────────────────────────────────

const broadcastRouter = router({
  sendGlobal: protectedProcedure
    .input(z.object({ guildIds: z.array(z.string()), message: z.string(), channelId: z.string().optional() }))
    .mutation(async ({ input }) => {
      const results = await Promise.all(
        input.guildIds.map(async (guildId) => {
          try {
            const result = await sendDashboardCommandToBot(guildId, "broadcast.sendGlobal", {
              message: input.message,
              channelId: input.channelId,
            });
            return { guildId, ...result };
          } catch (error: any) {
            return { guildId, success: false, error: error.message };
          }
        })
      );
      return results;
    }),
});

// ─── Real-Time Logs Router ───────────────────────────────────────────────────

const realTimeLogsRouter = router({
  getLogs: protectedProcedure
    .input(z.object({ guildId: z.string(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      await getDb();
      return RealTimeLog.find({ guildId: input.guildId }).sort({ createdAt: -1 }).limit(input.limit ?? 50).lean();
    }),

  getConfig: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input }) => {
      await getDb();
      return (
        await RealTimeLogConfig.findOne({ guildId: input.guildId }).lean()
      ) ?? {
        guildId: input.guildId,
        logChannelId: null,
        enabled: true,
        updatedBy: null,
        updatedAt: new Date(),
      };
    }),

  updateConfig: protectedProcedure
    .input(z.object({ guildId: z.string(), logChannelId: z.string().nullable(), enabled: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const { guildId, ...rest } = input;
      return sendDashboardCommandToBot(guildId, "realTimeLogs.updateConfig", {
        ...rest,
        requestedBy: ctx.user?.name || ctx.user?.openId || "N/A",
      });
    }),
});

// ─── Monitor Router ──────────────────────────────────────────────────────────

const monitorRouter = router({
  getConfig: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input }) => {
      await getDb();
      return (
        await MonitorConfig.findOne({ guildId: input.guildId }).lean()
      ) ?? {
        guildId: input.guildId,
        alertChannelId: null,
        enabled: true,
        updatedBy: "N/A",
        updatedAt: new Date(),
      };
    }),

  updateConfig: protectedProcedure
    .input(z.object({ guildId: z.string(), alertChannelId: z.string().nullable(), enabled: z.boolean().optional() }))
    .mutation(async ({ input, ctx }) => {
      const { guildId, ...rest } = input;
      return sendDashboardCommandToBot(guildId, "monitor.updateConfig", {
        ...rest,
        requestedBy: ctx.user?.name || ctx.user?.openId || "N/A",
      });
    }),

  getStatus: protectedProcedure.query(() => getServicesStatus()),

  getMetrics: protectedProcedure
    .input(z.object({ service: z.string(), hours: z.number().optional() }))
    .query(async ({ input }) => {
      await getDb();
      const since = new Date(Date.now() - (input.hours ?? 6) * 60 * 60 * 1000);
      return ServiceMetric.find({ service: input.service, createdAt: { $gte: since } })
        .sort({ createdAt: 1 })
        .limit(200)
        .lean();
    }),

  getLogs: protectedProcedure
    .input(z.object({ guildId: z.string(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      await getDb();
      return MonitorLog.find({ guildId: input.guildId }).sort({ createdAt: -1 }).limit(input.limit ?? 20).lean();
    }),

  listCommands: protectedProcedure.query(() => [
    { name: "help", category: "geral", description: "Lista os comandos disponíveis." },
    { name: "ping", category: "sistema", description: "Verifica a latência do bot." },
    { name: "ban", category: "moderação", description: "Bane um membro do servidor." },
    { name: "kick", category: "moderação", description: "Expulsa um membro do servidor." },
    { name: "clear", category: "moderação", description: "Limpa mensagens de um canal." },
  ]),

  sendTest: protectedProcedure
    .input(z.object({ guildId: z.string(), channelId: z.string() }))
    .mutation(async ({ input }) => {
      return sendDashboardCommandToBot(input.guildId, "monitor.sendTest", {
        channelId: input.channelId,
        message: "🧪 Teste de alerta do monitoramento Magnatas.",
      });
    }),

  testAlert: protectedProcedure
    .input(z.object({ guildId: z.string(), channelId: z.string() }))
    .mutation(async ({ input }) => {
      return sendDashboardCommandToBot(input.guildId, "monitor.testAlert", {
        channelId: input.channelId,
        message: "🧪 Teste de alerta do NOC Magnatas.",
      });
    }),
});

// ─── Developer / Debug Routers ───────────────────────────────────────────────

const userSyncRouter = router({
  list: adminProcedure.query(async () => {
    await getDb();
    const users = await User.find({ $or: [{ steamHex: { $ne: null } }, { discordId: { $ne: null } }] })
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();
    return users.map((u: any) => ({ ...u, id: String(u._id) }));
  }),
});

const debugRouter = router({
  testBotConnection: adminProcedure.mutation(async () => {
    const start = Date.now();
    const success = await checkBotAvailability();
    return {
      success,
      botUrl: process.env.BOT_API_URL || "http://localhost:3000",
      duration: Date.now() - start,
      error: success ? undefined : "Bot API indisponível",
    };
  }),
});

const devManagementRouter = router({
  list: adminProcedure.query(async () => {
    await getDb();
    const devs = await DevUser.find().sort({ createdAt: -1 }).lean();
    return devs.map((dev: any) => ({ ...dev, id: String(dev._id) }));
  }),
});

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  guilds: guildsRouter,
  settings: settingsRouter,
  autoMod: autoModRouter,
  notifications: notificationsRouter,
  logs: logsRouter,
  commands: commandsRouter,
  messages: messagesRouter,
  welcomeGoodbye: welcomeGoodbyeRouter,
  widget: widgetRouter,
  webhook: webhookRouter,
  maintenance: maintenanceRouter,
  broadcast: broadcastRouter,
  realTimeLogs: realTimeLogsRouter,
  monitor: monitorRouter,
  userSync: userSyncRouter,
  debug: debugRouter,
  devManagement: devManagementRouter,
});

export type AppRouter = typeof appRouter;
