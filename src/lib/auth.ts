export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  username: string;
  role: "USER" | "ADMIN" | "MODERATOR";
  avatar: string;
  isVerified: boolean;
  referralCode: string;
};

export type AuthPayload = {
  user: AuthUser;
  token: string;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getSessionToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: "include",
  });

  const json = (await response.json().catch(() => ({}))) as {
    message?: string;
    data?: T;
    errors?: { message: string }[];
  };

  if (!response.ok) {
    const message = json.message || json.errors?.[0]?.message || "Something went wrong";
    throw new ApiError(message, response.status);
  }

  return json.data as T;
}

export const SESSION_COOKIE = "chattm_session";
export const ROLE_COOKIE = "chattm_role";
const USER_KEY = "chattm_user";
const TOKEN_KEY = "chattm_session";

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

export function getSessionToken() {
  if (typeof window === "undefined") return null;
  return readCookie(SESSION_COOKIE) || localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function displayName(user: AuthUser) {
  return `${user.firstName} ${user.lastName}`.trim() || user.username;
}

function writeCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function setSession(token: string, user: AuthUser, remember = true) {
  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7;
  writeCookie(SESSION_COOKIE, token, maxAge);
  writeCookie(ROLE_COOKIE, user.role, maxAge);
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  writeCookie(SESSION_COOKIE, "", 0);
  writeCookie(ROLE_COOKIE, "", 0);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function identifierToSignupFields(identifier: string) {
  const value = identifier.trim();
  if (isEmail(value)) return { email: value.toLowerCase() };
  return { phone: value };
}

export async function loginRequest(identifier: string, password: string) {
  return apiRequest<AuthPayload>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });
}

export async function adminLoginRequest(identifier: string, password: string) {
  return apiRequest<AuthPayload>("/api/v1/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });
}

export async function signupRequest(input: {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  username: string;
  password: string;
  dateOfBirth?: string;
  gender?: string;
  bio?: string;
  avatar?: string;
  referralCode?: string;
}) {
  return apiRequest<AuthPayload>("/api/v1/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function logoutRequest() {
  try {
    await apiRequest("/api/v1/auth/logout", { method: "POST" });
  } catch {
    // Clear local session even if the API is unreachable.
  }
  clearSession();
}
