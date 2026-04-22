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
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      let tokenResponse;
      let userInfo;

      // Tenta usar o SDK (Portal Externo)
      try {
        tokenResponse = await sdk.exchangeCodeForToken(code, state);
        userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      } catch (sdkError) {
        console.warn("[OAuth] SDK exchange failed, trying direct Discord exchange:", sdkError);
        
        // FALLBACK: Troca de código direta com o Discord
        const discordResponse = await fetch("https://discord.com/api/v10/oauth2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.VITE_DISCORD_CLIENT_ID || "1492325134550302952",
            client_secret: process.env.DISCORD_CLIENT_SECRET || "",
            grant_type: "authorization_code",
            code,
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
          loginMethod: "discord",
        };
      }

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
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

      res.redirect(302, "/servers");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
