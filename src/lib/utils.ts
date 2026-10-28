export function inr(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "₹0";
  const fixed = Math.abs(n % 1) > 0.0001 ? 2 : 0;
  return `₹${n.toLocaleString("en-IN", {
    minimumFractionDigits: fixed,
    maximumFractionDigits: 2,
  })}`;
}

export function dmy(ymd: string | null | undefined): string {
  if (!ymd) return "—";
  const text = String(ymd).slice(0, 10);
  const [y, m, d] = text.split("-");
  if (!y || !m || !d) return text;
  return `${d}-${m}-${y}`;
}

export function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function thisMonth(): string {
  return today().slice(0, 7);
}

export function initials(name: string | null | undefined): string {
  return (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function ageFrom(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const d = new Date(`${String(dob).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (
    now.getMonth() < d.getMonth() ||
    (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())
  ) {
    age--;
  }
  return age;
}

export function badgeKind(value: unknown): "ok" | "warn" | "bad" | "" {
  const v = String(value ?? "");
  if (/^(approved|paid|active|completed|present|returned|enrolled|pass|published|yes|collected|enabled|open|resolved|sent|admitted|issued)$/i.test(v)) {
    return "ok";
  }
  if (/^(pending|scheduled|in progress|partial|late|half day|inactive|new|follow up|incoming|generated|upcoming)$/i.test(v)) {
    return "warn";
  }
  if (/^(rejected|disabled|absent|overdue|unpaid|fail|closed|no|inactive)$/i.test(v)) return "bad";
  return "";
}

export function csvDownload(filename: string, cols: string[], rows: (string | number)[][]) {
  const escape = (value: string | number) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [cols.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printArea() {
  window.print();
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function sum<T>(rows: T[], pick: (row: T) => number): number {
  return Math.round(rows.reduce((s, r) => s + Number(pick(r) || 0), 0) * 100) / 100;
}
