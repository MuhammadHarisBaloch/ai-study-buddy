import { NextResponse } from "next/server";
import { getStudyChunks } from "@/app/lib/notes";
import { summarizeNotes } from "@/app/lib/gemini";
import { auth } from "@/app/lib/auth";
import { toApiError } from "@/app/lib/apiError";
import { prisma } from "@/app/lib/prisma";

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

    // Save to history so the summary reappears when the user reopens this document.
    await prisma.message.create({
      data: {
        role: "assistant",
        kind: "summary",
        content: summary,
        documentId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("summary API error:", error);
    const { status, code, message } = toApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
