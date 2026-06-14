import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/app/lib/auth";

// DELETE /api/documents/:id — delete one of the user's documents (chunks cascade).
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }, // Next 16: params is a Promise
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Your must be signed in." },
      { status: 401 },
    );
  }

  const { id } = await params;

  // deleteMany filtered by BOTH id and userId = you can only delete your OWN document.
  // If it matched 0 rows, it wasn't yours (or doesn't exist) → 404.
  const result = await prisma.document.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
