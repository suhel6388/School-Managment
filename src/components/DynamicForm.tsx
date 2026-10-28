"use client";

import { useMemo, useState } from "react";
import { useLookups } from "./LookupProvider";
import { useToast } from "./ToastProvider";

export type FieldType =
  | "text"
  | "number"
  | "money"
  | "date"
  | "time"
  | "select"
  | "multi"
  | "textarea"
  | "checkbox"
  | "password"
  | "email"
  | "tel"
  | "url"
  | "file"
  | "hidden"
  | "section";

export type Field = {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  lookup?: string;
  options?: { value: string; label: string }[];
  span2?: boolean;
  help?: string;
  def?: unknown;
  placeholder?: string;
  accept?: string;
  maxKb?: number;
  alsoSet?: string;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
};

type Values = Record<string, unknown>;

function initialValues(fields: Field[], initial?: Values): Values {
  const values: Values = {};
  for (const field of fields) {
    if (field.type === "section") continue;
    const raw = initial && initial[field.name] !== undefined ? initial[field.name] : field.def;
    if (field.type === "multi") {
      values[field.name] = Array.isArray(raw) ? raw.map(String) : [];
    } else if (field.type === "checkbox") {
      values[field.name] = raw === true || raw === "true" || raw === 1 || raw === "1";
    } else if (field.type === "date") {
      values[field.name] = raw ? String(raw).slice(0, 10) : "";
    } else if (raw === null || raw === undefined) {
      values[field.name] = "";
    } else {
      values[field.name] = String(raw);
    }
  }
  return values;
}

function payloadOf(fields: Field[], values: Values): Values {
  const out: Values = {};
  for (const field of fields) {
    if (field.type === "section") continue;
    const value = values[field.name];
    if (field.type === "checkbox") {
      out[field.name] = value === true;
      continue;
    }
    if (field.type === "multi") {
      out[field.name] = Array.isArray(value) ? value : [];
      continue;
    }
    if (value === "" || value === null || value === undefined) {
      if (field.type === "text" || field.type === "textarea" || field.type === "email" || field.type === "tel" || field.type === "url") {
        out[field.name] = "";
      }
      continue;
    }
    if (field.type === "number" || field.type === "money") {
      out[field.name] = Number(value);
    } else {
      out[field.name] = value;
    }
  }
  return out;
}

