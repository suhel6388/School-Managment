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

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
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
      const res = await fetch("/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          callbackURL: "/login?verified=1",
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;
      if (!res.ok) throw new Error(data?.message ?? data?.error ?? "Could not create the account.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account.");
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
            <h1>Create account</h1>
            <div className="hint">Email and password sign-up for the new auth system</div>
          </div>
        </div>

        {done ? (
          <>
            <div className="hint" style={{ lineHeight: 1.7 }}>
              Account created. Check <b>{email}</b> for the verification link. In development,
              when SMTP is not configured, the link is printed in the server log.
            </div>
            <a className="btn pri" href="/login" style={{ height: 42, display: "grid", placeItems: "center" }}>
              Back to sign in
            </a>
          </>
        ) : (
          <>
            <div>
              <label className="klabel" htmlFor="name">Full name</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} style={fieldStyle} required />
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
            <div>
              <label className="klabel" htmlFor="password">Password</label>
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
              <label className="klabel" htmlFor="confirm">Confirm password</label>
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
            <button type="submit" className="btn pri" style={{ height: 42 }} disabled={busy}>
              {busy ? "Creating…" : "Create account"}
            </button>
            <div className="hint" style={{ textAlign: "center" }}>
              Already registered? <a href="/login" style={{ color: "inherit", fontWeight: 700 }}>Sign in</a>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
