"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { studyDocument } from "@/app/types/document";
import type { quizQuestion } from "@/app/types/quiz";
import TopBar from "@/app/components/study/TopBar";
import ChatsRail from "@/app/components/study/ChatsRail";
import DocumentsRail from "@/app/components/study/DocumentsRail";
import PlusMenu from "@/app/components/study/PlusMenu";
import QuizCard from "@/app/components/study/QuizCard";
import SummaryCard from "@/app/components/study/SummaryCard";

// The chat stream mixes saved chat turns with (ephemeral) quiz/summary cards.
type StreamItem =
  | { id: string; kind: "msg"; role: "user" | "assistant"; content: string }
  | { id: string; kind: "quiz"; questions: quizQuestion[] }
  | { id: string; kind: "summary"; content: string };

export default function StudyApp({
  userName,
  userImage,
}: {
  userName: string;
  userImage: string | null;
}) {
  // --- documents ---
  const [documents, setDocuments] = useState<studyDocument[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const [docsLoading, setDocsLoading] = useState(true);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- upload ---
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- chat stream ---
  const [items, setItems] = useState<StreamItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [generating, setGenerating] = useState<null | "quiz" | "summary">(null);
  const [error, setError] = useState<string | null>(null);

  // --- mobile drawers ---
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const refreshDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load documents.");
      setDocuments(data.documents);
      setDocsError(null);
    } catch (e) {
      setDocsError(e instanceof Error ? e.message : "Failed to load documents.");
    } finally {
      setDocsLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await refreshDocuments();
    })();
  }, [refreshDocuments]);

  // Load saved chat history when the selected document changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedDocumentId) {
        setItems([]);
        return;
      }
      setHistoryLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/messages?documentId=${selectedDocumentId}`,
        );
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || "Failed to load history.");
        setItems(
          (data.messages as { role: "user" | "assistant"; content: string }[]).map(
            (m) => ({
              id: crypto.randomUUID(),
              kind: "msg" as const,
              role: m.role,
              content: m.content,
            }),
          ),
        );
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load history.");
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedDocumentId]);

  // Auto-scroll to the newest item.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items, loading, generating]);

  // Esc closes any open mobile drawer.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setLeftOpen(false);
        setRightOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleUploaded(documentId: string) {
    setSelectedDocumentId(documentId);
    refreshDocuments();
  }

  function handleSelect(id: string) {
    setSelectedDocumentId(id);
    setError(null);
    setLeftOpen(false);
    setRightOpen(false);
  }

  async function handleDeleted(id: string) {
    if (!window.confirm("Delete this document and its notes?")) return;
    setDeletingId(id);
    setDocsError(null);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete document.");
      }
      if (selectedDocumentId === id) {
        setSelectedDocumentId(null);
        setItems([]);
      }
      await refreshDocuments();
    } catch (e) {
      setDocsError(
        e instanceof Error ? e.message : "Failed to delete document.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function uploadFile(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      handleUploaded(data.documentId);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading || historyLoading || !selectedDocumentId) return;

    // History the server needs = the chat turns so far + this new question.
    const chatHistory = items
      .filter((it) => it.kind === "msg")
      .map((it) => ({ role: it.role, content: it.content }));
    const outgoing = [...chatHistory, { role: "user" as const, content: text }];

    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), kind: "msg", role: "user", content: text },
    ]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: outgoing,
          documentId: selectedDocumentId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed.");
      setItems((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          kind: "msg",
          role: "assistant",
          content: data.reply,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function generateQuiz() {
    if (!selectedDocumentId || generating || loading) return;
    setGenerating("quiz");
    setError(null);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: selectedDocumentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate quiz.");
      setItems((prev) => [
        ...prev,
        { id: crypto.randomUUID(), kind: "quiz", questions: data.questions },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate quiz.");
    } finally {
      setGenerating(null);
    }
  }

  async function generateSummary() {
    if (!selectedDocumentId || generating || loading) return;
    setGenerating("summary");
    setError(null);
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: selectedDocumentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to summarize.");
      setItems((prev) => [
        ...prev,
        { id: crypto.randomUUID(), kind: "summary", content: data.summary },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to summarize.");
    } finally {
      setGenerating(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") sendMessage();
  }

  const busy = loading || generating !== null;
  const canChat = Boolean(selectedDocumentId) && !historyLoading;
  const activeDoc = documents.find((d) => d.id === selectedDocumentId) ?? null;

  const chatsRailProps = {
    documents,
    selectedId: selectedDocumentId,
    onSelect: handleSelect,
    loading: docsLoading,
  };
  const docsRailProps = {
    documents,
    selectedId: selectedDocumentId,
    onSelect: handleSelect,
    onDelete: handleDeleted,
    deletingId,
    loading: docsLoading,
    error: docsError,
  };

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <TopBar
        userName={userName}
        userImage={userImage}
        onOpenChats={() => setLeftOpen(true)}
        onOpenDocs={() => setRightOpen(true)}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) uploadFile(f);
          e.target.value = "";
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT rail (desktop) */}
        <aside className="hidden w-72 shrink-0 border-r border-border bg-surface lg:block">
          <ChatsRail {...chatsRailProps} />
        </aside>

        {/* CENTER chat */}
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center gap-2 border-b border-border bg-surface px-5 py-3">
            <span className="truncate font-display text-sm font-semibold text-ink">
              {activeDoc ? activeDoc.filename : "No document selected"}
            </span>
          </div>

          <div className="scroll-soft flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            {!selectedDocumentId ? (
              <EmptyChat />
            ) : (
              <div className="mx-auto w-full max-w-2xl space-y-4">
                {historyLoading && (
                  <p className="text-center text-sm text-muted">
                    Loading history…
                  </p>
                )}
                {!historyLoading && items.length === 0 && (
                  <p className="text-center text-sm text-muted">
                    Ask a question about{" "}
                    <span className="font-medium text-ink-soft">
                      {activeDoc?.filename}
                    </span>
                    , or use{" "}
                    <span className="font-medium text-ink-soft">+</span> to quiz
                    or summarize.
                  </p>
                )}

                {items.map((it) => {
                  if (it.kind === "quiz")
                    return <QuizCard key={it.id} questions={it.questions} />;
                  if (it.kind === "summary")
                    return <SummaryCard key={it.id} content={it.content} />;
                  return (
                    <div
                      key={it.id}
                      className={`animate-msg-in flex ${it.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                          it.role === "user"
                            ? "rounded-br-md bg-brand text-white"
                            : "rounded-bl-md bg-surface text-ink"
                        }`}
                      >
                        {it.content}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-surface px-4 py-3 shadow-sm">
                      <Dot delay="0ms" />
                      <Dot delay="150ms" />
                      <Dot delay="300ms" />
                    </div>
                  </div>
                )}

                {generating && (
                  <div className="animate-msg-in rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-muted shadow-sm">
                    {generating === "quiz"
                      ? "Building your quiz…"
                      : "Summarizing your notes…"}
                  </div>
                )}

                {error && (
                  <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-danger">
                    {error}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input bar with the "+" menu */}
          <div className="shrink-0 border-t border-border bg-surface p-3 sm:p-4">
            {(uploading || uploadError) && (
              <div className="mx-auto mb-2 flex w-full max-w-2xl items-center gap-2 px-1 text-xs">
                {uploading ? (
                  <span className="text-muted">Uploading and processing…</span>
                ) : (
                  <span className="text-danger">{uploadError}</span>
                )}
              </div>
            )}
            <div className="mx-auto flex w-full max-w-2xl items-center gap-2">
              <PlusMenu
                onUpload={() => fileInputRef.current?.click()}
                onQuiz={generateQuiz}
                onSummary={generateSummary}
                studyDisabled={!selectedDocumentId || busy}
              />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!canChat}
                placeholder={
                  !selectedDocumentId
                    ? "Select a document first"
                    : historyLoading
                      ? "Loading history…"
                      : "Ask anything about your notes…"
                }
                className="h-10 flex-1 rounded-xl border border-border bg-bg px-4 text-sm text-ink transition focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-60"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim() || !canChat}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-white transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT rail (desktop) */}
        <aside className="hidden w-80 shrink-0 border-l border-border bg-surface lg:block">
          <DocumentsRail {...docsRailProps} />
        </aside>
      </div>

      {/* MOBILE drawers */}
      {leftOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="animate-fade-in absolute inset-0 bg-ink/30"
            onClick={() => setLeftOpen(false)}
          />
          <div className="animate-slide-in-left absolute left-0 top-0 h-full w-72 border-r border-border bg-surface shadow-xl">
            <ChatsRail {...chatsRailProps} />
          </div>
        </div>
      )}
      {rightOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="animate-fade-in absolute inset-0 bg-ink/30"
            onClick={() => setRightOpen(false)}
          />
          <div className="animate-slide-in-right absolute right-0 top-0 h-full w-80 border-l border-border bg-surface shadow-xl">
            <DocumentsRail {...docsRailProps} />
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyChat() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <p className="mt-4 font-display text-base font-semibold text-ink">
        Pick a document to start
      </p>
      <p className="mt-1 max-w-xs text-sm text-muted">
        Choose one from your documents, or use the + menu to upload a new PDF,
        then ask away.
      </p>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-2 w-2 animate-bounce rounded-full bg-muted"
      style={{ animationDelay: delay }}
    />
  );
}
