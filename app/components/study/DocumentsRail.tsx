"use client";

import type { studyDocument } from "@/app/types/document";

// Right rail: the document library — select to study, delete, see which is active.
export default function DocumentsRail({
  documents,
  selectedId,
  onSelect,
  onDelete,
  deletingId,
  loading,
}: {
  documents: studyDocument[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  loading: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-4">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h10l6 6v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
          <path d="M14 4v6h6" />
        </svg>
        <h2 className="font-display text-sm font-semibold text-ink">Documents</h2>
      </div>

      <div className="scroll-soft flex-1 space-y-2 overflow-y-auto px-3 pb-3">
        {loading && (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        )}

        {!loading && documents.length === 0 && (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
            <p className="text-sm font-medium text-ink">No documents yet</p>
            <p className="mt-1 text-xs text-muted">
              Upload a PDF to start studying.
            </p>
          </div>
        )}

        {!loading &&
          documents.map((doc) => {
            const active = doc.id === selectedId;
            return (
              <div
                key={doc.id}
                className={`group rounded-xl border p-3 transition ${
                  active
                    ? "border-brand bg-brand/5"
                    : "border-border bg-surface hover:border-brand/40"
                }`}
              >
                <button
                  onClick={() => onSelect(doc.id)}
                  className="flex w-full items-start gap-2 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">
                      {doc.filename}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {doc._count.chunks} chunks ·{" "}
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                  </span>
                  {active && (
                    <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">
                      Active
                    </span>
                  )}
                </button>
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => onDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="rounded-md px-2 py-1 text-xs font-medium text-muted transition hover:bg-red-50 hover:text-danger disabled:opacity-50"
                  >
                    {deletingId === doc.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
