"use client";

import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let client: Client | null = null;

export function getStompClient(getToken: () => string | null) {
  if (client) return client;

  client = new Client({
    // Dùng SockJS để match backend /ws?token=...
    webSocketFactory: () =>
      new SockJS(`${process.env.NEXT_PUBLIC_WS_URL}?token=${getToken() ?? ""}`),

    reconnectDelay: 5000, // tự reconnect (5s, exponential backoff nội bộ)
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    onConnect: () => {
      // có thể log hoặc emit sự kiện "connected"
      // console.log('STOMP connected');
    },
    onStompError: (frame) => {
      console.error("STOMP error:", frame.headers["message"], frame.body);
    },
    onWebSocketClose: (evt) => {
      console.warn("WS closed", evt.reason);
    },
    debug: () => {}, // tắt log, bật khi cần
  });

  client.activate();
  return client;
}

export async function disconnectStomp() {
  if (client) {
    await client.deactivate();
    client = null;
  }
}
