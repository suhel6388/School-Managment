"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { dmy, today } from "@/lib/utils";
import { useLookups } from "@/components/LookupProvider";
import { useToast } from "@/components/ToastProvider";
import { GenericCrud } from "@/components/crud/GenericCrud";
import { CRUD_PAGES } from "./configs";
import { ErrorBox, Loading } from "./shared";

const STATUSES = ["Present", "Absent", "Late", "Half Day", "Holiday"] as const;

type AttendanceRow = {
  id: string;
  code: string;
  name: string;
  className?: string;
  sectionName?: string;
  status: string;
  note?: string;
};

type AttendanceData = {
  date: string;
  type: "student" | "staff";
  rows: AttendanceRow[];
  summary: { marked: number; present: number; absent: number; late: number };
};

function statusClass(value: string) {
  if (value === "Present") return "ok";
  if (value === "Absent") return "bad";
  if (value === "Late" || value === "Half Day") return "warn";
  return "";
}

function Summary({ summary }: { summary: AttendanceData["summary"] }) {
  return (
    <div className="sum">
      <div><small>Marked</small><b>{summary.marked}</b></div>
      <div><small>Present</small><b>{summary.present}</b></div>
      <div><small>Absent</small><b>{summary.absent}</b></div>
      <div><small>Late / half day</small><b>{summary.late}</b></div>
    </div>
  );
}

/** Student or staff attendance entry. */
export function AttendancePage({ type = "student" }: { type?: "student" | "staff" }) {
  const staff = type === "staff";
  const lookups = useLookups();
  const toast = useToast();
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(today());
  const [data, setData] = useState<AttendanceData | null>(null);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!date) return;
    if (!staff && !classId) {
      setData(null);
      setStatuses({});
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ date, type });
      if (!staff) {
        params.set("classId", classId);
        if (sectionId) params.set("sectionId", sectionId);
      }
      const res = await apiGet<AttendanceData>(`/api/attendance?${params}`);
      setData(res);
      setStatuses(Object.fromEntries(res.rows.map((row) => [row.id, row.status || ""])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load attendance.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [classId, date, sectionId, staff]);

  useEffect(() => {
    void load();
  }, [load]);

  function markAll(value: string) {
    if (!data) return;
    setStatuses(Object.fromEntries(data.rows.map((row) => [row.id, value])));
  }

  async function save() {
    if (!data) return;
    const records = data.rows
      .filter((row) => statuses[row.id])
      .map((row) => ({ id: row.id, status: statuses[row.id], note: row.note ?? "" }));
    if (!records.length) {
      toast("Mark at least one person before saving.", "warn");
      return;
    }
    setBusy(true);
    try {
      await apiPost("/api/attendance", { date, type, records });
      toast(`Attendance saved for ${records.length} ${staff ? "staff member" : "student"}(s).`);
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not save attendance.", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="ct">
        <h3>{staff ? "Staff Attendance" : "Student Attendance"}</h3>
        {data ? (
          <div className="tools">
            <button type="button" className="btn sm" onClick={() => markAll("Present")}>
              Mark all present
            </button>
            <button type="button" className="btn sm" onClick={() => markAll("Absent")}>
              Mark all absent
            </button>
          </div>
        ) : null}
      </div>
      <div className="flt">
        {!staff ? (
          <>
            <label>
              Class
              <select
                value={classId}
                onChange={(event) => {
                  setClassId(event.target.value);
                  setSectionId("");
                }}
              >
                <option value="">Select class</option>
                {lookups.list("classes").map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label>
              Section
              <select value={sectionId} onChange={(event) => setSectionId(event.target.value)}>
                <option value="">All sections</option>
                {lookups.list("sections").map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </>
        ) : null}
        <label>
          Date
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <button type="button" className="btn" onClick={() => void load()} disabled={loading}>
          Refresh
        </button>
      </div>
      <ErrorBox message={error} />
      {loading && !data ? (
        <Loading label="Loading attendance…" />
      ) : !staff && !classId ? (
        <div className="notebox">Select a class to load its students.</div>
      ) : data ? (
        <>
          <Summary summary={data.summary} />
          <div className="tw">
            <table className="tbl">
              <thead>
                <tr>
                  <th>{staff ? "Emp ID" : "Adm No"}</th>
                  <th>Name</th>
                  {!staff ? <th>Class</th> : null}
                  <th>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.code}</td>
                    <td><b>{row.name}</b></td>
                    {!staff ? (
                      <td>{[row.className, row.sectionName].filter(Boolean).join(" · ") || "—"}</td>
                    ) : null}
                    <td>
                      <div className="chk">
                        {STATUSES.map((status) => (
                          <label key={status}>
                            <input
                              type="radio"
                              name={`att-${row.id}`}
                              checked={statuses[row.id] === status}
                              onChange={() =>
                                setStatuses((current) => ({ ...current, [row.id]: status }))
                              }
                            />
                            {status}
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {!data.rows.length ? (
                  <tr>
                    <td className="empty" colSpan={staff ? 3 : 4}>
                      No active {staff ? "staff" : "students"} found for this selection.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="flexrow" style={{ marginTop: 14 }}>
            <button type="button" className="btn pri" onClick={save} disabled={busy || !data.rows.length}>
              {busy ? "Saving…" : "Save attendance"}
            </button>
            <span className="hint">Unmarked rows are left unchanged. Existing marks load automatically.</span>
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Read-only attendance register for a date. */
export function AttendanceByDatePage() {
  const lookups = useLookups();
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(today());
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ date, type: "student" });
      if (classId) params.set("classId", classId);
      if (sectionId) params.set("sectionId", sectionId);
      const res = await apiGet<AttendanceData>(`/api/attendance?${params}`);
      setData({ ...res, rows: res.rows.filter((row) => row.status) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load attendance.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [classId, date, sectionId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="card">
      <div className="ct">
        <h3>Attendance By Date</h3>
        <div className="tools"><span className="pill">{dmy(date)}</span></div>
      </div>
      <div className="flt">
        <label>
          Class
          <select
            value={classId}
            onChange={(event) => {
              setClassId(event.target.value);
              setSectionId("");
            }}
          >
            <option value="">All classes</option>
            {lookups.list("classes").map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          Section
          <select value={sectionId} onChange={(event) => setSectionId(event.target.value)}>
            <option value="">All sections</option>
            {lookups.list("sections").map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          Date
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
      </div>
      <ErrorBox message={error} />
      {loading && !data ? (
        <Loading label="Loading register…" />
      ) : data ? (
        <>
          <Summary summary={data.summary} />
          <div className="tw">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Adm No</th>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Status</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.code}</td>
                    <td><b>{row.name}</b></td>
                    <td>{[row.className, row.sectionName].filter(Boolean).join(" · ") || "—"}</td>
                    <td><span className={`bd ${statusClass(row.status)}`}>{row.status}</span></td>
                    <td>{row.note || "—"}</td>
                  </tr>
                ))}
                {!data.rows.length ? (
                  <tr>
                    <td className="empty" colSpan={5}>No attendance marked for this selection.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}

/** Student leave requests with approve/reject actions. */
export function StudentLeavePage() {
  return <GenericCrud config={CRUD_PAGES.stuleave} />;
}
