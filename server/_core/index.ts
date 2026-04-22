import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerDiscordOAuthRoutes } from "./discordOAuth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerDiscordOAuthRoutes(app);
  
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ABSOLUTE PORT FORCING FOR SHARD CLOUD
  // We ignore process.env.PORT because the logs show it's being set to 3000
  // while the proxy expects port 80.
  const port = 80;
  const host = "0.0.0.0";

  server.listen(port, host, () => {
    console.log("========================================");
    console.log(`🚀 SERVER IS LIVE!`);
    console.log(`URL: http://${host}:${port}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log("========================================");
  });
}

startServer().catch(err => {
  console.error("FAILED TO START SERVER:", err);
  process.exit(1);
});
