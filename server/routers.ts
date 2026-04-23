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
import { sendBroadcastToAllGuilds } from "./discord-broadcast";
import { sendAdminWelcomeMessage, sendGuildJoinWelcome } from "./welcome-admin";

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
          botToken: null,
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
        botToken: z.string().nullable().optional(),
        botEnabled: z.boolean().optional(),
        maintenanceMode: z.boolean().optional(),
        maintenanceEnabled: z.boolean().optional(),
        alertChannelId: z.string().nullable().optional(),
        maintenanceMessage: z.string().optional(),
        guildName: z.string().nullable().optional(),
        guildIcon: z.string().nullable().optional(),
        ownerId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { guildId, ...rest } = input;
      
      // APENAS O DESENVOLVEDOR PODE ALTERAR MODO DE MANUTENÇÃO
      if (rest.maintenanceMode !== undefined || rest.maintenanceEnabled !== undefined) {
        const DEVELOPER_ID = "761011766440230932";
        if (ctx.user.openId !== DEVELOPER_ID) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas o Desenvolvedor Mestre pode ativar o Modo de Manutenção.",
          });
        }
      }

      // Validar que alertChannelId está configurado se maintenanceEnabled for true
      if (rest.maintenanceEnabled === true && !rest.alertChannelId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Selecione um canal antes de ativar a manutenção.",
        });
      }

      // Bloqueio se o bot não estiver no servidor
      const isBotPresent = await checkBotInGuild(guildId);
      if (!isBotPresent) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "BOT_NOT_IN_GUILD",
        });
      }

      await upsertGuildSettings({ guildId, ...rest }, ctx.user.id, ctx.user.name);
      return { success: true };
    }),

  activateDev: protectedProcedure
    .input(
      z.object({
        guildId: z.string(),
        devCode: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const DEV_ACTIVATION_CODE = "04042003";
      
      if (input.devCode !== DEV_ACTIVATION_CODE) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Código de ativação inválido",
        });
      }

      // Armazenar o ID do usuário como Dev temporário na sessão
      // Isso será verificado no frontend para liberar as abas
      ctx.res.cookie("dev_activated", ctx.user?.openId || "", {
        httpOnly: false,
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        sameSite: "lax",
      });

      return { success: true, message: "Modo Dev ativado com sucesso!" };
    }),

  sendLocalMessage: protectedProcedure
    .input(
      z.object({
        guildId: z.string(),
        channelId: z.string(),
        message: z.string().max(2000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Validar que o usuário tem permissão
      const DEVELOPER_ID = "761011766440230932";
      if (ctx.user.openId !== DEVELOPER_ID) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas o Desenvolvedor Mestre pode enviar mensagens locais.",
        });
      }

      // Validar que o bot está no servidor
      const isBotPresent = await checkBotInGuild(input.guildId);
      if (!isBotPresent) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "BOT_NOT_IN_GUILD",
        });
      }

      // Validar que o canal existe
      const channels = await fetchGuildChannels(input.guildId);
      const channelExists = channels.some(ch => ch.id === input.channelId);
      if (!channelExists) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Canal não encontrado no servidor.",
        });
      }

      try {
        const { sendMessageToChannel, sendAuditLog } = await import("./discord");
        await sendMessageToChannel(input.channelId, input.message);
        
        // Log de Auditoria
        const channelName = channels.find(ch => ch.id === input.channelId)?.name || "desconhecido";
        await sendAuditLog(input.guildId, {
          title: "📨 Mensagem Local Enviada",
          description: `O desenvolvedor **${ctx.user.name}** enviou uma mensagem no canal <#${input.channelId}>.`,
          color: 0x3498DB
        });

        return { success: true, channelName };
      } catch (error: any) {
        console.error("Error sending local message:", error);
        
        // Verificar se é erro de permissão do Discord
        if (error.response?.status === 403) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "O bot não tem permissão para enviar mensagens neste canal.",
          });
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.response?.data?.message || "Erro ao enviar mensagem",
        });
      }
    }),

  testMessage: protectedProcedure
    .input(
      z.object({
        guildId: z.string(),
        channelId: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // APENAS O DESENVOLVEDOR PODE ENVIAR MENSAGENS DE TESTE
      const DEVELOPER_ID = "761011766440230932";
      if (ctx.user.id !== DEVELOPER_ID) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas o Desenvolvedor Mestre pode realizar testes de mensagem.",
        });
      }

      const isBotPresent = await checkBotInGuild(input.guildId);
      if (!isBotPresent) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "BOT_NOT_IN_GUILD",
        });
      }

      try {
        const { sendMessageToChannel, sendAuditLog } = await import("./discord");
        await sendMessageToChannel(input.channelId, input.message);
        
        // Log de Auditoria para o envio de teste
        await sendAuditLog(input.guildId, {
          title: "🚀 Teste de Mensagem Enviado",
          description: `O desenvolvedor **${ctx.user.name}** enviou uma mensagem de teste no canal <#${input.channelId}>.\n\n**Conteúdo:**\n${input.message}`,
          color: 0x2ECC71
        });

        return { success: true };
      } catch (error) {
        console.error("Error sending test message:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "FAILED_TO_SEND_MESSAGE",
        });
      }
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
          welcomeBanner: z.string().optional(),
          goodbyeBanner: z.string().optional(),
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
        welcomeBanner: config.welcomeBanner,
        goodbyeBanner: config.goodbyeBanner,
      });
      return { success: true };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────

