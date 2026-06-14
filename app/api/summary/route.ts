import { NextResponse } from "next/server";
import { getStudyChunks } from "@/app/lib/notes";
import { summarizeNotes } from "@/app/lib/gemini";
import { auth } from "@/app/lib/auth";

// POST /api/summary — summarize the SIGNED-IN user's stored notes.
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const { documentId } = await request.json();
    if (!documentId) {
      return NextResponse.json({ error: "No document selected." }, { status: 400 });
    }

    const chunks = await getStudyChunks(session.user.id, documentId);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "No notes yet. Upload a PDF first, then summarize." },
        { status: 400 },
      );
    }

    const summary = await summarizeNotes(chunks);
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("summary API error:", error);
    const message =
      error instanceof Error ? error.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
