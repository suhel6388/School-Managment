export type ApiErrorShape = { error?: string; details?: unknown };

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const type = res.headers.get("content-type") ?? "";
  const data = type.includes("application/json") ? await res.json() : null;
  if (!res.ok) {
    const message =
      (data as ApiErrorShape | null)?.error ??
      (res.status === 401
        ? "Your session has expired. Please sign in again."
        : `Request failed (${res.status}).`);
    if (res.status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new Error(message);
  }
  return data as T;
}

export const apiGet = <T,>(url: string) => apiFetch<T>(url);
export const apiPost = <T,>(url: string, body: unknown) =>
  apiFetch<T>(url, { method: "POST", body: JSON.stringify(body) });
export const apiPatch = <T,>(url: string, body: unknown) =>
  apiFetch<T>(url, { method: "PATCH", body: JSON.stringify(body) });
export const apiDelete = <T,>(url: string) => apiFetch<T>(url, { method: "DELETE" });
