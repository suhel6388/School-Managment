"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const fieldStyle = {
  width: "100%",
  height: 40,
  border: "1px solid var(--line)",
  borderRadius: 9,
  padding: "0 11px",
  marginTop: 4,
  background: "var(--inp)",
} as const;

export default function InvitationPage() {
  const params = useParams();
  const router = useRouter();
  const invitationId = String(params.id ?? "");

  const [invitation, setInvitation] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Registration fields for new users
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!invitationId) return;

    Promise.all([
      fetch(`/api/school/staff/invitations/${invitationId}`)
        .then((res) => (res.ok ? res.json() : null)),
      fetch("/api/auth/me").then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([invRes, meRes]) => {
        if (invRes?.invitation) {
          setInvitation(invRes.invitation);
        } else {
          setError("Invitation not found or no longer available.");
        }
        if (meRes?.user) {
          setCurrentUser(meRes.user);
        }
      })
      .catch(() => {
        setError("Failed to load invitation.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [invitationId]);

  async function handleAcceptExisting() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/school/staff/invitations/${invitationId}/accept`, {
        method: "POST",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? "Failed to accept invitation.");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invitation.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRegisterAndAccept(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setBusy(false);
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setBusy(false);
      return;
    }

    try {
      const res = await fetch(`/api/school/staff/invitations/${invitationId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          password,
          confirmPassword,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? "Failed to create account.");
      router.push("/login?verified=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="login" style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
        <p className="hint">Loading invitation…</p>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="login" style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
        <div className="lcard" style={{ maxWidth: 440, textAlign: "center" }}>
          <h2>Invalid Invitation</h2>
          <p className="hint" style={{ marginTop: 8 }}>{error}</p>
          <a className="btn pri" href="/login" style={{ marginTop: 16 }}>
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const isMatchedLoggedInUser =
    currentUser && currentUser.email?.toLowerCase() === invitation.email?.toLowerCase();

  return (
    <div className="login" style={{ minHeight: "100dvh", padding: "24px 16px" }}>
      <div className="lcard" style={{ maxWidth: 460 }}>
        <div className="brandrow">
          <div className="logo">ICE</div>
          <div>
            <h1>Staff Invitation</h1>
            <div className="hint">{invitation?.school?.name}</div>
          </div>
        </div>

        <div style={{ marginTop: 8, padding: 12, background: "var(--hover)", borderRadius: 8 }}>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Invitation Details:</div>
          <div style={{ fontWeight: 600, fontSize: 15, marginTop: 4 }}>
            Role: <span style={{ textTransform: "capitalize" }}>{invitation?.role}</span>
          </div>
          <div style={{ fontSize: 13, marginTop: 2 }}>
            Email: <b>{invitation?.email}</b>
          </div>
        </div>

        {error && <div className="lerr" style={{ marginTop: 8 }}>{error}</div>}

        {isMatchedLoggedInUser ? (
          <div style={{ marginTop: 16 }}>
            <p className="hint">
              You are signed in as <b>{currentUser.email}</b>. Click below to accept the invitation
              and access the school dashboard.
            </p>
            <button
              type="button"
              className="btn pri"
              style={{ width: "100%", height: 42, marginTop: 12 }}
              disabled={busy}
              onClick={handleAcceptExisting}
            >
              {busy ? "Accepting…" : `Accept & Join ${invitation?.school?.name}`}
            </button>
          </div>
        ) : currentUser ? (
          <div style={{ marginTop: 16 }}>
            <p className="hint" style={{ color: "var(--danger)" }}>
              You are currently signed in as <b>{currentUser.email}</b>, but this invitation was sent
              to <b>{invitation?.email}</b>.
            </p>
            <a
              className="btn pri"
              href="/login"
              style={{ display: "grid", placeItems: "center", height: 42, marginTop: 12 }}
            >
              Sign in with {invitation?.email}
            </a>
          </div>
        ) : (
          <form onSubmit={handleRegisterAndAccept} style={{ marginTop: 14 }}>
            <p className="hint" style={{ marginBottom: 12 }}>
              Set up your staff account credentials to join {invitation?.school?.name}:
            </p>

            <div>
              <label className="klabel" htmlFor="name">Full Name</label>
              <input
                id="name"
                placeholder="e.g. Sarah Jenkins"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={fieldStyle}
                required
              />
            </div>

            <div style={{ marginTop: 8 }}>
              <label className="klabel" htmlFor="password">Password (min 8 chars)</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={fieldStyle}
                required
              />
            </div>

            <div style={{ marginTop: 8 }}>
              <label className="klabel" htmlFor="confirm">Confirm Password</label>
              <input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={fieldStyle}
                required
              />
            </div>

            <button
              type="submit"
              className="btn pri"
              style={{ width: "100%", height: 42, marginTop: 16 }}
              disabled={busy}
            >
              {busy ? "Creating Account…" : "Create Account & Join School"}
            </button>

            <div className="hint" style={{ textAlign: "center", marginTop: 12 }}>
              Already have an account?{" "}
              <a href="/login" style={{ color: "inherit", fontWeight: 700 }}>
                Sign in
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
