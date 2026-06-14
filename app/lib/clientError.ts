// Curated, user-safe copy for failed requests. The client renders ONLY what this
// returns — a second guard so internal error details can never surface in the UI.
//
// 5xx / AI-busy → fixed curated strings (never the server's raw text).
// 4xx          → we trust our OWN validation messages (e.g. "No document selected.",
//                "...scanned or image-only PDF.") since those are hardcoded server-side
//                and are genuinely helpful to show.

const AI_BUSY = "The AI is busy right now — please try again in a moment.";
const GENERIC = "Something went wrong. Please try again.";

export function friendlyError(
  status?: number,
  code?: string,
  serverMessage?: string,
): string {
  if (code === "AI_BUSY" || status === 503 || status === 429) return AI_BUSY;

  // Client-side validation errors carry safe, useful messages — show them as-is.
  if (status && status >= 400 && status < 500 && serverMessage) {
    return serverMessage;
  }

  return GENERIC;
}
