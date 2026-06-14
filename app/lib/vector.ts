// pgvector reads a vector written as text, e.g. "[0.1,0.2,0.3]".
// This turns a number array into that string so we can cast it with ::vector in raw SQL.
export function toVectorLiteral(values: number[]): string {
  return `[${values.join(",")}]`;
}
