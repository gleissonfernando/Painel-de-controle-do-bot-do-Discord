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
import axios from "axios";
import { sendBroadcastToAllGuilds } from "./discord-broadcast";
import { sendAdminWelcomeMessage, sendGuildJoinWelcome } from "./welcome-admin";
import { sendMessageToChannel, getGuildTextChannels } from "./discord-messages";
import {
  getAllDevs,
  getDevById,
  createDev,
  updateDevRole,
  removeDev,
  getAuditLogs,
  createAuditLog,
  canPerformAction,
  isUserMaster,
} from "./db-devs";
import { removeGuildBot, getGuildInfo } from "./discord-guild-management";
import {
  getLogConfig,
  updateLogConfig,
  logGuildEvent,
  getGuildLogs,
  getLogsByType,
  getLogStats,
} from "./db-logs";

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
    
    if (!user || !user.accessToken) {
      return [];
    }

    try {
      const userGuilds = await fetchDiscordGuilds(user.accessToken);
      
      const adminGuilds = userGuilds.filter(g => {
        const perms = parseInt(g.permissions);
        const isAdmin = (perms & 0x8) === 0x8;
        const canManage = (perms & 0x20) === 0x20;
        return g.owner || isAdmin || canManage;
      });

      const { fetchBotGuilds } = await import("./bot-api-client");
      const botGuildsData = await fetchBotGuilds();
      const botGuildIds = new Set(botGuildsData.success ? botGuildsData.guilds.map((g: any) => g.id) : []);

      const results = await Promise.all(
        adminGuilds.map(async (guild) => {
          const isBotPresent = botGuildIds.has(guild.id) || await checkBotInGuild(guild.id);

          try {
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

      return results.filter(g => g.botPresent);
    } catch (error) {
      return [];
    }
  }),

  details: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input, ctx }) => {
      const user = ctx.user;
      if (!user || !user.accessToken) throw new TRPCError({ code: "UNAUTHORIZED" });

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
        return {
          id: input.guildId,
          name: "Server",
          icon: null,
          member_count: 0,
        };
      }
    }),

  channels: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input }) => {
      try {
        const channels = await fetchGuildChannels(input.guildId);
        return channels.map((c: any) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          position: c.position,
        }));
      } catch (error) {
        return [];
      }
    }),

  roles: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input }) => {
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
        return [];
      }
    }),
});

// ─── Settings Router ──────────────────────────────────────────────────────────

const settingsRouter = router({
  get: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input }) => {
      const { GuildConfig } = await import("./models");
      const settings = await GuildConfig.findOne({ guildId: input.guildId });
      return settings || {
        guildId: input.guildId,
        alertChannelId: null,
        alertChannelName: null,
        maintenanceEnabled: false,
        maintenanceMessage: "⚠️ O bot está em manutenção. Aguarde, já voltamos.",
        maintenanceVideoUrl: null,
        updatedBy: "N/A",
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        guildId: z.string(),
        alertChannelId: z.string().nullable().optional(),
        alertChannelName: z.string().nullable().optional(),
        maintenanceEnabled: z.boolean().optional(),
        maintenanceMessage: z.string().optional(),
        maintenanceVideoUrl: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { GuildConfig } = await import("./models");
      const { guildId, ...rest } = input;
      
      const updated = await GuildConfig.findOneAndUpdate(
        { guildId },
        { ...rest, updatedBy: ctx.user?.name || "Desconhecido" },
        { upsert: true, new: true }
      );
      return updated;
    }),
});

// ─── Maintenance Router ───────────────────────────────────────────────────────

