import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/app/lib/auth";

// GET /api/documents — list the signed-in user's documents (newest first).
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 },
    );
  }

  const documents = await prisma.document.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      filename: true,
      createdAt: true,
      _count: { select: { chunks: true } }, // how many chunks (handy to display)
    },
  });
  return NextResponse.json({ documents });
}
