// app/shared/ws/stompClient.ts
"use client";

import {
  Client,
  type IStompSocket,
  type StompConfig as CoreStompConfig,
  StompHeaders,
} from "@stomp/stompjs";
// NOTE: nếu dự án của bạn gặp lỗi typings, thử:
// import SockJS from "sockjs-client/dist/sockjs";
import SockJS from "sockjs-client";

/** Tuỳ chọn khi lấy client */
export type GetStompOptions = {
  /** Mặc định true (Spring thường bật SockJS) */
  useSockJS?: boolean;
  /** Nếu không truyền, sẽ suy ra từ env/location */
  url?: string;
  /** Cho broker relay (RabbitMQ) */
  virtualHost?: string;
  /** ms */
  heartbeatIncoming?: number;
  /** ms */
  heartbeatOutgoing?: number;
  /** ms (0 = tắt auto reconnect) */
  reconnectDelay?: number;
  /** Bật console debug */
  debug?: boolean;
  /** Hook tuỳ chọn chạy trước CONNECT (vd fetch gì đó) */
  beforeConnect?: () => void | Promise<void>;
};

/** Hàm cung cấp JWT, được gọi ngay trước mỗi CONNECT */
export type TokenProvider = () => string | null | undefined;

let _client: Client | null = null;
let _currentOptions: GetStompOptions | undefined;
let _tokenProvider: TokenProvider | undefined;

/** Suy ra URL mặc định */
function resolveUrl(useSockJS: boolean): string {
  // 1) ưu tiên env
  const envUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (envUrl && envUrl.trim()) return envUrl.trim();

  if (typeof window === "undefined") {
    // SSR — trả về placeholder, client sẽ set lại khi mount
    // Với SockJS bắt buộc http(s); native ws://
    return useSockJS ? "http://localhost:8888/ws" : "ws://localhost:8888/ws";
  }

  // 2) Suy ra từ location
  const origin = window.location.origin; // http://host:port
  if (useSockJS) {
    // SockJS yêu cầu http(s)
    return `${origin}/ws`;
  }
  // native WS dùng ws(s)
  return origin.replace(/^http/i, "ws") + "/ws";
}

/** Tạo mới Client theo options hiện tại */
function buildClient(
  tokenProvider?: TokenProvider,
  opts?: GetStompOptions
): Client {
  const {
    useSockJS = true,
    url = resolveUrl(useSockJS),
    virtualHost,
    heartbeatIncoming = 10000,
    heartbeatOutgoing = 10000,
    reconnectDelay = 3000,
    debug = false,
    beforeConnect,
  } = opts || {};

  const client = new Client();

  // Factory socket:
  if (useSockJS) {
    client.webSocketFactory = () => new SockJS(url) as unknown as IStompSocket;
  } else {
    // native ws(s) url
    (client as Client & { brokerURL: string }).brokerURL = url;
  }

  // Heartbeat + auto reconnect:
  client.heartbeatIncoming = heartbeatIncoming;
  client.heartbeatOutgoing = heartbeatOutgoing;
  client.reconnectDelay = reconnectDelay;

  // Debug:
  client.debug = (msg: string) => {
    if (debug) console.log("%cSTOMP", "color:#999", msg);
  };

  // Trước CONNECT: nạp token & headers động
  client.beforeConnect = async () => {
    if (beforeConnect) await beforeConnect();
    const token = tokenProvider?.();
    const headers: StompHeaders = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(virtualHost ? { host: virtualHost } : {}),
    };
    client.connectHeaders = headers; // <- luôn là StompHeaders (không undefined)
  };

  // Một số handler mặc định (Provider bên ngoài có thể override thêm)
  client.onStompError = (frame) => {
    console.error(
      "[STOMP] Broker error:",
      frame.headers["message"],
      frame.body
    );
  };
  client.onWebSocketError = (evt) => {
    console.error("[STOMP] WS error:", evt);
  };

  return client;
}

/**
 * Factory singleton cho STOMP Client.
 *
 * - Luôn trả về cùng một `Client` giữa các lần gọi.
 * - Nếu options thay đổi loại transport (SockJS vs native) → sẽ rebuild client.
 * - Tự `activate()` ngay lần đầu để Provider của bạn nhận onConnect/onDisconnect.
 */
export function getStompClient(
  tokenProvider?: TokenProvider,
  options?: GetStompOptions
): Client {
  const nextUseSockJS = options?.useSockJS ?? true;
  const currentUseSockJS = _currentOptions?.useSockJS ?? true;

  // Cần rebuild nếu chưa có client hoặc thay đổi SockJS/native
  const needRebuild = !_client || nextUseSockJS !== currentUseSockJS;

  _tokenProvider = tokenProvider;
  _currentOptions = {
    useSockJS: nextUseSockJS,
    url: options?.url ?? resolveUrl(nextUseSockJS),
    virtualHost: options?.virtualHost,
    heartbeatIncoming: options?.heartbeatIncoming ?? 10000,
    heartbeatOutgoing: options?.heartbeatOutgoing ?? 10000,
    reconnectDelay: options?.reconnectDelay ?? 3000,
    debug: options?.debug ?? false,
    beforeConnect: options?.beforeConnect,
  };

  if (needRebuild) {
    try {
      _client?.deactivate(); // dọn client cũ nếu có
    } catch {
      /* ignore */
    }
    _client = buildClient(_tokenProvider, _currentOptions);
  } else if (_client) {
    _client.heartbeatIncoming = _currentOptions.heartbeatIncoming!;
    _client.heartbeatOutgoing = _currentOptions.heartbeatOutgoing!;
    _client.reconnectDelay = _currentOptions.reconnectDelay!;
    _client.debug = (msg: string) => {
      if (_currentOptions?.debug) console.log("%cSTOMP", "color:#999", msg);
    };
    _client.beforeConnect = async () => {
      if (_currentOptions?.beforeConnect) await _currentOptions.beforeConnect();
      const token = _tokenProvider?.();
      const headers: StompHeaders = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(_currentOptions?.virtualHost
          ? { host: _currentOptions.virtualHost }
          : {}),
      };
      _client!.connectHeaders = headers;
    };

    // Nếu URL thay đổi (hiếm khi), rebuild để chắc chắn
    const isSock = _currentOptions.useSockJS ?? true;
    if (!isSock) {
      const c = _client as Client & {
        brokerURL?: string;
        webSocketFactory?: (() => IStompSocket) | undefined;
      };
      const effectiveUrl = _currentOptions.url!;
      const currentUrl = c.brokerURL ?? "";
      const urlChanged = currentUrl !== effectiveUrl;
      if (urlChanged) {
        try {
          _client.deactivate();
        } catch {
          /* ignore */
        }
        _client = buildClient(_tokenProvider, _currentOptions);
      }
    }
  }

  // Kích hoạt nếu chưa hoạt động
  if (_client && !_client.active) {
    _client.activate();
  }

  return _client!;
}
