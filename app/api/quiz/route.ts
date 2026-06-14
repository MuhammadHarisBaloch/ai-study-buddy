import { NextResponse } from "next/server";
import { getStudyChunks } from "@/app/lib/notes";
import { generateQuiz } from "@/app/lib/gemini";
import { auth } from "@/app/lib/auth";
import { toApiError } from "@/app/lib/apiError";
import { prisma } from "@/app/lib/prisma";
import { Prisma } from "@prisma/client";

// POST /api/quiz — build a quiz from the SIGNED-IN user's stored notes.
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 },
      );
    }

    const { documentId } = await request.json();
    if (!documentId) {
      return NextResponse.json(
        { error: "No document selected." },
        { status: 400 },
      );
    }

    const chunks = await getStudyChunks(session.user.id, documentId);

    // No notes uploaded yet → friendly guidance, not a crash.
    if (chunks.length === 0) {
      return NextResponse.json(
        {
          error: "No notes yet. Upload a pdf first, then generate a quiz.",
        },
        { status: 400 },
      );
    }

    const questions = await generateQuiz(chunks, 5);

    // Save to history so the quiz reappears when the user reopens this document.
    await prisma.message.create({
      data: {
        role: "assistant",
        kind: "quiz",
        content: "",
        // quizQuestion[] is plain JSON, but Prisma's Json input type needs a cast.
        data: questions as unknown as Prisma.InputJsonValue,
        documentId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Quiz API error", error);
    const { status, code, message } = toApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
