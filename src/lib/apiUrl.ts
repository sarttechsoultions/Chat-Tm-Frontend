const API_PREFIX = "/api/v1";

export function getApiBase() {
  const raw = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/+$/, "");
  if (!raw) return API_PREFIX;
  if (raw.endsWith(API_PREFIX)) return raw;
  return `${raw}${API_PREFIX}`;
}

export function apiUrl(path: string) {
  const base = getApiBase();
  let normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === API_PREFIX || normalized.startsWith(`${API_PREFIX}/`)) {
    normalized = normalized.slice(API_PREFIX.length) || "/";
  }
  return `${base}${normalized}`;
}
