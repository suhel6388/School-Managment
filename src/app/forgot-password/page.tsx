"use client";

import { useState } from "react";

const fieldStyle = {
  width: "100%",
  height: 40,
  border: "1px solid var(--line)",
  borderRadius: 9,
  padding: "0 11px",
  marginTop: 4,
  background: "var(--inp)",
} as const;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), redirectTo: "/reset-password" }),
      });
      const data = (await res.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;
      if (!res.ok) throw new Error(data?.message ?? data?.error ?? "Could not send the reset link.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the reset link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login" style={{ minHeight: "100dvh" }}>
      <form className="lcard" onSubmit={submit}>
        <div className="brandrow">
          <div className="logo">ICE</div>
          <div>
            <h1>Forgot password</h1>
            <div className="hint">We will email you a secure reset link.</div>
          </div>
        </div>

        {done ? (
          <>
            <div className="hint" style={{ lineHeight: 1.7 }}>
              If an account exists for <b>{email}</b>, a reset link has been sent. In development,
              when SMTP is not configured, the link is printed in the server log.
            </div>
            <a className="btn pri" href="/login" style={{ height: 42, display: "grid", placeItems: "center" }}>
              Back to sign in
            </a>
          </>
        ) : (
          <>
            <div>
              <label className="klabel" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={fieldStyle}
                required
              />
            </div>
            <div className="lerr">{error}</div>
            <button type="submit" className="btn pri" style={{ height: 42 }} disabled={busy}>
              {busy ? "Sending…" : "Send reset link"}
            </button>
            <div className="hint" style={{ textAlign: "center" }}>
              <a href="/login" style={{ color: "inherit", fontWeight: 700 }}>Back to sign in</a>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