export function DynamicForm({
  fields,
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  busy = false,
  extra,
}: {
  fields: Field[];
  initial?: Values;
  onSubmit: (values: Values) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
  busy?: boolean;
  extra?: React.ReactNode;
}) {
  const lookups = useLookups();
  const toast = useToast();
  const [values, setValues] = useState<Values>(() => initialValues(fields, initial));
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const visible = useMemo(() => fields, [fields]);

  function set(name: string, value: unknown) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleFile(field: Field, file: File | undefined) {
    if (!file) {
      set(field.name, "");
      return;
    }
    const maxKb = field.maxKb ?? 600;
    if (file.size > maxKb * 1024) {
      toast(`File is larger than ${maxKb} KB.`, "err");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setValues((current) => {
        const next = { ...current, [field.name]: String(reader.result ?? "") };
        if (field.alsoSet) next[field.alsoSet] = file.name;
        return next;
      });
    };
    reader.readAsDataURL(file);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    for (const field of visible) {
      if (field.type === "section") continue;
      if (!field.required) continue;
      const value = values[field.name];
      if (value === "" || value === null || value === undefined || (Array.isArray(value) && !value.length)) {
        setError(`${field.label} is required.`);
        return;
      }
    }
    setWorking(true);
    try {
      await onSubmit(payloadOf(fields, values));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <form onSubmit={submit}>
      {error ? <div className="alert" style={{ marginBottom: 12 }}>{error}</div> : null}
      <div className="fg">
        {visible.map((field) => {
          if (field.type === "section") {
            return (
              <div key={`sec-${field.name}`} className="sec">
                {field.label}
              </div>
            );
          }
          if (field.type === "hidden") {
            return <input key={field.name} type="hidden" value={String(values[field.name] ?? "")} readOnly />;
          }
          const span = field.span2 || field.type === "textarea" || field.type === "multi" || field.type === "file";
          const options =
            field.options ??
            (field.lookup
              ? lookups.list(field.lookup).map((o) => ({ value: String(o.value), label: o.label }))
              : []);
          return (
            <div key={field.name} className={`fld ${span ? "span2" : ""}`}>
              <label htmlFor={`f_${field.name}`}>
                {field.label} {field.required ? <b>*</b> : null}
              </label>
              {field.type === "select" ? (
                <select
                  id={`f_${field.name}`}
                  value={String(values[field.name] ?? "")}
                  onChange={(e) => set(field.name, e.target.value)}
                >
                  <option value="">{field.placeholder ?? "Select"}</option>
                  {options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "multi" ? (
                <div
                  className="chk"
                  style={{
                    border: "1px solid var(--line)",
                    borderRadius: 9,
                    padding: "9px 10px",
                    maxHeight: 170,
                    overflow: "auto",
                  }}
                >
                  {options.length ? (
                    options.map((o) => (
                      <label key={o.value}>
                        <input
                          type="checkbox"
                          checked={(values[field.name] as string[]).includes(o.value)}
                          onChange={(e) => {
                            const list = Array.isArray(values[field.name]) ? [...(values[field.name] as string[])] : [];
                            set(
                              field.name,
                              e.target.checked ? [...list, o.value] : list.filter((v) => v !== o.value),
                            );
                          }}
                        />
                        {o.label}
                      </label>
                    ))
                  ) : (
                    <span className="hint">Nothing to choose yet.</span>
                  )}
                </div>
              ) : field.type === "textarea" ? (
                <textarea
                  id={`f_${field.name}`}
                  rows={field.rows ?? 3}
                  value={String(values[field.name] ?? "")}
                  placeholder={field.placeholder}
                  onChange={(e) => set(field.name, e.target.value)}
                />
              ) : field.type === "checkbox" ? (
                <label className="chk" style={{ minHeight: 38, alignItems: "center" }}>
                  <input
                    id={`f_${field.name}`}
                    type="checkbox"
                    checked={values[field.name] === true}
                    onChange={(e) => set(field.name, e.target.checked)}
                  />
                  <span>{field.help ?? "Yes"}</span>
                </label>
              ) : field.type === "file" ? (
                <div>
                  <input
                    id={`f_${field.name}`}
                    type="file"
                    accept={field.accept}
                    onChange={(e) => handleFile(field, e.target.files?.[0])}
                  />
                  {typeof values[field.name] === "string" && String(values[field.name]).startsWith("data:image") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={String(values[field.name])}
                      alt="Preview"
                      style={{ width: 54, height: 54, objectFit: "cover", borderRadius: 10, marginTop: 6 }}
                    />
                  ) : values[field.name] ? (
                    <div className="hint" style={{ marginTop: 4 }}>File selected</div>
                  ) : null}
                  {field.help ? <div className="hint">{field.help}</div> : null}
                </div>
              ) : (
                <input
                  id={`f_${field.name}`}
                  type={
                    field.type === "money" || field.type === "number"
                      ? "number"
                      : field.type === "password"
                        ? "password"
                        : field.type === "email"
                          ? "email"
                          : field.type === "tel"
                            ? "tel"
                            : field.type === "url"
                              ? "url"
                              : field.type === "date"
                                ? "date"
                                : field.type === "time"
                                  ? "time"
                                  : "text"
                  }
                  value={String(values[field.name] ?? "")}
                  min={field.min ?? (field.type === "money" ? 0 : undefined)}
                  max={field.max}
                  step={field.step ?? (field.type === "money" ? "0.01" : undefined)}
                  placeholder={field.placeholder}
                  onChange={(e) => set(field.name, e.target.value)}
                />
              )}
              {field.help && field.type !== "file" && field.type !== "checkbox" ? (
                <div className="hint">{field.help}</div>
              ) : null}
            </div>
          );
        })}
      </div>
      {extra}
      <div className="mf" style={{ padding: "14px 0 0", border: 0, marginTop: 4 }}>
        <button type="button" className="btn" onClick={onCancel} disabled={working || busy}>
          Cancel
        </button>
        <button type="submit" className="btn pri" disabled={working || busy}>
          {working || busy ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
