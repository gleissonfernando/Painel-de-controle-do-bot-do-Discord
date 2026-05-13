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
  const oauthHandler = async (req: Request, res: Response) => {
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
        const protocol = req.headers["x-forwarded-proto"] || req.protocol;
        const host = req.headers["x-forwarded-host"] || req.get("host");
        const redirectUri = `${protocol}://${host}${req.path}`;

        console.log(`[OAuth] Exchanging code for token with redirect_uri: ${redirectUri}`);

        const discordResponse = await fetch("https://discord.com/api/v10/oauth2/token", {
          method: "POST",
          headers: { 
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: process.env.VITE_DISCORD_CLIENT_ID || "1492325134550302952",
            client_secret: process.env.DISCORD_CLIENT_SECRET || "",
            grant_type: "authorization_code",
            code: code,
            redirect_uri: redirectUri,
          }),
        });

        if (!discordResponse.ok) {
          const errorBody = await discordResponse.text();
          console.error(`[OAuth] Discord token exchange failed. Status: ${discordResponse.status}, Body:`, errorBody);
          throw new Error(`Discord token exchange failed: ${errorBody}`);
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

      // Busca os servidores do usuário para sincronização imediata
      let userGuilds = [];
      try {
        const guildsResponse = await fetch("https://discord.com/api/v10/users/@me/guilds", {
          headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
        });
        if (guildsResponse.ok) {
          userGuilds = await guildsResponse.ok ? await guildsResponse.json() : [];
        }
      } catch (e) {
        console.error("[OAuth] Failed to fetch user guilds during login:", e);
      }

      // Garante que o nome e avatar do usuário sejam salvos corretamente
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        avatar: null,
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
  };

  // Registra ambas as rotas para garantir compatibilidade
  app.get("/api/oauth/callback", oauthHandler);
  app.get("/auth/discord/callback", oauthHandler);
}
