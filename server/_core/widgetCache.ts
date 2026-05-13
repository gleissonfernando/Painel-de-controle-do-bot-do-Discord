/**
 * Cache do Widget do Discord
 * Evita chamadas excessivas à API
 * TTL padrão: 60 segundos
 */

import { obterWidgetServidor } from './discordApi';

interface WidgetCache {
  dados: any;
  timestamp: number;
}

const cache = new Map<string, WidgetCache>();
const CACHE_TTL = 60 * 1000; // 60 segundos

/**
 * Obter widget do servidor com cache
 */
export async function obterWidgetComCache(serverId: string): Promise<any> {
  const agora = Date.now();
  const cacheEntry = cache.get(serverId);

  // Usar cache se ainda válido
  if (cacheEntry && agora - cacheEntry.timestamp < CACHE_TTL) {
    console.log(`[Widget Cache] Usando cache para servidor ${serverId}`);
    return cacheEntry.dados;
  }

  try {
    console.log(`[Widget Cache] Buscando widget para servidor ${serverId}...`);
    const dados = await obterWidgetServidor(serverId);

    // Armazenar no cache
    cache.set(serverId, {
      dados,
      timestamp: agora,
    });

    return dados;
  } catch (erro) {
    console.error(`[Widget Cache] Erro ao buscar widget:`, erro);

    // Retornar cache expirado se disponível (fallback)
    if (cacheEntry) {
      console.warn(`[Widget Cache] Retornando cache expirado como fallback`);
      return cacheEntry.dados;
    }

    throw erro;
  }
}

/**
 * Limpar cache de um servidor
 */
export function limparCacheServidor(serverId: string): void {
  cache.delete(serverId);
  console.log(`[Widget Cache] Cache limpo para servidor ${serverId}`);
}

/**
 * Limpar todo o cache
 */
export function limparTodoCache(): void {
  cache.clear();
  console.log(`[Widget Cache] Todo o cache foi limpo`);
}

/**
 * Obter informações do cache (debug)
 */
export function obterInfoCache(): any {
  const info: any = {};

  cache.forEach((entry, serverId) => {
    const idadeMs = Date.now() - entry.timestamp;
    const idadeS = Math.round(idadeMs / 1000);
    const expirado = idadeMs > CACHE_TTL;

    info[serverId] = {
      idade: `${idadeS}s`,
      expirado,
      membrosOnline: entry.dados?.presence_count || 0,
    };
  });

  return info;
}
