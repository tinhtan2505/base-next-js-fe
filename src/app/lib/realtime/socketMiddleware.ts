"use client";
import type { Middleware } from "@reduxjs/toolkit";
import {
  connectRequested,
  disconnectRequested,
  statusChanged,
  errorHappened,
} from "./socketSlice";
import { stompManager } from "./stompClient";

export const socketMiddleware: Middleware = (store) => (next) => (action) => {
  if (connectRequested.match(action)) {
    const {
      url,
      token,
      useSockJS = true,
      virtualHost,
      debug,
    } = action.payload || {};
    try {
      const resolvedUrl =
        url ||
        (typeof window !== "undefined" && process.env.NEXT_PUBLIC_WS_URL) ||
        (typeof window !== "undefined"
          ? location.origin.replace(/^http/, "ws") + "/ws"
          : "/ws");
      stompManager.connect({
        url: resolvedUrl!,
        token: token ?? null,
        useSockJS,
        virtualHost,
        reconnectDelay: 3000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        debug,
      });
      store.dispatch(statusChanged(stompManager.getStatus()));
    } catch (e: unknown) {
      store.dispatch(errorHappened(String((e as Error)?.message || e)));
    }
  }
  if (disconnectRequested.match(action)) {
    stompManager.disconnect();
    store.dispatch(statusChanged("disconnected"));
  }
  return next(action);
};
