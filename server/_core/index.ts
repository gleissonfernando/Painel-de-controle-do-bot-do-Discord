import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerDiscordOAuthRoutes } from "./discordOAuth";
import { registerStorageProxy } from "./storageProxy";
import { setupWebSocket } from "./socket";
import { appRouter } from "../routers";
import { startMonitor } from "../monitor-service";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Setup WebSocket
  setupWebSocket(server);
  
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));
  
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

  const port = Number(
    process.env.PORT ||
      (process.env.NODE_ENV === "development" ? process.env.SOCKET_PORT || 3000 : 80)
  );
  const host = "0.0.0.0";

  server.listen(port, host, () => {
    console.log("========================================");
    console.log(`🚀 SHARD CLOUD DEPLOYMENT ACTIVE`);
    console.log(`FORCED PORT: ${port}`);
    console.log(`HOST: ${host}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log("========================================");
  });
}

if (process.env.ENABLE_MONITOR === "true") {
  startMonitor();
} else {
  console.log("[Monitor] Disabled. Set ENABLE_MONITOR=true to enable periodic checks.");
}
startServer().catch(err => {
  console.error("CRITICAL ERROR DURING STARTUP:", err);
  process.exit(1);
});
