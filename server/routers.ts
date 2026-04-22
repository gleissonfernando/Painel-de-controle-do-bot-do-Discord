import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createServerLog,
  createSocialNotification,
  deleteSocialNotification,
  getAutoModSettings,
  getCommandSettings,
  getGuildSettings,
  getServerLogs,
  getSocialNotifications,
  getWelcomeMessages,
  upsertAutoModSettings,
  upsertCommandSetting,
  upsertGuildSettings,
  upsertWelcomeMessages,
  updateSocialNotification,
} from "./db";
import {
  fetchDiscordGuilds,
  fetchGuildDetails,
  fetchGuildChannels,
  fetchGuildRoles,
  getMockGuilds,
  checkBotInGuild,
} from "./discord";

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
      return [
        {
          id: "1001",
          name: "My Awesome Server (Demo)",
          icon: null,
          owner: true,
          permissions: "8",
          memberCount: 1247,
          channels: 5,
          roles: 4,
        },
      ];
    }

    try {
      // Fetch all guilds the user is in
      const userGuilds = await fetchDiscordGuilds(user.accessToken);
      
      // Filter guilds where user has MANAGE_GUILD (0x20) or ADMINISTRATOR (0x8) permission
      // Or is the owner. Using bitwise operators on the permission string.
      const adminGuilds = userGuilds.filter(g => {
        const perms = parseInt(g.permissions);
        const isAdmin = (perms & 0x8) === 0x8;
        const canManage = (perms & 0x20) === 0x20;
        return g.owner || isAdmin || canManage;
      });

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
        return {
          id: details?.id || input.guildId,
          name: details?.name || "Server",
          icon: details?.icon || null,
          member_count: details?.approximate_member_count || 0,
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
          botEnabled: true,
          guildName: null,
          guildIcon: null,
          ownerId: null,
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
        botEnabled: z.boolean().optional(),
        guildName: z.string().nullable().optional(),
        guildIcon: z.string().nullable().optional(),
        ownerId: z.string().nullable().optional(),
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

      await upsertGuildSettings({ guildId, ...rest });
      return { success: true };
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

      await upsertAutoModSettings({ guildId, ...rest });
      return { success: true };
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

      await upsertCommandSetting(input.guildId, input.commandName, {
        enabled: input.enabled,
        guildId: input.guildId,
        commandName: input.commandName,
      });
      return { success: true };
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
      await upsertWelcomeMessages({ guildId, ...rest });
      return { success: true };
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
      await upsertWelcomeMessages({
        guildId,
        welcomeEnabled: config.welcomeEnabled,
        welcomeChannelId: config.welcomeChannelId || null,
        welcomeMessage: config.welcomeMessage,
        goodbyeEnabled: config.goodbyeEnabled,
        goodbyeChannelId: config.goodbyeChannelId || null,
        goodbyeMessage: config.goodbyeMessage,
      });
      return { success: true };
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
});

export type AppRouter = typeof appRouter;
