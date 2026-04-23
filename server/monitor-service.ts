import { MonitorConfig, MonitorLog, GuildConfig } from "./models";
import { sendMessageViaBot, checkBotAvailability } from "./bot-api-client";
import mongoose from "mongoose";
import axios from "axios";

interface ServiceStatus {
  name: string;
  status: "Online" | "Offline" | "Instável";
  lastCheck: Date;
}

// ID do Desenvolvedor Responsável (Master)
const DEV_RESPONSIBLE_ID = "761011766440230932";

let currentStatus: Record<string, ServiceStatus> = {
  "Dashboard": { name: "Dashboard", status: "Online", lastCheck: new Date() },
  "Bot": { name: "Bot", status: "Online", lastCheck: new Date() },
  "Database": { name: "Database", status: "Online", lastCheck: new Date() },
  "Discord API": { name: "Discord API", status: "Online", lastCheck: new Date() },
  "Verificador": { name: "Verificador", status: "Online", lastCheck: new Date() },
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
  try {
    if (mongoose.connection.readyState !== 1) throw new Error("DB Offline");
    currentStatus["Database"].status = "Online";
  } catch (err) {
    currentStatus["Database"].status = "Offline";
  }

  // 2. Check Bot
  try {
    const isBotOnline = await checkBotAvailability();
    currentStatus["Bot"].status = isBotOnline ? "Online" : "Offline";
  } catch (err) {
    currentStatus["Bot"].status = "Offline";
  }

  // 3. Check Discord API (via Bot)
  currentStatus["Discord API"].status = currentStatus["Bot"].status;

  // 4. Dashboard (Sempre Online se este código está rodando)
  currentStatus["Dashboard"].status = "Online";

  // 5. Check Verificador de Usuário (Simulado ou via Ping se houver URL)
  // Como o repositório é local ou em outro deploy, tentamos um ping se houver URL configurada
  // Por enquanto, monitoramos a existência do processo ou uma URL padrão
  try {
    // Exemplo: Se o verificador roda na porta 3001
    // const response = await axios.get("http://localhost:3001/api/health", { timeout: 5000 });
    // currentStatus["Verificador"].status = response.status === 200 ? "Online" : "Offline";
    
    // Simulação baseada no Bot por enquanto, já que eles costumam rodar juntos
    currentStatus["Verificador"].status = currentStatus["Bot"].status;
  } catch (err) {
    currentStatus["Verificador"].status = "Offline";
  }

  // Processar mudanças de status
  for (const serviceName of Object.keys(currentStatus)) {
    const service = currentStatus[serviceName];
    const prev = previousStatus[serviceName];

    if (service.status !== prev.status) {
      service.lastCheck = new Date();
      
      // Buscar todas as guildas configuradas para receber alertas
      const configs = await MonitorConfig.find({ enabled: true, alertChannelId: { $ne: null } });
      
      for (const config of configs) {
        // Salvar Log
        await MonitorLog.create({
          guildId: config.guildId,
          service: serviceName,
          status: service.status,
          message: service.status === "Online" ? "Serviço restaurado" : "Queda detectada",
        });

        // Enviar Alerta se for transição Online -> Offline ou Offline -> Online
        if (config.alertChannelId) {
          const isRestored = service.status === "Online";
          await sendDiscordAlert(config.guildId, config.alertChannelId, serviceName, service.status, isRestored);
        }
      }
    }
  }
}

// Iniciar monitoramento a cada 1 minuto
export function startMonitor() {
  setInterval(checkServices, 60000);
  console.log("🚀 Motor de Monitoramento Magnatas iniciado com suporte ao Verificador.");
}
