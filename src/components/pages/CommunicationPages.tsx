"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { dmy, today } from "@/lib/utils";
import { useLookups } from "@/components/LookupProvider";
import { useToast } from "@/components/ToastProvider";
import { ErrorBox, Loading } from "./shared";

type Recipient = {
  name: string;
  phone: string;
  email: string;
  obj: Record<string, unknown>;
};

type RecipientsResponse = {
  audiences: { value: string; label: string }[];
  recipients: Recipient[];
  count: number;
  template: string;
};

type Template = { id: string; title: string; body: string };

function fill(template: string, obj: Record<string, unknown>): string {
  return String(template).replace(/\{(\w+)\}/g, (match, key: string) =>
    obj[key] !== undefined && obj[key] !== null ? String(obj[key]) : match,
  );
}

function waLink(phone: string, text: string): string {
  const digits = String(phone ?? "").replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function AudienceSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label>
      Send to
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

/** Email or SMS composer. Messages are logged, not transmitted by the server. */
export function ComposerPage({ channel }: { channel: "Email" | "SMS" }) {
  const toast = useToast();
  const [audience, setAudience] = useState("allstu");
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [count, setCount] = useState(0);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadAudience = useCallback(async (value: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await apiGet<RecipientsResponse>(
        `/api/communications/recipients?audience=${encodeURIComponent(value)}`,
      );
      setOptions(res.audiences);
      setRecipients(res.recipients);
      setCount(res.count);
      if (!body) setBody(res.template ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load recipients.");
    } finally {
      setLoading(false);
    }
  }, [body]);

  useEffect(() => {
    void loadAudience(audience);
    // Audience changes drive this request; body is only used for the initial template.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audience]);

  useEffect(() => {
    const resource = channel === "Email" ? "emailTpl" : "smsTpl";
    apiGet<{ items: Template[] }>(`/api/resources/${resource}?pageSize=100&sort=title&dir=asc`)
      .then((res) => setTemplates(res.items))
      .catch(() => setTemplates([]));
  }, [channel]);

  useEffect(() => {
    if (!templateId) return;
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setBody(template.body);
      if (channel === "Email") setSubject(template.title);
    }
  }, [channel, templateId, templates]);

  async function send() {
    if (!body.trim()) {
      toast("Write a message before sending.", "err");
      return;
    }
    setBusy(true);
    try {
      const res = await apiPost<{ sent: number }>("/api/communications/send", {
        channel,
        audience,
        subject: channel === "Email" ? subject : undefined,
        body,
      });
      toast(`${res.sent} ${channel} message(s) saved to the log.`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not send the messages.", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="ct"><h3>Send {channel}</h3></div>
      <p className="hint">
        Messages are saved to the Email / SMS log. No external gateway is connected, so nothing
        leaves this application.
      </p>
      <ErrorBox message={error} />
      <div className="fg">
        <div className="fld">
          <AudienceSelect value={audience} options={options} onChange={setAudience} />
        </div>
        <div className="fld">
          <label htmlFor="comm_tpl">Template</label>
          <select id="comm_tpl" value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
            <option value="">No template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>{template.title}</option>
            ))}
          </select>
        </div>
        {channel === "Email" ? (
          <div className="fld span2">
            <label htmlFor="comm_subject">Subject</label>
            <input
              id="comm_subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </div>
        ) : null}
        <div className="fld span2">
          <label htmlFor="comm_body">Message</label>
          <textarea
            id="comm_body"
            rows={5}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Use {name}, {class}, {due}, {date} placeholders."
          />
        </div>
      </div>
      <div className="flexrow" style={{ marginTop: 14 }}>
        <button type="button" className="btn pri" onClick={send} disabled={busy || loading}>
          {busy ? "Sending…" : `Send ${channel}`}
        </button>
        <span className="hint">
          {loading ? "Counting recipients…" : `${count} recipient${count === 1 ? "" : "s"}`}
        </span>
      </div>
      {recipients.length ? (
        <div className="tw" style={{ marginTop: 14 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Phone</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {recipients.map((recipient, index) => (
                <tr key={`${recipient.name}-${index}`}>
                  <td>{recipient.name}</td>
                  <td>{recipient.phone || "—"}</td>
                  <td>{recipient.email || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {recipients.length && count > recipients.length ? (
        <p className="hint" style={{ marginTop: 8 }}>
          Showing the first {recipients.length} of {count} recipients.
        </p>
      ) : null}
    </div>
  );
}

/** WhatsApp links generated in the browser; messages are sent from the user's own WhatsApp. */
export function WhatsAppPage() {
  const toast = useToast();
  const [audience, setAudience] = useState("allstu");
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (value: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await apiGet<RecipientsResponse>(
        `/api/communications/recipients?audience=${encodeURIComponent(value)}`,
      );
      setOptions(res.audiences);
      setRecipients(res.recipients);
      if (!message) setMessage(res.template ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load recipients.");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    void load(audience);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audience]);

  async function runReminders() {
    if (!window.confirm("Generate fee reminder messages for every matching fee due?")) return;
    setBusy(true);
    try {
      const res = await apiPost<{ logged: number }>("/api/communications/reminders", {});
      toast(`${res.logged} fee reminder(s) logged.`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not generate reminders.", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="ct">
        <h3>WhatsApp Messages</h3>
        <div className="tools">
          <button type="button" className="btn" onClick={runReminders} disabled={busy}>
            {busy ? "Working…" : "Log fee reminders"}
          </button>
        </div>
      </div>
      <p className="hint">
        Each recipient gets a button that opens WhatsApp with the message filled in. You send it
        from your own WhatsApp.
      </p>
      <ErrorBox message={error} />
      <div className="flt">
        <AudienceSelect value={audience} options={options} onChange={setAudience} />
        <label style={{ flex: 1, minWidth: 260 }}>
          Message
          <input value={message} onChange={(event) => setMessage(event.target.value)} />
        </label>
      </div>
      {loading ? (
        <Loading label="Loading recipients…" />
      ) : (
        <div className="tw">
          <table className="tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Message</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recipients.map((recipient, index) => {
                const text = fill(message, recipient.obj);
                return (
                  <tr key={`${recipient.name}-${index}`}>
                    <td><b>{recipient.name}</b></td>
                    <td>{recipient.phone || "—"}</td>
                    <td style={{ maxWidth: 360 }}>{text}</td>
                    <td>
                      {recipient.phone ? (
                        <a
                          className="mini pri"
                          href={waLink(recipient.phone, text)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: "none", display: "inline-flex" }}
                        >
                          Open WhatsApp
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
              {!recipients.length ? (
                <tr>
                  <td className="empty" colSpan={4}>No recipients for this audience.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type CredentialStudent = {
  id: string;
  name: string;
  admNo: string;
  father?: string | null;
  phone?: string | null;
  portalPassword?: string | null;
};

/** Student login credentials with WhatsApp and SMS-log actions. */
export function CredentialsPage() {
  const lookups = useLookups();
  const toast = useToast();
  const [classId, setClassId] = useState("");
  const [students, setStudents] = useState<CredentialStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    if (!classId) {
      setStudents([]);
      return;
    }
    let alive = true;
    setLoading(true);
    setError("");
    apiGet<{ items: CredentialStudent[] }>(
      `/api/resources/students?classId=${encodeURIComponent(classId)}&status=active&pageSize=500&sort=admNo&dir=asc`,
    )
      .then((res) => {
        if (alive) setStudents(res.items);
      })
      .catch((err: Error) => {
        if (alive) setError(err.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [classId]);

  async function logSms(student: CredentialStudent) {
    setBusyId(student.id);
    try {
      await apiPost("/api/communications/credentials", { studentId: student.id });
      toast(`Credentials logged for ${student.name}.`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not log the credentials.", "err");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="card">
      <div className="ct"><h3>Login Credentials</h3></div>
      <p className="hint">
        The student username is the admission number. Use the WhatsApp button to send credentials
        from your own WhatsApp, or log them to the SMS gateway.
      </p>
      <div className="flt">
        <label>
          Class
          <select value={classId} onChange={(event) => setClassId(event.target.value)}>
            <option value="">Select</option>
            {lookups.list("classes").map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>
      <ErrorBox message={error} />
      {loading ? (
        <Loading label="Loading students…" />
      ) : (
        <div className="tw">
          <table className="tbl">
            <thead>
              <tr>
                <th>Student</th>
                <th>Username</th>
                <th>Password</th>
                <th>Phone</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const text = `Dear ${student.father || student.name}, login for ${student.name}: username ${student.admNo}, password ${student.portalPassword || ""}. - ICE School`;
                return (
                  <tr key={student.id}>
                    <td><b>{student.name}</b></td>
                    <td>{student.admNo}</td>
                    <td>{student.portalPassword || "—"}</td>
                    <td>{student.phone || "—"}</td>
                    <td className="act">
                      <button
                        type="button"
                        className="mini"
                        onClick={() => void logSms(student)}
                        disabled={busyId === student.id}
                      >
                        {busyId === student.id ? "Logging…" : "Log SMS"}
                      </button>
                      {student.phone ? (
                        <a
                          className="mini pri"
                          href={waLink(student.phone, text)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: "none", display: "inline-flex" }}
                        >
                          WhatsApp
                        </a>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
              {!students.length ? (
                <tr>
                  <td className="empty" colSpan={5}>Select a class with active students.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
      <p className="hint" style={{ marginTop: 10 }}>
        Today: {dmy(today())}. Credentials are stored per student in the database.
      </p>
    </div>
  );
}
