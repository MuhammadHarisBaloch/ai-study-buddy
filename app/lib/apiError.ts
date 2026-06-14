// Maps an arbitrary thrown error into a SAFE, user-facing API response shape.
// The raw error (which for a Gemini 503 is literally `{"error":{"code":503,...}}`)
// must never reach the client — callers log the real error with console.error and
// return only the { status, code, message } this produces.

export interface ApiErrorResult {
  status: number;
  code: string;
  message: string;
}

const AI_BUSY: ApiErrorResult = {
  status: 503,
  code: "AI_BUSY",
  message: "The AI is busy right now — please try again in a moment.",
};

const GENERIC: ApiErrorResult = {
  status: 500,
  code: "GENERIC",
  message: "Something went wrong. Please try again.",
};

export function toApiError(error: unknown): ApiErrorResult {
  // The @google/genai SDK attaches a numeric `status` on its errors; use it if present.
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? Number((error as { status?: unknown }).status)
      : undefined;

  const text =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  const haystack = `${status ?? ""} ${text}`.toLowerCase();

  // "Busy" = the model is overloaded / rate-limited / temporarily unavailable.
  const busy =
    status === 503 ||
    status === 429 ||
    /unavailable|overloaded|high demand|try again later|rate.?limit|resource_exhausted|quota/.test(
      haystack,
    );

  return busy ? AI_BUSY : GENERIC;
}
