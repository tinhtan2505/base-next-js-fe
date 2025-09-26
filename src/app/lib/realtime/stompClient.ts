"use client";
import {
  Client,
  IMessage,
  IStompSocket,
  StompSubscription,
} from "@stomp/stompjs";
import SockJS from "sockjs-client";

export type StompStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";
export type StompTopicHandler = (msg: IMessage) => void;

export interface StompConfig {
  url: string; // ví dụ: http://localhost:8888/ws (SockJS) hoặc ws://host/ws (thuần WS)
  useSockJS?: boolean; // Spring thường bật SockJS
  token?: string | null; // JWT
  heartbeatIncoming?: number; // ms
  heartbeatOutgoing?: number; // ms
  reconnectDelay?: number; // ms (0 = tắt auto reconnect)
  virtualHost?: string; // cho broker relay (RabbitMQ)
  debug?: boolean;
}

class StompClientManager {
  private client: Client | null = null;
  private status: StompStatus = "idle";
  private pendingSubs: Array<{ dest: string; cb: StompTopicHandler }> = [];
  private activeSubs: Map<string, StompSubscription> = new Map();
  private currentCfg?: StompConfig;

  getStatus() {
    return this.status;
  }

  connect(cfg: StompConfig) {
    const mustRecreate =
      !this.client || this.currentCfg?.useSockJS !== cfg.useSockJS;
    this.currentCfg = cfg;
    const {
      url,
      token,
      useSockJS = true,
      heartbeatIncoming = 10000,
      heartbeatOutgoing = 10000,
      reconnectDelay = 3000,
      virtualHost,
      debug,
    } = cfg;

    if (mustRecreate) {
      this.client?.deactivate();
      this.client = new Client();
    }
    if (!this.client) return;

    this.status = "connecting";
    this.client.reconnectDelay = reconnectDelay;
    this.client.heartbeatIncoming = heartbeatIncoming;
    this.client.heartbeatOutgoing = heartbeatOutgoing;

    if (useSockJS) {
      this.client.webSocketFactory = () =>
        new SockJS(url) as unknown as IStompSocket;
    } else {
      this.client.brokerURL = url; // ws:// or wss://
    }

    this.client.connectHeaders = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(virtualHost ? { host: virtualHost } : {}),
    } as Record<string, string>;

    this.client.debug = (msg: string) => {
      if (debug) console.log("%cSTOMP", "color:#999", msg);
    };

    this.client.onConnect = () => {
      this.status = "connected";
      this.pendingSubs.forEach(({ dest, cb }) => this.subscribe(dest, cb));
      this.pendingSubs = [];
    };

    this.client.onStompError = (frame) => {
      console.error("Broker error", frame.headers["message"], frame.body);
      this.status = "error";
    };

    this.client.onWebSocketError = (evt) => {
      console.error("WS error", evt);
      this.status = "error";
    };

    this.client.onDisconnect = () => {
      this.status = "disconnected";
    };

    this.client.activate();
  }

  disconnect() {
    if (!this.client) return;
    this.activeSubs.forEach((sub) => sub.unsubscribe());
    this.activeSubs.clear();
    this.pendingSubs = [];
    this.client.deactivate();
    this.status = "disconnected";
  }

  subscribe(destination: string, cb: StompTopicHandler): () => void {
    if (!this.client || this.status !== "connected") {
      this.pendingSubs.push({ dest: destination, cb });
      return () => {
        this.pendingSubs = this.pendingSubs.filter(
          (p) => !(p.dest === destination && p.cb === cb)
        );
      };
    }
    const sub = this.client.subscribe(destination, cb);
    const key = destination + "#" + Math.random();
    this.activeSubs.set(key, sub);
    return () => {
      try {
        sub.unsubscribe();
      } catch {}
      this.activeSubs.delete(key);
    };
  }
}

export const stompManager = new StompClientManager();
