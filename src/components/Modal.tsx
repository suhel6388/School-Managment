"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  size,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "wide" | "xl";
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    document.body.dataset.modal = "open";
    return () => {
      delete document.body.dataset.modal;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="mb"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={`md ${size ?? ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="mh">
          <h3>{title}</h3>
          <button type="button" className="ib" onClick={onClose} aria-label="Close">
            <svg className="i" viewBox="0 0 24 24">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="mbody">{children}</div>
        {footer ? <div className="mf">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
