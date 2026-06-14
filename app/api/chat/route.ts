import { NextResponse } from "next/server";
import { answerFromNotes } from "@/app/lib/gemini";
import { findRelevantChunks } from "@/app/lib/retrieval";
import { auth } from "@/app/lib/auth";
import type { chatMessage } from "@/app/types/chat";
import { prisma } from "@/app/lib/prisma";

// Runs on the SERVER. POST /api/chat — answers from the SIGNED-IN user's notes (RAG).
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const messages = body?.messages as chatMessage[] | undefined;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Request must include a non-empty 'messages' array." },
        { status: 400 },
      );
    }

    const documentId = body?.documentId as string | undefined;
    if (!documentId) {
      return NextResponse.json(
        {
          error: "No document selected.",
        },
        { status: 400 },
      );
    }

    // The latest user message is the question we answer.
    const question = messages[messages.length - 1].content;

    // 1) RETRIEVE: find the chunks most related to the question — scoped to this user.
    const chunks = await findRelevantChunks(
      question,
      session.user.id,
      documentId,
      5,
    );

    // 2) If nothing is stored yet, guide the user to upload notes.
    if (chunks.length === 0) {
      return NextResponse.json({
        reply:
          "I don't have any notes yet. Upload a PDF of your notes first, then ask me about them.",
      });
    }

    // 3) GROUND: answer using only those chunks.
    const reply = await answerFromNotes(
      question,
      chunks.map((c) => c.content),
    );

    // Save this turn to history (the user's question + the assistant's answer).
    await prisma.message.createMany({
      data: [
        {
          role: "user",
          content: question,
          documentId,
          userId: session?.user.id,
        },
        {
          role: "assistant",
          content: reply,
          documentId,
          userId: session?.user.id,
        },
      ],
    });

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("chat API error:", error);
    const message =
      error instanceof Error ? error.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
