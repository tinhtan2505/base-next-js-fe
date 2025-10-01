// app/lib/realtime/socketSlice.ts
"use client";

import type { IMessage } from "@stomp/stompjs";
import { getStompClient, GetStompOptions, TokenProvider } from "./stompClient";
// import {
//   getStompClient,
//   type GetStompOptions,
//   type TokenProvider,
// } from "@/app/shared/ws/stompClient";

export type Unsubscribe = () => void;

/** Lấy client (singleton) + đảm bảo đã activate */
export function ensureStompClient(
  tokenProvider: TokenProvider,
  options?: GetStompOptions
) {
  return getStompClient(tokenProvider, options);
}

/** Đăng ký topic, trả về hàm hủy */
export function subscribeTopic(
  destination: string,
  cb: (msg: IMessage) => void,
  tokenProvider: TokenProvider,
  options?: GetStompOptions
): Unsubscribe {
  const client = ensureStompClient(tokenProvider, options);
  const sub = client.subscribe(destination, cb);
  return () => {
    try {
      sub.unsubscribe();
    } catch {}
  };
}

/** Ví dụ dùng:
 * const unsub = subscribeTopic("/topic/projects", onMsg, () => localStorage.getItem("token"), { useSockJS: true });
 * // ... later
 * unsub();
 */

export { getStompClient }; // giữ export cũ nếu bạn đã dùng ở nơi khác
