"use client";

import { useEffect, useState } from "react";
import { getStoredUser, USER_UPDATED_EVENT, type AuthUser } from "../../lib/auth";

export function useCurrentUser() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const sync = () => setUser(getStoredUser());
    sync();
    window.addEventListener(USER_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(USER_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return user;
}
