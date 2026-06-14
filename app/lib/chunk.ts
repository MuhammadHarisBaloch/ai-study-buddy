// Split one long string into many smaller, OVERLAPPING pieces.
//   size    = max characters per chunk (~800)
//   overlap = characters each chunk shares with the previous one (~100)
export function chunkText(text: string, size = 800, overlap = 100): string[] {
  // 1) Normalize whitespace: collapse runs of spaces/newlines/tabs into single spaces.
  //    PDFs are full of stray line breaks; this makes chunks clean and predictable.
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return []; // empty input -> no chunks

  const chunks: string[] = [];
  const step = size - overlap; //  how far the window advances each time (e.g. 800-100=700)

  for (let start = 0; start < clean.length; start += step) {
    chunks.push(clean.slice(start, start + size));
  }
  return chunks;
}
