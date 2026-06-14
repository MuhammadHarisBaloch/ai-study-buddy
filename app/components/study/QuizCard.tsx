"use client";

import { useState } from "react";
import type { quizQuestion } from "@/app/types/quiz";

// An interactive multiple-choice quiz rendered inline in the chat stream.
export default function QuizCard({ questions }: { questions: quizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});

  function choose(qIndex: number, optIndex: number) {
    if (answers[qIndex] !== undefined) return; // lock once answered
    setAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  }

  const answeredCount = Object.keys(answers).length;
  const score = questions.reduce(
    (n, q, i) => (answers[i] === q.correctIndex ? n + 1 : n),
    0,
  );

  return (
    <div className="animate-msg-in rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet/10 text-violet">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </span>
        <h3 className="font-display text-sm font-semibold text-ink">
          Quiz · {questions.length} questions
        </h3>
        {answeredCount === questions.length && (
          <span className="ml-auto rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
            Score {score}/{questions.length}
          </span>
        )}
      </div>

      <div className="space-y-5">
        {questions.map((q, qi) => {
          const chosen = answers[qi];
          const answered = chosen !== undefined;
          return (
            <div key={qi}>
              <p className="text-sm font-medium text-ink">
                {qi + 1}. {q.question}
              </p>
              <div className="mt-2 space-y-2">
                {q.options.map((opt, oi) => {
                  let cls =
                    "border-border bg-surface text-ink-soft hover:border-brand/50 hover:bg-bg";
                  if (answered) {
                    if (oi === q.correctIndex)
                      cls = "border-success bg-emerald-50 text-emerald-800";
                    else if (oi === chosen)
                      cls = "border-danger bg-red-50 text-red-800";
                    else cls = "border-border bg-surface text-muted";
                  }
                  return (
                    <button
                      key={oi}
                      onClick={() => choose(qi, oi)}
                      disabled={answered}
                      className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition disabled:cursor-default ${cls}`}
                    >
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md border border-current/30 text-[11px] font-semibold">
                        {String.fromCharCode(65 + oi)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {answered && (
                <p
                  className={`mt-1.5 text-xs font-medium ${
                    chosen === q.correctIndex ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  {chosen === q.correctIndex ? "Correct!" : "Not quite."}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
