// app/shared/ws/stompClient.ts
"use client";

import { Client, type IStompSocket, type StompHeaders } from "@stomp/stompjs";
// Nếu gặp vấn đề typings bundler: import SockJS from "sockjs-client/dist/sockjs";
import SockJS from "sockjs-client";

export type GetStompOptions = {
  useSockJS?: boolean; // default true
  url?: string; // nếu không truyền sẽ suy ra
  virtualHost?: string; // cho broker relay
  heartbeatIncoming?: number; // ms
  heartbeatOutgoing?: number; // ms
  reconnectDelay?: number; // ms (0 = tắt auto reconnect)
  debug?: boolean; // log console
  beforeConnect?: () => void | Promise<void>;
};

export type TokenProvider = () => string | null | undefined;

let _client: Client | null = null;
let _currentOptions: GetStompOptions | undefined;
let _tokenProvider: TokenProvider | undefined;

function resolveUrl(useSockJS: boolean): string {
  const envUrl = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (envUrl) return envUrl;
  if (typeof window === "undefined") {
    return useSockJS ? "http://localhost:8888/ws" : "ws://localhost:8888/ws";
  }
  const origin = window.location.origin;
  return useSockJS ? `${origin}/ws` : origin.replace(/^http/i, "ws") + "/ws";
}

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

  if (useSockJS) {
    client.webSocketFactory = () => new SockJS(url) as unknown as IStompSocket;
  } else {
    client.brokerURL = url; // ws:// or wss://
  }

  client.heartbeatIncoming = heartbeatIncoming;
  client.heartbeatOutgoing = heartbeatOutgoing;
  client.reconnectDelay = reconnectDelay;

  client.debug = (msg: string) => {
    if (debug) console.log("%cSTOMP", "color:#999", msg);
  };

  client.beforeConnect = async () => {
    if (beforeConnect) await beforeConnect();
    const token = tokenProvider?.();
    console.log("STOMP beforeConnect, token:", token);

    const headers: StompHeaders = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(virtualHost ? { host: virtualHost } : {}),
    };
    client.connectHeaders = headers; // luôn là StompHeaders
  };

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

/** Singleton factory */
export function getStompClient(
  tokenProvider?: TokenProvider,
  options?: GetStompOptions
): Client {
  const nextUseSockJS = options?.useSockJS ?? true;
  const prevUseSockJS = _currentOptions?.useSockJS ?? true;
  const prevUrl = _currentOptions?.url;

  console.log("tokenProvider - useSockJS:", tokenProvider);

  const nextOptions: GetStompOptions = {
    useSockJS: nextUseSockJS,
    url: options?.url ?? resolveUrl(nextUseSockJS),
    virtualHost: options?.virtualHost,
    heartbeatIncoming: options?.heartbeatIncoming ?? 10000,
    heartbeatOutgoing: options?.heartbeatOutgoing ?? 10000,
    reconnectDelay: options?.reconnectDelay ?? 3000,
    debug: options?.debug ?? false,
    beforeConnect: options?.beforeConnect,
  };

  const needRebuild =
    !_client ||
    nextUseSockJS !== prevUseSockJS ||
    (!!prevUrl && nextOptions.url !== prevUrl);

  _tokenProvider = tokenProvider;
  _currentOptions = nextOptions;

  if (needRebuild) {
    try {
      _client?.deactivate();
    } catch {}
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
  }

  if (_client && !_client.active) _client.activate();
  return _client!;
}
