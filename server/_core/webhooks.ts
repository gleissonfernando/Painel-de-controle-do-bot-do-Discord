/**
 * Utilitário para enviar mensagens via Webhooks do Discord
 * Conforme documentação oficial: https://docs.discord.com/developers/platform/webhooks
 */

import { enviarWebhook } from './discordApi';

interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface EmbedFooter {
  text: string;
  icon_url?: string;
}

interface Embed {
  title?: string;
  description?: string;
  color?: number;
  fields?: EmbedField[];
  footer?: EmbedFooter;
  timestamp?: string;
  image?: { url: string };
  thumbnail?: { url: string };
}

interface WebhookPayload {
  username?: string;
  avatar_url?: string;
  content?: string;
  embeds?: Embed[];
  tts?: boolean;
}

/**
 * Cores padrão do Discord
 */
export const CORES_DISCORD = {
  BLURPLE: 0x5865f2,
  GREYPLE: 0x99aab5,
  DARK_BUT_NOT_BLACK: 0x2c2f33,
  NOT_QUITE_BLACK: 0x23272a,
  VERDE: 0x57f287,
  AMARELO: 0xfee75c,
  LARANJA: 0xf26522,
  VERMELHO: 0xed4245,
};

/**
 * Enviar mensagem simples via webhook
 */
export async function enviarMensagemSimples(
  webhookUrl: string,
  mensagem: string,
  nomeBot: string = 'Bot Dashboard'
): Promise<void> {
  const payload: WebhookPayload = {
    username: nomeBot,
    content: mensagem,
  };

  await enviarWebhook(webhookUrl, payload);
}

/**
 * Enviar embed via webhook
 */
export async function enviarEmbed(
  webhookUrl: string,
  embed: Embed,
  nomeBot: string = 'Bot Dashboard',
  avatarUrl?: string
): Promise<void> {
  // Adicionar timestamp se não existir
  if (!embed.timestamp) {
    embed.timestamp = new Date().toISOString();
  }

  const payload: WebhookPayload = {
    username: nomeBot,
    avatar_url: avatarUrl,
    embeds: [embed],
  };

  await enviarWebhook(webhookUrl, payload);
}

/**
 * Enviar notificação de novo usuário
 */
export async function notificarNovoUsuario(
  webhookUrl: string,
  usuario: any
): Promise<void> {
  const embed: Embed = {
    title: '👤 Novo Usuário Registrado',
    description: `Um novo usuário se registrou no dashboard`,
    color: CORES_DISCORD.VERDE,
    fields: [
      {
        name: 'Nome',
        value: usuario.global_name || usuario.username,
        inline: true,
      },
      {
        name: 'Username',
        value: `@${usuario.username}`,
        inline: true,
      },
      {
        name: 'ID Discord',
        value: usuario.id,
        inline: false,
      },
      {
        name: 'Email',
        value: usuario.email || 'Não fornecido',
        inline: false,
      },
    ],
    footer: {
      text: 'Dashboard Bot',
      icon_url: 'https://discord.com/assets/847541504914fd33810e70a0ea73177e.png',
    },
    timestamp: new Date().toISOString(),
  };

  await enviarEmbed(webhookUrl, embed, 'Dashboard Bot');
}

/**
 * Enviar notificação de erro
 */
export async function notificarErro(
  webhookUrl: string,
  titulo: string,
  erro: Error | string,
  contexto?: any
): Promise<void> {
  const mensagemErro = erro instanceof Error ? erro.message : String(erro);

  const embed: Embed = {
    title: `⚠️ ${titulo}`,
    description: `\`\`\`${mensagemErro.slice(0, 1000)}\`\`\``,
    color: CORES_DISCORD.VERMELHO,
    fields: contexto
      ? [
          {
            name: 'Contexto',
            value: JSON.stringify(contexto, null, 2).slice(0, 1000),
            inline: false,
          },
        ]
      : [],
    footer: {
      text: 'Dashboard Bot - Erro',
      icon_url: 'https://discord.com/assets/847541504914fd33810e70a0ea73177e.png',
    },
    timestamp: new Date().toISOString(),
  };

  await enviarEmbed(webhookUrl, embed, 'Dashboard Bot - Erro');
}

/**
 * Enviar notificação de formulário de contato
 */
export async function notificarFormularioContato(
  webhookUrl: string,
  dados: {
    nome: string;
    email: string;
    mensagem: string;
    pagina?: string;
  }
): Promise<void> {
  const embed: Embed = {
    title: '📬 Nova Mensagem de Contato',
    description: dados.mensagem.slice(0, 2000),
    color: CORES_DISCORD.BLURPLE,
    fields: [
      {
        name: 'Nome',
        value: dados.nome,
        inline: true,
      },
      {
        name: 'Email',
        value: dados.email,
        inline: true,
      },
      {
        name: 'Página de Origem',
        value: dados.pagina || 'Desconhecida',
        inline: false,
      },
    ],
    footer: {
      text: 'Dashboard Bot - Formulário de Contato',
      icon_url: 'https://discord.com/assets/847541504914fd33810e70a0ea73177e.png',
    },
    timestamp: new Date().toISOString(),
  };

  await enviarEmbed(webhookUrl, embed, 'Dashboard Bot');
}

/**
 * Enviar notificação de evento do servidor
 */
export async function notificarEventoServidor(
  webhookUrl: string,
  evento: string,
  detalhes: any
): Promise<void> {
  const embed: Embed = {
    title: `🎯 Evento do Servidor: ${evento}`,
    color: CORES_DISCORD.AMARELO,
    fields: Object.entries(detalhes).map(([chave, valor]) => ({
      name: chave,
      value: String(valor).slice(0, 1000),
      inline: false,
    })),
    footer: {
      text: 'Dashboard Bot - Eventos',
      icon_url: 'https://discord.com/assets/847541504914fd33810e70a0ea73177e.png',
    },
    timestamp: new Date().toISOString(),
  };

  await enviarEmbed(webhookUrl, embed, 'Dashboard Bot');
}
