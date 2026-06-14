import { GoogleGenAI } from "@google/genai";
import type { chatMessage } from "../types/chat";
import { safeParseJson } from "./json";
import type { quizQuestion } from "../types/quiz";

// Which Gemini model to use. "flash" is fast and free-tier friendly.
// Swap this string later (e.g. "gemini-2.5-flash") without touching anything else.
const MODEL = "gemini-2.5-flash";

// Takes the whole conversation, returns the AI's next reply as text.
export async function generateReply(messages: chatMessage[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local and restart the dev server. ",
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  // Gemini wants roles "user" / "model". Our UI uses "assistant", so map it.
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const response = await ai.models.generateContent({
    model: MODEL,
    contents,
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }
  return text;
}

// The "grounding" rule. This is what keeps the AI honest: answer only from the notes.
const STUDY_SYSTEM_INSTRUCTION = `Your are AI Study Buddy, a study assistant.
Answer the user's question using ONLY the notes provided below.
If the answer is not contained in the notes, reply exactly: "I couldn't find that in your notes." Do not use outside knowledge or guess. Be clear and consice."`;

// Answer a question grounded in the retrieved note chunks.
export async function answerFromNotes(
  question: string,
  contextChunks: string[],
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Number the notes so they stay distinct in the prompt.
  const notes = contextChunks
    .map((c, i) => `[Note ${i + 1}]\n${c}`)
    .join("\n\n");

  const prompt = `Notes:\n${notes}\n\nQuestion: ${question}`;

  const response = await ai.models.generateContent({
    model: MODEL, //reuse the same chat model constant
    contents: prompt,
    config: { systemInstruction: STUDY_SYSTEM_INSTRUCTION },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }
  return text;
}

// Instruction that keeps the quiz grounded and forces a strict JSON shape.
const QUIZ_SYSTEM_INSTRUCTION = `You are AI Study Buddy. Create a multiple-choice quiz based ONLY on the notes provided.
Rules:
- Every question and its correct answer must come from the notes alone. Do not use outside knowledge.
- Each question has exactly 4 options, with exactly one correct.
- Spread questions across different parts of the notes.
Return ONLY JSON of this exact shape:
{"questions":[{"question":"...","options":["...","...","...","..."],"correctIndex":0}]}
where correctIndex is the 0-based index of the correct option.`;

// Generate a grounded multiple-choice quiz from the note chunks.
export async function generateQuiz(
  contextChunks: string[],
  numQuestions = 5,
): Promise<quizQuestion[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const notes = contextChunks
    .map((c, i) => `[Note ${i + 1}]\n${c}`)
    .join("\n\n");
  const prompt = `Notes:\n${notes}\n\nCreate ${numQuestions} multiple-choice questions.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction: QUIZ_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json", // JSON mode: return clean JSON, no prose/fences
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  // Parse defensively, then keep only well-formed questions.
  const parsed = safeParseJson<{ questions: quizQuestion[] }>(text);
  if (!parsed || !Array.isArray(parsed.questions)) {
    throw new Error("Could not parse a quiz from the AI response.");
  }

  const questions = parsed.questions.filter(
    (q) =>
      q &&
      typeof q.question === "string" &&
      Array.isArray(q.options) &&
      q.options.length >= 2 &&
      typeof q.correctIndex === "number" &&
      q.correctIndex >= 0 &&
      q.correctIndex < q.options.length,
  );

  if (questions.length === 0) {
    throw new Error("The AI did not return any valid questions.");
  }

  return questions;
}

// Grounded summary instruction — key points only, from the notes.
const SUMMARY_SYSTEM_INSTRUCTION = `You are AI Study Buddy. Summarize the provided notes into clear, concise key points.
Rules:
- Use ONLY the notes. Do not add outside knowledge.
- Output 5-8 short bullet points, each on its own line starting with "- ".
- Capture the main ideas; keep each bullet brief.`;

// Produce a grounded bullet-point summary of the note chunks.
export async function summarizeNotes(contextChunks: string[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const notes = contextChunks
    .map((c, i) => `[Note ${i + 1}]\n${c}`)
    .join("\n\n");
  const prompt = `Notes:\n${notes}\n\nSummarize these notes as key bullet points.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { systemInstruction: SUMMARY_SYSTEM_INSTRUCTION },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }
  return text;
}
