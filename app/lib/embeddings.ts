import { GoogleGenAI } from "@google/genai";

// The embedding model. text-embedding-004 outputs 768 numbers per text (matches our column).
const EMBED_MODEL = "gemini-embedding-001";

// How the text will be used — this gently tunes the resulting vector.
export type embedTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

// Turn an array of texts into an array of 768-number vectors (one vector per input).
export async function embedTexts(
  texts: string[],
  taskType: embedTaskType,
): Promise<number[][]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // One call embeds all the texts at once (a "batch").
  const response = await ai.models.embedContent({
    model: EMBED_MODEL,
    contents: texts,
    config: { taskType, outputDimensionality: 768 },
  });

  const embeddings = response.embeddings;
  if (!embeddings || embeddings.length != texts.length) {
    throw new Error("Embedding response did not match the number of inputs.");
  }

  // Each result has a `.values` array — that's the 768 numbers.
  return embeddings.map((e) => e.values as number[]);
}
