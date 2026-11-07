"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";

type Captcha = { enabled: boolean; token: string; question: string };
type LoginMode = "staff" | "email";

export function LoginForm({ school }: { school: { name: string; session: string } }) {
  const [mode, setMode] = useState<LoginMode>("staff");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [answer, setAnswer] = useState("");
  const [captcha, setCaptcha] = useState<Captcha | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiGet<Captcha>("/api/auth/captcha")
      .then(setCaptcha)
      .catch(() => setCaptcha({ enabled: false, token: "", question: "" }));

    const params = new URLSearchParams(window.location.search);
    if (params.get("verified")) {
      setInfo("Your email is verified. You can sign in now.");
    }
    if (params.get("reset")) {
      setInfo("Your password was updated. Please sign in with the new password.");
    }
    const authError = params.get("error");
    if (authError) setError("The link is invalid or has expired. Please request a new one.");
  }, []);

  async function submitStaff(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
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

  async function submitEmail(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: emailPassword }),
      });
      const data = (await res.json().catch(() => null)) as
        | { message?: string; error?: string; code?: string }
        | null;
      if (!res.ok) {
        if (data?.code === "EMAIL_NOT_VERIFIED") {
          setInfo("Your email is not verified yet. We have sent you a new verification link.");
          setBusy(false);
          return;
        }
        throw new Error(data?.message ?? data?.error ?? "Invalid email or password.");
      }
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
      setBusy(false);
    }
  }

  const fieldStyle = {
    width: "100%",
    height: 40,
    border: "1px solid var(--line)",
    borderRadius: 9,
    padding: "0 11px",
    marginTop: 4,
    background: "var(--inp)",
  } as const;

  return (
    <div className="login" style={{ minHeight: "100dvh" }}>
      <form className="lcard" onSubmit={mode === "staff" ? submitStaff : submitEmail}>
        <div className="brandrow">
          <div className="logo">ICE</div>
          <div>
            <h1>{school.name}</h1>
            <div className="hint">School Manager · Session {school.session}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button
            type="button"
            className={mode === "staff" ? "btn pri" : "btn"}
            onClick={() => {
              setMode("staff");
              setError("");
              setInfo("");
            }}
            style={{ height: 36 }}
          >
            Staff login
          </button>
          <button
            type="button"
            className={mode === "email" ? "btn pri" : "btn"}
            onClick={() => {
              setMode("email");
              setError("");
              setInfo("");
            }}
            style={{ height: 36 }}
          >
            Email login
          </button>
        </div>

        {mode === "staff" ? (
          <>
            <div>
              <label className="klabel" htmlFor="username">Username</label>
              <input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={fieldStyle}
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
                style={fieldStyle}
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
                  style={fieldStyle}
                  required
                />
              </div>
            ) : null}
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
            <div>
              <label className="klabel" htmlFor="emailPassword">Password</label>
              <input
                id="emailPassword"
                type="password"
                autoComplete="current-password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                style={fieldStyle}
                required
              />
            </div>
          </>
        )}

        <div className="lerr">{error}</div>
        {info ? (
          <div className="hint" style={{ color: "var(--ok, #15803d)", lineHeight: 1.6 }}>
            {info}
          </div>
        ) : null}

        <button type="submit" className="btn pri" style={{ height: 42 }} disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>

        {mode === "email" ? (
          <div className="hint" style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <a href="/forgot-password" style={{ color: "inherit" }}>Forgot password?</a>
            <a href="/register" style={{ color: "inherit" }}>Create account</a>
          </div>
        ) : (
          <div className="hint" style={{ lineHeight: 1.7 }}>
            Demo accounts (seeded):
            <br />
            <b>admin</b> / admin123 · <b>teacher</b> / teacher123 · <b>accounts</b> / acc123
          </div>
        )}
      </form>
    </div>
  );
}
