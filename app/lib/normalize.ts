export function normalizeTitle(title: string): string {
  let t = title.trim().toLowerCase().replace(/^['"]|['"]$/g, "");
  t = t.replace(/[^a-z0-9]+/g, " ").trim();
  t = t.replace(/^(the|a|an) /, "");
  return t;
}

export function extractDriveFileId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const idMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) return trimmed;
  return null;
}
