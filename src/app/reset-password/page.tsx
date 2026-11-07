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

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("token") ?? "";
    setToken(value);
    if (!value) setError("This reset link is missing its token. Please request a new link.");
  }, []);

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
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: password, token }),
      });
      const data = (await res.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;
      if (!res.ok) throw new Error(data?.message ?? data?.error ?? "Could not reset the password.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset the password.");
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
            <h1>Reset password</h1>
            <div className="hint">Choose a new password for your account.</div>
          </div>
        </div>

        {done ? (
          <>
            <div className="hint" style={{ lineHeight: 1.7 }}>
              Your password has been updated. All previous sessions were signed out.
            </div>
            <a className="btn pri" href="/login" style={{ height: 42, display: "grid", placeItems: "center" }}>
              Sign in
            </a>
          </>
        ) : (
          <>
            <div>
              <label className="klabel" htmlFor="password">New password</label>
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
              <label className="klabel" htmlFor="confirm">Confirm new password</label>
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
            <button
              type="submit"
              className="btn pri"
              style={{ height: 42 }}
              disabled={busy || !token}
            >
              {busy ? "Updating…" : "Update password"}
            </button>
            <div className="hint" style={{ textAlign: "center" }}>
              <a href="/forgot-password" style={{ color: "inherit", fontWeight: 700 }}>
                Request a new link
              </a>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
