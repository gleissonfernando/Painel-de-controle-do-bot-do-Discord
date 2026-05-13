import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

export let io: SocketIOServer | null = null;

type IdentifyPayload = {
  type: "bot" | "dashboard";
  guildId?: string;
};

type GuildEventPayload = {
  guildId: string;
  event?: string;
  payload?: unknown;
  [key: string]: unknown;
};

function guildRoom(guildId: string) {
  return `guild:${guildId}`;
}

function botRoom(guildId: string) {
  return `bot:guild:${guildId}`;
}

export function setupWebSocket(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:5000",
      methods: ["GET", "POST"],
      credentials: false,
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.IO] connect ${socket.id}`);

    socket.on("identify", (data: IdentifyPayload) => {
      try {
        if (!data?.guildId) {
          console.warn(`[Socket.IO] identify ignored for ${socket.id}: missing guildId`);
          return;
        }

        const room = guildRoom(data.guildId);

        if (data.type === "bot") {
          socket.join(room);
          socket.join(botRoom(data.guildId));
          socket.join("bots");
          console.log(`[Socket.IO] bot identified ${socket.id} guild=${data.guildId}`);
          io?.to(room).emit("bot_status", { guildId: data.guildId, status: "online" });
          return;
        }

        if (data.type === "dashboard") {
          socket.join(room);
          console.log(`[Socket.IO] dashboard identified ${socket.id} guild=${data.guildId}`);
          return;
        }

        console.warn(`[Socket.IO] identify ignored for ${socket.id}: invalid type`);
      } catch (error) {
        console.error(`[Socket.IO] identify error ${socket.id}:`, error);
      }
    });

    socket.on("bot_event", (data: GuildEventPayload) => {
      try {
        if (!data?.guildId) {
          console.warn(`[Socket.IO] bot_event ignored for ${socket.id}: missing guildId`);
          return;
        }

        console.log(`[Socket.IO] bot_event guild=${data.guildId} event=${data.event || "unknown"}`);
        io?.to(guildRoom(data.guildId)).emit("bot_event", data);

        // Backward compatibility with existing dashboard listeners.
        io?.to(guildRoom(data.guildId)).emit("server_update", data);
        if (data.event === "new_log" || data.payload) {
          io?.to(guildRoom(data.guildId)).emit("new_log", data.payload ?? data);
        }
      } catch (error) {
        console.error(`[Socket.IO] bot_event error ${socket.id}:`, error);
      }
    });

    socket.on("bot_status", (data: GuildEventPayload) => {
      try {
        if (!data?.guildId) {
          console.warn(`[Socket.IO] bot_status ignored for ${socket.id}: missing guildId`);
          return;
        }

        console.log(`[Socket.IO] bot_status guild=${data.guildId}`);
        io?.to(guildRoom(data.guildId)).emit("bot_status", data);
      } catch (error) {
        console.error(`[Socket.IO] bot_status error ${socket.id}:`, error);
      }
    });

    socket.on("panel_command", (data: GuildEventPayload) => {
      try {
        if (!data?.guildId) {
          console.warn(`[Socket.IO] panel_command ignored for ${socket.id}: missing guildId`);
          return;
        }

        console.log(`[Socket.IO] panel_command dashboard->bot guild=${data.guildId} event=${data.event || "command"}`);
        io?.to(botRoom(data.guildId)).emit("panel_command", data);
      } catch (error) {
        console.error(`[Socket.IO] panel_command error ${socket.id}:`, error);
      }
    });

    socket.on("error", (error) => {
      console.error(`[Socket.IO] socket error ${socket.id}:`, error);
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket.IO] disconnect ${socket.id}: ${reason}`);
    });
  });

  io.engine.on("connection_error", (error) => {
    console.error("[Socket.IO] connection error:", error.message);
  });

  return io;
}

export function getIO() {
  return io;
}

/**
 * Envia uma mensagem para uma guild específica
 */
export function emitToGuild(guildId: string, event: string, payload: any) {
  if (io) {
    io.to(guildRoom(guildId)).emit(event, payload);
  }
}

export async function emitCommandToBot(guildId: string, command: string, payload: Record<string, unknown> = {}) {
  if (!io) return { delivered: false, botCount: 0 };

  const room = botRoom(guildId);
  const sockets = await io.in(room).fetchSockets();
  io.to(room).emit("panel_command", {
    guildId,
    command,
    payload,
    createdAt: new Date().toISOString(),
  });

  return { delivered: sockets.length > 0, botCount: sockets.length };
}

export async function emitCommandToAllBots(command: string, payload: Record<string, unknown> = {}) {
  if (!io) return { delivered: false, botCount: 0 };

  const sockets = await io.in("bots").fetchSockets();
  io.to("bots").emit("panel_command", {
    command,
    payload,
    createdAt: new Date().toISOString(),
  });

  return { delivered: sockets.length > 0, botCount: sockets.length };
}
