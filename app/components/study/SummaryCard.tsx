"use client";

// A grounded summary rendered inline in the chat stream.
export default function SummaryCard({ content }: { content: string }) {
  return (
    <div className="animate-msg-in rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16M4 12h10M4 18h7" />
          </svg>
        </span>
        <h3 className="font-display text-sm font-semibold text-ink">Summary</h3>
      </div>
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
        {content}
      </div>
    </div>
  );
}
