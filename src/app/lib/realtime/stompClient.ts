// "use client";
import type {
  Client,
  IMessage,
  StompHeaders,
  StompSubscription,
} from "@stomp/stompjs";
import { Client as StompClient } from "@stomp/stompjs";
import SockJS from "sockjs-client";

type ConnectOptions = {
  url: string; // ví dụ: "/ws" (SockJS endpoint) hoặc "wss://.../ws"
  useSockJS?: boolean; // Spring dùng SockJS => true
  getAuthToken?: () => string | undefined; // JWT nếu có
  debug?: boolean;
};

let client: Client | null = null;
let connecting = false;
const subscriptions = new Map<string, StompSubscription>();

function buildHeaders(getAuthToken?: () => string | undefined): StompHeaders {
  const headers: StompHeaders = {};
  const token = getAuthToken?.();
  if (token) headers.Authorization = `Bearer ${token}`; // ✅ không tạo key khi undefined
  return headers;
}

export function getStompClient(opts: ConnectOptions): Client {
  if (client) return client;

  const { url, useSockJS = true, getAuthToken, debug } = opts;

  const c = new StompClient({
    // SockJS: truyền factory thay vì url WS thuần
    webSocketFactory: useSockJS ? () => new SockJS(url) : undefined,
    brokerURL: useSockJS ? undefined : url, // WS thuần (wss://...): dùng brokerURL
    connectHeaders: buildHeaders(getAuthToken),
    // Tự động reconnect
    reconnectDelay: 2000, // ms
    // Heartbeat
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: debug ? (str) => console.log("[STOMP]", str) : undefined,
    // Gửi lại header khi reconnect
    beforeConnect: () => {
      c.connectHeaders = buildHeaders(getAuthToken);
    },
    onStompError: (frame) => {
      console.error("❌ STOMP error:", frame.headers["message"], frame.body);
    },
    onWebSocketClose: (evt) => {
      console.warn("WS closed:", evt?.code, evt?.reason);
    },
  });

  client = c;
  return c;
}

export async function ensureConnected(c: Client): Promise<void> {
  if (c.connected || connecting) return;
  connecting = true;
  try {
    await new Promise<void>((resolve, reject) => {
      c.onConnect = () => {
        connecting = false;
        resolve();
      };
      c.onWebSocketError = (e) => {
        connecting = false;
        reject(e);
      };
      c.activate();
    });
  } catch (e) {
    connecting = false;
    throw e;
  }
}

export function stompSubscribe(
  c: Client,
  destination: string,
  onMessage: (msg: IMessage) => void
) {
  const key = destination;
  if (subscriptions.has(key)) return subscriptions.get(key)!;

  const sub = c.subscribe(destination, onMessage, {});
  subscriptions.set(key, sub);
  return sub;
}

export function stompUnsubscribe(destination: string) {
  const sub = subscriptions.get(destination);
  if (sub) {
    try {
      sub.unsubscribe();
    } catch {}
    subscriptions.delete(destination);
  }
}

export function deactivateStomp() {
  subscriptions.forEach((s) => {
    try {
      s.unsubscribe();
    } catch {}
  });
  subscriptions.clear();
  client?.deactivate();
  client = null;
  connecting = false;
}
