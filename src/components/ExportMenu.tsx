"use client";

import { useEffect, useRef, useState } from "react";

type ExportMenuProps = {
  label: string;
  csvLabel: string;
  pdfLabel: string;
  onCsv: () => void;
  onPdf: () => void;
  className?: string;
  align?: "left" | "right";
};

export default function ExportMenu({
  label,
  csvLabel,
  pdfLabel,
  onCsv,
  onPdf,
  className = "ys-btn-secondary gap-2 text-xs",
  align = "right",
}: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const run = (handler: () => void) => {
    setOpen(false);
    handler();
  };

  return (
    <div ref={ref} className="relative inline-flex">
      <button type="button" onClick={() => setOpen((value) => !value)} className={className} aria-haspopup="menu" aria-expanded={open}>
        <svg viewBox="0 0 24 24" className="ys-btn-icon" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 3v10" strokeLinecap="round" />
          <path d="M8 9l4 4 4-4" strokeLinecap="round" />
          <path d="M5 21h14" strokeLinecap="round" />
        </svg>
        {label}
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M7 10l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className={[
            "absolute top-full z-40 mt-2 min-w-36 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lg",
            align === "right" ? "right-0" : "left-0",
          ].join(" ")}
        >
          <button type="button" role="menuitem" onClick={() => run(onPdf)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-muted">
            {pdfLabel}
            <span className="ml-auto text-[10px] text-muted-foreground">.pdf</span>
          </button>
          <button type="button" role="menuitem" onClick={() => run(onCsv)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-muted">
            {csvLabel}
            <span className="ml-auto text-[10px] text-muted-foreground">.csv</span>
          </button>
        </div>
      )}
    </div>
  );
}
