import { MonitorConfig, MonitorLog, GuildConfig, ServiceMetric } from "./models";
import { sendMessageViaBot, checkBotAvailability } from "./bot-api-client";
import mongoose from "mongoose";
import pidusage from "pidusage";

interface ServiceStatus {
  name: string;
  status: "Online" | "Offline" | "Instável";
  lastCheck: Date;
  latency: number;
  cpu?: number;
  ram?: number;
  lastError?: string;
}

const DEV_RESPONSIBLE_ID = "761011766440230932";

let currentStatus: Record<string, ServiceStatus> = {
  "Dashboard": { name: "Dashboard", status: "Online", lastCheck: new Date(), latency: 0, cpu: 0, ram: 0 },
  "Bot": { name: "Bot", status: "Online", lastCheck: new Date(), latency: 0 },
  "Database": { name: "Database", status: "Online", lastCheck: new Date(), latency: 0 },
  "Discord API": { name: "Discord API", status: "Online", lastCheck: new Date(), latency: 0 },
  "Verificador": { name: "Verificador", status: "Online", lastCheck: new Date(), latency: 0 },
};

export const getServicesStatus = () => currentStatus;

async function sendDiscordAlert(guildId: string, channelId: string, service: string, status: string, isRestored: boolean, errorDetail?: string) {
  const guild = await GuildConfig.findOne({ guildId });
  const guildName = guild?.guildName || "Servidor Desconhecido";
  const now = new Date().toLocaleString("pt-BR");

  const embed = isRestored ? {
    title: "✅ SISTEMA RESTAURADO",
    description: `**Serviço:** ${service}\n**Status:** ${status}\n**Horário:** ${now}`,
    color: 0x00FF00,
    footer: { text: "Magnatas.gg • Monitoramento" },
    timestamp: new Date(),
  } : {
    title: "🚨 ALERTA MAGNATAS",
    description: `**Serviço afetado:** ${service}\n**Status:** ${status}\n**Horário:** ${now}\n**Servidor:** ${guildName}\n${errorDetail ? `**Causa do Erro:** \`${errorDetail}\`\n` : ""}\nO desenvolvedor responsável <@${DEV_RESPONSIBLE_ID}> já foi notificado.`,
    color: 0xFF0000,
    footer: { text: "Magnatas.gg • Monitoramento" },
    timestamp: new Date(),
  };

  try {
    await sendMessageViaBot({
      guildId,
      channelId,
      message: isRestored ? "" : `<@${DEV_RESPONSIBLE_ID}> 🚨 Queda detectada no serviço: **${service}**`,
      embeds: [embed]
    });
  } catch (err) {
    console.error(`Erro ao enviar alerta de monitoramento para ${guildId}:`, err);
  }
}

async function checkServices() {
  const previousStatus = { ...currentStatus };

  // 1. Check Database
  const dbStart = Date.now();
  try {
    if (mongoose.connection.readyState !== 1) throw new Error("Conexão com MongoDB não está pronta (readyState !== 1)");
    currentStatus["Database"].status = "Online";
    currentStatus["Database"].latency = Date.now() - dbStart;
    currentStatus["Database"].lastError = undefined;
  } catch (err: any) {
    currentStatus["Database"].status = "Offline";
    currentStatus["Database"].latency = 0;
    currentStatus["Database"].lastError = err.message || "Erro desconhecido no Banco de Dados";
  }

  // 2. Check Bot
  const botStart = Date.now();
  try {
    const isBotOnline = await checkBotAvailability();
    if (!isBotOnline) throw new Error("Bot não respondeu ao healthcheck (Timeout ou Offline)");
    currentStatus["Bot"].status = "Online";
    currentStatus["Bot"].latency = Date.now() - botStart;
    currentStatus["Bot"].lastError = undefined;
  } catch (err: any) {
    currentStatus["Bot"].status = "Offline";
    currentStatus["Bot"].latency = 0;
    currentStatus["Bot"].lastError = err.message || "Bot Offline";
  }

  // 3. Check Discord API (via Bot)
  currentStatus["Discord API"].status = currentStatus["Bot"].status;
  currentStatus["Discord API"].latency = currentStatus["Bot"].latency;
  currentStatus["Discord API"].lastError = currentStatus["Bot"].lastError;

  // 4. Dashboard Metrics (CPU/RAM)
  try {
    const stats = await pidusage(process.pid);
    currentStatus["Dashboard"].status = "Online";
    currentStatus["Dashboard"].latency = 1;
    currentStatus["Dashboard"].cpu = Math.round(stats.cpu);
    currentStatus["Dashboard"].ram = Math.round(stats.memory / 1024 / 1024); // MB
    currentStatus["Dashboard"].lastError = undefined;
  } catch (e: any) {
    currentStatus["Dashboard"].status = "Online";
    currentStatus["Dashboard"].lastError = e.message;
  }

  // 5. Check Verificador
  currentStatus["Verificador"].status = currentStatus["Bot"].status;
  currentStatus["Verificador"].latency = currentStatus["Bot"].latency;
  currentStatus["Verificador"].lastError = currentStatus["Bot"].lastError;

  // Salvar métricas e processar mudanças
  for (const serviceName of Object.keys(currentStatus)) {
    const service = currentStatus[serviceName];
    const prev = previousStatus[serviceName];

    // Salvar métrica no banco para os gráficos
    try {
      await ServiceMetric.create({
        service: serviceName,
        latency: service.latency,
        cpu: service.cpu,
        ram: service.ram,
        status: service.status,
      });
    } catch (e) {
      console.error("Erro ao salvar métrica:", e);
    }

    if (service.status !== prev.status) {
      service.lastCheck = new Date();
      
      const configs = await MonitorConfig.find({ enabled: true, alertChannelId: { $ne: null } });
      
      for (const config of configs) {
        await MonitorLog.create({
          guildId: config.guildId,
          service: serviceName,
          status: service.status,
          message: service.status === "Online" ? "Serviço restaurado" : "Queda detectada",
          errorDetail: service.status === "Offline" ? service.lastError : undefined
        });

        if (config.alertChannelId) {
          const isRestored = service.status === "Online";
          await sendDiscordAlert(
            config.guildId, 
            config.alertChannelId, 
            serviceName, 
            service.status, 
            isRestored, 
            service.status === "Offline" ? service.lastError : undefined
          );
        }
      }
    }
  }
}

export function startMonitor() {
  checkServices();
  setInterval(checkServices, 60000);
  console.log("🚀 Motor de Monitoramento Magnatas iniciado com captura de erros detalhada.");
}
