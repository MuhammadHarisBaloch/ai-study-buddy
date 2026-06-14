import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { extractPdfText } from "@/app/lib/pdf";
import { chunkText } from "@/app/lib/chunk";
import { embedTexts } from "@/app/lib/embeddings";
import { toVectorLiteral } from "@/app/lib/vector";
import { auth } from "@/app/lib/auth";

const MAX_BYTES = 10 * 1024 * 1024; //10 MB

export async function POST(request: Request) {
  try {
    // 0) Must be signed in. We read the user from the SERVER session — never trust the client.
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be signed in to upload notes." },
        { status: 401 },
      );
    }

    // 1) Pull the uploaded file out of the multipart form data.
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No file was uploaded." },
        { status: 400 },
      );
    }

    // 2) Validate: must be a PDF, within the size cap.
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return NextResponse.json(
        { error: "Please upload a pdf file." },
        { status: 400 },
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File is too large (max 10 MB)." },
        { status: 400 },
      );
    }

    // 3) Convert the file to raw bytes, then extract its text.
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { text, pageCount } = await extractPdfText(bytes);

    // 4) EDGE CASE: scanned / image-only PDFs have no selectable text.
    if (!text) {
      return NextResponse.json(
        {
          error:
            "No selectable text found - this looks like a scanned or image-only PDF.",
        },
        { status: 422 }, // 422 = "I understood the request, but can't process this content"
      );
    }

    // 5) Split the text into overlapping chunks.
    const chunks = chunkText(text);

    // 6) Save the Document AND its Chunks (nested create). `include: { chunks: true }`
    //    gives us the created chunk rows back — we need their database ids next.
    const doc = await prisma.document.create({
      data: {
        filename: file.name,
        pageCount,
        userId: session.user.id, // tag the document with its owner
        chunks: {
          create: chunks.map((content, index) => ({ content, index })),
        },
      },
      include: { chunks: true },
    });

    // 7) Embed every chunk's text in ONE batch call, then store each vector.
    //    Prisma can't write the Unsupported `vector` column, so we use raw SQL ($executeRaw).
    const vectors = await embedTexts(
      doc.chunks.map((c) => c.content),
      "RETRIEVAL_DOCUMENT",
    );

    for (let i = 0; i < doc.chunks.length; i++) {
      await prisma.$executeRaw`
        UPDATE "chunk"
        SET embedding = ${toVectorLiteral(vectors[i])}::vector
        WHERE id = ${doc.chunks[i].id}`;
    }

    // 8) Return a summary + a preview of chunk #0.
    return NextResponse.json({
      documentId: doc.id,
      filename: doc.filename,
      pageCount: doc.chunks.length,
      preview: chunks[0].slice(0, 200),
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to process the PDF. Please try again.",
        code: "GENERIC",
      },
      { status: 500 },
    );
  }
}
