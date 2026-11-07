"use client";

import { useEffect, useState } from "react";

const fieldStyle = {
  width: "100%",
  height: 40,
  border: "1px solid var(--line)",
  borderRadius: 9,
  padding: "0 11px",
  marginTop: 4,
  background: "var(--inp)",
} as const;

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("email");
    if (value) setEmail(value);
    if (params.get("error")) {
      setError("The verification link is invalid or has expired. Request a new one below.");
    }
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/send-verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), callbackURL: "/login?verified=1" }),
      });
      const data = (await res.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;
      if (!res.ok) throw new Error(data?.message ?? data?.error ?? "Could not send the link.");
      setInfo("A new verification link has been sent. In development, check the server log.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the link.");
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
            <h1>Verify email</h1>
            <div className="hint">Request a fresh verification link.</div>
          </div>
        </div>
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
        {info ? <div className="hint" style={{ color: "var(--ok, #15803d)", lineHeight: 1.6 }}>{info}</div> : null}
        <button type="submit" className="btn pri" style={{ height: 42 }} disabled={busy}>
          {busy ? "Sending…" : "Send verification link"}
        </button>
        <div className="hint" style={{ textAlign: "center" }}>
          <a href="/login" style={{ color: "inherit", fontWeight: 700 }}>Back to sign in</a>
        </div>
      </form>
    </div>
  );
}
