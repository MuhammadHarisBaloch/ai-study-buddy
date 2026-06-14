// Safely parse JSON that came from an AI. Returns null instead of throwing,
// so callers can handle "the model returned junk" gracefully.
export function safeParseJson<T>(raw: string): T | null {
  let text = raw.trim();

  // Models sometimes wrap JSON in ```json ... ``` fences — strip them.
  if (text.startsWith("```")) {
    text = text
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    // Fallback: grab the outermost { … } or [ … ] and try once more.
    const match = text.match(/[[{][\s\S]*[\]}]/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}
