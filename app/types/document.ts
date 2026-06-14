// One document as returned by GET /api/documents.
export interface studyDocument {
  id: string;
  filename: string;
  createdAt: string; // JSON serializes dates to strings
  _count: { chunks: number };
}
