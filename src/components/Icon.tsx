import type { CSSProperties } from "react";

const PATHS: Record<string, string> = {
  dash: "M4 4h6v7H4zM14 4h6v4h-6zM14 12h6v8h-6zM4 15h6v5H4z",
  phone: "M6 3h3l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 5.2 2 2 0 0 1 6 3z",
  userplus: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M19 8v6M16 11h6",
  rupee: "M6 4h12M6 8h12M15 4c0 4-3 6-7 6h-2l8 10",
  dollar: "M12 2v20M17 6.5c0-2-2.2-3.5-5-3.5S7 4.5 7 6.5 9.2 10 12 10s5 1.5 5 3.5S14.8 17 12 17s-5-1.5-5-3.5",
  check: "M4 12.5l5 5L20 6",
  book: "M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 1 4 17.5zM4 17.5A2.5 2.5 0 0 1 6.5 15H20",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7v.5M12 17h.01",
  clip: "M9 5h6a2 2 0 0 1 2 2v13a1 1 0 0 1-1.6.8L12 18l-3.4 2.8A1 1 0 0 1 7 20V7a2 2 0 0 1 2-2z",
  layers: "M12 3 2 8l10 5 10-5zM2 13l10 5 10-5M2 18l10 5 10-5",
  brief: "M4 7h16v13H4zM9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M4 12h16",
  mega: "M3 10v4a2 2 0 0 0 2 2h2l9 4V4L7 8H5a2 2 0 0 0-2 2zM19 8a5 5 0 0 1 0 8",
  down: "M12 3v12M7 10l5 5 5-5M4 20h16",
  edit: "M4 20h4L20 8l-4-4L4 16zM14 6l4 4",
  lib: "M4 4h4v16H4zM10 4h4v16h-4zM16 5l3.5-.7 3 15-3.5.7z",
  box: "M3 7l9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10",
  truck: "M3 6h11v10H3zM14 10h4l3 3v3h-7zM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  award: "M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 14 7 22l5-3 5 3-1.5-8",
  cap: "M2 9l10-5 10 5-10 5zM6 11.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5",
  bar: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z",
  chev: "M9 6l6 6-6 6",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM16 16l5 5",
  bell: "M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6zM10 20a2 2 0 0 0 4 0",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  menu: "M3 6h18M3 12h18M3 18h18",
  plus: "M12 5v14M5 12h14",
  close: "M6 6l12 12M18 6L6 18",
  upload: "M12 21V9M7 14l5-5 5 5M4 4h16",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M17 3.5a4 4 0 0 1 0 7.5M18 21a7 7 0 0 0-3-5.7",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  trash: "M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7M14 10v7",
  print: "M6 9V3h12v6M6 18H4v-6h16v6h-2M6 14h12v7H6z",
  send: "M22 2 11 13M22 2l-7 20-4-9-9-4z",
  chat: "M21 15a3 3 0 0 1-3 3H8l-5 3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3z",
  alert: "M12 3 2 21h20zM12 9v5M12 18h.01",
  calendar: "M4 5h16v16H4zM4 9h16M8 3v4M16 3v4",
  id: "M3 5h18v14H3zM7 9h4v4H7zM14 10h4M14 14h4M7 16h11",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  save: "M4 3h13l3 3v15H4zM8 3v6h8V3M8 15h8v6H8z",
  arrow: "M5 12h14M13 6l6 6-6 6",
};

export function Icon({
  name,
  size,
  className = "i",
  style,
}: {
  name: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const d = PATHS[name] ?? PATHS.dash;
  return (
    <svg
      className={className}
      style={{ ...style, ...(size ? { width: size, height: size } : {}) }}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
