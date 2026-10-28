"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { dmy, initials, inr } from "@/lib/utils";
import { Modal } from "@/components/Modal";
import { DynamicForm } from "@/components/DynamicForm";
import { useLookups } from "@/components/LookupProvider";
import { useToast } from "@/components/ToastProvider";
import { GenericCrud } from "@/components/crud/GenericCrud";
import { CRUD_PAGES } from "./configs";

type AnyRow = Record<string, any>;

export function StudentListPage() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const config = useMemo(
    () => ({
      ...CRUD_PAGES.students,
      onRowClick: (row: AnyRow) => setProfileId(String(row.id)),
    }),
    [],
  );
  return (
    <>
      <GenericCrud config={config} />
      <StudentProfileModal studentId={profileId} onClose={() => setProfileId(null)} />
    </>
  );
}

const TABS = ["Overview", "Fees", "Attendance", "Exams", "Payments", "Transport"] as const;

export function StudentProfileModal({
  studentId,
  onClose,
}: {
  studentId: string | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<AnyRow | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!studentId) return;
    setData(null);
    setError("");
    setTab("Overview");
    apiGet<AnyRow>(`/api/students/${studentId}/profile`)
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [studentId, onClose]);

  const student: AnyRow = data?.student ?? {};
  const fees: AnyRow = data?.fees ?? { rows: [], totals: {} };

  async function disableStudent() {
    const reason = window.prompt("Reason for disabling this student?");
    if (reason === null) return;
    try {
      await apiPost("/api/actions/student-status", {
        id: studentId,
        status: "disabled",
        reasonId: reason || null,
      });
      toast("Student disabled.");
      onClose();
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not disable.", "err");
    }
  }

  return (
    <Modal
      open={!!studentId}
      title={data ? `${student.name} · ${student.admNo}` : "Student profile"}
      onClose={onClose}
      size="xl"
    >
      {error ? <div className="alert">{error}</div> : null}
      {!data && !error ? (
        <div className="loading">
          <span className="spinner" />
          Loading student…
        </div>
      ) : null}
      {data ? (
        <>
          <div className="profhead" style={{ marginBottom: 14 }}>
            <div className="pic">
              {student.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={String(student.photo)} alt={String(student.name)} />
              ) : (
                initials(String(student.name))
              )}
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div className="flexrow">
                <h2 style={{ fontSize: 21 }}>{String(student.name)}</h2>
                <span className={`bd ${student.status === "active" ? "ok" : "bad"}`}>{String(student.status)}</span>
              </div>
              <div className="hint">
                {[student.class?.name, student.section?.name].filter(Boolean).join(" · ")} · Roll{" "}
                {String(student.rollNo || "—")} · Admitted {dmy(String(student.admDate ?? ""))}
              </div>
            </div>
            <div className="flexrow">
              <button
                type="button"
                className="btn pri"
                onClick={() => {
                  onClose();
                  router.push(`/collect?student=${studentId}`);
                }}
              >
                Collect fees
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  onClose();
                  router.push(`/students?open=${studentId}`);
                }}
              >
                Edit record
              </button>
            </div>
          </div>

          <div className="tabs">
            {TABS.map((name) => (
              <button key={name} type="button" className={tab === name ? "on" : ""} onClick={() => setTab(name)}>
                {name}
              </button>
            ))}
          </div>

          {tab === "Overview" ? (
            <div className="grid g2">
              <div className="card">
                <h3 style={{ marginBottom: 10 }}>Personal</h3>
                <div className="kv">
                  <div><small>Admission no</small>{String(student.admNo)}</div>
                  <div><small>Roll no</small>{String(student.rollNo || "—")}</div>
                  <div><small>Gender</small>{String(student.gender)}</div>
                  <div><small>Date of birth</small>{student.dob ? dmy(String(student.dob)) : "—"}</div>
                  <div><small>Category</small>{student.category?.name ?? "—"}</div>
                  <div><small>House</small>{student.house?.name ?? "—"}</div>
                  <div><small>Father</small>{String(student.father || "—")}</div>
                  <div><small>Mother</small>{String(student.mother || "—")}</div>
                  <div><small>Phone</small>{String(student.phone || "—")}</div>
                  <div><small>Email</small>{String(student.email || "—")}</div>
                  <div style={{ gridColumn: "1/-1" }}><small>Address</small>{String(student.address || "—")}</div>
                </div>
              </div>
              <div className="card">
                <h3 style={{ marginBottom: 10 }}>Fee summary</h3>
                <div className="sum">
                  <div><small>Total</small><b>{inr(fees.totals?.amount ?? 0)}</b></div>
                  <div><small>Paid</small><b>{inr(fees.totals?.paid ?? 0)}</b></div>
                  <div><small>Balance</small><b style={{ color: "var(--bad)" }}>{inr(fees.totals?.bal ?? 0)}</b></div>
                </div>
                <div className="kv">
                  <div><small>Attendance</small>{data.attendance?.percent === null ? "Not marked" : `${data.attendance?.percent}%`}</div>
                  <div><small>Present days</small>{String(data.attendance?.present ?? 0)}</div>
                  <div><small>Transport</small>{data.transport?.length ? `${data.transport[0].route} · ${data.transport[0].pickup}` : "Not using"}</div>
                  <div><small>Hostel</small>{data.hostel?.length ? `${data.hostel[0].hostel} · Room ${data.hostel[0].room}` : "Day scholar"}</div>
                </div>
                <div className="flexrow" style={{ marginTop: 14 }}>
                  {student.status === "active" ? (
                    <button type="button" className="mini no" onClick={disableStudent}>
                      Disable student
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="mini ok"
                      onClick={async () => {
                        try {
                          await apiPost("/api/actions/student-status", { id: studentId, status: "active" });
                          toast("Student enabled.");
                          onClose();
                        } catch (err) {
                          toast(err instanceof Error ? err.message : "Could not enable.", "err");
                        }
                      }}
                    >
                      Enable student
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {tab === "Fees" ? (
            <div className="tw">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Fee</th>
                    <th>Group</th>
                    <th>Due</th>
                    <th>Amount</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(fees.rows ?? []).map((row: AnyRow) => (
                    <tr key={row.key}>
                      <td>{row.name}</td>
                      <td>{row.group}</td>
                      <td>{dmy(row.due)}</td>
                      <td className="money">{inr(row.amount)}</td>
                      <td className="money">{inr(row.paid + row.disc)}</td>
                      <td className="money">{inr(row.bal)}</td>
                      <td><span className={`bd ${row.status === "Paid" ? "ok" : row.late ? "bad" : "warn"}`}>{row.status}</span></td>
                    </tr>
                  ))}
                  {!fees.rows?.length ? <tr><td className="empty" colSpan={7}>No fee rows for this class.</td></tr> : null}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === "Attendance" ? (
            <div className="grid g2">
              <div className="card">
                <h3 style={{ marginBottom: 8 }}>Recent attendance</h3>
                <div className="sum">
                  <div><small>Attendance</small><b>{data.attendance?.percent ?? 0}%</b></div>
                  <div><small>Present</small><b>{data.attendance?.present ?? 0}</b></div>
                  <div><small>Absent</small><b>{data.attendance?.absent ?? 0}</b></div>
                  <div><small>Late</small><b>{data.attendance?.late ?? 0}</b></div>
                </div>
                {(data.attendance?.recent ?? []).map((row: AnyRow) => (
                  <div key={row.date} className="ev">
                    <div style={{ flex: 1 }}>{dmy(row.date)}</div>
                    <span className={`bd ${row.status === "Present" ? "ok" : row.status === "Absent" ? "bad" : "warn"}`}>
                      {row.status}
                    </span>
                  </div>
                ))}
                {!data.attendance?.recent?.length ? <div className="hint">No attendance marked yet.</div> : null}
              </div>
              <div className="card">
                <h3 style={{ marginBottom: 8 }}>Leave requests</h3>
                {(data.leaves ?? []).map((row: AnyRow) => (
                  <div key={row.id} className="ev">
                    <div style={{ flex: 1 }}>
                      <b>{dmy(row.from)} → {dmy(row.to)}</b>
                      <div className="hint">{row.reason || "No reason"}</div>
                    </div>
                    <span className={`bd ${row.status === "Approved" ? "ok" : row.status === "Rejected" ? "bad" : "warn"}`}>
                      {row.status}
                    </span>
                  </div>
                ))}
                {!data.leaves?.length ? <div className="hint">No leave requests.</div> : null}
              </div>
            </div>
          ) : null}

          {tab === "Exams" ? (
            <div className="tw">
              <table className="tbl">
                <thead><tr><th>Exam</th><th>Subject</th><th>Date</th><th>Marks</th><th>Max</th></tr></thead>
                <tbody>
                  {(data.results ?? []).map((row: AnyRow) => (
                    <tr key={row.id}>
                      <td>{row.group}</td>
                      <td>{row.subject}</td>
                      <td>{dmy(row.date)}</td>
                      <td>{row.absent ? "Absent" : row.marks}</td>
                      <td>{row.max}</td>
                    </tr>
                  ))}
                  {!data.results?.length ? <tr><td className="empty" colSpan={5}>No exam results.</td></tr> : null}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === "Payments" ? (
            <div className="tw">
              <table className="tbl">
                <thead><tr><th>Receipt</th><th>Date</th><th>Amount</th><th>Mode</th><th>Action</th></tr></thead>
                <tbody>
                  {(data.payments ?? []).map((row: AnyRow) => (
                    <tr key={row.id}>
                      <td>{row.rc}</td>
                      <td>{dmy(row.date)}</td>
                      <td className="money">{inr(row.amount)}</td>
                      <td>{row.mode}</td>
                      <td>
                        <button
                          type="button"
                          className="mini no"
                          onClick={async () => {
                            if (!window.confirm(`Revert receipt ${row.rc}?`)) return;
                            try {
                              await apiDelete(`/api/fees/payments/${row.id}`);
                              toast("Payment reverted.");
                              setData(await apiGet<AnyRow>(`/api/students/${studentId}/profile`));
                            } catch (err) {
                              toast(err instanceof Error ? err.message : "Could not revert.", "err");
                            }
                          }}
                        >
                          Revert
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!data.payments?.length ? <tr><td className="empty" colSpan={5}>No payments.</td></tr> : null}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === "Transport" ? (
            <div className="grid g2">
              <div className="card">
                <h3 style={{ marginBottom: 8 }}>Transport</h3>
                {(data.transport ?? []).map((row: AnyRow) => (
                  <div key={row.id} className="ev">
                    <div><b>{row.route}</b><div className="hint">{row.pickup}</div></div>
                    <span className="bd">{row.due ? dmy(row.due) : "No due date"}</span>
                  </div>
                ))}
                {!data.transport?.length ? <div className="hint">Not using school transport.</div> : null}
              </div>
              <div className="card">
                <h3 style={{ marginBottom: 8 }}>Hostel</h3>
                {(data.hostel ?? []).map((row: AnyRow) => (
                  <div key={row.id} className="ev">
                    <div><b>{row.hostel} · Room {row.room}</b><div className="hint">{row.type} · {dmy(row.date)}</div></div>
                  </div>
                ))}
                {!data.hostel?.length ? <div className="hint">Day scholar.</div> : null}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </Modal>
  );
}

export function AdmissionPage() {
  const [student, setStudent] = useState<AnyRow | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function submit(values: Record<string, unknown>) {
    setBusy(true);
    try {
      const created = await apiPost<AnyRow>("/api/resources/students", values);
      setStudent(created);
      toast(`Admission saved · ${created.admNo}`);
    } finally {
      setBusy(false);
    }
  }

  if (student) {
    return (
      <div className="card">
        <div className="ct"><h3>Admission complete</h3></div>
        <div className="alert ok" style={{ marginBottom: 12 }}>
          {student.name} was admitted with admission number <b>{student.admNo}</b>.
        </div>
        <div className="kv">
          <div><small>Name</small>{student.name}</div>
          <div><small>Admission no</small>{student.admNo}</div>
          <div><small>Class</small>{student.class?.name ?? "—"}</div>
          <div><small>Section</small>{student.section?.name ?? "—"}</div>
          <div><small>Guardian phone</small>{student.phone || "—"}</div>
          <div><small>Portal password</small>{student.portalPassword || "—"}</div>
        </div>
        <div className="flexrow" style={{ marginTop: 18 }}>
          <button type="button" className="btn pri" onClick={() => router.push(`/collect?student=${student.id}`)}>
            Collect fees
          </button>
          <button type="button" className="btn" onClick={() => router.push(`/students?open=${student.id}`)}>
            Open profile
          </button>
          <button type="button" className="btn" onClick={() => setStudent(null)}>
            Admit another student
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="ct"><h3>New student admission</h3></div>
      <div className="notebox" style={{ marginBottom: 14 }}>
        Admission number and portal password are generated automatically when left blank. The student&apos;s
        class controls which fee masters apply.
      </div>
      <DynamicForm
        fields={CRUD_PAGES.students.fields}
        busy={busy}
        submitLabel="Admit student"
        onCancel={() => router.push("/students")}
        onSubmit={submit}
      />
    </div>
  );
}

export function BulkDeletePage() {
  const lookups = useLookups();
  const toast = useToast();
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [rows, setRows] = useState<AnyRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setBusy(true);
    const params = new URLSearchParams({ pageSize: "500", status: "active" });
    if (classId) params.set("classId", classId);
    if (sectionId) params.set("sectionId", sectionId);
    apiGet<{ items: AnyRow[] }>(`/api/resources/students?${params}`)
      .then((res) => {
        if (!alive) return;
        setRows(res.items);
        setSelected(new Set());
        setError("");
      })
      .catch((err: Error) => alive && setError(err.message))
      .finally(() => alive && setBusy(false));
    return () => {
      alive = false;
    };
  }, [classId, sectionId]);

  async function remove() {
    if (!selected.size) return;
    if (!window.confirm(`Delete ${selected.size} student(s)? Fee and attendance history will also be deleted.`)) {
      return;
    }
    setBusy(true);
    try {
      const res = await apiPost<{ deleted: number; failed: { id: string; error: string }[] }>(
        "/api/actions/bulk-delete",
        { resource: "students", ids: [...selected] },
      );
      toast(`${res.deleted} student(s) deleted.${res.failed.length ? ` ${res.failed.length} failed.` : ""}`);
      const params = new URLSearchParams({ pageSize: "500", status: "active" });
      if (classId) params.set("classId", classId);
      if (sectionId) params.set("sectionId", sectionId);
      const refreshed = await apiGet<{ items: AnyRow[] }>(`/api/resources/students?${params}`);
      setRows(refreshed.items);
      setSelected(new Set());
    } catch (err) {
      toast(err instanceof Error ? err.message : "Bulk delete failed.", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="ct">
        <h3>Bulk delete students <span className="cnt">{rows.length}</span></h3>
        <div className="tools">
          <button type="button" className="btn bad" disabled={!selected.size || busy} onClick={remove}>
            Delete selected ({selected.size})
          </button>
        </div>
      </div>
      <div className="alert warn" style={{ marginBottom: 12 }}>
        Deleting a student removes their fee payments, attendance, exam marks, transport and hostel links.
        This cannot be undone.
      </div>
      <div className="flt">
        <label>
          Class
          <select
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setSectionId("");
            }}
          >
            <option value="">All classes</option>
            {lookups.list("classes").map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label>
          Section
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="">All sections</option>
            {lookups.list("sections").map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>
      {error ? <div className="alert">{error}</div> : null}
      <div className="tw">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 34 }}>
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selected.size === rows.length}
                  onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((r) => String(r.id))) : new Set())}
                />
              </th>
              <th>Adm No</th>
              <th>Name</th>
              <th>Class</th>
              <th>Father</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row.id)}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(String(row.id))}
                    onChange={(e) => {
                      setSelected((current) => {
                        const next = new Set(current);
                        if (e.target.checked) next.add(String(row.id));
                        else next.delete(String(row.id));
                        return next;
                      });
                    }}
                  />
                </td>
                <td>{String(row.admNo)}</td>
                <td>{String(row.name)}</td>
                <td>{lookups.label("classes", row.classId)}</td>
                <td>{String(row.father || "—")}</td>
                <td>{String(row.phone || "—")}</td>
              </tr>
            ))}
            {!rows.length && !busy ? <tr><td className="empty" colSpan={6}>No students in this selection.</td></tr> : null}
            {busy ? <tr><td className="empty" colSpan={6}>Loading…</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function OnlineAdmissionsPage() {
  const toast = useToast();
  const lookups = useLookups();
  const [status, setStatus] = useState("Pending");
  const [rows, setRows] = useState<AnyRow[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [admit, setAdmit] = useState<AnyRow | null>(null);
  const [admitClass, setAdmitClass] = useState("");
  const [admitSection, setAdmitSection] = useState("");

  async function load() {
    setBusy(true);
    try {
      const params = new URLSearchParams({ pageSize: "100" });
      if (status) params.set("status", status);
      const res = await apiGet<{ items: AnyRow[] }>(`/api/resources/onlineAdm?${params}`);
      setRows(res.items);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load applications.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function openAdmit(row: AnyRow) {
    setAdmit(row);
    setAdmitClass(String(row.classId ?? ""));
    setAdmitSection("");
  }

  async function doAdmit() {
    if (!admit) return;
    if (!admitClass) {
      toast("Choose a class.", "err");
      return;
    }
    try {
      const res = await apiPost<{ admNo: string; studentId: string }>("/api/actions/online-admit", {
        id: admit.id,
        classId: admitClass,
        sectionId: admitSection || undefined,
      });
      toast(`Admitted with ${res.admNo}.`);
      setAdmit(null);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not admit.", "err");
    }
  }

  async function reject(row: AnyRow) {
    if (!window.confirm(`Reject the application from ${row.name}?`)) return;
    try {
      await apiPost("/api/actions/online-reject", { id: row.id });
      toast("Application rejected.");
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not reject.", "err");
    }
  }

  const sections = lookups.list("sections");

  return (
    <div className="card">
      <div className="ct">
        <h3>Online Admission Applications</h3>
        <div className="tools">
          <select className="sin" value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 150 }}>
            <option value="">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Admitted">Admitted</option>
            <option value="Rejected">Rejected</option>
          </select>
          <button type="button" className="btn" onClick={load} disabled={busy}>Refresh</button>
        </div>
      </div>
      <div className="notebox" style={{ marginBottom: 12 }}>
        Approving an application creates a student, generates an admission number and marks the application admitted.
      </div>
      {error ? <div className="alert">{error}</div> : null}
      <div className="tw">
        <table className="tbl">
          <thead>
            <tr><th>Name</th><th>Phone</th><th>Class</th><th>Father</th><th>Applied</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row.id)}>
                <td>{String(row.name)}</td>
                <td>{String(row.phone || "—")}</td>
                <td>{lookups.label("classes", row.classId)}</td>
                <td>{String(row.father || "—")}</td>
                <td>{dmy(String(row.date))}</td>
                <td><span className={`bd ${row.status === "Admitted" ? "ok" : row.status === "Rejected" ? "bad" : "warn"}`}>{String(row.status)}</span></td>
                <td className="act">
                  {row.status === "Pending" ? (
                    <>
                      <button type="button" className="mini pri" onClick={() => openAdmit(row)}>Admit</button>{" "}
                      <button type="button" className="mini no" onClick={() => reject(row)}>Reject</button>
                    </>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && !busy ? <tr><td className="empty" colSpan={7}>No applications found.</td></tr> : null}
            {busy ? <tr><td className="empty" colSpan={7}>Loading…</td></tr> : null}
          </tbody>
        </table>
      </div>

      <Modal open={!!admit} title={`Admit ${admit?.name ?? ""}`} onClose={() => setAdmit(null)}>
        {admit ? (
          <>
            <div className="kv" style={{ marginBottom: 14 }}>
              <div><small>Phone</small>{String(admit.phone || "—")}</div>
              <div><small>Father</small>{String(admit.father || "—")}</div>
              <div><small>Date of birth</small>{admit.dob ? dmy(String(admit.dob)) : "—"}</div>
              <div><small>Applied for</small>{lookups.label("classes", admit.classId)}</div>
            </div>
            <div className="fg">
              <div className="fld">
                <label>Class *</label>
                <select value={admitClass} onChange={(e) => setAdmitClass(e.target.value)}>
                  <option value="">Select class</option>
                  {lookups.list("classes").map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="fld">
                <label>Section (optional)</label>
                <select value={admitSection} onChange={(e) => setAdmitSection(e.target.value)}>
                  <option value="">Use first linked section</option>
                  {sections.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div className="mf" style={{ padding: "16px 0 0", border: 0 }}>
              <button type="button" className="btn" onClick={() => setAdmit(null)}>Cancel</button>
              <button type="button" className="btn pri" onClick={doAdmit}>Admit student</button>
            </div>
          </>
        ) : null}
      </Modal>
    </div>
  );
}
