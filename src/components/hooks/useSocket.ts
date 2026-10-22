import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getSessionToken } from "../../lib/auth";
import { getApiBase } from "../../lib/apiUrl";

function getSocketUrl() {
  const configured = (process.env.NEXT_PUBLIC_SOCKET_URL || "").trim().replace(/\/+$/, "");
  if (configured) return configured;

  // When the API is configured with an absolute public URL, Socket.IO lives on
  // that same backend. This keeps presence working without a second URL locally.
  const apiBase = getApiBase();
  if (/^https?:\/\//i.test(apiBase)) return new URL(apiBase).origin;

  // Local rewrites share the current origin. Production deployments that proxy
  // only HTTP API routes should set NEXT_PUBLIC_SOCKET_URL to their API origin.
  return process.env.NEXT_PUBLIC_SOCKET_ORIGIN || (typeof window === "undefined" ? "" : window.location.origin);
}

let socketInstance: Socket | null = null;
let socketToken: string | null = null;

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(
    socketInstance?.connected ? socketInstance : null
  );

  useEffect(() => {
    const token = getSessionToken();
    if (!token) return;

    if (socketInstance && socketToken !== token) {
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
      socketInstance = null;
    }

    if (!socketInstance) {
      socketToken = token;
      socketInstance = io(getSocketUrl(), {
        auth: { token },
        withCredentials: true,
        transports: ["polling", "websocket"],
        tryAllTransports: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 800,
      });
    }

    const instance = socketInstance;
    setSocket(instance);

    const onConnect = () => setSocket(instance);
    const onDisconnect = () => {
      // Keep the instance so reconnect can resume; UI can still emit after reconnect.
    };

    instance.on("connect", onConnect);
    instance.on("disconnect", onDisconnect);

    return () => {
      instance.off("connect", onConnect);
      instance.off("disconnect", onDisconnect);
    };
  }, []);

  return socket;
}
