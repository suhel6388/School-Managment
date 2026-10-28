"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiGet } from "@/lib/api";

export type Option = { value: string; label: string; [key: string]: unknown };
export type LookupKey =
  | "classes"
  | "sections"
  | "subjects"
  | "students"
  | "staff"
  | "feeGroups"
  | "feeTypes"
  | "examGroups"
  | "departments"
  | "designations"
  | "leaveTypes"
  | "books"
  | "members"
  | "items"
  | "itemCats"
  | "stores"
  | "suppliers"
  | "routes"
  | "pickups"
  | "hostels"
  | "roomTypes"
  | "rooms"
  | "feeDiscounts"
  | "sessions"
  | "categories"
  | "houses"
  | "disReasons"
  | "expenseHeads"
  | "contentTypes"
  | "roles"
  | "templates"
  | "sources"
  | "purposes"
  | "complaintTypes"
  | "references"
  | "lessons"
  | "vehicles";

type LookupState = {
  data: Record<string, Option[]>;
  loading: boolean;
  error: string | null;
  list: (key: string) => Option[];
  label: (key: string, value: unknown) => string;
  find: (key: string, value: unknown) => Option | undefined;
  reload: () => void;
};

const LookupContext = createContext<LookupState>({
  data: {},
  loading: true,
  error: null,
  list: () => [],
  label: () => "—",
  find: () => undefined,
  reload: () => {},
});

export function useLookups(): LookupState {
  return useContext(LookupContext);
}

export function LookupProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Record<string, Option[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiGet<Record<string, Option[]>>("/api/lookups")
      .then((res) => {
        if (!alive) return;
        setData(res);
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
  }, [nonce]);

  const list = useCallback((key: string): Option[] => data[key] ?? [], [data]);

  const find = useCallback(
    (key: string, value: unknown): Option | undefined => {
      if (value === null || value === undefined || value === "") return undefined;
      return (data[key] ?? []).find((o) => String(o.value) === String(value));
    },
    [data],
  );

  const label = useCallback(
    (key: string, value: unknown): string => {
      if (Array.isArray(value)) {
        if (!value.length) return "—";
        return value
          .map((v) => (data[key] ?? []).find((o) => String(o.value) === String(v))?.label ?? String(v))
          .join(", ");
      }
      const found = find(key, value);
      return found ? found.label : value === null || value === undefined || value === "" ? "—" : String(value);
    },
    [data, find],
  );

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  const value = useMemo(
    () => ({ data, loading, error, list, label, find, reload }),
    [data, loading, error, list, label, find, reload],
  );

  return <LookupContext.Provider value={value}>{children}</LookupContext.Provider>;
}
