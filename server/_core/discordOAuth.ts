import type { Express, Request, Response } from "express";
import { ENV } from "./env";
import { checkBotInGuild } from "../discord";

/**
 * Handles Discord OAuth2 callback when user adds bot to server
 * Discord redirects here after user authorizes the bot
 */
export function registerDiscordOAuthRoutes(app: Express) {
  app.get("/api/discord/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const guildId = req.query.guild_id as string;

    if (!code) {
      return res.status(400).json({ error: "Missing authorization code" });
    }

    try {
      // Exchange code for access token
      const tokenResponse = await fetch(
        "https://discord.com/api/v10/oauth2/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: ENV.discordClientId,
            client_secret: ENV.discordClientSecret,
            code,
            grant_type: "authorization_code",
            redirect_uri: "https://magnatas-dashboard.shardweb.app",
            scope: "bot email",
          }).toString(),
        }
      );

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json();
        console.error("[Discord OAuth] Token exchange failed:", error);
        return res
          .status(400)
          .json({ error: "Failed to exchange code for token" });
      }

      const tokenData = await tokenResponse.json();

      // Get bot info
      const botResponse = await fetch(
        "https://discord.com/api/v10/oauth2/@me",
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        }
      );

      if (!botResponse.ok) {
        console.error("[Discord OAuth] Failed to get bot info");
        return res.status(400).json({ error: "Failed to get bot info" });
      }

      const botInfo = await botResponse.json();

      // Check if bot is now in the guild
      let botInGuild = false;
      if (guildId) {
        botInGuild = await checkBotInGuild(guildId);
        console.log(`[Discord OAuth] Bot in guild ${guildId}: ${botInGuild}`);
      }

      // Redirect back to dashboard with success
      // The guild_id parameter tells us which server the bot was added to
      if (guildId) {
        const botStatus = botInGuild ? "true" : "false";
        return res.redirect(302, `/dashboard/${guildId}?bot_added=true&bot_verified=${botStatus}`);
      }

      // If no guild_id, redirect to servers page
      return res.redirect(302, "/servers?bot_added=true");
    } catch (error) {
      console.error("[Discord OAuth] Callback error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── Endpoint to check if bot is in a guild ────────────────────────────────────
  app.get("/api/check-bot/:guildId", async (req: Request, res: Response) => {
    const { guildId } = req.params;

    if (!guildId) {
      return res.status(400).json({ error: "Guild ID is required" });
    }

    try {
      const botInGuild = await checkBotInGuild(guildId);
      return res.json({ botInGuild, guildId });
    } catch (error) {
      console.error("[Check Bot] Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
