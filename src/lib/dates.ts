export const MON = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Format a JS Date as YYYY-MM-DD using UTC (database @db.Date values are UTC midnight). */
export function toYmd(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/** Today's date in the server's local timezone. */
export function todayYmd(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function parseYmd(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  // Reject rolled-over dates such as 2026-02-31.
  if (d.toISOString().slice(0, 10) !== value) return null;
  return d;
}

export function addDays(value: string, days: number): string {
  const d = parseYmd(value);
  if (!d) return value;
  d.setUTCDate(d.getUTCDate() + days);
  return toYmd(d);
}

/** DD-MM-YYYY for display. */
export function dmy(value: string | null | undefined): string {
  return value ? value.slice(0, 10).split("-").reverse().join("-") : "";
}

export function monthOf(value: string): string {
  return value.slice(0, 7);
}

export function monthStart(month: string): Date {
  return new Date(`${month}-01T00:00:00.000Z`);
}

export function monthEnd(month: string): Date {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
}

export function lastMonths(count: number, from = new Date()): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(from.getFullYear(), from.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: MON[d.getMonth()],
    });
  }
  return out;
}

export function ageFromDob(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const d = parseYmd(dob.slice(0, 10));
  if (!d) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getUTCFullYear();
  const m = now.getMonth() + 1 - (d.getUTCMonth() + 1);
  if (m < 0 || (m === 0 && now.getDate() < d.getUTCDate())) age--;
  return age;
}