const maintenanceRouter = router({
  getGlobal: protectedProcedure.query(async () => {
    const { GlobalConfig } = await import("./models");
    const config = await GlobalConfig.findOne();
    return config || {
      maintenanceGlobalEnabled: false,
      maintenanceMessage: "⚠️ O bot está em manutenção global. Aguarde, já voltamos.",
      maintenanceVideoUrl: null,
      updatedBy: "N/A",
    };
  }),

  updateGlobal: protectedProcedure
    .input(z.object({
      maintenanceGlobalEnabled: z.boolean(),
      maintenanceMessage: z.string(),
      maintenanceVideoUrl: z.string().nullable().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { GlobalConfig } = await import("./models");
      const config = await GlobalConfig.findOneAndUpdate(
        {},
        { ...input, updatedBy: ctx.user?.name || "Desconhecido" },
        { upsert: true, new: true }
      );
      return config;
    }),

  sendAlert: protectedProcedure
    .input(z.object({
      guildId: z.string(),
      type: z.enum(["local", "global"]),
      message: z.string(),
      mediaUrl: z.string().nullable().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { guildId, type, message, mediaUrl } = input;
      const DEVELOPER_ID = "761011766440230932";
      
      if (ctx.user.openId !== DEVELOPER_ID) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas desenvolvedores podem disparar alertas." });
      }

      const { GuildConfig } = await import("./models");
      const { sendMessageViaBot } = await import("./bot-api-client");

      let targetGuilds = [];
      if (type === "local") {
        const s = await GuildConfig.findOne({ guildId });
        if (s) targetGuilds.push(s);
      } else {
        targetGuilds = await GuildConfig.find({ alertChannelId: { $ne: null } });
      }

      const results = await Promise.all(targetGuilds.map(async (s) => {
        if (!s.alertChannelId) return { guildId: s.guildId, guildName: s.guildName, success: false, error: "Canal de alerta não configurado" };
        
        try {
          await sendMessageViaBot({
            guildId: s.guildId,
            channelId: s.alertChannelId,
            message: "",
            embeds: [{
              title: "🛠️ Bot em manutenção",
              description: message,
              image: mediaUrl ? { url: mediaUrl } : undefined,
              footer: { text: "Magnatas.gg • Sistema de manutenção" },
              color: 0xFF0000,
              timestamp: new Date(),
            }]
          });
          return { guildId: s.guildId, guildName: s.guildName, success: true };
        } catch (err: any) {
          return { guildId: s.guildId, guildName: s.guildName, success: false, error: err.message };
        }
      }));

      return results;
    }),
});

// --- Real-Time Logs Router ---
const realTimeLogsRouter = router({
  getConfig: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input }) => {
      const { RealTimeLogConfig } = await import("./models");
      const config = await RealTimeLogConfig.findOne({ guildId: input.guildId });
      return config || {
        guildId: input.guildId,
        logChannelId: null,
        enabled: true,
        updatedBy: "N/A",
      };
    }),

  updateConfig: protectedProcedure
    .input(z.object({
      guildId: z.string(),
      logChannelId: z.string().nullable(),
      enabled: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { RealTimeLogConfig } = await import("./models");
      const config = await RealTimeLogConfig.findOneAndUpdate(
        { guildId: input.guildId },
        { ...input, updatedBy: ctx.user?.name || "Desconhecido" },
        { upsert: true, new: true }
      );
      return config;
    }),

  getLogs: protectedProcedure
    .input(z.object({ guildId: z.string(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const { RealTimeLog } = await import("./models");
      return await RealTimeLog.find({ guildId: input.guildId })
        .sort({ createdAt: -1 })
        .limit(input.limit);
    }),

  createLog: publicProcedure
    .input(z.object({
      guildId: z.string(),
      title: z.string(),
      description: z.string(),
      fields: z.array(z.object({ name: z.string(), value: z.string(), inline: z.boolean().optional() })).optional(),
      imageUrl: z.string().optional(),
      footer: z.string().optional(),
      color: z.number().optional(),
      type: z.string().optional(),
      userId: z.string().optional(),
      userName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { RealTimeLog, RealTimeLogConfig } = await import("./models");
      const { sendMessageViaBot } = await import("./bot-api-client");
      
      // 1. Salvar no Banco
      const log = await RealTimeLog.create(input);

      // 2. Emitir via Socket.IO
      const { io } = await import("./_core/socket");
      if (io) {
        io.to(`guild_${input.guildId}`).emit("new_log", log);
      }

      // 3. Enviar para o Discord se configurado
      const config = await RealTimeLogConfig.findOne({ guildId: input.guildId });
      if (config && config.enabled && config.logChannelId) {
        try {
          await sendMessageViaBot({
            guildId: input.guildId,
            channelId: config.logChannelId,
            message: "",
            embeds: [{
              title: input.title,
              description: input.description,
              fields: input.fields,
              image: input.imageUrl ? { url: input.imageUrl } : undefined,
              footer: input.footer ? { text: input.footer } : undefined,
              color: input.color || 0x000000,
              timestamp: new Date(),
            }]
          });
        } catch (err) {
          console.error("Erro ao enviar log para o Discord:", err);
        }
      }

      return log;
    }),
});

// --- Monitor Router ---
const monitorRouter = router({
  getConfig: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input }) => {
      const { MonitorConfig } = await import("./models");
      const config = await MonitorConfig.findOne({ guildId: input.guildId });
      return config || {
        guildId: input.guildId,
        alertChannelId: null,
        enabled: true,
        updatedBy: "N/A",
      };
    }),

  updateConfig: protectedProcedure
    .input(z.object({
      guildId: z.string(),
      alertChannelId: z.string(),
      enabled: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { MonitorConfig } = await import("./models");
      const config = await MonitorConfig.findOneAndUpdate(
        { guildId: input.guildId },
        { ...input, updatedBy: ctx.user?.name || "Desconhecido" },
        { upsert: true, new: true }
      );
      return config;
    }),

  getStatus: protectedProcedure.query(async () => {
    const { getServicesStatus } = await import("./monitor-service");
    return getServicesStatus();
  }),

  getLogs: protectedProcedure
    .input(z.object({ guildId: z.string(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const { MonitorLog } = await import("./models");
      return await MonitorLog.find({ guildId: input.guildId })
        .sort({ createdAt: -1 })
        .limit(input.limit);
    }),

  getMetrics: protectedProcedure
    .input(z.object({ service: z.string(), hours: z.number().default(24) }))
    .query(async ({ input }) => {
      const { ServiceMetric } = await import("./models");
      const startTime = new Date(Date.now() - input.hours * 60 * 60 * 1000);
      return await ServiceMetric.find({ 
        service: input.service,
        createdAt: { $gte: startTime }
      }).sort({ createdAt: 1 });
    }),

  listCommands: protectedProcedure.query(async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const commandsPath = "/home/ubuntu/bot-magnatas-gg/commands";
    const commands: any[] = [];

    try {
      const folders = fs.readdirSync(commandsPath);
      for (const folder of folders) {
        const folderPath = path.join(commandsPath, folder);
        if (fs.statSync(folderPath).isDirectory()) {
          const files = fs.readdirSync(folderPath).filter(f => f.endsWith(".js"));
          for (const file of files) {
            // Como não podemos dar require em arquivos JS arbitrários com facilidade no tRPC
            // vamos ler o conteúdo e extrair o nome e descrição via regex simples
            const content = fs.readFileSync(path.join(folderPath, file), "utf-8");
            const nameMatch = content.match(/\.setName\(['"](.+?)['"]\)/);
            const descMatch = content.match(/\.setDescription\(['"](.+?)['"]\)/);
            
            if (nameMatch) {
              commands.push({
                name: nameMatch[1],
                description: descMatch ? descMatch[1] : "Sem descrição",
                category: folder
              });
            }
          }
        }
      }
    } catch (e) {
      console.error("Erro ao listar comandos:", e);
    }
    return commands;
  }),

  sendTest: protectedProcedure
    .input(z.object({
      guildId: z.string(),
      channelId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { sendMessageViaBot } = await import("./bot-api-client");
      const now = new Date().toLocaleString("pt-BR");
      
      try {
        await sendMessageViaBot({
          guildId: input.guildId,
          channelId: input.channelId,
          message: "",
          embeds: [{
            title: "🧪 TESTE DE MONITORAMENTO MAGNATAS",
            description: `**Status:** Sistema funcionando corretamente\n**Horário:** ${now}\n**Configurado por:** ${ctx.user?.name || "Admin"}`,
            color: 0x00FFFF,
            footer: { text: "Magnatas.gg • Teste de Sistema" },
            timestamp: new Date(),
          }]
        });
        return { success: true };
      } catch (err: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
      }
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
      const DEVELOPER_ID = "761011766440230932";
      const isMaster = ctx.user.openId === DEVELOPER_ID || ctx.user.name === "vilao";
      
      if (!isMaster) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas o Desenvolvedor Mestre pode enviar mensagens globais." });
      }

      const { GuildConfig } = await import("./models");
      const { sendMessageViaBot } = await import("./bot-api-client");

      const results = await Promise.all(input.guildIds.map(async (id) => {
        const s = await GuildConfig.findOne({ guildId: id });
        
        // Se não tiver canal configurado, tenta buscar o canal de alerta padrão
        let targetChannelId = s?.alertChannelId;
        
        if (!targetChannelId) {
          return { 
            guildId: id, 
            guildName: s?.guildName || `Guild ${id}`, 
            success: false, 
            error: "Canal de alerta não configurado" 
          };
        }
        
        try {
          // Enviar mensagem real via API do Bot
          await sendMessageViaBot({
            guildId: id,
            channelId: targetChannelId,
            message: input.message,
          });
          return { guildId: id, guildName: s?.guildName || `Guild ${id}`, success: true };
        } catch (err: any) {
          console.error(`[Broadcast] Erro ao enviar para ${id}:`, err.message);
          return { 
            guildId: id, 
            guildName: s?.guildName || `Guild ${id}`, 
            success: false, 
            error: err.message || "Erro na API do Bot" 
          };
        }
      }));

      return results;
    }),
});

// --- AutoMod Router ---
const autoModRouter = router({
  get: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input }) => {
      return await getAutoModSettings(input.guildId);
    }),
  update: protectedProcedure
    .input(z.any())
    .mutation(async ({ input }) => {
      return await upsertAutoModSettings(input);
    }),
});

// --- Notifications Router ---
const notificationsRouter = router({
  list: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input }) => {
      return await getSocialNotifications(input.guildId);
    }),
  create: protectedProcedure
    .input(z.any())
    .mutation(async ({ input }) => {
      return await createSocialNotification(input);
    }),
  update: protectedProcedure
    .input(z.any())
    .mutation(async ({ input }) => {
      return await updateSocialNotification(input.id, input);
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteSocialNotification(input.id);
    }),
});

// --- Logs Router ---
const logsRouter = router({
  list: protectedProcedure
    .input(z.object({ guildId: z.string(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      return await getServerLogs(input.guildId, input.limit);
    }),
});

// --- Logs Config Router ---
const logsConfigRouter = router({
  get: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input }) => {
      return await getLogConfig(input.guildId);
    }),
  update: protectedProcedure
    .input(z.any())
    .mutation(async ({ input }) => {
      return await updateLogConfig(input.guildId, input);
    }),
});

