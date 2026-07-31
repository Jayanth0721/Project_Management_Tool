import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";

type EventHandler = (data: any) => void;

const WS_URL = `${import.meta.env.VITE_WS_URL || "ws://localhost:8000/api/v1"}`;

export function useWebSocket(handlers?: Record<string, EventHandler>) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  // const addToast = useToastStore((s) => s.addToast);

  const connect = useCallback(() => {
    if (!accessToken) return;

    const ws = new WebSocket(`${WS_URL}/ws?token=${accessToken}`);

    ws.onopen = () => {
      console.debug("[WS] Connected");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === "pong") return;
        const handler = handlers?.[msg.event];
        if (handler) {
          handler(msg.data);
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      console.debug("[WS] Disconnected — reconnecting in 5s");
      reconnectTimer.current = setTimeout(connect, 5000);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, [accessToken, handlers]);

  const send = useCallback((event: string, data?: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event, data }));
    }
  }, []);

  useEffect(() => {
    connect();
    // Keepalive ping every 30s
    const ping = setInterval(() => send("ping"), 30000);
    return () => {
      clearInterval(ping);
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      wsRef.current?.close();
    };
  }, [connect, send]);

  return { send, isConnected: wsRef.current?.readyState === WebSocket.OPEN };
}
