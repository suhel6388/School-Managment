"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import { dmy, inr } from "@/lib/utils";
import { Icon } from "@/components/Icon";

type Dashboard = {
  school: { name: string; session: string; address: string; phone: string };
  kpis: {
    activeStudents: number;
    newThisMonth: number;
    classes: number;
    sections: number;
    subjects: number;
    staff: number;
    collectedThisMonth: number;
    pendingTotal: number;
    pendingStudents: number;
  };
  charts: {
    admissions: { label: string; value: number }[];
    classes: { label: string; value: number }[];
    monthly: { month: number; label: string; value: number }[];
  };
  recentAdmissions: { id: string; name: string; className: string; admDate: string }[];
  pendingTop: { id: string; name: string; className: string; due: number }[];
  events: { id: string; title: string; date: string; time: string; place: string }[];
  notices: { id: string; title: string; date: string }[];
  attendance: { marked: number; present: number; percent: number | null };
  alerts: { label: string; route: string; count: number }[];
};

export function Dashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    apiGet<Dashboard>("/api/dashboard")
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!data) {
    return (
      <div className="loading">
        <span className="spinner" />
        Loading dashboard…
      </div>
    );
  }

  const k = data.kpis;
  const maxAdmission = Math.max(1, ...data.charts.admissions.map((x) => x.value));
  const maxClass = Math.max(1, ...data.charts.classes.map((x) => x.value));

  return (
    <>
      <div className="grid g4" style={{ marginBottom: 14 }}>
        <button
          type="button"
          className="stat"
          style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)" }}
          onClick={() => router.push("/students")}
        >
          <span className="ic">
            <Icon name="userplus" />
          </span>
          <span>
            <b>{k.activeStudents}</b>
            <small>Active students · {k.newThisMonth} new this month</small>
          </span>
        </button>
        <button
          type="button"
          className="stat"
          style={{ background: "linear-gradient(135deg,#059669,#047857)" }}
          onClick={() => router.push("/collect")}
        >
          <span className="ic">
            <Icon name="rupee" />
          </span>
          <span>
            <b>{inr(k.collectedThisMonth)}</b>
            <small>Collected this month</small>
          </span>
        </button>
        <button
          type="button"
          className="stat"
          style={{ background: "linear-gradient(135deg,#ea580c,#c2410c)" }}
          onClick={() => router.push("/duefees")}
        >
          <span className="ic">
            <Icon name="alert" />
          </span>
          <span>
            <b>{inr(k.pendingTotal)}</b>
            <small>Pending from {k.pendingStudents} students</small>
          </span>
        </button>
        <button
          type="button"
          className="stat"
          style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}
          onClick={() => router.push("/staff")}
        >
          <span className="ic">
            <Icon name="brief" />
          </span>
          <span>
            <b>{k.staff}</b>
            <small>Active staff · {k.classes} classes</small>
          </span>
        </button>
      </div>

      {data.alerts.length ? (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="ct">
            <h3>
              Needs attention <span className="cnt">{data.alerts.length}</span>
            </h3>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {data.alerts.map((alert) => (
              <button
                type="button"
                key={alert.label}
                className="alert warn"
                style={{ textAlign: "left", cursor: "pointer" }}
                onClick={() => router.push(`/${alert.route}`)}
              >
                <Icon name="alert" />
                {alert.label}
                <span className="x">→</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid g3b" style={{ marginBottom: 14 }}>
        <div className="card">
          <div className="ct">
            <h3>Admissions · last 6 months</h3>
          </div>
          <div style={{ display: "grid", gap: 9 }}>
            {data.charts.admissions.map((row) => (
              <div key={row.label} style={{ display: "grid", gridTemplateColumns: "38px 1fr 30px", gap: 8, alignItems: "center" }}>
                <span className="small muted">{row.label}</span>
                <div className="bar">
                  <i style={{ width: `${(row.value / maxAdmission) * 100}%` }} />
                </div>
                <b className="small" style={{ textAlign: "right" }}>{row.value}</b>
              </div>
            ))}
          </div>
          <div className="hint" style={{ marginTop: 10 }}>
            {data.attendance.marked
              ? `Attendance today: ${data.attendance.present}/${data.attendance.marked} present (${data.attendance.percent}%).`
              : "Attendance has not been marked today."}
          </div>
        </div>

        <div className="card">
          <div className="ct">
            <h3>Class strength</h3>
            <button type="button" className="mini" onClick={() => router.push("/rep_student")}>
              Full report
            </button>
          </div>
          <div style={{ display: "grid", gap: 9 }}>
            {data.charts.classes.slice(0, 10).map((row) => (
              <div key={row.label} style={{ display: "grid", gridTemplateColumns: "80px 1fr 30px", gap: 8, alignItems: "center" }}>
                <span className="small">{row.label}</span>
                <div className="bar">
                  <i style={{ width: `${(row.value / maxClass) * 100}%`, background: "var(--tileGrn)" }} />
                </div>
                <b className="small" style={{ textAlign: "right" }}>{row.value}</b>
              </div>
            ))}
            {!data.charts.classes.length ? <div className="hint">No active students yet.</div> : null}
          </div>
        </div>

        <div className="card">
          <div className="ct">
            <h3>Quick actions</h3>
          </div>
          <div className="qa">
            <button type="button" onClick={() => router.push("/admission")}>
              <Icon name="userplus" /> Admission
            </button>
            <button type="button" onClick={() => router.push("/collect")}>
              <Icon name="rupee" /> Collect fees
            </button>
            <button type="button" onClick={() => router.push("/stuatt")}>
              <Icon name="check" /> Attendance
            </button>
            <button type="button" onClick={() => router.push("/examresult")}>
              <Icon name="book" /> Exam marks
            </button>
            <button type="button" onClick={() => router.push("/sendemail")}>
              <Icon name="mega" /> Send message
            </button>
            <button type="button" onClick={() => router.push("/certgen")}>
              <Icon name="award" /> Certificate
            </button>
          </div>
        </div>
      </div>

      <div className="grid g3b">
        <div className="card">
          <div className="ct">
            <h3>Recent admissions</h3>
            <button type="button" className="mini" onClick={() => router.push("/students")}>
              View all
            </button>
          </div>
          {data.recentAdmissions.length ? (
            data.recentAdmissions.map((student) => (
              <div
                key={student.id}
                className="ev"
                style={{ cursor: "pointer" }}
                onClick={() => router.push(`/students?open=${student.id}`)}
              >
                <div className="dt">
                  {student.admDate.slice(8, 10)}
                  <small>{student.admDate.slice(5, 7)}</small>
                </div>
                <div style={{ minWidth: 0 }}>
                  <b>{student.name}</b>
                  <div className="hint">{student.className || "No class"} · {dmy(student.admDate)}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="hint">No admissions recorded.</div>
          )}
        </div>

        <div className="card">
          <div className="ct">
            <h3>Fee collection by month</h3>
          </div>
          <div className="months">
            {data.charts.monthly.map((row) => (
              <button type="button" key={row.label} onClick={() => router.push("/rep_finance")}>
                <b>{row.label}</b>
                <span>{row.value ? inr(row.value) : "—"}</span>
              </button>
            ))}
          </div>
          <div className="ct" style={{ marginTop: 14, marginBottom: 4 }}>
            <h3 style={{ fontSize: 14 }}>Top pending fees</h3>
          </div>
          {data.pendingTop.map((p) => (
            <div key={p.id} className="ev">
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>{p.name}</b>
                <div className="hint">{p.className || "No class"}</div>
              </div>
              <b className="money" style={{ color: "var(--bad)" }}>{inr(p.due)}</b>
            </div>
          ))}
          {!data.pendingTop.length ? <div className="hint">No pending fees.</div> : null}
        </div>

        <div className="card">
          <div className="ct">
            <h3>Calendar & notices</h3>
          </div>
          {data.events.map((event) => (
            <div key={event.id} className="ev">
              <div className="dt">
                {event.date.slice(8, 10)}
                <small>{event.date.slice(5, 7)}</small>
              </div>
              <div>
                <b>{event.title}</b>
                <div className="hint">
                  {[event.time, event.place].filter(Boolean).join(" · ") || "All day"}
                </div>
              </div>
            </div>
          ))}
          {!data.events.length ? <div className="hint">No upcoming events.</div> : null}
          <div className="ct" style={{ marginTop: 14, marginBottom: 4 }}>
            <h3 style={{ fontSize: 14 }}>Notices</h3>
            <button type="button" className="mini" onClick={() => router.push("/notices")}>
              Manage
            </button>
          </div>
          {data.notices.map((notice) => (
            <div key={notice.id} className="ev">
              <div style={{ flex: 1 }}>
                <b>{notice.title}</b>
                <div className="hint">{dmy(notice.date)}</div>
              </div>
            </div>
          ))}
          {!data.notices.length ? <div className="hint">No notices published.</div> : null}
        </div>
      </div>
    </>
  );
}