// --- Commands Router ---
const commandsRouter = router({
  list: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input }) => {
      return await getCommandSettings(input.guildId);
    }),
  update: protectedProcedure
    .input(z.any())
    .mutation(async ({ input }) => {
      return await upsertCommandSetting(input);
    }),
});

// --- Messages Router ---
const messagesRouter = router({
  get: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input }) => {
      return await getWelcomeMessages(input.guildId);
    }),
  update: protectedProcedure
    .input(z.any())
    .mutation(async ({ input }) => {
      return await upsertWelcomeMessages(input);
    }),
});

// --- Welcome/Goodbye Router ---
const welcomeGoodbyeRouter = router({
  get: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .query(async ({ input }) => {
      return await getWelcomeMessages(input.guildId);
    }),
  save: protectedProcedure
    .input(z.any())
    .mutation(async ({ input }) => {
      return await upsertWelcomeMessages({ guildId: input.guildId, ...input.config });
    }),
  sendWelcome: protectedProcedure
    .input(z.object({
      guildId: z.string(),
      channelId: z.string().nullable(),
      mode: z.enum(["local", "global"]),
      imageUrl: z.string(),
      userName: z.string(),
      userAvatar: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const { guildId, channelId, mode, imageUrl, userName, userAvatar } = input;
      const { GuildConfig } = await import("./models");
      const { sendMessageViaBot } = await import("./bot-api-client");

      let targetGuilds = [];
      if (mode === "local") {
        const s = await GuildConfig.findOne({ guildId });
        if (s && channelId) {
          targetGuilds.push({ guildId: s.guildId, channelId });
        }
      } else {
        const configs = await GuildConfig.find({ alertChannelId: { $ne: null } });
        targetGuilds = configs.map(c => ({ guildId: c.guildId, channelId: c.alertChannelId! }));
      }

      const results = await Promise.all(targetGuilds.map(async (target) => {
        try {
          await sendMessageViaBot({
            guildId: target.guildId,
            channelId: target.channelId,
            message: "",
            embeds: [{
              title: "👑 Novo membro chegou!",
              description: `📛 **${userName}** entrou no Magnatas\n\n@${userName} seja bem-vindo ao império Magnatas.`,
              image: { url: imageUrl },
              thumbnail: { url: userAvatar },
              footer: { text: "Magnatas.gg • Sistema Magnatas 1v99" },
              color: 0xFF0000,
              timestamp: new Date(),
            }]
          });
          return { guildId: target.guildId, success: true };
        } catch (err: any) {
          return { guildId: target.guildId, success: false, error: err.message };
        }
      }));

      // Registrar Log em Tempo Real
      const { RealTimeLog } = await import("./models");
      const { io } = await import("./_core/socket");
      
      const logData = {
        guildId,
        title: "🚀 Boas-vindas Enviada",
        description: `Mensagem de boas-vindas enviada para ${results.filter(r => r.success).length} servidor(es).`,
        type: "WELCOME",
        color: 0x00FF00,
        footer: "Sistema Magnatas",
        userName: ctx.user?.name,
        userId: ctx.user?.discordId
      };
      
      const log = await RealTimeLog.create(logData);
      if (io) {
        io.to(`guild_${guildId}`).emit("new_log", log);
      }

      return results;
    }),
  sendExit: protectedProcedure
    .input(z.object({
      guildId: z.string(),
      channelId: z.string().nullable(),
      mode: z.enum(["local", "global"]),
      imageUrl: z.string(),
      userName: z.string(),
      userAvatar: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const { guildId, channelId, mode, imageUrl, userName, userAvatar } = input;
      const { GuildConfig } = await import("./models");
      const { sendMessageViaBot } = await import("./bot-api-client");

      let targetGuilds = [];
      if (mode === "local") {
        const s = await GuildConfig.findOne({ guildId });
        if (s && channelId) {
          targetGuilds.push({ guildId: s.guildId, channelId });
        }
      } else {
        const configs = await GuildConfig.find({ alertChannelId: { $ne: null } });
        targetGuilds = configs.map(c => ({ guildId: c.guildId, channelId: c.alertChannelId! }));
      }

      const results = await Promise.all(targetGuilds.map(async (target) => {
        try {
          await sendMessageViaBot({
            guildId: target.guildId,
            channelId: target.channelId,
            message: "",
            embeds: [{
              title: "🚪 Um membro saiu...",
              description: `📛 Usuário: **${userName}**\n⚠️ Saiu do Magnatas\n\n@${userName} saiu do império Magnatas.`,
              image: { url: imageUrl },
              thumbnail: { url: userAvatar },
              footer: { text: "Magnatas.gg • Sistema Magnatas (Saída)" },
              color: 0xFF0000,
              timestamp: new Date(),
            }]
          });
          return { guildId: target.guildId, success: true };
        } catch (err: any) {
          return { guildId: target.guildId, success: false, error: err.message };
        }
      }));

      // Registrar Log em Tempo Real
      const { RealTimeLog } = await import("./models");
      const { io } = await import("./_core/socket");
      
      const logData = {
        guildId,
        title: "🚪 Saída Enviada",
        description: `Mensagem de saída enviada para ${results.filter(r => r.success).length} servidor(es).`,
        type: "EXIT",
        color: 0xFF0000,
        footer: "Sistema Magnatas",
        userName: ctx.user?.name,
        userId: ctx.user?.discordId
      };
      
      const log = await RealTimeLog.create(logData);
      if (io) {
        io.to(`guild_${guildId}`).emit("new_log", log);
      }

      return results;
    }),
  sendTest: protectedProcedure
    .input(z.object({
      guildId: z.string(),
      channelId: z.string(),
      type: z.enum(["WELCOME", "EXIT", "LOG"]),
      imageUrl: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const { guildId, channelId, type, imageUrl } = input;
      const { sendMessageViaBot } = await import("./bot-api-client");

      const testEmbed = {
        title: "🧪 Teste de painel Magnatas",
        description: `📛 Usuário: **Teste#0001**\n✅ Sistema funcionando corretamente\n\nEste é um envio de teste para validar a integração do painel ${type}.`,
        image: imageUrl ? { url: imageUrl } : undefined,
        thumbnail: { url: "https://cdn.discordapp.com/embed/avatars/0.png" },
        footer: { text: "Magnatas.gg • Sistema de Teste" },
        color: 0x00FF00,
        timestamp: new Date(),
      };

      try {
        await sendMessageViaBot({
          guildId,
          channelId,
          message: "",
          embeds: [testEmbed]
        });

        // Registrar Log de Teste
        const { RealTimeLog } = await import("./models");
        const { io } = await import("./_core/socket");
        
        const logData = {
          guildId,
          title: "🧪 Teste Realizado",
          description: `Envio de teste do painel ${type} concluído com sucesso.`,
          type: "TEST",
          color: 0x00FFFF,
          footer: "Sistema Magnatas",
          userName: ctx.user?.name,
          userId: ctx.user?.discordId
        };
        
        const log = await RealTimeLog.create(logData);
        if (io) {
          io.to(`guild_${guildId}`).emit("new_log", log);
        }

        return { success: true };
      } catch (err: any) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
      }
    }),
});

// --- Dev Management Router ---
const devManagementRouter = router({
  list: protectedProcedure.query(async () => {
    return await getAllDevs();
  }),
});

// --- User Sync Router (Steam Hex & Discord) ---
const userSyncRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    // Apenas Master ou Admin pode ver a lista completa
    const isMaster = ctx.user?.name === "vilao" || ctx.user?.openId === "761011766440230932";
    if (!isMaster && ctx.user?.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado." });
    }

    const { User } = await import("./models");
    const users = await User.find({ steamHex: { $exists: true, $ne: null } }).sort({ updatedAt: -1 });
    
    return users.map(u => ({
      id: u._id,
      name: u.name,
      discordId: u.discordId,
      avatar: u.avatar,
      steamHex: u.steamHex,
      updatedAt: u.updatedAt,
    }));
  }),
  
  sync: protectedProcedure
    .input(z.object({ steamHex: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { User } = await import("./models");
      const user = await User.findOneAndUpdate(
        { openId: ctx.user.openId },
        { steamHex: input.steamHex },
        { new: true }
      );
      return { success: true, user };
    }),
});

