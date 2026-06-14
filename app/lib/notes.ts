import { prisma } from "@/app/lib/prisma";

// Get a representative set of note chunks for whole-notes tasks (quiz, summary).
// Unlike chat (which searches for chunks relevant to a question), these features
// cover the ENTIRE notes — so we gather chunks across all documents, capped for cost.
export async function getStudyChunks(
  userId: string,
  documentId: string,
  maxChunks = 40,
): Promise<string[]> {
  // Pull every chunk's text FOR THIS USER, in document + reading order. The
  // `where: { document: { userId } }` filters through the relation so we only ever
  // read the signed-in user's notes. We select ONLY `content` (never the Unsupported
  // `embedding` column, which Prisma can't read).
  const rows = await prisma.chunk.findMany({
    where: { documentId, document: { userId } }, // this document AND owned by this user
    orderBy: [{ documentId: "asc" }, { index: "asc" }],
    select: { content: true },
  });

  const all = rows.map((r) => r.content);
  if (all.length <= maxChunks) return all;

  // Too many chunks → sample EVENLY across the whole set so coverage spans the
  // entire document, not just the beginning.
  const step = all.length / maxChunks;
  const sampled: string[] = [];
  for (let i = 0; i < maxChunks; i++) {
    sampled.push(all[Math.floor(i * step)]);
  }
  return sampled;
}
