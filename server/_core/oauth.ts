import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code") || (req.query.code as string);
    const state = getQueryParam(req, "state") || (req.query.state as string);
    const guildId = getQueryParam(req, "guild_id") || (req.query.guild_id as string);

    console.log(`[OAuth] Callback received. Code: ${code ? "present" : "missing"}, State: ${state ? "present" : "missing"}, Guild: ${guildId || "none"}`);

    if (!code) {
      console.error("[OAuth] Missing code in query parameters:", req.query);
      // Se o bot foi adicionado mas não há código (improvável mas possível em alguns fluxos), ainda tentamos salvar
      if (guildId) {
        await db.upsertGuildSettings({ guildId, botEnabled: true });
        return res.redirect(302, `/dashboard/${guildId}`);
      }
      res.status(400).json({ error: "Authentication code is missing from Discord redirect." });
      return;
    }

    try {
      let tokenResponse;
      let userInfo;

      // Tenta usar o SDK (Portal Externo) se o state estiver presente
      try {
        if (!state) {
          console.log("[OAuth] No state provided, skipping SDK exchange and going direct to Discord.");
          throw new Error("State missing");
        }
        tokenResponse = await sdk.exchangeCodeForToken(code, state);
        userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      } catch (sdkError) {
        console.warn("[OAuth] Using direct Discord exchange (SDK fallback/no state).");
        
        // FALLBACK: Troca de código direta com o Discord
        // De acordo com a documentação, client_id e client_secret podem ser enviados no body ou via Basic Auth
        const discordResponse = await fetch("https://discord.com/api/v10/oauth2/token", {
          method: "POST",
          headers: { 
            "Content-Type": "application/x-www-form-urlencoded",
            // Algumas implementações preferem Basic Auth, mas o body é padrão para x-www-form-urlencoded
          },
          body: new URLSearchParams({
            client_id: process.env.VITE_DISCORD_CLIENT_ID || "1492325134550302952",
            client_secret: process.env.DISCORD_CLIENT_SECRET || "",
            grant_type: "authorization_code",
            code: code,
            redirect_uri: `https://magnatas-dashboard.shardweb.app/api/oauth/callback`,
          }),
        });

        if (!discordResponse.ok) {
          throw new Error(`Discord token exchange failed: ${await discordResponse.text()}`);
        }

        const discordTokens = await discordResponse.json();
        tokenResponse = {
          accessToken: discordTokens.access_token,
          refreshToken: discordTokens.refresh_token,
        };

        // Busca info do usuário no Discord
        const userResponse = await fetch("https://discord.com/api/v10/users/@me", {
          headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
        });
        
        const discordUser = await userResponse.json();
        userInfo = {
          openId: discordUser.id,
          name: discordUser.global_name || discordUser.username,
          email: discordUser.email,
          avatar: discordUser.avatar 
            ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
            : null,
          loginMethod: "discord",
        };
      }

      if (!userInfo || !userInfo.openId) {
        console.warn("[OAuth] User info missing, but check if bot was added.");
        if (guildId) {
          console.log(`[OAuth] Bot added to guild ${guildId}, initializing settings and redirecting.`);
          
          // Inicializa as configurações do servidor no banco para garantir que o acesso seja liberado
          await db.upsertGuildSettings({ 
            guildId, 
            botEnabled: true,
            prefix: "!" // Prefixo padrão
          });

          // Redireciona direto para o dashboard do servidor adicionado
          return res.redirect(302, `/dashboard/${guildId}`);
        }
        res.status(400).json({ error: "Authentication failed: User information could not be retrieved and no bot was added." });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        avatar: (userInfo as any).avatar || null,
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      if (guildId) {
        // Inicializa as configurações se o bot foi adicionado
        await db.upsertGuildSettings({ guildId, botEnabled: true });
        return res.redirect(302, `/dashboard/${guildId}`);
      }

      res.redirect(302, "/servers");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      // Se houver erro no login mas o bot foi adicionado, ainda redirecionamos para o dashboard
      if (guildId) {
        await db.upsertGuildSettings({ guildId, botEnabled: true });
        return res.redirect(302, `/dashboard/${guildId}`);
      }
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