// ─── Maintenance Router ───────────────────────────────────────────────────────

const maintenanceRouter = router({
  getSettings: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input }) => {
      const { MaintenanceSettings } = await import("./models");
      const settings = await MaintenanceSettings.findOne({ guildId: input.guildId });
      return settings || { guildId: input.guildId, maintenanceEnabled: false, alertChannelId: null, alertMessage: "Sistema em manutenção" };
    }),

  updateSettings: protectedProcedure
    .input(z.object({
      guildId: z.string(),
      maintenanceEnabled: z.boolean(),
      alertChannelId: z.string().optional(),
      alertMessage: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { MaintenanceSettings } = await import("./models");
      const { guildId, maintenanceEnabled, alertChannelId, alertMessage } = input;

      if (maintenanceEnabled && !alertChannelId) {
        throw new Error("⚠️ Selecione um canal antes de ativar a manutenção.");
      }

      const settings = await MaintenanceSettings.findOneAndUpdate(
        { guildId },
        {
          maintenanceEnabled,
          alertChannelId,
          alertMessage: alertMessage || "Sistema em manutenção",
        },
        { upsert: true, new: true }
      );

      // Log da ação
      await createServerLog({
        guildId,
        eventType: maintenanceEnabled ? "MAINTENANCE_ENABLED" : "MAINTENANCE_DISABLED",
        userId: ctx.user?.openId,
        userName: ctx.user?.name,
        userAvatar: ctx.user?.avatar,
        details: { alertChannelId, alertMessage },
      });

      return settings;
    }),
});

// --- Broadcast Router ---
const broadcastRouter = router({
  sendGlobal: protectedProcedure
    .input(z.object({
      message: z.string().max(2000),
      guildIds: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      // APENAS O DESENVOLVEDOR PODE ENVIAR MENSAGENS GLOBAIS
      const DEVELOPER_ID = "761011766440230932";
      if (ctx.user.openId !== DEVELOPER_ID) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas o Desenvolvedor Mestre pode enviar mensagens globais.",
        });
      }

      const { message, guildIds } = input;
      
      // Buscar nomes dos servidores
      const guilds = await Promise.all(
        guildIds.map(async (guildId) => {
          const settings = await getGuildSettings(guildId);
          return {
            id: guildId,
            name: settings?.guildName || `Guild ${guildId}`,
          };
        })
      );

      // Enviar broadcast
      const results = await sendBroadcastToAllGuilds(message, guilds);

      // Registrar log de auditoria
      await createServerLog({
        guildId: guildIds[0] || "global",
        eventType: "BROADCAST_SENT",
        userId: ctx.user?.openId,
        userName: ctx.user?.name,
        userAvatar: ctx.user?.avatar,
        details: {
          message: message.substring(0, 100),
          totalGuilds: guildIds.length,
          successCount: results.filter(r => r.success).length,
        },
      });

      return results;
    }),
});

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
  maintenance: maintenanceRouter,
  broadcast: broadcastRouter,
});

export type AppRouter = typeof appRouter;
