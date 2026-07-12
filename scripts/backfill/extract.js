/**
 * Downloads each play's PDF from Drive, extracts its text, and asks Claude
 * to pull out cast size / gender breakdown / genre / runtime / synopsis.
 *
 * Usage:
 *   node extract.js <plays.json> <out.json> [limit]
 *
 * Resumable: skips any play already present (with a result) in out.json,
 * and writes progress after every play so a crash/interrupt doesn't lose
 * work already paid for.
 */
const fs = require("fs");
const path = require("path");
const { GoogleAuth } = require("google-auth-library");
const Anthropic = require("@anthropic-ai/sdk");
const pdfParse = require("pdf-parse");
require("dotenv").config({ path: path.join(__dirname, "..", "..", "app", "credentials", "anthropic.env") });

const MODEL = "claude-haiku-4-5";
const MAX_CHARS = 60000; // keep cost/time bounded; cast lists + enough plot context are almost always within this

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function getDriveClient() {
  const auth = new GoogleAuth({
    keyFile: path.join(__dirname, "..", "..", "app", "credentials", "drive-service-account.json"),
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  return auth.getClient();
}

async function downloadPdfText(client, fileId) {
  const res = await client.request({
    url: `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    responseType: "arraybuffer",
  });
  const buf = Buffer.from(res.data);
  const parsed = await pdfParse(buf);
  return parsed.text;
}

const TOOL = {
  name: "record_play_metadata",
  description: "Record structured metadata extracted from a play/musical script.",
  input_schema: {
    type: "object",
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
      synopsis: { type: "string", description: "A 2-4 sentence, spoiler-light synopsis." },
    },
    required: ["cast_size", "male_count", "female_count", "flexible_count", "genre", "synopsis"],
  },
};

async function extractMetadata(title, author, text) {
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
  if (!toolUse) throw new Error("No tool_use in response");
  return { data: toolUse.input, usage: msg.usage };
}

async function main() {
  const [playsPath, outPath, limitArg] = process.argv.slice(2);
  const limit = limitArg ? parseInt(limitArg, 10) : Infinity;

  const plays = JSON.parse(fs.readFileSync(playsPath, "utf-8"));
  const candidates = plays.filter((p) => p.drive_file_id);

  let results = [];
  if (fs.existsSync(outPath)) {
    results = JSON.parse(fs.readFileSync(outPath, "utf-8"));
  }
  const done = new Set(results.map((r) => `${r.title}::${r.author}`));

  const client = await getDriveClient();

  let processed = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (const play of candidates) {
    if (processed >= limit) break;
    const key = `${play.title}::${play.author}`;
    if (done.has(key)) continue;

    process.stdout.write(`[${processed + 1}/${Math.min(limit, candidates.length)}] ${play.title}... `);
    try {
      const text = await downloadPdfText(client, play.drive_file_id);
      if (!text || text.trim().length < 200) {
        console.log("SKIP (no extractable text, likely a scanned image PDF)");
        results.push({ title: play.title, author: play.author, error: "no_text" });
        processed++;
        fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
        continue;
      }
      const { data, usage } = await extractMetadata(play.title, play.author, text);
      results.push({ title: play.title, author: play.author, ...data });
      totalInputTokens += usage.input_tokens;
      totalOutputTokens += usage.output_tokens;
      console.log(`OK (cast ${data.cast_size}, ${usage.input_tokens}in/${usage.output_tokens}out tokens)`);
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      results.push({ title: play.title, author: play.author, error: err.message });
    }
    processed++;
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  }

  console.log(`\nProcessed ${processed} plays.`);
  console.log(`Total tokens: ${totalInputTokens} in / ${totalOutputTokens} out`);
  // Haiku 4.5 pricing: $1/MTok in, $5/MTok out (informational estimate only)
  const estCost = (totalInputTokens / 1e6) * 1 + (totalOutputTokens / 1e6) * 5;
  console.log(`Estimated cost for this run: $${estCost.toFixed(4)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
