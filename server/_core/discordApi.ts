/**
 * Utilitário para chamadas à Discord API v10
 * Com tratamento de rate limiting conforme documentação oficial
 * https://docs.discord.com/developers/topics/rate-limits
 */

import fetch from 'node-fetch';

const DISCORD_API_BASE = 'https://discord.com/api/v10';
const USER_AGENT = 'DiscordBotDashboard/1.0 (https://seu-dominio.com)';

interface DiscordRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  token?: string;
  isBot?: boolean;
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAfter: number;
  bucket: string;
}

// Armazenar informações de rate limit por bucket
const rateLimitCache = new Map<string, RateLimitInfo>();

/**
 * Extrair informações de rate limit dos headers da resposta
 */
function extrairRateLimit(headers: any): RateLimitInfo {
  return {
    limit: parseInt(headers.get('x-ratelimit-limit') || '0'),
    remaining: parseInt(headers.get('x-ratelimit-remaining') || '0'),
    resetAfter: parseFloat(headers.get('x-ratelimit-reset-after') || '0'),
    bucket: headers.get('x-ratelimit-bucket') || 'unknown',
  };
}

/**
 * Aguardar se necessário antes de fazer requisição
 */
async function verificarRateLimit(bucket: string): Promise<void> {
  const info = rateLimitCache.get(bucket);
  
  if (info && info.remaining === 0 && info.resetAfter > 0) {
    const aguardarMs = info.resetAfter * 1000;
    console.warn(`[Discord API] Rate limit atingido no bucket ${bucket}. Aguardando ${aguardarMs}ms...`);
    await new Promise(resolve => setTimeout(resolve, aguardarMs));
  }
}

/**
 * Chamada genérica à Discord API com tratamento de rate limiting
 */
export async function chamarDiscord(
  endpoint: string,
  opcoes: DiscordRequestOptions = {}
): Promise<any> {
  const {
    method = 'GET',
    headers = {},
    body,
    token,
    isBot = false,
  } = opcoes;

  const url = endpoint.startsWith('http') ? endpoint : `${DISCORD_API_BASE}${endpoint}`;

  // Construir headers
  const headersFinais: Record<string, string> = {
    'User-Agent': USER_AGENT,
    ...headers,
  };

  // Adicionar autenticação
  if (token) {
    const tipo = isBot ? 'Bot' : 'Bearer';
    headersFinais['Authorization'] = `${tipo} ${token}`;
  }

  // Adicionar Content-Type se houver body
  if (body && !headersFinais['Content-Type']) {
    headersFinais['Content-Type'] = 'application/json';
  }

  // Verificar rate limit antes de fazer requisição
  const bucket = `${method}:${endpoint}`;
  await verificarRateLimit(bucket);

  try {
    const resposta = await fetch(url, {
      method,
      headers: headersFinais,
      body: body ? JSON.stringify(body) : undefined,
      timeout: 10000, // 10 segundos de timeout
    } as any);

    // Atualizar informações de rate limit
    const rateLimit = extrairRateLimit(resposta.headers);
    rateLimitCache.set(bucket, rateLimit);

    // Logar aviso se restam poucos requests
    if (rateLimit.remaining < 5 && rateLimit.remaining > 0) {
      console.warn(
        `[Discord API] Atenção: apenas ${rateLimit.remaining} requests restantes no bucket ${bucket}`
      );
    }

    // Tratar rate limit (429)
    if (resposta.status === 429) {
      const dados = (await resposta.json()) as any;
      const aguardar = (dados.retry_after || 1) * 1000;

      console.warn(
        `[Discord API] Rate limit global atingido. Aguardando ${aguardar}ms...`
      );

      await new Promise(resolve => setTimeout(resolve, aguardar));

      // Tentar novamente recursivamente
      return chamarDiscord(endpoint, opcoes);
    }

    // Tratar erro 401 (token inválido)
    if (resposta.status === 401) {
      throw new Error('Token Discord inválido ou expirado');
    }

    // Tratar erro 403 (sem permissão)
    if (resposta.status === 403) {
      const dados = (await resposta.json()) as any;
      throw new Error(`Sem permissão: ${dados.message || 'Desconhecido'}`);
    }

    // Tratar erro 404 (não encontrado)
    if (resposta.status === 404) {
      throw new Error('Recurso não encontrado no Discord');
    }

    // Tratar outros erros
    if (!resposta.ok) {
      const dados = (await resposta.json()) as any;
      throw new Error(
        `Erro Discord (${resposta.status}): ${dados.message || 'Desconhecido'}`
      );
    }

    // Retornar dados (204 No Content retorna null)
    if (resposta.status === 204) {
      return null;
    }

    return await resposta.json();
  } catch (erro) {
    console.error(`[Discord API] Erro ao chamar ${url}:`, erro);
    throw erro;
  }
}

/**
 * Obter informações do usuário autenticado
 */
export async function obterUsuarioAtual(accessToken: string): Promise<any> {
  return chamarDiscord('/users/@me', {
    token: accessToken,
    isBot: false,
  });
}

/**
 * Obter servidores do usuário
 */
export async function obterServidoresUsuario(accessToken: string): Promise<any[]> {
  return chamarDiscord('/users/@me/guilds', {
    token: accessToken,
    isBot: false,
  });
}

/**
 * Obter widget do servidor (sem autenticação necessária)
 */
export async function obterWidgetServidor(serverId: string): Promise<any> {
  return chamarDiscord(`/guilds/${serverId}/widget.json`);
}

/**
 * Enviar mensagem via webhook
 */
export async function enviarWebhook(webhookUrl: string, payload: any): Promise<void> {
  await chamarDiscord(webhookUrl, {
    method: 'POST',
    body: payload,
  });
}

/**
 * Obter informações do servidor (requer bot token)
 */
export async function obterServidorInfo(serverId: string, botToken: string): Promise<any> {
  return chamarDiscord(`/guilds/${serverId}`, {
    token: botToken,
    isBot: true,
  });
}

/**
 * Obter membros do servidor (requer bot token)
 */
export async function obterMembrosServidor(
  serverId: string,
  botToken: string,
  limit: number = 100
): Promise<any[]> {
  return chamarDiscord(`/guilds/${serverId}/members?limit=${limit}`, {
    token: botToken,
    isBot: true,
  });
}

/**
 * Obter canais do servidor (requer bot token)
 */
export async function obterCanaisServidor(serverId: string, botToken: string): Promise<any[]> {
  return chamarDiscord(`/guilds/${serverId}/channels`, {
    token: botToken,
    isBot: true,
  });
}

/**
 * Obter cargos do servidor (requer bot token)
 */
export async function obterCargosServidor(serverId: string, botToken: string): Promise<any[]> {
  return chamarDiscord(`/guilds/${serverId}/roles`, {
    token: botToken,
    isBot: true,
  });
}

/**
 * Renovar token OAuth2
 */
export async function renovarTokenOAuth(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<any> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const resposta = await fetch('https://discord.com/api/v10/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: params,
    timeout: 10000,
  } as any);

  if (!resposta.ok) {
    throw new Error('Falha ao renovar token OAuth2');
  }

  return await resposta.json();
}

/**
 * Revogar token OAuth2
 */
export async function revogarTokenOAuth(
  clientId: string,
  clientSecret: string,
  token: string
): Promise<void> {
  const params = new URLSearchParams({
    token,
  });

  await fetch('https://discord.com/api/v10/oauth2/token/revoke', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: params,
    timeout: 10000,
  } as any).catch(() => {
    // Silenciar erros de revogação
  });
}
