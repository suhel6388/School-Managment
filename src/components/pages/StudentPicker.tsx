"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLookups } from "@/components/LookupProvider";

export function StudentPicker({
  value,
  onChange,
  placeholder = "Search by name, admission no or phone…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const lookups = useLookups();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = lookups.find("students", value);

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const options = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = lookups.list("students");
    if (!term) return list.slice(0, 40);
    return list
      .filter((o) =>
        `${o.label} ${o.name ?? ""} ${o.admNo ?? ""} ${o.phone ?? ""} ${o.father ?? ""}`
          .toLowerCase()
          .includes(term),
      )
      .slice(0, 40);
  }, [lookups, q]);

  return (
    <div className="srchpick" ref={ref}>
      <input
        value={open ? q : selected?.label ?? ""}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true);
          setQ("");
        }}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
      />
      {open ? (
        <div className="dd" style={{ maxHeight: 280, overflow: "auto" }}>
          {value ? (
            <div
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              <div className="pickrow"><b>Clear selection</b><small>—</small></div>
            </div>
          ) : null}
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
                setQ("");
              }}
            >
              <div className="pickrow">
                <b>{String(option.name ?? option.label)}</b>
                <small>{String(option.admNo ?? "")}</small>
              </div>
              <small>
                {[option.className, option.sectionName, option.father, option.phone]
                  .filter(Boolean)
                  .join(" · ")}
              </small>
            </div>
          ))}
          {!options.length ? <div className="hint" style={{ padding: 12 }}>No matching student.</div> : null}
        </div>
      ) : null}
    </div>
  );
}
