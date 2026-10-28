"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./Icon";
import { NAV, NAV_BY_ID, NAV_HI } from "./nav";
import { apiGet, apiPost } from "@/lib/api";
import { initials } from "@/lib/utils";
import { useToast } from "./ToastProvider";
import { Modal } from "./Modal";
import { DynamicForm } from "./DynamicForm";

type User = { username: string; name: string; role: string };
type SearchResult = { type: string; label: string; sub: string; href: string };
type Alert = { label: string; route: string; count: number };
type ChatMessage = { role: "u" | "a"; text: string; links?: { label: string; href: string }[] };

function AssistantModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "a",
      text: "Hi! I am the ICE Assistant. Ask me about pending fees, class strength, attendance, staff, exams or events.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const q = input.trim();
    if (!q || busy) return;
    setMessages((list) => [...list, { role: "u", text: q }]);
    setInput("");
    setBusy(true);
    try {
      const res = await apiPost<{ answer: string; links: { label: string; href: string }[] }>("/api/assistant", { q });
      setMessages((list) => [...list, { role: "a", text: res.answer, links: res.links }]);
    } catch (err) {
      setMessages((list) => [
        ...list,
        { role: "a", text: err instanceof Error ? err.message : "Something went wrong." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title="ICE Assistant" onClose={onClose}>
      <div className="chat">
        {messages.map((message, index) => (
          <div key={index} className={`msg ${message.role}`}>
            {message.text}
            {message.links?.length ? (
              <div style={{ marginTop: 6, display: "grid", gap: 4 }}>
                {message.links.map((link) => (
                  <a key={link.href} href={link.href} onClick={onClose} style={{ color: "inherit", fontWeight: 700 }}>
                    → {link.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <form onSubmit={send} className="flexrow">
        <input
          className="sin"
          style={{ flex: 1, width: "auto" }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
        />
        <button type="submit" className="btn pri" disabled={busy || !input.trim()}>
          {busy ? "…" : "Send"}
        </button>
      </form>
    </Modal>
  );
}

export function AppShell({
  user,
  perms,
  school,
  children,
}: {
  user: User;
  perms: string[] | "all";
  school: { name: string; session: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();

  const pageId = pathname === "/" ? "dashboard" : (pathname.split("/").filter(Boolean)[0] ?? "dashboard");
  const meta = NAV_BY_ID[pageId];

  const [openG, setOpenG] = useState<string | null>(meta?.group.id ?? null);
  const [sideOpen, setSideOpen] = useState(false);
  const [mega, setMega] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [pop, setPop] = useState<"bell" | "user" | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [assistant, setAssistant] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const allowed = useMemo(
    () => NAV.filter((group) => perms === "all" || perms.includes(group.id)),
    [perms],
  );

  useEffect(() => {
    setOpenG(meta?.group.id ?? null);
    setSideOpen(false);
    setMega(false);
  }, [meta?.group.id]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("ice_theme");
      const system = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      setTheme(stored === "dark" || stored === "light" ? stored : system);
      const storedLang = localStorage.getItem("ice_lang");
      if (storedLang === "hi" || storedLang === "en") setLang(storedLang);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    apiGet<{ alerts: Alert[] }>("/api/alerts")
      .then((res) => setAlerts(res.alerts))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const term = q.trim();
      if (term.length < 2) {
        setResults([]);
        return;
      }
      apiGet<{ results: SearchResult[] }>(`/api/search?q=${encodeURIComponent(term)}`)
        .then((res) => setResults(res.results))
        .catch(() => setResults([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    function onDown(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest(".pop") && !target.closest("[data-pop]")) setPop(null);
      if (!searchRef.current?.contains(target)) setSearchOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("ice_theme", next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const toggleLang = useCallback(() => {
    setLang((current) => {
      const next = current === "en" ? "hi" : "en";
      try {
        localStorage.setItem("ice_lang", next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const groupTitle = (id: string, title: string) => (lang === "hi" ? NAV_HI[id] ?? title : title);

  async function logout() {
    await apiPost("/api/auth/logout", {}).catch(() => {});
    window.location.href = "/login";
  }

  async function changePassword(values: Record<string, unknown>) {
    setPasswordBusy(true);
    try {
      await apiPost("/api/actions/change-password", values);
      toast("Password changed.");
      setPasswordOpen(false);
    } finally {
      setPasswordBusy(false);
    }
  }

  return (
    <div id="app">
      <div id="side" className={sideOpen ? "open" : ""}>
        <div className="brand">
          <div className="logo">ICE</div>
          <div style={{ minWidth: 0 }}>
            <b style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{school.name}</b>
            <small>Session {school.session}</small>
          </div>
        </div>
        <div className="sq">
          <button type="button" className="pill" onClick={() => setMega((value) => !value)}>
            <span className="flexrow" style={{ gap: 8 }}>
              <Icon name="list" />
              Quick Links
            </span>
            <Icon name="chev" />
          </button>
        </div>
        <nav className="nav">
          <Link href="/" className={`ng ${pageId === "dashboard" ? "act" : ""}`} onClick={() => setSideOpen(false)}>
            <Icon name="dash" />
            <span>{lang === "hi" ? "डैशबोर्ड" : "Dashboard"}</span>
          </Link>
          {allowed.map((group) => (
            <div key={group.id}>
              <button
                type="button"
                className={`ng ${openG === group.id ? "on" : ""}`}
                onClick={() => setOpenG((current) => (current === group.id ? null : group.id))}
              >
                <Icon name={group.icon} />
                <span>{groupTitle(group.id, group.title)}</span>
                <Icon name="chev" className="i ch" />
              </button>
              <div className="sub">
                {group.items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/${item.id}`}
                    className={pageId === item.id ? "cur" : ""}
                    onClick={() => setSideOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="main">
        <header className="top">
          <button
            type="button"
            className="ib"
            aria-label="Toggle menu"
            onClick={() => {
              if (window.innerWidth <= 860) setSideOpen((value) => !value);
              else document.body.classList.toggle("collapsed");
            }}
          >
            <Icon name="menu" />
          </button>
          <button type="button" className="chip hide-s" onClick={() => setMega((value) => !value)}>
            <Icon name="list" size={15} /> Quick Links
          </button>
          <div className="gs" ref={searchRef}>
            <Icon name="search" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search students, staff, books or receipts…"
              aria-label="Global search"
            />
            {searchOpen && q.trim().length >= 2 ? (
              <div className="dd">
                {results.length ? (
                  results.map((result, index) => (
                    <div
                      key={`${result.type}-${result.href}-${index}`}
                      onClick={() => {
                        router.push(result.href);
                        setSearchOpen(false);
                        setQ("");
                      }}
                    >
                      <div className="pickrow">
                        <b>{result.label}</b>
                        <small>{result.type}</small>
                      </div>
                      <small>{result.sub}</small>
                    </div>
                  ))
                ) : (
                  <div className="hint" style={{ padding: 12 }}>No matches found.</div>
                )}
              </div>
            ) : null}
          </div>
          <div className="sp" />
          <button type="button" className="ib" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">
            <Icon name={theme === "dark" ? "sun" : "moon"} />
          </button>
          <button type="button" className="chip" onClick={toggleLang} title="Switch language">
            {lang === "en" ? "EN" : "हिं"}
          </button>
          <div className="rel">
            <button
              type="button"
              className="ib"
              data-pop="bell"
              onClick={() => {
                setPop((value) => (value === "bell" ? null : "bell"));
                apiGet<{ alerts: Alert[] }>("/api/alerts").then((res) => setAlerts(res.alerts)).catch(() => {});
              }}
              aria-label="Alerts"
            >
              <Icon name="bell" />
              {alerts.length ? <span className="dot">{alerts.length}</span> : null}
            </button>
            {pop === "bell" ? (
              <div className="pop">
                <h4>Alerts</h4>
                {alerts.length ? (
                  alerts.map((alert) => (
                    <div
                      key={alert.label}
                      className="it"
                      onClick={() => {
                        router.push(`/${alert.route}`);
                        setPop(null);
                      }}
                    >
                      {alert.label}
                    </div>
                  ))
                ) : (
                  <div className="it">Nothing needs attention.</div>
                )}
              </div>
            ) : null}
          </div>
          <div className="rel">
            <button
              type="button"
              className="av"
              data-pop="user"
              onClick={() => setPop((value) => (value === "user" ? null : "user"))}
              aria-label="Account"
              style={{ border: 0, cursor: "pointer" }}
            >
              {initials(user.name)}
            </button>
            {pop === "user" ? (
              <div className="pop">
                <h4>
                  {user.name}
                  <div className="hint" style={{ fontWeight: 500 }}>{user.role} · {user.username}</div>
                </h4>
                <div className="it" onClick={() => { router.push("/set_general"); setPop(null); }}>
                  School settings
                </div>
                <div className="it" onClick={() => { setPasswordOpen(true); setPop(null); }}>
                  Change my password
                </div>
                <div className="it" onClick={logout}>Logout</div>
              </div>
            ) : null}
          </div>
        </header>

        <div id="view">{children}</div>
        <footer className="ft">
          {school.name} · {school.session} · ICE School Manager
        </footer>
      </div>

      {mega ? (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 69 }} onClick={() => setMega(false)} />
          <div className="mega">
            {allowed.map((group) => (
              <div className="mg" key={group.id}>
                <h4>
                  <Icon name={group.icon} /> {groupTitle(group.id, group.title)}
                </h4>
                {group.items.map((item) => (
                  <Link key={item.id} href={`/${item.id}`} onClick={() => setMega(false)}>
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </>
      ) : null}

      <button type="button" className="aifab" onClick={() => setAssistant(true)}>
        Ask ICE
      </button>
      <AssistantModal open={assistant} onClose={() => setAssistant(false)} />

      <Modal open={passwordOpen} title="Change my password" onClose={() => setPasswordOpen(false)}>
        {passwordOpen ? (
          <DynamicForm
            fields={[
              { name: "current", label: "Current password", type: "password", required: true },
              { name: "next", label: "New password", type: "password", required: true, help: "At least 6 characters." },
            ]}
            busy={passwordBusy}
            onCancel={() => setPasswordOpen(false)}
            onSubmit={changePassword}
            submitLabel="Update password"
          />
        ) : null}
      </Modal>
    </div>
  );
}
