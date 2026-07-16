import { GoogleAuth } from "google-auth-library";
import Anthropic from "@anthropic-ai/sdk";

// pdf-parse's Node build still resolves through pdfjs-dist code paths that
// reference the browser-only DOMMatrix global, which crashes at import time
// in some serverless runtimes. Polyfill it before pdf-parse loads.
if (typeof globalThis.DOMMatrix === "undefined") {
  const { default: DOMMatrix } = await import("dommatrix");
  globalThis.DOMMatrix = DOMMatrix;
}

const { PDFParse } = await import("pdf-parse");

const MODEL = "claude-haiku-4-5";
const MAX_CHARS = 60000; // keep cost/time bounded; cast lists + enough plot context are almost always within this

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function getDriveClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set");
  // Stored base64-encoded to sidestep .env quoting/escaping of the JSON's
  // embedded quotes and newlines (the key's PEM block).
  const json = Buffer.from(raw, "base64").toString("utf-8");
  const auth = new GoogleAuth({
    credentials: JSON.parse(json),
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  return auth.getClient();
}

async function fetchDrivePdfText(driveFileId: string): Promise<string> {
  const client = await getDriveClient();
  const res = await client.request<ArrayBuffer>({
    url: `https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`,
    responseType: "arraybuffer",
  });
  const buf = Buffer.from(res.data as ArrayBuffer);
  const parser = new PDFParse({ data: buf });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

const TOOL = {
  name: "record_play_metadata",
  description: "Record structured metadata extracted from a play/musical script.",
  input_schema: {
    type: "object" as const,
    properties: {
      cast_size: { type: "integer", description: "Total number of distinct named/credited roles." },
      male_count: { type: "integer", description: "Number of male-identified roles." },
      female_count: { type: "integer", description: "Number of female-identified roles." },
      flexible_count: {
        type: "integer",
        description: "Roles playable by any gender, ensemble, or unspecified gender.",
      },
      genre: {
        type: "string",
        description: "Short genre label, e.g. 'Comedy', 'Drama', 'Dark Comedy', 'Musical', 'Farce'.",
      },
      runtime: {
        type: "string",
        description:
          "Estimated running time if stated in the script (e.g. '90 minutes'); otherwise a rough estimate from page/scene count, e.g. '~100 minutes (estimated)'.",
      },
      year: {
        type: "integer",
        description:
          "The copyright or publication year printed on the script (e.g. in a copyright notice or publisher's imprint), as a 4-digit year. Omit this field entirely if no such year is stated anywhere in the text.",
      },
      synopsis: { type: "string", description: "A 2-4 sentence, spoiler-light synopsis." },
      themes: {
        type: "array",
        items: { type: "string" },
        description:
          "3-8 short lowercase keyword tags for themes/subject matter (e.g. 'grief', 'coming-of-age', 'holiday', 'family drama') to help this play surface in search.",
      },
    },
    required: ["cast_size", "male_count", "female_count", "flexible_count", "genre", "synopsis", "themes"],
  },
};

type ExtractedMetadata = {
  cast_size: number;
  male_count: number;
  female_count: number;
  flexible_count: number;
  genre: string;
  runtime?: string;
  year?: number;
  synopsis: string;
  themes: string[];
};

async function extractMetadata(
  title: string,
  author: string,
  text: string
): Promise<ExtractedMetadata> {
  const excerpt = text.slice(0, MAX_CHARS);
  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "record_play_metadata" },
    messages: [
      {
        role: "user",
        content: `Here is the text of the play/musical "${title}" by ${author}. Read it and record its metadata using the record_play_metadata tool.\n\n${excerpt}`,
      },
    ],
  });
  const toolUse = msg.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") throw new Error("No tool_use in response");
  return toolUse.input as ExtractedMetadata;
}

export type RunExtractionResult =
  | { ok: true; data: ExtractedMetadata; extractedText: string }
  | { ok: false; reason: string };

export async function runExtraction({
  title,
  author,
  driveFileId,
}: {
  title: string;
  author: string;
  driveFileId: string;
}): Promise<RunExtractionResult> {
  try {
    const text = await fetchDrivePdfText(driveFileId);
    if (!text || text.trim().length < 200) {
      return { ok: false, reason: "no_text" };
    }
    const data = await extractMetadata(title, author, text);
    return { ok: true, data, extractedText: text };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}
