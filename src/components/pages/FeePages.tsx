"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { dmy, inr, today } from "@/lib/utils";
import { Modal } from "@/components/Modal";
import { useLookups } from "@/components/LookupProvider";
import { useToast } from "@/components/ToastProvider";
import { StudentPicker } from "./StudentPicker";
import { DocHeader, ErrorBox, Loading, PrintButtons, useSchool, type SchoolInfo } from "./shared";

type FeePayment = {
  id: string;
  rc: string;
  amount: number;
  discount: number;
  fine: number;
  mode: string;
  date: string;
  note: string;
};

type FeeRow = {
  key: string;
  name: string;
  group: string;
  amount: number;
  due: string;
  fine: number;
  paid: number;
  disc: number;
  bal: number;
  late: boolean;
  status: "Paid" | "Partial" | "Unpaid";
  payments: FeePayment[];
};

type FeeStudent = {
  id: string;
  name: string;
  admNo: string;
  father: string;
  phone: string;
  className: string | null;
  sectionName: string | null;
};

type FeeData = {
  student: FeeStudent;
  rows: FeeRow[];
  totals: {
    amount: number;
    paid: number;
    disc: number;
    fine: number;
    bal: number;
    due: number;
  };
};

type Receipt = {
  payment: {
    id: string;
    rc: string;
    amount: number;
    discount: number;
    fine: number;
    mode: string;
    date: string;
    note: string;
  };
  feeName: string;
  student: {
    id?: string;
    name: string;
    admNo: string;
    father: string;
    className?: string | null;
    sectionName?: string | null;
  };
  balanceAfter?: number;
};

const MODES = ["Cash", "Bank Transfer", "Cheque", "UPI", "Card"];

function statusClass(status: string) {
  if (status === "Paid") return "ok";
  if (status === "Partial") return "warn";
  return "bad";
}

export function ReceiptDocument({
  receipt,
  school,
}: {
  receipt: Receipt;
  school: SchoolInfo | null;
}) {
  const p = receipt.payment;
  return (
    <div className="doc">
      <DocHeader school={school} />
      <h3 style={{ textAlign: "center", margin: "4px 0 2px" }}>FEE RECEIPT</h3>
      <div className="c">Receipt no. {p.rc}</div>
      <div className="receipt-meta">
        <div>
          <b>Student</b>
          {receipt.student.name}
        </div>
        <div>
          <b>Admission no.</b>
          {receipt.student.admNo}
        </div>
        <div>
          <b>Class</b>
          {[receipt.student.className, receipt.student.sectionName].filter(Boolean).join(" · ") || "—"}
        </div>
        <div>
          <b>Date</b>
          {dmy(p.date)}
        </div>
        <div>
          <b>Mode</b>
          {p.mode}
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Particulars</th>
            <th style={{ textAlign: "right" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{receipt.feeName}</td>
            <td style={{ textAlign: "right" }}>{inr(p.amount)}</td>
          </tr>
          {p.discount > 0 ? (
            <tr>
              <td>Discount</td>
              <td style={{ textAlign: "right" }}>{inr(p.discount)}</td>
            </tr>
          ) : null}
          {p.fine > 0 ? (
            <tr>
              <td>Fine</td>
              <td style={{ textAlign: "right" }}>{inr(p.fine)}</td>
            </tr>
          ) : null}
          <tr>
            <th>Total received</th>
            <th style={{ textAlign: "right" }}>{inr(p.amount + p.discount)}</th>
          </tr>
        </tbody>
      </table>
      {typeof receipt.balanceAfter === "number" ? (
        <p>
          <b>Balance after this receipt:</b> {inr(receipt.balanceAfter)}
        </p>
      ) : null}
      {p.note ? (
        <p>
          <b>Note:</b> {p.note}
        </p>
      ) : null}
      <hr />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 34, fontSize: 13 }}>
        <span>Received by</span>
        <span>Authorised signatory</span>
      </div>
      <div className="c" style={{ marginTop: 10 }}>{school?.footerText || "This is a computer generated receipt."}</div>
    </div>
  );
}

function ReceiptModal({
  receipt,
  school,
  onClose,
  footer,
}: {
  receipt: Receipt | null;
  school: SchoolInfo | null;
  onClose: () => void;
  footer?: React.ReactNode;
}) {
  return (
    <Modal
      open={!!receipt}
      title={receipt ? `Receipt ${receipt.payment.rc}` : "Fee receipt"}
      onClose={onClose}
      size="wide"
      footer={
        <>
          <button type="button" className="btn no-print" onClick={onClose}>
            Close
          </button>
          {footer}
          <button type="button" className="btn pri no-print" onClick={() => window.print()}>
            Print receipt
          </button>
        </>
      }
    >
      {receipt ? <ReceiptDocument receipt={receipt} school={school} /> : null}
    </Modal>
  );
}

