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

  // ABSOLUTE FORCE PORT 80 FOR SHARD CLOUD
  // We ignore process.env.PORT entirely because Shard Cloud sets it to 3000
  // but their proxy only looks for port 80.
  const port = 80;
  const host = "0.0.0.0";

  server.listen(port, host, () => {
    console.log("========================================");
    console.log(`🚀 SHARD CLOUD DEPLOYMENT ACTIVE`);
    console.log(`FORCED PORT: ${port}`);
    console.log(`HOST: ${host}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log("========================================");
    
    // Diagnostic heartbeat to keep logs active and verify port
    setInterval(() => {
      console.log(`[Heartbeat] Server still responding on port ${port}...`);
    }, 30000);
  });
}

startServer().catch(err => {
  console.error("CRITICAL ERROR DURING STARTUP:", err);
  process.exit(1);
});
