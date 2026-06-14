"use client";

import type { studyDocument } from "@/app/types/document";

// Left rail: each document is a "chat thread". Click to open its conversation.
export default function ChatsRail({
  documents,
  selectedId,
  onSelect,
  loading,
}: {
  documents: studyDocument[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-4">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <h2 className="font-display text-sm font-semibold text-ink">Chats</h2>
      </div>

      <div className="scroll-soft flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {loading && (
          <div className="space-y-2 px-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-12 rounded-xl" />
            ))}
          </div>
        )}

        {!loading && documents.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-muted">
            No chats yet. Upload a document to start one.
          </p>
        )}

        {!loading &&
          documents.map((doc) => {
            const active = doc.id === selectedId;
            return (
              <button
                key={doc.id}
                onClick={() => onSelect(doc.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                  active
                    ? "bg-brand/10 text-brand"
                    : "text-ink-soft hover:bg-bg"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                    active ? "bg-brand text-white" : "bg-bg text-muted"
                  }`}
                >
                  {doc.filename.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {doc.filename}
                  </span>
                  <span className="block text-xs text-muted">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
}
