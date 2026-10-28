"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { csvDownload, dmy, inr } from "@/lib/utils";
import { useLookups } from "../LookupProvider";
import { useToast } from "../ToastProvider";
import { DynamicForm } from "../DynamicForm";
import { Modal } from "../Modal";
import type { Column, CrudConfig, CrudHelpers, Row } from "./types";
import { badgeKind } from "@/lib/utils";

type ListResponse = {
  items: Row[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
};

function badge(value: unknown) {
  const text = String(value ?? "");
  if (!text) return <span className="muted">—</span>;
  return <span className={`bd ${badgeKind(text)}`}>{text}</span>;
}

function cellText(col: Column, row: Row, label: (key: string, value: unknown) => string): string {
  const value = col.key ? row[col.key] : "";
  if (col.lookup) return label(col.lookup, value);
  if (col.type === "money") return inr(value as number);
  if (col.type === "date") return dmy(value as string);
  if (col.type === "bool") return value ? "Yes" : "No";
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function GenericCrud({ config }: { config: CrudConfig }) {
  const lookups = useLookups();
  const toast = useToast();

  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pageSize ?? 12);
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>(config.defaultFilters ?? {});
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; row?: Row } | null>(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const autoOpened = useRef(false);

  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  const openEdit = useCallback(
    async (row: Row) => {
      try {
        const full = await apiGet<Row>(`/api/resources/${config.resource}/${String(row.id)}`);
        setModal({ mode: "edit", row: full });
      } catch (err) {
        toast(err instanceof Error ? err.message : "Could not load the record.", "err");
        setModal({ mode: "edit", row });
      }
    },
    [config.resource, toast],
  );

  const params = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    if (q) p.set("q", q);
    for (const [key, value] of Object.entries(filters)) {
      if (value !== "") p.set(key, value);
    }
    if (config.dateRange && from) p.set("from", from);
    if (config.dateRange && to) p.set("to", to);
    if (sort) {
      p.set("sort", sort);
      p.set("dir", dir);
    }
    return p.toString();
  }, [page, pageSize, q, filters, from, to, sort, dir, config.dateRange]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQ(qInput);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [qInput]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiGet<ListResponse>(`/api/resources/${config.resource}?${params}`)
      .then((data) => {
        if (!alive) return;
        setRows(data.items);
        setTotal(data.total);
        setPages(data.pages);
        setError(null);
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
  }, [config.resource, params, refreshKey]);

  const helpers: CrudHelpers = useMemo(
    () => ({
      refresh,
      toast,
      edit: (row: Row) => {
        void openEdit(row);
      },
    }),
    [refresh, toast, openEdit],
  );

  useEffect(() => {
    if (autoOpened.current || typeof window === "undefined" || !rows.length) return;
    const id = new URLSearchParams(window.location.search).get("open");
    if (!id) return;
    const row = rows.find((r) => String(r.id) === id);
    if (row) {
      autoOpened.current = true;
      config.onRowClick?.(row, helpers);
      if (!config.onRowClick && config.canEdit !== false) void openEdit(row);
    }
  }, [rows, config, helpers, openEdit]);

  function updateFilter(name: string, value: string, clearOthers?: string[]) {
    setFilters((current) => {
      const next = { ...current, [name]: value };
      for (const clear of clearOthers ?? []) next[clear] = "";
      return next;
    });
    setPage(1);
  }

  function toggleSort(name: string) {
    if (sort === name) {
      setDir((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSort(name);
      setDir("asc");
    }
  }

  async function save(values: Record<string, unknown>) {
    const payload = config.transformSubmit ? config.transformSubmit(values) : values;
    setBusy(true);
    try {
      if (modal?.mode === "edit" && modal.row) {
        await apiPatch(`/api/resources/${config.resource}/${String(modal.row.id)}`, payload);
        toast(`${config.singular} updated.`);
      } else {
        await apiPost(`/api/resources/${config.resource}`, payload);
        toast(`${config.singular} saved.`);
      }
      setModal(null);
      refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: Row) {
    if (!window.confirm(`Delete this ${config.singular.toLowerCase()}? This cannot be undone.`)) return;
    try {
      await apiDelete(`/api/resources/${config.resource}/${String(row.id)}`);
      toast(`${config.singular} deleted.`);
      refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed.", "err");
    }
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const all: Row[] = [];
      let current = 1;
      let lastPage = 1;
      while (current <= lastPage && all.length < 5000) {
        const p = new URLSearchParams(params);
        p.set("page", String(current));
        p.set("pageSize", "200");
        const data = await apiGet<ListResponse>(`/api/resources/${config.resource}?${p}`);
        all.push(...data.items);
        lastPage = data.pages;
        current++;
      }
      csvDownload(
        `${config.resource}-${new Date().toISOString().slice(0, 10)}.csv`,
        config.columns.map((c) => c.label),
        all.map((row) => config.columns.map((col) => cellText(col, row, lookups.label))),
      );
      toast(`Exported ${all.length} row(s).`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Export failed.", "err");
    } finally {
      setExporting(false);
    }
  }

  const canAdd = config.canAdd !== false;
  const canEdit = config.canEdit !== false;
  const canDelete = config.canDelete !== false;

  return (
    <div>
      {config.description ? <div className="notebox" style={{ marginBottom: 12 }}>{config.description}</div> : null}
      <div className="card">
        <div className="ct">
          <h3>
            {config.title}
            <span className="cnt">{total}</span>
          </h3>
          <div className="tools">
            {config.headerActions?.(helpers)}
            {canAdd ? (
              <button type="button" className="btn pri" onClick={() => setModal({ mode: "create" })}>
                + {config.addLabel ?? `Add ${config.singular}`}
              </button>
            ) : null}
            <button type="button" className="btn" onClick={exportCsv} disabled={exporting || !total}>
              {exporting ? "Exporting…" : "Export CSV"}
            </button>
          </div>
        </div>

        {config.search !== false || config.filters?.length || config.dateRange ? (
          <div className="flt">
            {config.search !== false ? (
              <label>
                Search
                <input
                  className="sin"
                  value={qInput}
                  onChange={(e) => setQInput(e.target.value)}
                  placeholder="Search records…"
                />
              </label>
            ) : null}
            {(config.filters ?? []).map((filter) => (
              <label key={filter.name}>
                {filter.label}
                <select
                  value={filters[filter.name] ?? ""}
                  onChange={(e) => updateFilter(filter.name, e.target.value)}
                >
                  <option value="">All</option>
                  {(filter.options ?? lookups.list(filter.lookup ?? "")).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            {config.dateRange ? (
              <>
                <label>
                  From
                  <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
                </label>
                <label>
                  To
                  <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
                </label>
                {from || to ? (
                  <button type="button" className="btn sm" onClick={() => { setFrom(""); setTo(""); }}>
                    Clear dates
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}

        {error ? <div className="alert" style={{ marginBottom: 10 }}>{error}</div> : null}

        <div className="tw">
          <table className="tbl">
            <thead>
              <tr>
                {config.columns.map((col, index) => (
                  <th
                    key={`${col.label}-${index}`}
                    style={{ width: col.width, cursor: col.key ? "pointer" : undefined }}
                    onClick={col.key ? () => toggleSort(col.key!) : undefined}
                  >
                    {col.label}
                    {sort === col.key ? (dir === "asc" ? " ↑" : " ↓") : ""}
                  </th>
                ))}
                {canEdit || canDelete || config.rowActions ? <th style={{ textAlign: "right" }}>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {loading && !rows.length ? (
                <tr>
                  <td className="empty" colSpan={config.columns.length + 1}>
                    <span className="spinner" style={{ display: "inline-block" }} />
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((row, rowIndex) => (
                  <tr
                    key={String(row.id ?? rowIndex)}
                    style={config.onRowClick ? { cursor: "pointer" } : undefined}
                    onClick={(event) => {
                      if (!config.onRowClick) return;
                      const target = event.target as HTMLElement;
                      if (target.closest("button") || target.closest("a")) return;
                      config.onRowClick(row, helpers);
                    }}
                  >
                    {config.columns.map((col, index) => (
                      <td key={`${col.label}-${index}`}>
                        {col.render
                          ? col.render(row)
                          : col.type === "badge"
                            ? badge(col.key ? row[col.key] : "")
                            : col.type === "money"
                              ? <span className="money">{inr(col.key ? (row[col.key] as number) : 0)}</span>
                              : col.type === "date"
                                ? dmy(col.key ? (row[col.key] as string) : "")
                                : col.type === "bool"
                                  ? (col.key && row[col.key] ? "Yes" : "No")
                                  : col.type === "stars"
                                    ? "★".repeat(Number(col.key ? row[col.key] : 0) || 0)
                                    : col.lookup
                                      ? lookups.label(col.lookup, col.key ? row[col.key] : "")
                                      : col.key
                                        ? (String(row[col.key] ?? "") || <span className="muted">—</span>)
                                        : "—"}
                      </td>
                    ))}
                    {canEdit || canDelete || config.rowActions ? (
                      <td className="act">
                        <div className="flexrow" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
                          {config.rowActions?.(row, helpers)}
                          {canEdit ? (
                            <button type="button" className="mini" onClick={() => void openEdit(row)}>
                              Edit
                            </button>
                          ) : null}
                          {canDelete ? (
                            <button type="button" className="mini no" onClick={() => remove(row)}>
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="empty" colSpan={config.columns.length + 1}>
                    {loading ? "Loading…" : (config.empty ?? "No records found")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pg">
          <span>
            {total} record{total === 1 ? "" : "s"} · page {Math.min(page, pages)} of {pages}
          </span>
          <div className="tools">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="sin"
              style={{ width: 110, height: 32 }}
              aria-label="Rows per page"
            >
              {[12, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
            <button type="button" className="btn sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </button>
            <button type="button" className="btn sm" disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>
              Next
            </button>
          </div>
        </div>
      </div>

      <Modal
        open={!!modal}
        title={modal?.mode === "edit" ? `Edit ${config.singular}` : `Add ${config.singular}`}
        onClose={() => setModal(null)}
        size={config.fields.length > 10 ? "wide" : undefined}
      >
        {modal ? (
          <DynamicForm
            key={modal.row ? String(modal.row.id) : "new"}
            fields={config.fields}
            initial={{ ...(config.defaults ?? {}), ...(modal.row ?? {}) }}
            busy={busy}
            submitLabel={modal.mode === "edit" ? "Save changes" : `Save ${config.singular.toLowerCase()}`}
            onCancel={() => setModal(null)}
            onSubmit={save}
          />
        ) : null}
      </Modal>
    </div>
  );
}
