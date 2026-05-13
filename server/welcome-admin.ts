import axios from "axios";
import { getGuildSettings } from "./db";

const DISCORD_API = "https://discord.com/api/v10";
const DEFAULT_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

/**
 * Resolve o melhor token para um servidor específico.
 */
async function resolveBotToken(guildId?: string): Promise<string | undefined> {
  if (guildId) {
    try {
      const settings = await getGuildSettings(guildId);
      if (settings?.botToken) {
        return settings.botToken;
      }
    } catch (err) {
      console.error(`[Discord] Erro ao buscar token no DB para guild ${guildId}:`, err);
    }
  }
  return DEFAULT_BOT_TOKEN;
}

/**
 * Gera uma mensagem criativa de boas-vindas para administradores.
 */
function generateWelcomeMessage(guildName: string, adminName: string): string {
  const welcomeMessages = [
    `🎉 **Bem-vindo ao Painel de Administração, ${adminName}!**\n\nVocê acaba de entrar em **${guildName}** com permissões de administrador. Parabéns! 🏆\n\nAgora você tem acesso total aos controles do bot Magnatas.gg. Use com sabedoria! ⚡`,
    
    `👑 **Olá, ${adminName}!**\n\nVocê foi detectado como administrador em **${guildName}**. Bem-vindo ao time de liderança! 🎯\n\nCom grandes poderes vêm grandes responsabilidades. Aproveite as ferramentas do Magnatas.gg! 🚀`,
    
    `🌟 **Boas-vindas, ${adminName}!**\n\nVocê entrou em **${guildName}** com privilégios de administrador. Que honra! 💎\n\nO bot Magnatas.gg está pronto para servir seu servidor. Vamos fazer coisas incríveis juntos! ✨`,
    
    `🔐 **Admin Detectado: ${adminName}**\n\nVocê agora tem acesso total aos controles de **${guildName}**. Bem-vindo! 🎪\n\nUse o Painel de Desenvolvimento para gerenciar seu servidor com eficiência. Boa sorte! 🍀`,
    
    `⚡ **${adminName}, você é o novo administrador de ${guildName}!**\n\nParabéns por alcançar este nível de confiança! 🏅\n\nO Magnatas.gg está aqui para ajudar você a gerenciar seu servidor de forma incrível! 🌈`,
  ];

  return welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
}

/**
 * Envia uma mensagem de boas-vindas para um administrador em um canal específico.
 */
export async function sendAdminWelcomeMessage(
  guildId: string,
  channelId: string,
  adminName: string,
  guildName: string
): Promise<boolean> {
  const token = await resolveBotToken(guildId);
  if (!token) {
    console.error("[WelcomeAdmin] Bot token not configured");
    return false;
  }

  try {
    const welcomeMessage = generateWelcomeMessage(guildName, adminName);

    const embed = {
      title: "👋 Bem-vindo ao Painel de Administração",
      description: welcomeMessage,
      color: 0x3498DB,
      thumbnail: {
        url: "https://cdn.discordapp.com/emojis/1234567890123456789.png", // Placeholder
      },
      footer: {
        text: "Magnatas.gg - Sistema de Administração",
        icon_url: "https://cdn.discordapp.com/app-icons/YOUR_BOT_ID/YOUR_ICON_HASH.png",
      },
      timestamp: new Date().toISOString(),
    };

    await axios.post(
      `${DISCORD_API}/channels/${channelId}/messages`,
      { embeds: [embed] },
      {
        headers: { Authorization: `Bot ${token}` },
      }
    );

    console.log(`[WelcomeAdmin] Mensagem de boas-vindas enviada para ${adminName} em ${guildName}`);
    return true;
  } catch (error: any) {
    console.error(
      `[WelcomeAdmin] Erro ao enviar mensagem de boas-vindas:`,
      error.response?.data?.message || error.message
    );
    return false;
  }
}

/**
 * Envia uma mensagem de boas-vindas automática quando o bot entra em um novo servidor.
 */
