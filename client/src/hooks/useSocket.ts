import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const useSocket = (guildId?: string, onUpdate?: (data: any) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const [botStatus, setBotStatus] = useState<"online" | "offline">("offline");

  useEffect(() => {
    if (!guildId) return;

    // Conecta ao servidor (usa o host atual)
    if (!socket) {
      socket = io();
    }

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("[WebSocket] Connected to server");
      
      // Identifica-se como dashboard
      socket?.emit("identify", { type: "dashboard", guildId });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      setBotStatus("offline");
      console.log("[WebSocket] Disconnected from server");
    });

    socket.on("bot_status", (data: { status: "online" | "offline", guildId: string }) => {
      if (data.guildId === guildId) {
        setBotStatus(data.status);
      }
    });

    socket.on("server_update", (data: any) => {
      if (data.guildId === guildId && onUpdate) {
        onUpdate(data);
      }
    });

    return () => {
      socket?.off("connect");
      socket?.off("disconnect");
      socket?.off("bot_status");
      socket?.off("server_update");
    };
  }, [guildId]);

  const emitEvent = (event: string, payload: any) => {
    if (socket && isConnected) {
      socket.emit(event, payload);
    }
  };

  return { socket, isConnected, botStatus, emitEvent };
};
