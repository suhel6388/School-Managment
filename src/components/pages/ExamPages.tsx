"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { dmy } from "@/lib/utils";
import { useLookups } from "@/components/LookupProvider";
import { useToast } from "@/components/ToastProvider";
import { Modal } from "@/components/Modal";
import { DocHeader, ErrorBox, Loading, PrintButtons, useSchool } from "./shared";

type Schedule = {
  id: string;
  subject: string;
  subjectId: string;
  date: string;
  time: string;
  max: number;
  pass: number;
};

type ExamStudent = { id: string; name: string; admNo: string; rollNo: string };

type ExamResultsData = {
  schedules: Schedule[];
  students: ExamStudent[];
  results: Record<string, { marks: number; absent: boolean }>;
  grades: { name: string; from: number; to: number; point: number; remark: string }[];
  divisions: { name: string; from: number; to: number }[];
};

type StudentRow = {
  id: string;
  name: string;
  admNo: string;
  rollNo: string | null;
  classId?: string | null;
  sectionId?: string | null;
  father?: string | null;
  phone?: string | null;
  photo?: string | null;
  dob?: string | null;
  className?: string;
  sectionName?: string;
};

type MarksheetRow = {
  scheduleId: string;
  subject: string;
  date: string;
  max: number;
  pass: number;
  marks: number | null;
  absent: boolean;
  grade: string;
};

type Marksheet = {
  studentId: string;
  name: string;
  admNo: string;
  rollNo: string;
  className: string;
  sectionName: string;
  father: string;
  rows: MarksheetRow[];
  max: number;
  got: number;
  pct: number;
  fail: boolean;
  grade: string;
  division: string;
  rank: number;
};

type AdmitData = {
  group: string;
  template: { title: string; exam: string | null; instructions: string | null; sign: string | null };
  schedules: { date: string; subject: string; time: string; room: string }[];
  students: {
    id: string;
    name: string;
    admNo: string;
    rollNo: string;
    className: string;
    sectionName: string;
  }[];
};

const ADMIT_FIELDS = [
  { name: "title", label: "Card title", type: "text" },
  { name: "exam", label: "Exam name", type: "text" },
  { name: "sign", label: "Signature label", type: "text" },
  { name: "instructions", label: "Instructions", type: "textarea" },
] as const;

const MARK_FIELDS = [
  { name: "title", label: "Title", type: "text" },
  { name: "signL", label: "Left signature", type: "text" },
  { name: "signR", label: "Right signature", type: "text" },
  { name: "remarks", label: "Remarks", type: "textarea" },
] as const;

const ID_FIELDS = [
  { name: "color", label: "Card colour", type: "color" },
  { name: "validity", label: "Validity", type: "text" },
] as const;

/** Loads the exam groups and classes used by the exam screens. */
function useExamLookups() {
  const lookups = useLookups();
  const classes = lookups.list("classes");
  const sections = lookups.list("sections");
  const groups = lookups.list("examGroups");
  return { classes, sections, groups, lookups };
}

