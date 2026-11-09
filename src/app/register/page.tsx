"use client";

import { useState } from "react";
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

export default function RegisterPage() {
  // Owner details
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // School details
  const [schoolName, setSchoolName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [createdSchool, setCreatedSchool] = useState<{ name: string; slug: string } | null>(null);

  const slugPreview = schoolName.trim() ? generateSchoolSlug(schoolName) : "";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!schoolName.trim()) {
      setError("Please enter your school or organization name.");
      return;
    }
    if (password !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters for the password.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/schools/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: schoolName.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          ownerName: name.trim(),
          ownerEmail: email.trim(),
          password,
          confirmPassword: confirm,
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        success?: boolean;
        message?: string;
        error?: string;
        school?: { name: string; slug: string };
      } | null;

      if (!res.ok) {
        throw new Error(data?.message ?? data?.error ?? "Could not register the school.");
      }

      setCreatedSchool(data?.school ?? { name: schoolName, slug: slugPreview });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not register the school.");
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
            <h1>Register School</h1>
            <div className="hint">SaaS school onboarding &amp; owner registration</div>
          </div>
        </div>

        {done ? (
          <>
            <div className="hint" style={{ lineHeight: 1.7 }}>
              <b>{createdSchool?.name}</b> has been onboarded successfully with slug{" "}
              <code>{createdSchool?.slug}</code>!
              <br />
              <br />
              Please check <b>{email}</b> for your verification email. Once verified, sign in
              to access your school management dashboard.
            </div>
            <a
              className="btn pri"
              href="/login"
              style={{ height: 42, display: "grid", placeItems: "center", marginTop: 12 }}
            >
              Go to sign in
            </a>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>
              1. School Information
            </div>

            <div>
              <label className="klabel" htmlFor="schoolName">School Name</label>
              <input
                id="schoolName"
                placeholder="e.g. Greenwood Academy"
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

            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 14 }}>
              2. Owner Account
            </div>

            <div>
              <label className="klabel" htmlFor="name">Owner Full Name</label>
              <input
                id="name"
                placeholder="e.g. Dr. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={fieldStyle}
                required
              />
            </div>

            <div>
              <label className="klabel" htmlFor="email">Owner Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="owner@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={fieldStyle}
                required
              />
            </div>

            <div>
              <label className="klabel" htmlFor="password">Password (min 8 characters)</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={fieldStyle}
                required
              />
            </div>

            <div>
              <label className="klabel" htmlFor="confirm">Confirm Password</label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                style={fieldStyle}
                required
              />
            </div>

            <div className="lerr">{error}</div>

            <button type="submit" className="btn pri" style={{ height: 42, marginTop: 8 }} disabled={busy}>
              {busy ? "Registering School…" : "Register & Onboard School"}
            </button>

            <div className="hint" style={{ textAlign: "center", marginTop: 8 }}>
              Already registered? <a href="/login" style={{ color: "inherit", fontWeight: 700 }}>Sign in</a>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
