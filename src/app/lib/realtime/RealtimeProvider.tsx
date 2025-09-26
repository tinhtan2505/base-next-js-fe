"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Client } from "@stomp/stompjs";
import { getStompClient } from "./socketSlice";
// import { getStompClient } from "./stompClient";

type Ctx = { client: Client | null; connected: boolean };
const RealtimeCtx = createContext<Ctx>({ client: null, connected: false });
export const useRealtime = () => useContext(RealtimeCtx);

export default function RealtimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [connected, setConnected] = useState(false);

  const client = useMemo(
    () =>
      getStompClient(
        () =>
          typeof window !== "undefined" ? localStorage.getItem("token") : null,
        {
          useSockJS: true, // Spring SockJS
          // url: process.env.NEXT_PUBLIC_WS_URL, // nếu muốn chỉ định
          virtualHost: process.env.NEXT_PUBLIC_WS_VHOST || undefined,
          heartbeatIncoming: 10000,
          heartbeatOutgoing: 10000,
          reconnectDelay: 3000,
          debug: false,
        }
      ),
    []
  );

  useEffect(() => {
    if (!client) return;
    const onConnect: Client["onConnect"] = () => setConnected(true);
    const onDisconnect: Client["onDisconnect"] = () => setConnected(false);

    const prevOnConnect = client.onConnect;
    const prevOnDisconnect = client.onDisconnect;

    client.onConnect = onConnect;
    client.onDisconnect = onDisconnect;

    if (client.connected) setConnected(true);
    return () => {
      // không deactivate toàn cục ở đây nếu muốn giữ kết nối khi unmount 1 page
      client.onConnect = prevOnConnect ?? (() => {});
      client.onDisconnect = prevOnDisconnect ?? (() => {});
    };
  }, [client]);

  return (
    <RealtimeCtx.Provider value={{ client, connected }}>
      {children}
    </RealtimeCtx.Provider>
  );
}
