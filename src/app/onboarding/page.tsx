"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateSchoolSlug } from "@/lib/slug";

const fieldStyle = {
  width: "100%",
  height: 40,
  border: "1px solid var(--line)",
  borderRadius: 9,
  padding: "0 11px",
  marginTop: 4,
  background: "var(--inp)",
} as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [schoolName, setSchoolName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [session, setSession] = useState("2026-27");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const slugPreview = schoolName.trim() ? generateSchoolSlug(schoolName) : "";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!schoolName.trim()) {
      setError("Please enter your school or organization name.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: schoolName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          session: session.trim() || undefined,
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
        error?: string;
        redirectUrl?: string;
      } | null;

      if (!res.ok) {
        throw new Error(data?.message ?? data?.error ?? "Could not onboard the school.");
      }

      router.push(data?.redirectUrl ?? "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not onboard the school.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login" style={{ minHeight: "100dvh", padding: "24px 16px" }}>
      <form className="lcard" onSubmit={submit} style={{ maxWidth: 460 }}>
        <div className="brandrow">
          <div className="logo">ICE</div>
          <div>
            <h1>School Onboarding</h1>
            <div className="hint">Set up a new school workspace as School Owner</div>
          </div>
        </div>

        <div>
          <label className="klabel" htmlFor="schoolName">School Name</label>
          <input
            id="schoolName"
            placeholder="e.g. Springfield High School"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            style={fieldStyle}
            required
          />
          {slugPreview && (
            <div className="hint" style={{ fontSize: 11, marginTop: 3 }}>
              School URL: <code>app.school.io/{slugPreview}</code>
            </div>
          )}
        </div>

        <div>
          <label className="klabel" htmlFor="email">Official School Email (optional)</label>
          <input
            id="email"
            type="email"
            placeholder="info@school.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={fieldStyle}
          />
        </div>

        <div>
          <label className="klabel" htmlFor="phone">School Phone (optional)</label>
          <input
            id="phone"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={fieldStyle}
          />
        </div>

        <div>
          <label className="klabel" htmlFor="address">Address (optional)</label>
          <input
            id="address"
            placeholder="City, State"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={fieldStyle}
          />
        </div>

        <div>
          <label className="klabel" htmlFor="session">Academic Session</label>
          <input
            id="session"
            placeholder="2026-27"
            value={session}
            onChange={(e) => setSession(e.target.value)}
            style={fieldStyle}
          />
        </div>

        <div className="lerr">{error}</div>

        <button type="submit" className="btn pri" style={{ height: 42, marginTop: 8 }} disabled={busy}>
          {busy ? "Setting up School…" : "Complete Onboarding"}
        </button>
      </form>
    </div>
  );
}
