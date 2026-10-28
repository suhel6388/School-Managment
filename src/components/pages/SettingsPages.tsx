"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { useLookups } from "@/components/LookupProvider";
import { useToast } from "@/components/ToastProvider";
import { NAV } from "@/components/nav";
import { ErrorBox, Loading } from "./shared";

type SettingRow = Record<string, unknown>;

type SettingField = {
  name: string;
  key?: string;
  label: string;
  type?: "text" | "textarea" | "email" | "tel" | "checkbox" | "select" | "date";
  options?: { value: string; label: string }[];
  help?: string;
  span2?: boolean;
};

function SettingsFormPage({
  title,
  description,
  fields,
}: {
  title: string;
  description?: string;
  fields: SettingField[];
}) {
  const toast = useToast();
  const lookups = useLookups();
  const [values, setValues] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    apiGet<{ settings: SettingRow }>("/api/settings")
      .then((res) => {
        if (alive) setValues(res.settings);
      })
      .catch((err: Error) => {
        if (alive) setError(err.message);
      });
    return () => {
      alive = false;
    };
  }, []);

  function valueOf(field: SettingField): string | boolean {
    const key = field.key ?? field.name;
    const value = values?.[key];
    if (field.type === "checkbox") return value === true;
    return value == null ? "" : String(value);
  }

  async function save() {
    if (!values) return;
    setBusy(true);
    setError("");
    const patch: Record<string, unknown> = {};
    for (const field of fields) {
      patch[field.name] = field.type === "checkbox" ? valueOf(field) === true : valueOf(field);
    }
    try {
      await apiPatch("/api/settings", patch);
      toast("Settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the settings.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="ct"><h3>{title}</h3></div>
      {description ? <p className="hint">{description}</p> : null}
      <ErrorBox message={error} />
      {!values ? (
        <Loading label="Loading settings…" />
      ) : (
        <>
          <div className="fg">
            {fields.map((field) => {
              const options =
                field.options ??
                (field.name === "session" ? lookups.list("sessions") : []);
              return (
                <div key={field.name} className={`fld ${field.span2 || field.type === "textarea" ? "span2" : ""}`}>
                  {field.type === "checkbox" ? (
                    <label className="chk" style={{ marginTop: 18 }}>
                      <input
                        type="checkbox"
                        checked={valueOf(field) === true}
                        onChange={(event) =>
                          setValues((current) => ({ ...(current ?? {}), [field.key ?? field.name]: event.target.checked }))
                        }
                      />
                      {field.label}
                    </label>
                  ) : (
                    <>
                      <label htmlFor={`set_${field.name}`}>{field.label}</label>
                      {field.type === "textarea" ? (
                        <textarea
                          id={`set_${field.name}`}
                          rows={4}
                          value={String(valueOf(field))}
                          onChange={(event) =>
                            setValues((current) => ({ ...(current ?? {}), [field.key ?? field.name]: event.target.value }))
                          }
                        />
                      ) : field.type === "select" ? (
                        <select
                          id={`set_${field.name}`}
                          value={String(valueOf(field))}
                          onChange={(event) =>
                            setValues((current) => ({ ...(current ?? {}), [field.key ?? field.name]: event.target.value }))
                          }
                        >
                          <option value="">Select</option>
                          {options.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={`set_${field.name}`}
                          type={field.type ?? "text"}
                          value={String(valueOf(field))}
                          onChange={(event) =>
                            setValues((current) => ({ ...(current ?? {}), [field.key ?? field.name]: event.target.value }))
                          }
                        />
                      )}
                    </>
                  )}
                  {field.help ? <div className="hint">{field.help}</div> : null}
                </div>
              );
            })}
          </div>
          <div className="flexrow" style={{ marginTop: 14 }}>
            <button type="button" className="btn pri" onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save settings"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function GeneralSettingsPage() {
  return (
    <SettingsFormPage
      title="General Setting"
      description="These details appear on receipts, certificates and ID cards."
      fields={[
        { name: "name", label: "School name" },
        { name: "email", label: "Email", type: "email" },
        { name: "phone", label: "Phone", type: "tel" },
        { name: "session", label: "Current session", type: "select" },
        { name: "address", label: "Address", type: "textarea" },
      ]}
    />
  );
}

export function WhatsAppSettingsPage() {
  return (
    <SettingsFormPage
      title="WhatsApp Reminders"
      description="Used by fee reminders and by the WhatsApp page. Messages open in your own WhatsApp."
      fields={[
        {
          name: "waMessage",
          label: "Fee reminder message ({name}, {class}, {due})",
          type: "textarea",
        },
      ]}
    />
  );
}

export function PrintSettingsPage() {
  return (
    <SettingsFormPage
      title="Print Header & Footer"
      description="Used on receipts, marksheets, admit cards, certificates and payslips."
      fields={[
        { name: "headerText", label: "Header text (school name on documents)" },
        { name: "footerText", label: "Footer text" },
      ]}
    />
  );
}

export function CaptchaSettingsPage() {
  return (
    <SettingsFormPage
      title="Captcha Setting"
      description="When on, the login screen asks the user to solve a small addition."
      fields={[{ name: "captcha", label: "Ask a simple sum on the login screen", type: "checkbox" }]}
    />
  );
}

export function ProfileSettingsPage() {
  return (
    <SettingsFormPage
      title="Student Profile Update"
      description="Choose which profile fields students may change."
      fields={[
        { name: "profile.phone", key: "profilePhone", label: "Phone", type: "checkbox" },
        { name: "profile.address", key: "profileAddr", label: "Address", type: "checkbox" },
        { name: "profile.email", key: "profileEmail", label: "Email", type: "checkbox" },
        { name: "profile.photo", key: "profilePhoto", label: "Photo", type: "checkbox" },
      ]}
    />
  );
}

export function FileTypesPage() {
  return (
    <SettingsFormPage
      title="File Types"
      description="Allowed upload extensions, applied to files attached in the Download Center and other upload fields."
      fields={[
        {
          name: "fileTypes",
          label: "Allowed extensions (comma separated)",
          type: "textarea",
        },
      ]}
    />
  );
}

export function SubscriptionPage() {
  const [usage, setUsage] = useState<{ students: number; staff: number; classes: number } | null>(null);
  const [settings, setSettings] = useState<SettingRow | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<{ settings: SettingRow; usage: { students: number; staff: number; classes: number } }>("/api/settings")
      .then((res) => {
        setSettings(res.settings);
        setUsage(res.usage);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="card">
      <div className="ct"><h3>Subscription</h3></div>
      <ErrorBox message={error} />
      {!settings || !usage ? (
        <Loading label="Loading subscription…" />
      ) : (
        <>
          <div className="sum">
            <div><small>Plan</small><b>{String(settings.planName ?? "—")}</b></div>
            <div><small>Valid till</small><b>{String(settings.planExpires ?? "—")}</b></div>
            <div><small>Students</small><b>{usage.students}</b></div>
            <div><small>Staff</small><b>{usage.staff}</b></div>
            <div><small>Classes</small><b>{usage.classes}</b></div>
          </div>
          <p className="hint">
            This installation runs on your own MySQL server and is not tied to a paid plan. The plan
            details are kept for your own record and can be changed on this page.
          </p>
          <PlanForm
            planName={String(settings.planName ?? "")}
            planExpires={String(settings.planExpires ?? "")}
          />
        </>
      )}
    </div>
  );
}

function PlanForm({ planName, planExpires }: { planName: string; planExpires: string }) {
  const toast = useToast();
  const [name, setName] = useState(planName);
  const [expires, setExpires] = useState(planExpires);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    try {
      await apiPatch("/api/settings", { planName: name, planExpires: expires || null });
      toast("Subscription details saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the plan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ErrorBox message={error} />
      <div className="flt" style={{ marginTop: 8 }}>
        <label>
          Plan name
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          Expires
          <input type="date" value={expires} onChange={(event) => setExpires(event.target.value)} />
        </label>
        <button type="button" className="btn pri" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save plan"}
        </button>
      </div>
    </>
  );
}

type AssistantResponse = { answer: string; links: { label: string; href: string }[] };

export function AssistantPage() {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; text: string; links?: { label: string; href: string }[] }[]
  >([{ role: "assistant", text: "Ask me about students, pending fees, collection, attendance, staff or birthdays." }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function ask(event: React.FormEvent) {
    event.preventDefault();
    const question = input.trim();
    if (!question) return;
    setMessages((current) => [...current, { role: "user", text: question }]);
    setInput("");
    setBusy(true);
    setError("");
    try {
      const res = await apiPost<AssistantResponse>("/api/assistant", { q: question });
      setMessages((current) => [
        ...current,
        { role: "assistant", text: res.answer, links: res.links },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not answer that question.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="ct"><h3>ICE Assistant</h3></div>
      <p className="hint">
        Answers quick questions from your school data using built-in rules. It is not connected to
        an external AI model.
      </p>
      <ErrorBox message={error} />
      <div className="chat">
        {messages.map((message, index) => (
          <div className={`msg ${message.role === "user" ? "u" : "a"}`} key={index}>
            {message.text}
            {message.links?.length ? (
              <div className="flexrow" style={{ marginTop: 6, flexWrap: "wrap" }}>
                {message.links.map((link) => (
                  <a key={link.href} href={link.href} className="mini">
                    {link.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <form className="tools" onSubmit={ask} style={{ marginTop: 10 }}>
        <input
          className="sin"
          style={{ flex: 1, width: "auto" }}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="e.g. pending fees"
          aria-label="Ask a question"
        />
        <button type="submit" className="btn pri" disabled={busy || !input.trim()}>
          {busy ? "…" : "Ask"}
        </button>
      </form>
    </div>
  );
}

type RoleRow = { id: string; name: string; perms: "all" | string[] };

export function RolesPage() {
  const toast = useToast();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const groups = NAV.filter((group) => group.id !== "dash");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiGet<{ items: RoleRow[] }>("/api/resources/roles?pageSize=100&sort=name&dir=asc");
      setRoles(res.items);
      setSelected(
        Object.fromEntries(
          res.items.map((role) => [
            role.id,
            role.perms === "all" ? groups.map((group) => group.id) : role.perms,
          ]),
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load roles.");
    } finally {
      setLoading(false);
    }
  }, [groups]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(roleId: string, groupId: string, checked: boolean) {
    setSelected((current) => {
      const list = current[roleId] ?? [];
      return {
        ...current,
        [roleId]: checked ? [...new Set([...list, groupId])] : list.filter((id) => id !== groupId),
      };
    });
  }

  async function save() {
    setBusy(true);
    setError("");
    try {
      for (const role of roles) {
        if (role.name === "Admin") continue;
        await apiPatch(`/api/resources/roles/${role.id}`, { perms: selected[role.id] ?? [] });
      }
      toast("Permissions saved. They apply the next time a user signs in.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save permissions.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="ct"><h3>Roles &amp; Permissions</h3></div>
      <p className="hint">
        Tick the modules each role can open. Admin always has everything. Changes apply the next
        time that user signs in.
      </p>
      <ErrorBox message={error} />
      {loading ? (
        <Loading label="Loading roles…" />
      ) : (
        <>
          <div className="tw">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Role</th>
                  {groups.map((group) => <th key={group.id}>{group.title}</th>)}
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td><b>{role.name}</b></td>
                    {groups.map((group) => {
                      const admin = role.name === "Admin";
                      const checked = admin || (selected[role.id] ?? []).includes(group.id);
                      return (
                        <td key={group.id}>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={admin}
                            aria-label={`${role.name} ${group.title}`}
                            onChange={(event) => toggle(role.id, group.id, event.target.checked)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flexrow" style={{ marginTop: 14 }}>
            <button type="button" className="btn pri" onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save permissions"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

type SessionRow = { id: string; name: string };

export function SessionsPage() {
  const lookups = useLookups();
  const toast = useToast();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [current, setCurrent] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [sessionRes, settingsRes] = await Promise.all([
        apiGet<{ items: SessionRow[] }>("/api/resources/sessions?pageSize=100&sort=name&dir=desc"),
        apiGet<{ settings: { session?: string } }>("/api/settings"),
      ]);
      setSessions(sessionRes.items);
      setCurrent(settingsRes.settings.session ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load sessions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function makeCurrent(session: SessionRow) {
    setBusy(true);
    try {
      await apiPatch("/api/settings", { session: session.name });
      setCurrent(session.name);
      lookups.reload();
      toast(`${session.name} is now the current session.`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not change the session.", "err");
    } finally {
      setBusy(false);
    }
  }

  async function addSession(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await apiPost("/api/resources/sessions", { name: name.trim() });
      setName("");
      toast("Session added.");
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not add the session.", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="ct"><h3>Session Setting</h3></div>
      <ErrorBox message={error} />
      <form className="flt" onSubmit={addSession}>
        <label>
          New session
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="2027-28" />
        </label>
        <button type="submit" className="btn pri" disabled={busy || !name.trim()}>
          Add session
        </button>
      </form>
      {loading ? (
        <Loading label="Loading sessions…" />
      ) : (
        <div className="tw">
          <table className="tbl">
            <thead>
              <tr><th>Session</th><th>Current</th><th>Action</th></tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td><b>{session.name}</b></td>
                  <td>
                    {session.name === current ? <span className="bd ok">Active</span> : "—"}
                  </td>
                  <td className="act">
                    {session.name === current ? null : (
                      <button
                        type="button"
                        className="mini ok"
                        onClick={() => void makeCurrent(session)}
                        disabled={busy}
                      >
                        Make current
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!sessions.length ? (
                <tr><td className="empty" colSpan={3}>No sessions yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type Stats = {
  students: number;
  staff: number;
  classes: number;
  sections: number;
  payments: number;
  roles: number;
  users: number;
  logs: number;
};

export function BackupPage() {
  const toast = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [restoreText, setRestoreText] = useState("");

  const loadStats = useCallback(async () => {
    try {
      setStats(await apiGet<Stats>("/api/system/stats"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load system statistics.");
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  async function download() {
    setBusy(true);
    try {
      const backup = await apiGet<Record<string, unknown>>("/api/system/backup");
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `ice-school-backup-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast("Backup downloaded.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not build the backup.", "err");
    } finally {
      setBusy(false);
    }
  }

  async function restore() {
    if (!restoreText.trim()) {
      toast("Paste or choose a backup file first.", "warn");
      return;
    }
    if (!window.confirm("Replace all school data with this backup? User accounts and logs are kept.")) {
      return;
    }
    setBusy(true);
    try {
      const parsed = JSON.parse(restoreText) as unknown;
      const res = await apiPost<{ restored?: number }>("/api/system/restore", { backup: parsed });
      toast(`Backup restored${res.restored ? ` (${res.restored} tables)` : ""}.`);
      setRestoreText("");
      await loadStats();
    } catch (err) {
      toast(err instanceof Error ? err.message : "That backup could not be restored.", "err");
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!window.confirm("Replace all school data with the demo data? User accounts are kept.")) return;
    setBusy(true);
    try {
      await apiPost("/api/system/reset", {});
      toast("Demo data restored.");
      await loadStats();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not reset the database.", "err");
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      setRestoreText(await file.text());
    } catch {
      toast("Could not read that file.", "err");
    }
  }

  return (
    <div className="card">
      <div className="ct"><h3>Backup &amp; Reset</h3></div>
      <p className="hint">
        School data lives in MySQL. A backup includes students, fees, staff, attendance, exams and
        settings. User accounts, roles and logs stay local to this installation.
      </p>
      <ErrorBox message={error} />
      {stats ? (
        <div className="sum">
          <div><small>Students</small><b>{stats.students}</b></div>
          <div><small>Staff</small><b>{stats.staff}</b></div>
          <div><small>Classes</small><b>{stats.classes}</b></div>
          <div><small>Payments</small><b>{stats.payments}</b></div>
          <div><small>Users</small><b>{stats.users}</b></div>
          <div><small>Audit entries</small><b>{stats.logs}</b></div>
        </div>
      ) : (
        <Loading label="Loading statistics…" />
      )}
      <div className="tools" style={{ marginBottom: 12 }}>
        <button type="button" className="btn pri" onClick={download} disabled={busy}>
          Download backup
        </button>
        <label className="btn" style={{ cursor: "pointer" }}>
          Choose backup file
          <input
            type="file"
            accept="application/json,.json"
            style={{ display: "none" }}
            onChange={(event) => void onFile(event.target.files?.[0])}
          />
        </label>
        <button type="button" className="btn" onClick={restore} disabled={busy || !restoreText}>
          Restore backup
        </button>
        <button type="button" className="btn bad" onClick={reset} disabled={busy}>
          Reset to demo data
        </button>
      </div>
      <div className="fld span2">
        <label htmlFor="backup_text">Backup JSON</label>
        <textarea
          id="backup_text"
          rows={6}
          value={restoreText}
          onChange={(event) => setRestoreText(event.target.value)}
          placeholder="Paste a backup here or choose a .json file above."
        />
      </div>
    </div>
  );
}
