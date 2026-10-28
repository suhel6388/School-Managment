"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { dmy, inr, thisMonth, today } from "@/lib/utils";
import { useLookups } from "@/components/LookupProvider";
import { useToast } from "@/components/ToastProvider";
import { Modal } from "@/components/Modal";
import { DocHeader, ErrorBox, Loading, PrintButtons, useSchool } from "./shared";

type StaffRow = {
  id: string;
  name: string;
  empId: string;
  basic: number;
  desigId?: string | null;
};

type PayrollRow = {
  id: string;
  staffId: string;
  month: string;
  basic: number;
  allow: number;
  deduct: number;
  net: number;
  status: string;
  paidDate?: string | null;
  mode?: string | null;
  staffName?: string;
  staffEmpId?: string;
};

const MODES = ["Bank Transfer", "Cash", "Cheque"];

export function PayrollPage() {
  const toast = useToast();
  const { school } = useSchool();
  const lookups = useLookups();
  const [month, setMonth] = useState(thisMonth());
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [payroll, setPayroll] = useState<PayrollRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [genFor, setGenFor] = useState<StaffRow | null>(null);
  const [allow, setAllow] = useState("0");
  const [deduct, setDeduct] = useState("0");

  const [payFor, setPayFor] = useState<PayrollRow | null>(null);
  const [mode, setMode] = useState("Bank Transfer");
  const [paidDate, setPaidDate] = useState(today());

  const [slip, setSlip] = useState<{ row: PayrollRow; staff: StaffRow | undefined } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [staffRes, payrollRes] = await Promise.all([
        apiGet<{ items: StaffRow[] }>("/api/resources/staff?status=active&pageSize=500&sort=name&dir=asc"),
        apiGet<{ items: PayrollRow[] }>(
          `/api/resources/payroll?month=${encodeURIComponent(month)}&pageSize=500&sort=name&dir=asc`,
        ),
      ]);
      setStaff(staffRes.items);
      setPayroll(payrollRes.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load payroll.");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

  const merged = useMemo(
    () =>
      staff.map((member) => ({
        staff: member,
        row: payroll.find((p) => p.staffId === member.id) ?? null,
      })),
    [payroll, staff],
  );

  const payable = merged.reduce((sum, item) => sum + Number(item.row?.net ?? item.staff.basic), 0);
  const paid = merged
    .filter((item) => item.row?.status === "Paid")
    .reduce((sum, item) => sum + Number(item.row?.net ?? 0), 0);

  async function generateAll() {
    if (!window.confirm(`Generate payroll for all active staff for ${month}?`)) return;
    setBusy(true);
    try {
      const res = await apiPost<{ created: number }>("/api/actions/payroll-generate", { month });
      toast(`Generated ${res.created} payroll row(s).`);
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not generate payroll.", "err");
    } finally {
      setBusy(false);
    }
  }

  async function generateOne() {
    if (!genFor) return;
    const basic = Number(genFor.basic);
    const allowances = Number(allow) || 0;
    const deductions = Number(deduct) || 0;
    setBusy(true);
    try {
      await apiPost("/api/resources/payroll", {
        staffId: genFor.id,
        month,
        basic,
        allow: allowances,
        deduct: deductions,
        net: basic + allowances - deductions,
        status: "Generated",
      });
      toast(`Payroll generated for ${genFor.name}.`);
      setGenFor(null);
      setAllow("0");
      setDeduct("0");
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not generate payroll.", "err");
    } finally {
      setBusy(false);
    }
  }

  async function markPaid() {
    if (!payFor) return;
    setBusy(true);
    try {
      await apiPost("/api/actions/payroll-pay", { id: payFor.id, mode, date: paidDate });
      toast("Salary marked paid.");
      setPayFor(null);
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not mark the salary paid.", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="ct">
        <h3>Payroll</h3>
        <div className="tools">
          <button type="button" className="btn pri" onClick={generateAll} disabled={busy || !staff.length}>
            {busy ? "Working…" : "Generate for all"}
          </button>
        </div>
      </div>
      <div className="flt">
        <label>
          Month
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        </label>
        <button type="button" className="btn" onClick={() => void load()} disabled={loading}>
          Refresh
        </button>
      </div>
      <ErrorBox message={error} />
      {loading && !staff.length ? (
        <Loading label="Loading payroll…" />
      ) : (
        <>
          <div className="sum">
            <div><small>Payable</small><b>{inr(payable)}</b></div>
            <div><small>Paid</small><b>{inr(paid)}</b></div>
            <div><small>Employees</small><b>{staff.length}</b></div>
          </div>
          <div className="tw">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Emp ID</th>
                  <th>Name</th>
                  <th>Basic</th>
                  <th>Allowance</th>
                  <th>Deduction</th>
                  <th>Net pay</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {merged.map(({ staff: member, row }) => (
                  <tr key={member.id}>
                    <td>{member.empId}</td>
                    <td>
                      <b>{member.name}</b>
                      <div className="hint">{lookups.label("designations", member.desigId)}</div>
                    </td>
                    <td className="num">{inr(row?.basic ?? member.basic)}</td>
                    <td className="num">{row ? inr(row.allow) : "—"}</td>
                    <td className="num">{row ? inr(row.deduct) : "—"}</td>
                    <td className="num"><b>{row ? inr(row.net) : "—"}</b></td>
                    <td>
                      <span
                        className={`bd ${
                          row?.status === "Paid" ? "ok" : row ? "warn" : ""
                        }`}
                      >
                        {row?.status ?? "Not generated"}
                      </span>
                    </td>
                    <td className="act">
                      {!row ? (
                        <button
                          type="button"
                          className="mini pri"
                          onClick={() => {
                            setGenFor(member);
                            setAllow("0");
                            setDeduct("0");
                          }}
                        >
                          Generate
                        </button>
                      ) : null}
                      {row && row.status !== "Paid" ? (
                        <button
                          type="button"
                          className="mini ok"
                          onClick={() => {
                            setPayFor(row);
                            setMode("Bank Transfer");
                            setPaidDate(today());
                          }}
                        >
                          Mark paid
                        </button>
                      ) : null}
                      {row ? (
                        <button
                          type="button"
                          className="mini"
                          onClick={() => setSlip({ row, staff: member })}
                        >
                          Payslip
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {!merged.length ? (
                  <tr>
                    <td className="empty" colSpan={8}>No active staff found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal
        open={Boolean(genFor)}
        title={`Generate payroll${genFor ? ` - ${genFor.name}` : ""}`}
        onClose={() => setGenFor(null)}
        footer={
          <>
            <button type="button" className="btn" onClick={() => setGenFor(null)}>Cancel</button>
            <button type="button" className="btn pri" onClick={generateOne} disabled={busy}>
              {busy ? "Saving…" : "Generate"}
            </button>
          </>
        }
      >
        <div className="fg">
          <div className="fld">
            <label htmlFor="pay_allow">Allowances</label>
            <input
              id="pay_allow"
              type="number"
              min={0}
              step="0.01"
              value={allow}
              onChange={(event) => setAllow(event.target.value)}
            />
          </div>
          <div className="fld">
            <label htmlFor="pay_deduct">Deductions</label>
            <input
              id="pay_deduct"
              type="number"
              min={0}
              step="0.01"
              value={deduct}
              onChange={(event) => setDeduct(event.target.value)}
            />
          </div>
          <div className="fld span2">
            <div className="notebox">
              Basic {inr(genFor?.basic ?? 0)} · Net{" "}
              {inr(Number(genFor?.basic ?? 0) + (Number(allow) || 0) - (Number(deduct) || 0))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(payFor)}
        title="Mark salary paid"
        onClose={() => setPayFor(null)}
        footer={
          <>
            <button type="button" className="btn" onClick={() => setPayFor(null)}>Cancel</button>
            <button type="button" className="btn pri" onClick={markPaid} disabled={busy}>
              {busy ? "Saving…" : "Mark paid"}
            </button>
          </>
        }
      >
        <div className="fg">
          <div className="fld">
            <label htmlFor="pay_mode">Mode</label>
            <select id="pay_mode" value={mode} onChange={(event) => setMode(event.target.value)}>
              {MODES.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          <div className="fld">
            <label htmlFor="pay_date">Payment date</label>
            <input
              id="pay_date"
              type="date"
              value={paidDate}
              onChange={(event) => setPaidDate(event.target.value)}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(slip)}
        title="Payslip"
        size="wide"
        onClose={() => setSlip(null)}
        footer={
          <PrintButtons>
            <button type="button" className="btn" onClick={() => setSlip(null)}>Close</button>
          </PrintButtons>
        }
      >
        {slip ? (
          <div className="doc">
            <DocHeader school={school} />
            <h2 style={{ fontSize: 16 }}>PAYSLIP - {slip.row.month}</h2>
            <table>
              <tbody>
                <tr>
                  <td>Employee</td>
                  <td>{slip.staff?.name ?? slip.row.staffName}</td>
                  <td>Employee ID</td>
                  <td>{slip.staff?.empId ?? slip.row.staffEmpId}</td>
                </tr>
                <tr>
                  <td>Designation</td>
                  <td>{lookups.label("designations", slip.staff?.desigId)}</td>
                  <td>Status</td>
                  <td>{slip.row.status}</td>
                </tr>
              </tbody>
            </table>
            <table>
              <thead>
                <tr>
                  <th>Earnings</th>
                  <th>Amount</th>
                  <th>Deductions</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Basic</td>
                  <td>{inr(slip.row.basic)}</td>
                  <td>Deductions</td>
                  <td>{inr(slip.row.deduct)}</td>
                </tr>
                <tr>
                  <td>Allowances</td>
                  <td>{inr(slip.row.allow)}</td>
                  <td />
                  <td />
                </tr>
                <tr>
                  <th>Net pay</th>
                  <th>{inr(slip.row.net)}</th>
                  <th>Paid on</th>
                  <th>{slip.row.paidDate ? dmy(slip.row.paidDate) : "—"}</th>
                </tr>
              </tbody>
            </table>
            <div className="c" style={{ fontSize: 12 }}>{school?.footerText}</div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

type SyllabusTopic = {
  id: string;
  lessonId: string;
  lesson: string;
  name: string;
  planDate: string;
  status: string;
};

type SyllabusData = {
  lessons: { id: string; name: string; topics: number }[];
  topics: SyllabusTopic[];
  summary: { lessons: number; topics: number; completed: number; percent: number };
};

export function SyllabusPage() {
  const lookups = useLookups();
  const toast = useToast();
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [data, setData] = useState<SyllabusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!classId || !subjectId) {
      setData(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setData(
        await apiGet<SyllabusData>(
          `/api/lessons/syllabus?classId=${encodeURIComponent(classId)}&subjectId=${encodeURIComponent(subjectId)}`,
        ),
      );
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Could not load the syllabus.");
    } finally {
      setLoading(false);
    }
  }, [classId, subjectId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(topic: SyllabusTopic, status: string) {
    try {
      await apiPatch(`/api/resources/topics/${topic.id}`, { status });
      setData((current) =>
        current
          ? {
              ...current,
              topics: current.topics.map((t) => (t.id === topic.id ? { ...t, status } : t)),
              summary: {
                ...current.summary,
                completed: current.topics.filter((t) =>
                  t.id === topic.id ? status === "Completed" : t.status === "Completed",
                ).length,
              },
            }
          : current,
      );
      toast("Topic status updated.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not update the topic.", "err");
    }
  }

  return (
    <div className="card">
      <div className="ct"><h3>Syllabus Status</h3></div>
      <div className="flt">
        <label>
          Class
          <select
            value={classId}
            onChange={(event) => {
              setClassId(event.target.value);
              setSubjectId("");
            }}
          >
            <option value="">Select</option>
            {lookups.list("classes").map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          Subject
          <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
            <option value="">Select</option>
            {lookups.list("subjects").map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <button type="button" className="btn" onClick={() => void load()} disabled={loading}>
          Refresh
        </button>
      </div>
      <ErrorBox message={error} />
      {!classId || !subjectId ? (
        <div className="notebox">Select a class and subject to see lesson and topic progress.</div>
      ) : loading && !data ? (
        <Loading label="Loading syllabus…" />
      ) : data ? (
        <>
          <div className="sum">
            <div><small>Lessons</small><b>{data.summary.lessons}</b></div>
            <div><small>Topics</small><b>{data.summary.topics}</b></div>
            <div><small>Completed</small><b>{data.summary.percent}%</b></div>
          </div>
          <div className="tw">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Lesson</th>
                  <th>Topic</th>
                  <th>Planned</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.topics.map((topic) => (
                  <tr key={topic.id}>
                    <td>{topic.lesson}</td>
                    <td><b>{topic.name}</b></td>
                    <td>{topic.planDate ? dmy(topic.planDate) : "—"}</td>
                    <td>
                      <select
                        value={topic.status}
                        aria-label={`Status for ${topic.name}`}
                        onChange={(event) => void setStatus(topic, event.target.value)}
                      >
                        {["Pending", "In Progress", "Completed"].map((value) => (
                          <option key={value} value={value}>{value}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {!data.topics.length ? (
                  <tr>
                    <td className="empty" colSpan={4}>
                      No lessons and topics for this class and subject yet.
                    </td>
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

export function LessonCopyPage() {
  const lookups = useLookups();
  const toast = useToast();
  const [fromClassId, setFromClassId] = useState("");
  const [toClassId, setToClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [busy, setBusy] = useState(false);

  async function copy() {
    if (!fromClassId || !toClassId || !subjectId) {
      toast("Select source class, target class and subject.", "warn");
      return;
    }
    if (fromClassId === toClassId) {
      toast("Source and target classes must differ.", "warn");
      return;
    }
    setBusy(true);
    try {
      const res = await apiPost<{ copied: number }>("/api/actions/lesson-copy", {
        fromClassId,
        toClassId,
        subjectId,
      });
      toast(`Copied ${res.copied} lesson(s).`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not copy lessons.", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="ct"><h3>Copy Old Lessons</h3></div>
      <p className="hint">
        Copy lessons and their topics from one class to another for the same subject. Topic status
        resets to Pending and lessons that already exist in the target class are skipped.
      </p>
      <div className="flt">
        <label>
          From class
          <select value={fromClassId} onChange={(event) => setFromClassId(event.target.value)}>
            <option value="">Select</option>
            {lookups.list("classes").map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          Subject
          <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
            <option value="">Select</option>
            {lookups.list("subjects").map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          To class
          <select value={toClassId} onChange={(event) => setToClassId(event.target.value)}>
            <option value="">Select</option>
            {lookups.list("classes").map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <button type="button" className="btn pri" onClick={copy} disabled={busy}>
          {busy ? "Copying…" : "Copy lessons"}
        </button>
      </div>
    </div>
  );
}

export function NotFoundPage({ id }: { id: string }) {
  return (
    <div className="card">
      <div className="ct"><h3>Page not found</h3></div>
      <div className="notebox">
        The menu item <b>{id || "unknown"}</b> does not map to a page in this build. Choose a module
        from the sidebar or use Quick Links.
      </div>
    </div>
  );
}
