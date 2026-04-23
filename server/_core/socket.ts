import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function setupWebSocket(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*", // Em produção, você pode restringir isso
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[WebSocket] New connection: ${socket.id}`);

    // Identificação da conexão (Bot ou Dashboard)
    socket.on("identify", (data: { type: "bot" | "dashboard"; guildId?: string }) => {
      if (data.type === "bot" && data.guildId) {
        socket.join(`guild_${data.guildId}`);
        socket.join("bots");
        console.log(`[WebSocket] Bot identified for guild: ${data.guildId}`);
        
        // Notifica dashboards que o bot está online
        io?.to(`guild_${data.guildId}`).emit("bot_status", { status: "online", guildId: data.guildId });
      } else if (data.type === "dashboard" && data.guildId) {
        socket.join(`guild_${data.guildId}`);
        console.log(`[WebSocket] Dashboard identified for guild: ${data.guildId}`);
      }
    });

    // Eventos enviados pelo Bot para o Dashboard
    socket.on("bot_event", (data: { guildId: string; event: string; payload: any }) => {
      console.log(`[WebSocket] Event from bot: ${data.event} for guild ${data.guildId}`);
      // Encaminha o evento para todos na sala daquela guild (principalmente dashboards)
      io?.to(`guild_${data.guildId}`).emit("server_update", data);
    });

    socket.on("disconnect", () => {
      console.log(`[WebSocket] Disconnected: ${socket.id}`);
    });
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
    io.to(`guild_${guildId}`).emit(event, payload);
  }
}
