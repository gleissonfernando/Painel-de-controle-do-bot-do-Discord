/**
 * Router para Webhooks do Discord
 * Permite enviar mensagens para Discord via webhook
 */

import { router, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import {
  notificarFormularioContato,
  notificarErro,
  notificarNovoUsuario,
} from '../_core/webhooks';

export const webhookRouter = router({
  /**
   * Enviar formulário de contato via webhook
   */
  enviarContato: publicProcedure
    .input(
      z.object({
        nome: z.string().min(1).max(100),
        email: z.string().email(),
        mensagem: z.string().min(1).max(2000),
        pagina: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

        if (!webhookUrl) {
          throw new Error('DISCORD_WEBHOOK_URL não configurado');
        }

        await notificarFormularioContato(webhookUrl, {
          nome: input.nome,
          email: input.email,
          mensagem: input.mensagem,
          pagina: input.pagina,
        });

        return {
          sucesso: true,
          mensagem: 'Mensagem enviada com sucesso!',
        };
      } catch (erro) {
        console.error('[Webhook Router] Erro ao enviar contato:', erro);
        return {
          sucesso: false,
          erro: 'Falha ao enviar mensagem',
        };
      }
    }),

  /**
   * Enviar notificação de novo usuário
   */
  notificarNovoUsuario: publicProcedure
    .input(
      z.object({
        id: z.string(),
        username: z.string(),
        global_name: z.string().optional(),
        email: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

        if (!webhookUrl) {
          throw new Error('DISCORD_WEBHOOK_URL não configurado');
        }

        await notificarNovoUsuario(webhookUrl, input);

        return { sucesso: true };
      } catch (erro) {
        console.error('[Webhook Router] Erro ao notificar novo usuário:', erro);
        return { sucesso: false };
      }
    }),

  /**
   * Enviar notificação de erro
   */
  notificarErro: publicProcedure
    .input(
      z.object({
        titulo: z.string(),
        mensagem: z.string(),
        contexto: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

        if (!webhookUrl) {
          throw new Error('DISCORD_WEBHOOK_URL não configurado');
        }

        await notificarErro(webhookUrl, input.titulo, input.mensagem, input.contexto);

        return { sucesso: true };
      } catch (erro) {
        console.error('[Webhook Router] Erro ao notificar erro:', erro);
        return { sucesso: false };
      }
    }),
});
