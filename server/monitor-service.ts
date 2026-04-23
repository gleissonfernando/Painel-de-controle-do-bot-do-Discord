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

async function sendDiscordAlert(guildId: string, channelId: string, service: string, status: string, isRestored: boolean) {
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
    description: `**Serviço afetado:** ${service}\n**Status:** ${status}\n**Horário:** ${now}\n**Servidor:** ${guildName}\n\nO desenvolvedor responsável <@${DEV_RESPONSIBLE_ID}> já foi notificado.`,
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
    if (mongoose.connection.readyState !== 1) throw new Error("DB Offline");
    currentStatus["Database"].status = "Online";
    currentStatus["Database"].latency = Date.now() - dbStart;
  } catch (err) {
    currentStatus["Database"].status = "Offline";
    currentStatus["Database"].latency = 0;
  }

  // 2. Check Bot (Status Real: Se o bot não responder, fica Offline)
  const botStart = Date.now();
  try {
    const isBotOnline = await checkBotAvailability();
    currentStatus["Bot"].status = isBotOnline ? "Online" : "Offline";
    currentStatus["Bot"].latency = isBotOnline ? Date.now() - botStart : 0;
  } catch (err) {
    currentStatus["Bot"].status = "Offline";
    currentStatus["Bot"].latency = 0;
  }

  // 3. Check Discord API (via Bot)
  currentStatus["Discord API"].status = currentStatus["Bot"].status;
  currentStatus["Discord API"].latency = currentStatus["Bot"].latency;

  // 4. Dashboard Metrics (CPU/RAM)
  try {
    const stats = await pidusage(process.pid);
    currentStatus["Dashboard"].status = "Online";
    currentStatus["Dashboard"].latency = 1;
    currentStatus["Dashboard"].cpu = Math.round(stats.cpu);
    currentStatus["Dashboard"].ram = Math.round(stats.memory / 1024 / 1024); // MB
  } catch (e) {
    currentStatus["Dashboard"].status = "Online";
  }

  // 5. Check Verificador
  currentStatus["Verificador"].status = currentStatus["Bot"].status;
  currentStatus["Verificador"].latency = currentStatus["Bot"].latency;

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
        });

        if (config.alertChannelId) {
          const isRestored = service.status === "Online";
          await sendDiscordAlert(config.guildId, config.alertChannelId, serviceName, service.status, isRestored);
        }
      }
    }
  }
}

export function startMonitor() {
  checkServices();
  setInterval(checkServices, 60000);
  console.log("🚀 Motor de Monitoramento Magnatas iniciado com métricas de Hardware.");
}
