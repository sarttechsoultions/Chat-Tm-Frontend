import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getSessionToken } from "../../lib/auth";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

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
      socketInstance = io(SOCKET_URL, {
        auth: { token },
        withCredentials: true,
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 800,
      });
    }

    const instance = socketInstance;

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
