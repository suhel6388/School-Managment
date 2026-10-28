import type { ReactNode } from "react";
import type { Field } from "../DynamicForm";

export type Row = Record<string, unknown>;

export type Column = {
  key?: string;
  label: string;
  lookup?: string;
  type?: "money" | "date" | "badge" | "bool" | "num" | "stars" | "text";
  render?: (row: Row) => ReactNode;
  sortable?: boolean;
  width?: string;
};

export type FilterDef = {
  name: string;
  label: string;
  lookup?: string;
  options?: { value: string; label: string }[];
};

export type CrudHelpers = {
  refresh: () => void;
  toast: (message: string, kind?: "" | "err" | "warn") => void;
  edit: (row: Row) => void;
};

export type CrudConfig = {
  resource: string;
  title: string;
  singular: string;
  description?: string;
  fields: Field[];
  columns: Column[];
  filters?: FilterDef[];
  defaultFilters?: Record<string, string>;
  dateRange?: boolean;
  search?: boolean;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  addLabel?: string;
  pageSize?: number;
  rowActions?: (row: Row, helpers: CrudHelpers) => ReactNode;
  headerActions?: (helpers: CrudHelpers) => ReactNode;
  onRowClick?: (row: Row, helpers: CrudHelpers) => void;
  empty?: string;
  defaults?: Record<string, unknown>;
  transformSubmit?: (values: Record<string, unknown>) => Record<string, unknown>;
};
