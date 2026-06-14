import { prisma } from "@/app/lib/prisma";
import { embedTexts } from "@/app/lib/embeddings";
import { toVectorLiteral } from "@/app/lib/vector";

// A chunk found by search, plus how similar it is to the question (0..1, higher = closer).
export interface retrievedChunk {
  id: string;
  content: string;
  similarity: number;
}

// Find the K chunks belonging to THIS user whose meaning is closest to the question.
export async function findRelevantChunks(
  question: string,
  userId: string,
  documentId: string,
  k = 5,
): Promise<retrievedChunk[]> {
  // 1) Embed the QUESTION into the same 768-dim space as the stored chunks.
  //    taskType "RETRIEVAL_QUERY" tells Gemini this vector is a search query.
  const [queryVector] = await embedTexts([question], "RETRIEVAL_QUERY");
  const literal = toVectorLiteral(queryVector);

  // 2) pgvector's <=> = cosine DISTANCE (0 = identical direction, 2 = opposite).
  //    We JOIN to "Document" and filter d."userId" = ${userId} so a user can ONLY
  //    ever match their own chunks. (Raw SQL can't use Prisma's `where`, so the
  //    ownership check lives right here in the query — enforced on the server.)
  const rows = await prisma.$queryRaw<retrievedChunk[]>`
    SELECT c.id, c.content,
           1 - (c.embedding <=> ${literal}::vector) AS similarity
    FROM "chunk" c
    JOIN "Document" d ON d.id = c."documentId"
    WHERE c.embedding IS NOT NULL AND d."userId" = ${userId} AND c. "documentId" = ${documentId}
    ORDER BY c.embedding <=> ${literal}::vector
    LIMIT ${k}
  `;

  return rows;
}