export async function sendGuildJoinWelcome(
  guildId: string,
  guildName: string,
  ownerId: string,
  ownerName: string
): Promise<boolean> {
  const token = await resolveBotToken(guildId);
  if (!token) {
    console.error("[WelcomeAdmin] Bot token not configured");
    return false;
  }

  try {
    // Buscar canais do servidor
    const channelsRes = await axios.get(`${DISCORD_API}/guilds/${guildId}/channels`, {
      headers: { Authorization: `Bot ${token}` },
    });

    const channels = channelsRes.data;

    // Priorizar canal de admin/logs ou o primeiro canal de texto
    const targetChannel = channels.find((c: any) =>
      c.type === 0 && (c.name.includes("admin") || c.name.includes("logs") || c.name.includes("mods"))
    ) || channels.find((c: any) => c.type === 0);

    if (!targetChannel) {
      console.warn(`[WelcomeAdmin] Nenhum canal de texto encontrado em ${guildName}`);
      return false;
    }

    const joinEmbed = {
      title: "🤖 Magnatas.gg Ativado",
      description: `Olá ${ownerName}! 👋\n\nO bot **Magnatas.gg** foi ativado com sucesso em **${guildName}**!\n\n**O que você pode fazer agora:**\n• 🎮 Gerenciar configurações do bot\n• 📊 Acompanhar logs e atividades\n• 🔧 Ativar modo de manutenção\n• 📢 Enviar mensagens globais\n• ⚙️ Personalizar comportamentos\n\n**Próximos passos:**\n1. Acesse o Painel de Desenvolvimento\n2. Configure os canais de alerta\n3. Personalize as mensagens de boas-vindas\n4. Teste as funcionalidades\n\nBem-vindo ao time Magnatas! 🚀`,
      color: 0x00FF00,
      fields: [
        {
          name: "📖 Documentação",
          value: "[Clique aqui para acessar a documentação](https://magnatas.gg/docs)",
          inline: false,
        },
        {
          name: "💬 Suporte",
          value: "[Junte-se ao servidor de suporte](https://discord.gg/magnatas)",
          inline: false,
        },
      ],
      footer: {
        text: "Magnatas.gg - Sistema de Administração Inteligente",
      },
      timestamp: new Date().toISOString(),
    };

    await axios.post(
      `${DISCORD_API}/channels/${targetChannel.id}/messages`,
      { embeds: [joinEmbed] },
      {
        headers: { Authorization: `Bot ${token}` },
      }
    );

    console.log(`[WelcomeAdmin] Mensagem de boas-vindas de entrada enviada para ${guildName}`);
    return true;
  } catch (error: any) {
    console.error(
      `[WelcomeAdmin] Erro ao enviar mensagem de entrada:`,
      error.response?.data?.message || error.message
    );
    return false;
  }
}

/**
 * Envia uma mensagem de boas-vindas criativa quando um novo admin é detectado.
 */
export async function notifyNewAdmin(
  guildId: string,
  guildName: string,
  newAdminId: string,
  newAdminName: string,
  detectedByUserId: string
): Promise<boolean> {
  const token = await resolveBotToken(guildId);
  if (!token) {
    console.error("[WelcomeAdmin] Bot token not configured");
    return false;
  }

  try {
    // Buscar canais do servidor
    const channelsRes = await axios.get(`${DISCORD_API}/guilds/${guildId}/channels`, {
      headers: { Authorization: `Bot ${token}` },
    });

    const channels = channelsRes.data;

    // Priorizar canal de admin/logs
    const targetChannel = channels.find((c: any) =>
      c.type === 0 && (c.name.includes("admin") || c.name.includes("logs"))
    ) || channels.find((c: any) => c.type === 0);

    if (!targetChannel) {
      console.warn(`[WelcomeAdmin] Nenhum canal de texto encontrado em ${guildName}`);
      return false;
    }

    const adminEmbed = {
      title: "👑 Novo Administrador Detectado",
      description: `**${newAdminName}** agora é administrador de **${guildName}**!\n\nBem-vindo ao time de liderança! 🎉`,
      color: 0xFFD700,
      fields: [
        {
          name: "👤 Novo Admin",
          value: newAdminName,
          inline: true,
        },
        {
          name: "🏢 Servidor",
          value: guildName,
          inline: true,
        },
        {
          name: "📝 Detalhes",
          value: `Detectado pelo sistema de monitoramento do Magnatas.gg`,
          inline: false,
        },
      ],
      footer: {
        text: "Magnatas.gg - Sistema de Administração",
      },
      timestamp: new Date().toISOString(),
    };

    await axios.post(
      `${DISCORD_API}/channels/${targetChannel.id}/messages`,
      { embeds: [adminEmbed] },
      {
        headers: { Authorization: `Bot ${token}` },
      }
    );

    console.log(`[WelcomeAdmin] Notificação de novo admin enviada para ${guildName}`);
    return true;
  } catch (error: any) {
    console.error(
      `[WelcomeAdmin] Erro ao enviar notificação de novo admin:`,
      error.response?.data?.message || error.message
    );
    return false;
  }
}
