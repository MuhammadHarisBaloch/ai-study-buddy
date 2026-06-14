import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/app/lib/auth";

// GET /api/messages?documentId=... — past chat for one of the user's documents.
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 },
    );
  }

  // documentId comes from the query string (?documentId=...) since this is a GET.
  const documentId = new URL(request.url).searchParams.get("documentId");
  if (!documentId) {
    return NextResponse.json({ error: "documentId is required." }, { status: 400 });
  }

  // Filter by BOTH documentId and userId → you only ever read your own history.
  const messages = await prisma.message.findMany({
    where: { documentId, userId: session.user.id },
    orderBy: { createdAt: "asc" }, // oldest first, so the chat reads top-to-bottom
    select: { role: true, content: true },
  });
  return NextResponse.json({ messages });
}