export function CollectFeesPage() {
  const [studentId, setStudentId] = useState("");
  const [data, setData] = useState<FeeData | null>(null);
  const [selectedKey, setSelectedKey] = useState("");
  const [amount, setAmount] = useState("");
  const [discountId, setDiscountId] = useState("");
  const [fine, setFine] = useState("0");
  const [mode, setMode] = useState("Cash");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const toast = useToast();
  const lookups = useLookups();
  const { school } = useSchool();

  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("student") ?? "";
    if (wanted) setStudentId(wanted);
  }, []);

  const load = useCallback(async (id: string) => {
    if (!id) {
      setData(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiGet<FeeData>(`/api/fees/student/${id}`);
      setData(res);
      setSelectedKey((current) => {
        if (current && res.rows.some((row) => row.key === current && row.bal > 0)) return current;
        return res.rows.find((row) => row.bal > 0)?.key ?? res.rows[0]?.key ?? "";
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load fees.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(studentId);
  }, [studentId, load]);

  const selectedRow = useMemo(
    () => data?.rows.find((row) => row.key === selectedKey),
    [data, selectedKey],
  );

  useEffect(() => {
    if (!selectedRow) {
      setAmount("");
      setFine("0");
      return;
    }
    setAmount(selectedRow.bal > 0 ? String(selectedRow.bal) : "");
    setFine(String(selectedRow.fine || 0));
    setDiscountId("");
  }, [selectedRow?.key]);

  async function collect() {
    if (!studentId || !selectedRow) {
      toast("Choose a student and a fee row.", "err");
      return;
    }
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast("Enter a valid amount.", "err");
      return;
    }
    setBusy(true);
    try {
      const res = await apiPost<{
        payment: Receipt["payment"];
        student: Receipt["student"];
        fee: { name: string };
        balanceAfter: number;
      }>("/api/fees/collect", {
        studentId,
        feeKey: selectedRow.key,
        amount: value,
        discountId: discountId || undefined,
        fine: Number(fine) || 0,
        mode,
        date,
        note,
      });
      setReceipt({
        payment: res.payment,
        student: {
          ...res.student,
          className: data?.student.className,
          sectionName: data?.student.sectionName,
        },
        feeName: res.fee.name,
        balanceAfter: res.balanceAfter,
      });
      toast("Payment collected.");
      setNote("");
      await load(studentId);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not collect fees.", "err");
    } finally {
      setBusy(false);
    }
  }

  async function collectAll() {
    if (!studentId) return;
    if (!window.confirm("Collect the full outstanding balance for this student?")) return;
    setBusy(true);
    try {
      const res = await apiPost<{ collected: number; receipts: string[]; count: number }>(
        "/api/fees/collect-all",
        { studentId, mode, date },
      );
      toast(`${inr(res.collected)} collected across ${res.count} receipt(s).`);
      await load(studentId);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not collect dues.", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="card">
        <div className="ct">
          <h3>Collect Fees</h3>
          {data ? (
            <div className="tools">
              <button type="button" className="btn" disabled={busy} onClick={collectAll}>
                Collect all dues
              </button>
            </div>
          ) : null}
        </div>
        <div className="flt">
          <label style={{ flex: 1, minWidth: 280 }}>
            Student
            <StudentPicker value={studentId} onChange={setStudentId} />
          </label>
        </div>
        <ErrorBox message={error} />
        {!studentId ? (
          <div className="notebox">
            Search for a student by name, admission number or guardian phone to open their fee ledger.
          </div>
        ) : loading ? (
          <Loading label="Loading fee ledger…" />
        ) : data ? (
          <>
            <div className="profhead" style={{ marginBottom: 12 }}>
              <div className="pic">{data.student.name.slice(0, 1).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <b style={{ fontSize: 17 }}>{data.student.name}</b>
                <div className="hint">
                  {data.student.admNo} · {[data.student.className, data.student.sectionName].filter(Boolean).join(" · ")}
                  {data.student.father ? ` · Father: ${data.student.father}` : ""}
                </div>
              </div>
              <div className="sum" style={{ margin: 0 }}>
                <div><small>Total</small><b>{inr(data.totals.amount)}</b></div>
                <div><small>Paid</small><b>{inr(data.totals.paid + data.totals.disc)}</b></div>
                <div><small>Balance</small><b style={{ color: "var(--bad)" }}>{inr(data.totals.bal)}</b></div>
              </div>
            </div>

            <div className="grid g2">
              <div>
                <div className="tw">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th style={{ width: 34 }} />
                        <th>Fee</th>
                        <th>Due</th>
                        <th>Amount</th>
                        <th>Paid</th>
                        <th>Balance</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((row) => (
                        <tr
                          key={row.key}
                          style={{ cursor: row.bal > 0 ? "pointer" : "default" }}
                          onClick={() => {
                            if (row.bal > 0) setSelectedKey(row.key);
                          }}
                        >
                          <td>
                            <input
                              type="radio"
                              name="fee-row"
                              checked={selectedKey === row.key}
                              disabled={row.bal <= 0}
                              onChange={() => setSelectedKey(row.key)}
                            />
                          </td>
                          <td>
                            <b>{row.name}</b>
                            <div className="hint">{row.group}</div>
                          </td>
                          <td>{row.due ? dmy(row.due) : "—"}</td>
                          <td className="money">{inr(row.amount)}</td>
                          <td className="money">{inr(row.paid + row.disc)}</td>
                          <td className="money" style={{ color: row.bal > 0 ? "var(--bad)" : undefined }}>
                            {inr(row.bal)}
                          </td>
                          <td>
                            <span className={`bd ${statusClass(row.status)}`}>{row.status}</span>
                          </td>
                        </tr>
                      ))}
                      {!data.rows.length ? (
                        <tr>
                          <td className="empty" colSpan={7}>No fee rows are configured for this class.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
                {data.totals.due > 0 ? (
                  <div className="alert warn" style={{ marginTop: 10 }}>
                    {inr(data.totals.due)} is already due today.
                  </div>
                ) : null}
              </div>

              <div className="card" style={{ marginTop: 0 }}>
                <div className="ct"><h3>New payment</h3></div>
                {selectedRow ? (
                  <>
                    <div className="notebox" style={{ marginBottom: 12 }}>
                      {selectedRow.name} · balance {inr(selectedRow.bal)}
                      {selectedRow.due ? ` · due ${dmy(selectedRow.due)}` : ""}
                    </div>
                    <div className="fg">
                      <div className="fld">
                        <label>Amount</label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                      </div>
                      <div className="fld">
                        <label>Fine</label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={fine}
                          onChange={(e) => setFine(e.target.value)}
                        />
                      </div>
                      <div className="fld">
                        <label>Discount</label>
                        <select value={discountId} onChange={(e) => setDiscountId(e.target.value)}>
                          <option value="">No discount</option>
                          {lookups.list("feeDiscounts").map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="fld">
                        <label>Mode</label>
                        <select value={mode} onChange={(e) => setMode(e.target.value)}>
                          {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div className="fld">
                        <label>Date</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                      </div>
                      <div className="fld span2">
                        <label>Note</label>
                        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
                      </div>
                    </div>
                    <div className="flexrow" style={{ marginTop: 14 }}>
                      <button
                        type="button"
                        className="btn pri"
                        disabled={busy || selectedRow.bal <= 0}
                        onClick={collect}
                      >
                        {busy ? "Saving…" : "Collect payment"}
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => {
                          setAmount(String(selectedRow.bal));
                          setDiscountId("");
                          setFine(String(selectedRow.fine || 0));
                        }}
                      >
                        Full balance
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="notebox">Select an unpaid fee row to record a payment.</div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>

      <ReceiptModal receipt={receipt} school={school} onClose={() => setReceipt(null)} />
    </>
  );
}

type PaymentRow = {
  id: string;
  rc: string;
  amount: number;
  discount: number;
  fine: number;
  mode: string;
  date: string;
  note?: string;
  studentId: string;
  studentName?: string;
  studentAdm?: string;
  studentClass?: string;
};

export function FeeSearchPage() {
  const [q, setQ] = useState("");
  const [mode, setMode] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [studentId, setStudentId] = useState("");
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [revertId, setRevertId] = useState("");
  const toast = useToast();
  const { school } = useSchool();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: "200" });
      if (q.trim()) params.set("q", q.trim());
      if (mode) params.set("mode", mode);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (studentId) params.set("studentId", studentId);
      const res = await apiGet<{ items: PaymentRow[]; total: number }>(
        `/api/resources/payments?${params}`,
      );
      setRows(res.items);
      setTotal(res.total);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load receipts.");
    } finally {
      setLoading(false);
    }
  }, [q, mode, from, to, studentId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function openReceipt(row: PaymentRow) {
    try {
      const res = await apiGet<Receipt>(`/api/fees/payments/${row.id}`);
      setReceipt(res);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not load the receipt.", "err");
    }
  }

  async function revert() {
    if (!revertId) return;
    if (!window.confirm("Revert this receipt? The payment will be deleted from the fee ledger.")) return;
    try {
      await apiDelete(`/api/fees/payments/${revertId}`);
      toast("Receipt reverted.");
      setReceipt(null);
      setRevertId("");
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not revert the receipt.", "err");
    }
  }

  const shown = rows.reduce((sum, row) => sum + row.amount, 0);

  return (
    <>
      <div className="card">
        <div className="ct">
          <h3>Search Fees Payment <span className="cnt">{total}</span></h3>
          <div className="tools">
            <span className="pill">Shown: {inr(shown)}</span>
          </div>
        </div>
        <div className="flt">
          <label>
            Search
            <input
              className="sin"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Receipt, note or mode"
            />
          </label>
          <label style={{ minWidth: 220 }}>
            Student
            <StudentPicker value={studentId} onChange={setStudentId} placeholder="All students" />
          </label>
          <label>
            Mode
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="">All modes</option>
              {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label>
            From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            To
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setQ("");
              setMode("");
              setFrom("");
              setTo("");
              setStudentId("");
            }}
          >
            Clear
          </button>
        </div>
        <ErrorBox message={error} />
        {loading && !rows.length ? (
          <Loading label="Loading receipts…" />
        ) : (
          <div className="tw">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Receipt</th>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Mode</th>
                  <th>Amount</th>
                  <th>Discount</th>
                  <th>Fine</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} style={{ cursor: "pointer" }} onClick={() => openReceipt(row)}>
                    <td><b>{row.rc}</b></td>
                    <td>{dmy(row.date)}</td>
                    <td>
                      {row.studentName || "—"}
                      {row.studentAdm ? <div className="hint">{row.studentAdm}</div> : null}
                    </td>
                    <td>{row.studentClass || "—"}</td>
                    <td>{row.mode}</td>
                    <td className="money">{inr(row.amount)}</td>
                    <td className="money">{inr(row.discount)}</td>
                    <td className="money">{inr(row.fine)}</td>
                    <td className="act">
                      <button type="button" className="mini" onClick={() => openReceipt(row)}>
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))}
                {!rows.length && !loading ? (
                  <tr><td className="empty" colSpan={9}>No receipts matched these filters.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ReceiptModal
        receipt={receipt}
        school={school}
        onClose={() => {
          setReceipt(null);
          setRevertId("");
        }}
        footer={
          receipt ? (
            <button
              type="button"
              className="btn bad no-print"
              onClick={() => {
                setRevertId(receipt.payment.id);
                void revert();
              }}
            >
              Revert receipt
            </button>
          ) : null
        }
      />
    </>
  );
}

type DueRow = {
  studentId: string;
  student: string;
  admNo: string;
  className: string;
  sectionName: string;
  fee: string;
  due: string;
  amount: number;
  paid: number;
  balance: number;
  status: string;
};

export function DueFeesPage() {
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [type, setType] = useState("");
  const [rows, setRows] = useState<DueRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const lookups = useLookups();
  const router = useRouter();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (classId) params.set("classId", classId);
      if (sectionId) params.set("sectionId", sectionId);
      if (type.trim()) params.set("type", type.trim());
      const res = await apiGet<{ rows: DueRow[]; total: number }>(`/api/fees/due?${params}`);
      setRows(res.rows);
      setTotal(res.total);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load due fees.");
    } finally {
      setLoading(false);
    }
  }, [classId, sectionId, type]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <div className="card">
      <div className="ct">
        <h3>Search Due Fees <span className="cnt">{rows.length}</span></h3>
        <div className="tools"><span className="pill">Outstanding: {inr(total)}</span></div>
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
            {lookups.list("classes").map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label>
          Section
          <select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="">All sections</option>
            {lookups.list("sections").map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label>
          Fee name starts with
          <input value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. Tuition" />
        </label>
        <button type="button" className="btn" onClick={() => void load()} disabled={loading}>
          Refresh
        </button>
      </div>
      <ErrorBox message={error} />
      {loading && !rows.length ? (
        <Loading label="Loading due fees…" />
      ) : (
        <div className="tw">
          <table className="tbl">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Fee</th>
                <th>Due</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.studentId}-${row.fee}-${index}`}>
                  <td>
                    <b>{row.student}</b>
                    <div className="hint">{row.admNo}</div>
                  </td>
                  <td>{[row.className, row.sectionName].filter(Boolean).join(" · ") || "—"}</td>
                  <td>{row.fee}</td>
                  <td>{row.due ? dmy(row.due) : "—"}</td>
                  <td className="money">{inr(row.amount)}</td>
                  <td className="money">{inr(row.paid)}</td>
                  <td className="money" style={{ color: "var(--bad)" }}>{inr(row.balance)}</td>
                  <td><span className={`bd ${row.status === "Overdue" ? "bad" : row.status === "Upcoming" ? "warn" : ""}`}>{row.status}</span></td>
                  <td className="act">
                    <button
                      type="button"
                      className="mini pri"
                      onClick={() => router.push(`/collect?student=${row.studentId}`)}
                    >
                      Collect
                    </button>
                  </td>
                </tr>
              ))}
              {!rows.length && !loading ? (
                <tr><td className="empty" colSpan={9}>No outstanding fees for this selection.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type BankRow = {
  id: string;
  studentId: string;
  studentName?: string;
  studentAdm?: string;
  amount: number;
  bank?: string;
  ref: string;
  date: string;
  status: string;
};

export function BankPaymentsPage() {
  const [rows, setRows] = useState<BankRow[]>([]);
  const [status, setStatus] = useState("Pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");
  const [ref, setRef] = useState("");
  const [date, setDate] = useState(today());
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: "200" });
      if (status) params.set("status", status);
      const res = await apiGet<{ items: BankRow[] }>(`/api/resources/bankPay?${params}`);
      setRows(res.items);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load bank payments.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function add() {
    if (!studentId || !amount || !ref.trim()) {
      toast("Choose a student, amount and reference.", "err");
      return;
    }
    setBusy(true);
    try {
      await apiPost("/api/resources/bankPay", {
        studentId,
        amount: Number(amount),
        bank,
        ref: ref.trim(),
        date,
      });
      toast("Bank payment recorded.");
      setOpen(false);
      setStudentId("");
      setAmount("");
      setBank("");
      setRef("");
      setDate(today());
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not record the payment.", "err");
    } finally {
      setBusy(false);
    }
  }

  async function act(row: BankRow, action: "approve" | "reject") {
    if (!window.confirm(`${action === "approve" ? "Approve" : "Reject"} ${row.ref}?`)) return;
    try {
      const res = await apiPost<{ status: string; posted: number }>(`/api/fees/bank/${row.id}`, { action });
      toast(
        action === "approve"
          ? `Approved. ${inr(res.posted)} posted to the fee ledger.`
          : "Payment rejected.",
      );
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not update the payment.", "err");
    }
  }

  return (
    <>
      <div className="card">
        <div className="ct">
          <h3>Offline Bank Payments <span className="cnt">{rows.length}</span></h3>
          <div className="tools">
            <select className="sin" value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 150 }}>
              <option value="">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <button type="button" className="btn pri" onClick={() => setOpen(true)}>+ Record payment</button>
          </div>
        </div>
        <div className="notebox" style={{ marginBottom: 12 }}>
          Approving a bank payment posts it against the student&apos;s oldest outstanding fee row. Rejected entries stay in the log.
        </div>
        <ErrorBox message={error} />
        {loading && !rows.length ? (
          <Loading label="Loading bank payments…" />
        ) : (
          <div className="tw">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Bank</th>
                  <th>Reference</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <b>{row.studentName || "—"}</b>
                      <div className="hint">{row.studentAdm || ""}</div>
                    </td>
                    <td>{row.bank || "—"}</td>
                    <td>{row.ref}</td>
                    <td>{dmy(row.date)}</td>
                    <td className="money">{inr(row.amount)}</td>
                    <td>
                      <span className={`bd ${row.status === "Approved" ? "ok" : row.status === "Rejected" ? "bad" : "warn"}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="act">
                      {row.status === "Pending" ? (
                        <div className="flexrow" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
                          <button type="button" className="mini ok" onClick={() => void act(row, "approve")}>Approve</button>
                          <button type="button" className="mini no" onClick={() => void act(row, "reject")}>Reject</button>
                        </div>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!rows.length && !loading ? (
                  <tr><td className="empty" colSpan={7}>No bank payments recorded for this status.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={open}
        title="Record offline bank payment"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" className="btn" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
            <button type="button" className="btn pri" onClick={add} disabled={busy}>
              {busy ? "Saving…" : "Save payment"}
            </button>
          </>
        }
      >
        <div className="fg">
          <div className="fld span2">
            <label>Student</label>
            <StudentPicker value={studentId} onChange={setStudentId} />
          </div>
          <div className="fld">
            <label>Amount</label>
            <input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="fld">
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="fld">
            <label>Bank</label>
            <input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Bank name" />
          </div>
          <div className="fld">
            <label>Reference / UTR</label>
            <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Transaction reference" />
          </div>
        </div>
      </Modal>
    </>
  );
}
