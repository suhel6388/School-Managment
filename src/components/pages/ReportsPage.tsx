"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/api";
import { csvDownload, today } from "@/lib/utils";
import { useLookups } from "@/components/LookupProvider";
import { useToast } from "@/components/ToastProvider";
import { DocHeader, ErrorBox, Loading, useSchool } from "./shared";

type ReportResult = {
  title: string;
  sum?: [string, string | number][];
  cols: string[];
  rows: (string | number)[][];
};

type FilterKind = "class" | "section" | "exam" | "month" | "from" | "to" | "q";

const REPORT_CONFIG: Record<string, { type: string; filters: FilterKind[] }> = {
  rep_student: { type: "student", filters: ["class", "section", "q"] },
  rep_finance: { type: "finance", filters: ["from", "to"] },
  rep_attendance: { type: "attendance", filters: ["class", "section", "month"] },
  rep_exam: { type: "exam", filters: ["exam"] },
  rep_online: { type: "online", filters: [] },
  rep_lesson: { type: "lesson", filters: [] },
  rep_hr: { type: "hr", filters: ["month"] },
  rep_homework: { type: "homework", filters: [] },
  rep_library: { type: "library", filters: [] },
  rep_inventory: { type: "inventory", filters: [] },
  rep_transport: { type: "transport", filters: [] },
  rep_hostel: { type: "hostel", filters: [] },
  rep_alumni: { type: "alumni", filters: [] },
  rep_userlog: { type: "userlog", filters: [] },
  rep_audit: { type: "audit", filters: [] },
};

function firstOfMonth(): string {
  return `${today().slice(0, 7)}-01`;
}

export function ReportsPage({ id }: { id: string }) {
  const lookups = useLookups();
  const toast = useToast();
  const { school } = useSchool();
  const config = REPORT_CONFIG[id] ?? { type: "student", filters: ["class", "section", "q"] };

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [month, setMonth] = useState(today().slice(0, 7));
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());
  const [q, setQ] = useState("");
  const [result, setResult] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filters = useMemo(() => new Set(config.filters), [config.filters]);
  const classes = lookups.list("classes");
  const sections = useMemo(() => {
    const found = classes.find((c) => String(c.value) === classId);
    const ids = found?.sectionIds;
    return Array.isArray(ids)
      ? lookups.list("sections").filter((s) => (ids as string[]).includes(String(s.value)))
      : lookups.list("sections");
  }, [classId, classes, lookups]);

  const run = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters.has("class") && classId) params.set("classId", classId);
      if (filters.has("section") && sectionId) params.set("sectionId", sectionId);
      if (filters.has("exam") && groupId) params.set("groupId", groupId);
      if (filters.has("exam") && classId) params.set("classId", classId);
      if (filters.has("month")) params.set("month", month);
      if (filters.has("from")) params.set("from", from);
      if (filters.has("to")) params.set("to", to);
      if (filters.has("q") && q.trim()) params.set("q", q.trim());
      setResult(await apiGet<ReportResult>(`/api/reports/${config.type}?${params}`));
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Could not build the report.");
    } finally {
      setLoading(false);
    }
  }, [classId, config.type, filters, from, groupId, month, q, sectionId, to]);

  useEffect(() => {
    void run();
    // Only reload when the report type changes; the user runs other filters explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.type]);

  function exportCsv() {
    if (!result) return;
    csvDownload(`${config.type}-report.csv`, result.cols, result.rows);
    toast("CSV downloaded.");
  }

  return (
    <div className="card">
      <div className="ct">
        <h3>{result?.title ?? "Report"}</h3>
        <div className="tools no-print">
          <button type="button" className="btn" onClick={exportCsv} disabled={!result?.rows.length}>
            Download CSV
          </button>
          <button type="button" className="btn" onClick={() => window.print()} disabled={!result}>
            Print
          </button>
        </div>
      </div>

      <div className="print-head">
        <DocHeader school={school} title={result?.title} />
      </div>

      {config.filters.length ? (
        <div className="flt no-print">
          {filters.has("exam") ? (
            <label>
              Exam group
              <select value={groupId} onChange={(event) => setGroupId(event.target.value)}>
                <option value="">Select</option>
                {lookups.list("examGroups").map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          ) : null}
          {filters.has("class") ? (
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
                {classes.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          ) : null}
          {filters.has("section") ? (
            <label>
              Section
              <select value={sectionId} onChange={(event) => setSectionId(event.target.value)}>
                <option value="">All sections</option>
                {sections.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          ) : null}
          {filters.has("month") ? (
            <label>
              Month
              <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
            </label>
          ) : null}
          {filters.has("from") ? (
            <label>
              From
              <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            </label>
          ) : null}
          {filters.has("to") ? (
            <label>
              To
              <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
            </label>
          ) : null}
          {filters.has("q") ? (
            <label>
              Search
              <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Name, adm no…" />
            </label>
          ) : null}
          <button type="button" className="btn pri" onClick={run} disabled={loading}>
            {loading ? "Loading…" : "Show report"}
          </button>
        </div>
      ) : null}

      <ErrorBox message={error} />
      {loading && !result ? (
        <Loading label="Building report…" />
      ) : result ? (
        <>
          {result.sum?.length ? (
            <div className="sum">
              {result.sum.map(([label, value], index) => (
                <div key={`${label}-${index}`}>
                  <small>{label}</small>
                  <b>{String(value)}</b>
                </div>
              ))}
            </div>
          ) : null}
          <div className="tw">
            <table className="tbl">
              <thead>
                <tr>{result.cols.map((col) => <th key={col}>{col}</th>)}</tr>
              </thead>
              <tbody>
                {result.rows.slice(0, 500).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{String(cell ?? "")}</td>
                    ))}
                  </tr>
                ))}
                {!result.rows.length ? (
                  <tr>
                    <td className="empty" colSpan={Math.max(1, result.cols.length)}>
                      No data for this selection.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {result.rows.length > 500 ? (
            <p className="hint" style={{ marginTop: 8 }}>
              Showing the first 500 rows. Download the CSV for the complete result.
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
