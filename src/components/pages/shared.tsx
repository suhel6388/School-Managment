"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

export type SchoolInfo = {
  id?: number;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  session: string;
  headerText?: string | null;
  footerText?: string | null;
  captcha?: boolean;
  waMessage?: string | null;
  fileTypes?: string | null;
  planName?: string | null;
  planExpires?: string | null;
  profilePhone?: boolean;
  profileAddr?: boolean;
  profileEmail?: boolean;
  profilePhoto?: boolean;
};

/** Loads the single school-settings row for printable documents. */
export function useSchool() {
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    apiGet<{ settings: SchoolInfo }>("/api/settings")
      .then((res) => {
        if (alive) setSchool(res.settings);
      })
      .catch((err: Error) => {
        if (alive) setError(err.message);
      });
    return () => {
      alive = false;
    };
  }, []);
  return { school, error };
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="loading">
      <span className="spinner" />
      {label}
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  if (!message) return null;
  return <div className="alert" style={{ marginBottom: 12 }}>{message}</div>;
}

export function DocHeader({
  school,
  title,
  subtitle,
}: {
  school: SchoolInfo | null;
  title?: string;
  subtitle?: string;
}) {
  return (
    <>
      <h2>{school?.headerText || school?.name || "ICE School"}</h2>
      {school?.address ? <div className="c">{school.address}</div> : null}
      <div className="c">
        {[school?.phone, school?.email].filter(Boolean).join(" · ")}
        {school?.session ? ` · Session ${school.session}` : ""}
      </div>
      {title ? <hr /> : null}
      {title ? <h3 style={{ textAlign: "center", margin: "6px 0" }}>{title}</h3> : null}
      {subtitle ? <div className="c">{subtitle}</div> : null}
    </>
  );
}

export function PrintButtons({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flexrow no-print" style={{ marginBottom: 12 }}>
      <button type="button" className="btn pri" onClick={() => window.print()}>
        Print
      </button>
      {children}
    </div>
  );
}
