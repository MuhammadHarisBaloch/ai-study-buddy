// Extract plain text from a PDF's raw bytes.
// We LAZY-LOAD unpdf with `await import(...)` INSIDE the function (not a top-of-file
// import) so the heavy PDF library only loads when an upload actually happens — this
// keeps it serverless-friendly and avoids the startup crashes pdf-parse causes.
export async function extractPdfText(bytes: Uint8Array) {
  const { extractText, getDocumentProxy } = await import("unpdf");

  const pdf = await getDocumentProxy(bytes); // parse the bytes into a PDF object
  const { totalPages, text } = await extractText(pdf, {
    // pull out the text
    mergePages: true, // join all pages into one string
  });

  return { text: text.trim(), pageCount: totalPages };
}