// --- Guild Management Router ---
const guildManagementRouter = router({
  removeBot: protectedProcedure
    .input(z.object({ guildId: z.string() }))
    .mutation(async ({ input }) => {
      return await removeGuildBot(input.guildId);
    }),
});

// --- Debug Router ---
const debugRouter = router({
  testBotConnection: protectedProcedure.mutation(async () => {
    const BOT_API_URL = process.env.BOT_API_URL || "http://localhost:3000";
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${BOT_API_URL}/api/panel/diagnostic`, { timeout: 5000 });
      return {
        success: true,
        duration: Date.now() - startTime,
        botUrl: BOT_API_URL,
        data: response.data
      };
    } catch (err: any) {
      return {
        success: false,
        duration: Date.now() - startTime,
        botUrl: BOT_API_URL,
        error: err.message,
        code: err.code,
        response: err.response?.data
      };
    }
  }),
});

export const appRouter = router({
  debug: debugRouter,
  system: systemRouter,
  auth: authRouter,
  guilds: guildsRouter,
  settings: settingsRouter,
  autoMod: autoModRouter,
  notifications: notificationsRouter,
  logs: logsRouter,
  logsConfig: logsConfigRouter,
  commands: commandsRouter,
  messages: messagesRouter,
  welcomeGoodbye: welcomeGoodbyeRouter,
  maintenance: maintenanceRouter,
  broadcast: broadcastRouter,
  devManagement: devManagementRouter,
  userSync: userSyncRouter,
  guildManagement: guildManagementRouter,
  realTimeLogs: realTimeLogsRouter,
  monitor: monitorRouter,
});

export type AppRouter = typeof appRouter;
