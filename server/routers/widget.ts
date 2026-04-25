/**
 * Router para Widget do Discord
 * Fornece dados do widget com cache para o frontend
 */

import { router, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import { obterWidgetComCache } from '../_core/widgetCache';

export const widgetRouter = router({
  /**
   * Obter dados do widget com cache
   * GET /api/trpc/widget.get?input={"serverId":"123"}
   */
  get: publicProcedure
    .input(z.object({ serverId: z.string() }))
    .query(async ({ input }) => {
      try {
        const dados = await obterWidgetComCache(input.serverId);

        // Retornar apenas dados necessários para o frontend
        return {
          nome: dados.name,
          online: dados.presence_count || 0,
          convite: dados.instant_invite,
          membros: (dados.members || [])
            .slice(0, 10)
            .map((m: any) => ({
              nome: m.username,
              avatar: m.avatar_url,
              status: m.status,
            })),
          canais: (dados.channels || [])
            .slice(0, 5)
            .map((c: any) => ({
              id: c.id,
              nome: c.name,
              posicao: c.position,
            })),
        };
      } catch (erro) {
        console.error('[Widget Router] Erro ao obter widget:', erro);
        return {
          nome: 'Servidor',
          online: 0,
          convite: null,
          membros: [],
          canais: [],
          erro: 'Widget temporariamente indisponível',
        };
      }
    }),

  /**
   * Obter informações de cache (debug)
   */
  cacheInfo: publicProcedure.query(async () => {
    const { obterInfoCache } = await import('../_core/widgetCache');
    return obterInfoCache();
  }),
});
