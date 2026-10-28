"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Kind = "" | "err" | "warn";
type ToastFn = (message: string, kind?: Kind) => void;

const ToastContext = createContext<ToastFn>(() => {});

export function useToast(): ToastFn {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<{ id: number; message: string; kind: Kind }[]>([]);

  const push = useCallback<ToastFn>((message, kind = "") => {
    const id = Date.now() + Math.random();
    setItems((list) => [...list, { id, message, kind }]);
    window.setTimeout(() => {
      setItems((list) => list.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div id="toast">
        {items.map((t) => (
          <div key={t.id} className={`tt ${t.kind}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
