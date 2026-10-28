"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";

type Captcha = { enabled: boolean; token: string; question: string };

export function LoginForm({ school }: { school: { name: string; session: string } }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [answer, setAnswer] = useState("");
  const [captcha, setCaptcha] = useState<Captcha | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiGet<Captcha>("/api/auth/captcha")
      .then(setCaptcha)
      .catch(() => setCaptcha({ enabled: false, token: "", question: "" }));
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await apiPost("/api/auth/login", {
        username,
        password,
        captchaToken: captcha?.token ?? "",
        captchaAnswer: answer,
      });
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
      setBusy(false);
      apiGet<Captcha>("/api/auth/captcha").then(setCaptcha).catch(() => {});
    }
  }

  return (
    <div className="login" style={{ minHeight: "100dvh" }}>
      <form className="lcard" onSubmit={submit}>
        <div className="brandrow">
          <div className="logo">ICE</div>
          <div>
            <h1>{school.name}</h1>
            <div className="hint">School Manager · Session {school.session}</div>
          </div>
        </div>
        <div>
          <label className="klabel" htmlFor="username">Username</label>
          <input
            id="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: "100%",
              height: 40,
              border: "1px solid var(--line)",
              borderRadius: 9,
              padding: "0 11px",
              marginTop: 4,
              background: "var(--inp)",
            }}
            required
          />
        </div>
        <div>
          <label className="klabel" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              height: 40,
              border: "1px solid var(--line)",
              borderRadius: 9,
              padding: "0 11px",
              marginTop: 4,
              background: "var(--inp)",
            }}
            required
          />
        </div>
        {captcha?.enabled ? (
          <div>
            <label className="klabel" htmlFor="captcha">
              Captcha: {captcha.question}
            </label>
            <input
              id="captcha"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              style={{
                width: "100%",
                height: 40,
                border: "1px solid var(--line)",
                borderRadius: 9,
                padding: "0 11px",
                marginTop: 4,
                background: "var(--inp)",
              }}
              required
            />
          </div>
        ) : null}
        <div className="lerr">{error}</div>
        <button type="submit" className="btn pri" style={{ height: 42 }} disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <div className="hint" style={{ lineHeight: 1.7 }}>
          Demo accounts (seeded):
          <br />
          <b>admin</b> / admin123 · <b>teacher</b> / teacher123 · <b>accounts</b> / acc123
        </div>
      </form>
    </div>
  );
}
