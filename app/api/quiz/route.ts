import { NextResponse } from "next/server";
import { getStudyChunks } from "@/app/lib/notes";
import { generateQuiz } from "@/app/lib/gemini";
import { auth } from "@/app/lib/auth";

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
    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Quiz API error", error);
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
