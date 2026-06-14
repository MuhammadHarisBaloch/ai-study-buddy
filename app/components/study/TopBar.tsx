"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";

export default function TopBar({
  userName,
  userImage,
  onOpenChats,
  onOpenDocs,
}: {
  userName: string;
  userImage: string | null;
  onOpenChats: () => void;
  onOpenDocs: () => void;
}) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
        {/* Mobile/tablet: open Chats drawer */}
        <button
          onClick={onOpenChats}
          aria-label="Open chats"
          className="-ml-1 rounded-lg p-2 text-ink-soft transition hover:bg-bg lg:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <span className="truncate bg-gradient-to-r from-brand-soft to-violet bg-clip-text font-display text-base font-bold text-transparent sm:text-lg">
          AI Study Buddy
        </span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Mobile/tablet: open Documents drawer */}
        <button
          onClick={onOpenDocs}
          aria-label="Open documents"
          className="rounded-lg p-2 text-ink-soft transition hover:bg-bg lg:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h10l6 6v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
            <path d="M14 4v6h6" />
          </svg>
        </button>

        <AccountMenu userName={userName} userImage={userImage} />
      </div>
    </header>
  );
}

// Avatar dropdown holding the user's name + Sign out. Collapsing these into a
// menu keeps the mobile header uncluttered while staying clean on desktop.
function AccountMenu({
  userName,
  userImage,
}: {
  userName: string;
  userImage: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  const initial = userName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center gap-2 rounded-xl border border-border py-1 pl-1 pr-1.5 transition hover:bg-bg sm:pr-2 ${
          open ? "bg-bg" : "bg-surface"
        }`}
      >
        {userImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={userImage} alt="" className="h-7 w-7 rounded-full" />
        ) : (
          <span className="grid h-7 w-7 place-items-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
            {initial}
          </span>
        )}
        <span className="hidden max-w-[9rem] truncate text-sm text-ink-soft sm:block">
          {userName}
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`hidden h-4 w-4 text-muted transition-transform sm:block ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="animate-scale-in absolute right-0 top-12 z-30 w-56 origin-top-right rounded-xl border border-border bg-surface p-1.5 shadow-lg"
        >
          <div className="border-b border-border px-2.5 pb-2 pt-1.5">
            <p className="truncate text-sm font-medium text-ink">{userName}</p>
            <p className="text-[11px] text-muted">Signed in</p>
          </div>
          <button
            role="menuitem"
            onClick={() => {
              setSigningOut(true);
              void signOut();
            }}
            disabled={signingOut}
            className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-ink-soft transition hover:bg-bg disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5M21 12H9" />
            </svg>
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
