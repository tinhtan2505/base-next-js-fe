"use client";

import { useRealtime } from "@/app/lib/realtime/RealtimeProvider";
import { useEffect } from "react";

export function useStompSubscription<T = unknown>(
  destination: string,
  handler: (msg: T) => void
) {
  const { client, connected } = useRealtime();

  useEffect(() => {
    if (!client || !connected) return;

    const sub = client.subscribe(destination, (message) => {
      try {
        handler(JSON.parse(message.body));
      } catch {
        // fallback: payload có thể là text
        handler(message.body as unknown as T);
      }
    });

    return () => sub?.unsubscribe();
  }, [client, connected, destination, handler]);
}
