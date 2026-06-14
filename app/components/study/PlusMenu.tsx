"use client";

import { useEffect, useRef, useState } from "react";

// The "+" action menu in the chat input bar: Upload / Quiz / Summarize.
export default function PlusMenu({
  onUpload,
  onQuiz,
  onSummary,
  studyDisabled,
}: {
  onUpload: () => void;
  onQuiz: () => void;
  onSummary: () => void;
  studyDisabled: boolean; // quiz/summary need a selected document
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="More actions"
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border text-ink-soft transition hover:bg-bg ${
          open ? "bg-bg" : "bg-surface"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className={`h-5 w-5 transition-transform ${open ? "rotate-45" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {open && (
        <div className="animate-scale-in absolute bottom-12 left-0 z-20 w-52 origin-bottom-left rounded-xl border border-border bg-surface p-1.5 shadow-lg">
          <MenuItem onClick={() => run(onUpload)} label="Upload notes" hint="PDF">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4m0 0L8 8m4-4 4 4" />
              <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
          </MenuItem>
          <MenuItem
            onClick={() => run(onQuiz)}
            label="Generate quiz"
            disabled={studyDisabled}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </MenuItem>
          <MenuItem
            onClick={() => run(onSummary)}
            label="Summarize"
            disabled={studyDisabled}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16M4 12h10M4 18h7" />
            </svg>
          </MenuItem>
          {studyDisabled && (
            <p className="px-2.5 pb-1 pt-1.5 text-[11px] text-muted">
              Select a document to quiz or summarize.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  children,
  label,
  hint,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-ink-soft transition hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
    >
      <span className="text-brand">{children}</span>
      {label}
      {hint && <span className="ml-auto text-[11px] text-muted">{hint}</span>}
    </button>
  );
}
