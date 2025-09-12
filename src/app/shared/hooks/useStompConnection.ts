"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Client, IFrame } from "@stomp/stompjs";
import { useRealtime } from "@/app/lib/realtime/RealtimeProvider";

type ConnStatus = "disconnected" | "connecting" | "connected" | "error";

const toErrorMessage = (e: unknown): string => {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return "Unknown error";
  }
};

export function useStompConnection() {
  const { client, connected } = useRealtime(); // lấy client & cờ connected từ Provider
  const [status, setStatus] = useState<ConnStatus>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const attemptsRef = useRef(0);

  // tính toán nhanh
  const connecting = useMemo(() => status === "connecting", [status]);
  const state = useMemo(
    () => ({ connected, connecting, status, error }),
    [connected, connecting, status, error]
  );

  // gắn listeners cho client hiện tại
  useEffect(() => {
    if (!client) {
      setStatus("disconnected");
      setError(null);
      attemptsRef.current = 0;
      return;
    }

    // trạng thái ban đầu
    setStatus(client.connected ? "connected" : "connecting");
    setError(null);

    const onConnect = (_frame?: IFrame) => {
      setStatus("connected");
      setError(null);
      attemptsRef.current = 0;
    };

    const onStompError = (frame: IFrame) => {
      setStatus("error");
      setError(frame?.headers?.message || "STOMP error");
    };

    const onWebSocketClose = (evt: CloseEvent) => {
      attemptsRef.current += 1;
      setStatus("connecting"); // STOMP sẽ tự reconnect nếu cấu hình reconnectDelay
      setError(evt.reason || null);
    };

    const prevOnConnect = client.onConnect;
    const prevOnStompError = client.onStompError;
    const prevOnWebSocketClose = client.onWebSocketClose;

    client.onConnect = onConnect;
    client.onStompError = onStompError;
    client.onWebSocketClose = onWebSocketClose;

    // đồng bộ nếu client đã đang connected
    if (client.connected) onConnect();

    return () => {
      // khôi phục handlers cũ (tránh ghi đè ở nơi khác)
      client.onConnect = prevOnConnect;
      client.onStompError = prevOnStompError;
      client.onWebSocketClose = prevOnWebSocketClose;
    };
  }, [client]);

  const connect = useCallback(() => {
    // Provider đã activate khi khởi tạo, nhưng vẫn expose để chủ động gọi lại nếu cần
    try {
      client?.activate();
      setStatus(client?.connected ? "connected" : "connecting");
      setError(null);
    } catch (e: unknown) {
      setStatus("error");
      setError(toErrorMessage(e));
    }
  }, [client]);

  const disconnect = useCallback(async () => {
    try {
      await client?.deactivate();
      setStatus("disconnected");
      setError(null);
    } catch (e: unknown) {
      setStatus("error");
      setError(toErrorMessage(e));
    }
  }, [client]);

  const publish = useCallback(
    (
      destination: string,
      body: unknown,
      headers: Record<string, string> = {}
    ) => {
      if (!client?.connected) throw new Error("STOMP not connected");
      client.publish({
        destination,
        headers,
        body: typeof body === "string" ? body : JSON.stringify(body),
      });
    },
    [client]
  );

  return {
    client: client as Client | null,
    ...state, // { connected, connecting, status, error }
    attempts: attemptsRef.current,
    connect,
    disconnect,
    publish,
  };
}