function Filters({
  groupId,
  classId,
  sectionId,
  onGroup,
  onClass,
  onSection,
  showGroup = true,
}: {
  groupId: string;
  classId: string;
  sectionId: string;
  onGroup: (value: string) => void;
  onClass: (value: string) => void;
  onSection: (value: string) => void;
  showGroup?: boolean;
}) {
  const { classes, sections, groups } = useExamLookups();
  const allowed = useMemo(() => {
    const found = classes.find((c) => String(c.value) === classId);
    const ids = found?.sectionIds;
    return Array.isArray(ids) ? (ids as string[]) : null;
  }, [classes, classId]);
  const visibleSections = allowed ? sections.filter((s) => allowed.includes(String(s.value))) : sections;
  return (
    <div className="flt">
      {showGroup ? (
        <label>
          Exam group
          <select value={groupId} onChange={(event) => onGroup(event.target.value)}>
            <option value="">Select</option>
            {groups.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      ) : null}
      <label>
        Class
        <select value={classId} onChange={(event) => onClass(event.target.value)}>
          <option value="">Select</option>
          {classes.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <label>
        Section
        <select value={sectionId} onChange={(event) => onSection(event.target.value)}>
          <option value="">All sections</option>
          {visibleSections.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
    </div>
  );
}

/** Marks entry for one subject exam. */
export function ExamResultsPage() {
  const toast = useToast();
  const [groupId, setGroupId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [scheduleId, setScheduleId] = useState("");
  const [data, setData] = useState<ExamResultsData | null>(null);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [absent, setAbsent] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!groupId || !classId) {
      setData(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ groupId, classId });
      if (sectionId) params.set("sectionId", sectionId);
      const res = await apiGet<ExamResultsData>(`/api/exams/results?${params}`);
      setData(res);
      setScheduleId((current) =>
        res.schedules.some((s) => s.id === current) ? current : (res.schedules[0]?.id ?? ""),
      );
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Could not load results.");
    } finally {
      setLoading(false);
    }
  }, [classId, groupId, sectionId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!data) {
      setMarks({});
      setAbsent({});
      return;
    }
    const nextMarks: Record<string, string> = {};
    const nextAbsent: Record<string, boolean> = {};
    for (const student of data.students) {
      const row = data.results[`${scheduleId}|${student.id}`];
      nextMarks[student.id] = row ? String(row.marks) : "";
      nextAbsent[student.id] = row?.absent ?? false;
    }
    setMarks(nextMarks);
    setAbsent(nextAbsent);
  }, [data, scheduleId]);

  const schedule = data?.schedules.find((s) => s.id === scheduleId) ?? null;

  async function save() {
    if (!schedule) return;
    const records = (data?.students ?? [])
      .map((student) => ({
        studentId: student.id,
        raw: marks[student.id] ?? "",
        absent: absent[student.id] === true,
      }))
      .filter((row) => row.absent || row.raw !== "");
    if (!records.length) {
      toast("Enter marks for at least one student.", "warn");
      return;
    }
    const tooHigh = records.find((row) => !row.absent && Number(row.raw) > schedule.max);
    if (tooHigh) {
      toast(`Marks cannot be more than the maximum of ${schedule.max}.`, "err");
      return;
    }
    setBusy(true);
    try {
      await apiPost<{ saved: number }>("/api/exams/results/save", {
        scheduleId,
        records: records.map((row) => ({
          studentId: row.studentId,
          marks: row.absent ? null : Number(row.raw),
          absent: row.absent,
        })),
      });
      toast(`Saved results for ${records.length} student(s).`);
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not save results.", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="ct">
        <h3>Exam Result Entry</h3>
        {schedule ? (
          <div className="tools">
            <span className="pill">
              {schedule.subject} · Max {schedule.max} · Pass {schedule.pass}
            </span>
            <span className="pill">{dmy(schedule.date)}</span>
          </div>
        ) : null}
      </div>
      <Filters
        groupId={groupId}
        classId={classId}
        sectionId={sectionId}
        onGroup={(value) => {
          setGroupId(value);
          setScheduleId("");
          setData(null);
        }}
        onClass={(value) => {
          setClassId(value);
          setSectionId("");
          setScheduleId("");
          setData(null);
        }}
        onSection={(value) => {
          setSectionId(value);
          setScheduleId("");
          setData(null);
        }}
      />
      <ErrorBox message={error} />
      {!groupId || !classId ? (
        <div className="notebox">Choose an exam group and class to load the subject exams.</div>
      ) : loading && !data ? (
        <Loading label="Loading students…" />
      ) : data ? (
        <>
          {data.schedules.length ? (
            <div className="flt">
              <label>
                Subject exam
                <select value={scheduleId} onChange={(event) => setScheduleId(event.target.value)}>
                  {data.schedules.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.subject} ({dmy(row.date)})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <div className="notebox">
              No exams are scheduled for this group and class. Add them under Exam Schedule first.
            </div>
          )}
          {schedule ? (
            <>
              <div className="tw">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Roll</th>
                      <th>Student</th>
                      <th>Adm No</th>
                      <th>Marks</th>
                      <th>Absent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.students.map((student) => (
                      <tr key={student.id}>
                        <td>{student.rollNo || "—"}</td>
                        <td><b>{student.name}</b></td>
                        <td>{student.admNo}</td>
                        <td>
                          <input
                            type="number"
                            className="sin"
                            style={{ width: 100 }}
                            min={0}
                            max={schedule.max}
                            value={marks[student.id] ?? ""}
                            disabled={absent[student.id]}
                            onChange={(event) =>
                              setMarks((current) => ({ ...current, [student.id]: event.target.value }))
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={absent[student.id] === true}
                            aria-label={`Mark ${student.name} absent`}
                            onChange={(event) =>
                              setAbsent((current) => ({ ...current, [student.id]: event.target.checked }))
                            }
                          />
                        </td>
                      </tr>
                    ))}
                    {!data.students.length ? (
                      <tr>
                        <td className="empty" colSpan={5}>No active students in this class and section.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <div className="flexrow" style={{ marginTop: 14 }}>
                <button type="button" className="btn pri" onClick={save} disabled={busy || !data.students.length}>
                  {busy ? "Saving…" : "Save results"}
                </button>
                <span className="hint">Blank rows are ignored. Existing marks load automatically.</span>
              </div>
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

/** Shared class/section student picker used by admit cards, marksheets and certificates. */
export function StudentPickerCard({
  title,
  description,
  showExam = false,
  templateLabel,
  templateOptions,
  actionLabel,
  onGenerate,
}: {
  title: string;
  description?: string;
  showExam?: boolean;
  templateLabel?: string;
  templateOptions?: { value: string; label: string }[];
  actionLabel: string;
  onGenerate: (args: {
    studentIds: string[];
    students: StudentRow[];
    groupId: string;
    classId: string;
    sectionId: string;
    templateId: string;
  }) => void | Promise<void>;
}) {
  const toast = useToast();
  const lookups = useLookups();
  const [groupId, setGroupId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!classId) {
      setStudents([]);
      setSelected({});
      return;
    }
    let alive = true;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ classId, status: "active", pageSize: "500", sort: "admNo", dir: "asc" });
    if (sectionId) params.set("sectionId", sectionId);
    apiGet<{ items: StudentRow[] }>(`/api/resources/students?${params}`)
      .then((res) => {
        if (!alive) return;
        setStudents(res.items);
        setSelected(Object.fromEntries(res.items.map((s) => [s.id, true])));
      })
      .catch((err: Error) => {
        if (!alive) return;
        setStudents([]);
        setError(err.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [classId, sectionId]);

  const allChecked = students.length > 0 && students.every((s) => selected[s.id]);
  const chosen = students.filter((s) => selected[s.id]);
  const chosenIds = chosen.map((s) => s.id);

  async function generate() {
    if (!classId) {
      toast("Select a class first.", "warn");
      return;
    }
    if (showExam && !groupId) {
      toast("Select an exam group first.", "warn");
      return;
    }
    if (templateLabel && !templateId) {
      toast(`Select a ${templateLabel.toLowerCase()} first.`, "warn");
      return;
    }
    if (!chosenIds.length) {
      toast("Select at least one student.", "warn");
      return;
    }
    setBusy(true);
    try {
      await onGenerate({
        studentIds: chosenIds,
        students: chosen,
        groupId,
        classId,
        sectionId,
        templateId,
      });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not generate the document.", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="ct">
        <h3>{title}</h3>
        {description ? <span className="hint">{description}</span> : null}
      </div>
      <Filters
        groupId={groupId}
        classId={classId}
        sectionId={sectionId}
        showGroup={showExam}
        onGroup={setGroupId}
        onClass={(value) => {
          setClassId(value);
          setSectionId("");
        }}
        onSection={setSectionId}
      />
      {templateLabel ? (
        <div className="flt">
          <label>
            {templateLabel}
            <select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
              <option value="">Select</option>
              {(templateOptions ?? []).map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
      <ErrorBox message={error} />
      {!classId ? (
        <div className="notebox">Select a class to list its students.</div>
      ) : loading ? (
        <Loading label="Loading students…" />
      ) : (
        <>
          <div className="tw">
            <table className="tbl">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={allChecked}
                      aria-label="Select all students"
                      onChange={(event) =>
                        setSelected(Object.fromEntries(students.map((s) => [s.id, event.target.checked])))
                      }
                    />
                  </th>
                  <th>Adm No</th>
                  <th>Student</th>
                  <th>Roll</th>
                  <th>Section</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected[student.id] === true}
                        aria-label={`Select ${student.name}`}
                        onChange={(event) =>
                          setSelected((current) => ({ ...current, [student.id]: event.target.checked }))
                        }
                      />
                    </td>
                    <td>{student.admNo}</td>
                    <td><b>{student.name}</b></td>
                    <td>{student.rollNo || "—"}</td>
                    <td>{lookups.label("sections", student.sectionId)}</td>
                  </tr>
                ))}
                {!students.length ? (
                  <tr>
                    <td className="empty" colSpan={5}>No active students in this selection.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="flexrow" style={{ marginTop: 14 }}>
            <button type="button" className="btn pri" onClick={generate} disabled={busy || !students.length}>
              {busy ? "Working…" : actionLabel}
            </button>
            <span className="hint">{chosenIds.length} of {students.length} selected</span>
          </div>
        </>
      )}
    </div>
  );
}

function TemplateField({
  field,
  value,
  onChange,
}: {
  field: { name: string; label: string; type: string };
  value: string;
  onChange: (value: string) => void;
}) {
  if (field.type === "textarea") {
    return (
      <div className="fld span2">
        <label htmlFor={`tpl_${field.name}`}>{field.label}</label>
        <textarea
          id={`tpl_${field.name}`}
          rows={3}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    );
  }
  return (
    <div className="fld">
      <label htmlFor={`tpl_${field.name}`}>{field.label}</label>
      <input
        id={`tpl_${field.name}`}
        type={field.type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function TemplateEditor({
  type,
  title,
  description,
  fields,
}: {
  type: "admit" | "mark" | "id";
  title: string;
  description?: string;
  fields: readonly { name: string; label: string; type: string }[];
}) {
  const toast = useToast();
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    apiGet<Record<string, Record<string, unknown>>>("/api/templates")
      .then((res) => {
        if (!alive) return;
        const key = type === "admit" ? "admit" : type === "mark" ? "mark" : "idCard";
        const source = res[key] ?? {};
        setValues(
          Object.fromEntries(
            fields.map((field) => [field.name, source[field.name] == null ? "" : String(source[field.name])]),
          ),
        );
      })
      .catch((err: Error) => {
        if (alive) setError(err.message);
      });
    return () => {
      alive = false;
    };
  }, [fields, type]);

  async function save() {
    if (!values) return;
    setBusy(true);
    setError("");
    try {
      await apiPatch("/api/templates", { type, ...values });
      toast("Design saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the design.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="ct">
        <h3>{title}</h3>
        {description ? <span className="hint">{description}</span> : null}
      </div>
      <ErrorBox message={error} />
      {!values ? (
        <Loading label="Loading design…" />
      ) : (
        <>
          <div className="fg">
            {fields.map((field) => (
              <TemplateField
                key={field.name}
                field={field}
                value={values[field.name] ?? ""}
                onChange={(value) => setValues((current) => ({ ...current, [field.name]: value }))}
              />
            ))}
          </div>
          <div className="flexrow" style={{ marginTop: 14 }}>
            <button type="button" className="btn pri" onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save design"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function AdmitDesignPage() {
  return (
    <TemplateEditor
      type="admit"
      title="Design Admit Card"
      description="This layout is used by Print Admit Card."
      fields={ADMIT_FIELDS}
    />
  );
}

export function MarksDesignPage() {
  return (
    <TemplateEditor
      type="mark"
      title="Design Marksheet"
      description="This layout is used by Print Marksheet."
      fields={MARK_FIELDS}
    />
  );
}

export function IdCardDesignPage() {
  return (
    <TemplateEditor
      type="id"
      title="Design ID Card"
      description="Colour and validity shown on student ID cards."
      fields={ID_FIELDS}
    />
  );
}

/** Printable admit cards. */
export function AdmitPrintPage() {
  const { school } = useSchool();
  const [data, setData] = useState<AdmitData | null>(null);

  return (
    <>
      <StudentPickerCard
        title="Print Admit Card"
        description="Choose an exam group, class and students, then print."
        showExam
        actionLabel="Generate admit cards"
        onGenerate={async ({ studentIds, groupId, classId, sectionId }) => {
          const params = new URLSearchParams({ groupId, classId, studentIds: studentIds.join(",") });
          if (sectionId) params.set("sectionId", sectionId);
          setData(await apiGet<AdmitData>(`/api/exams/admit-card?${params}`));
        }}
      />
      <Modal
        open={Boolean(data)}
        title="Admit cards"
        size="xl"
        onClose={() => setData(null)}
        footer={
          <PrintButtons>
            <button type="button" className="btn" onClick={() => setData(null)}>
              Close
            </button>
          </PrintButtons>
        }
      >
        {data ? (
          <>
            {data.students.map((student) => (
              <div className="doc" key={student.id}>
                <DocHeader school={school} />
                <h2 style={{ fontSize: 17 }}>{data.template.title}</h2>
                <div className="c">
                  {[data.template.exam, data.group].filter(Boolean).join(" · ")}
                </div>
                <table>
                  <tbody>
                    <tr>
                      <td>Name</td>
                      <td><b>{student.name}</b></td>
                      <td>Adm No</td>
                      <td>{student.admNo}</td>
                    </tr>
                    <tr>
                      <td>Class</td>
                      <td>{[student.className, student.sectionName].filter(Boolean).join(" ")}</td>
                      <td>Roll No</td>
                      <td>{student.rollNo || "—"}</td>
                    </tr>
                  </tbody>
                </table>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Subject</th>
                      <th>Time</th>
                      <th>Room</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.schedules.map((row, index) => (
                      <tr key={`${row.subject}-${index}`}>
                        <td>{dmy(row.date)}</td>
                        <td>{row.subject}</td>
                        <td>{row.time || "—"}</td>
                        <td>{row.room || "—"}</td>
                      </tr>
                    ))}
                    {!data.schedules.length ? (
                      <tr>
                        <td colSpan={4}>No exam schedule found for this group and class.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
                {data.template.instructions ? (
                  <div style={{ fontSize: 12 }}>{data.template.instructions}</div>
                ) : null}
                <div style={{ textAlign: "right", marginTop: 24 }}>{data.template.sign}</div>
              </div>
            ))}
          </>
        ) : null}
      </Modal>
    </>
  );
}

/** Printable marksheets. */
export function MarksPrintPage() {
  const { school } = useSchool();
  const [sheets, setSheets] = useState<Marksheet[] | null>(null);
  const [title, setTitle] = useState("REPORT CARD");
  const [remark, setRemark] = useState("");
  const [signL, setSignL] = useState("Class Teacher");
  const [signR, setSignR] = useState("Principal");

  useEffect(() => {
    apiGet<{ mark: { title?: string; remarks?: string | null; signL?: string | null; signR?: string | null } }>(
      "/api/templates",
    )
      .then((res) => {
        if (res.mark.title) setTitle(res.mark.title);
        if (res.mark.remarks) setRemark(res.mark.remarks);
        if (res.mark.signL) setSignL(res.mark.signL);
        if (res.mark.signR) setSignR(res.mark.signR);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <StudentPickerCard
        title="Print Marksheet"
        description="Choose an exam group, class and students, then print their report cards."
        showExam
        actionLabel="Generate marksheets"
        onGenerate={async ({ studentIds, groupId, classId, sectionId }) => {
          const params = new URLSearchParams({ groupId, classId, studentIds: studentIds.join(",") });
          if (sectionId) params.set("sectionId", sectionId);
          const res = await apiGet<{ sheets: Marksheet[] }>(`/api/exams/marksheets?${params}`);
          setSheets(res.sheets);
        }}
      />
      <Modal
        open={Boolean(sheets)}
        title="Marksheets"
        size="xl"
        onClose={() => setSheets(null)}
        footer={
          <PrintButtons>
            <button type="button" className="btn" onClick={() => setSheets(null)}>
              Close
            </button>
          </PrintButtons>
        }
      >
        {(sheets ?? []).map((sheet) => (
          <div className="doc" key={sheet.studentId}>
            <DocHeader school={school} />
            <h2 style={{ fontSize: 17 }}>{title}</h2>
            <div className="c">
              {sheet.className} {sheet.sectionName ? `(${sheet.sectionName})` : ""} · Session{" "}
              {school?.session ?? ""}
            </div>
            <table>
              <tbody>
                <tr>
                  <td>Name</td>
                  <td><b>{sheet.name}</b></td>
                  <td>Adm No</td>
                  <td>{sheet.admNo}</td>
                </tr>
                <tr>
                  <td>Roll</td>
                  <td>{sheet.rollNo || "—"}</td>
                  <td>Father</td>
                  <td>{sheet.father || "—"}</td>
                </tr>
              </tbody>
            </table>
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Max</th>
                  <th>Pass</th>
                  <th>Obtained</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {sheet.rows.map((row) => (
                  <tr key={row.scheduleId}>
                    <td>{row.subject}</td>
                    <td>{row.max}</td>
                    <td>{row.pass}</td>
                    <td>{row.absent ? "AB" : row.marks ?? "—"}</td>
                    <td>{row.grade}</td>
                  </tr>
                ))}
                {!sheet.rows.length ? (
                  <tr>
                    <td colSpan={5}>No result data for this exam group.</td>
                  </tr>
                ) : null}
                <tr>
                  <th>Total</th>
                  <th>{sheet.max}</th>
                  <th />
                  <th>{sheet.got}</th>
                  <th>{sheet.grade}</th>
                </tr>
              </tbody>
            </table>
            <div>
              Percentage: <b>{sheet.pct.toFixed(1)}%</b> &nbsp; Result:{" "}
              <b>{sheet.fail ? "FAIL" : "PASS"}</b> &nbsp; Division: <b>{sheet.division}</b> &nbsp;
              Rank: <b>{sheet.rank || "—"}</b>
            </div>
            {remark ? (
              <div style={{ marginTop: 8, fontSize: 13 }}>Remarks: {remark}</div>
            ) : null}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 26 }}>
              <span>{signL}</span>
              <span>{signR}</span>
            </div>
          </div>
        ))}
      </Modal>
    </>
  );
}
