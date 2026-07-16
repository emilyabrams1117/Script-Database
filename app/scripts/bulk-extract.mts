/**
 * Runs Drive+Claude extraction for every play that has a Drive link but no
 * extracted data yet, writing results directly to the live database via the
 * same lib/extraction.ts pipeline the app uses.
 *
 * Resumable: only selects plays where castSize is still null, so a
 * killed/restarted run just picks up where it left off — no double-billing
 * already-processed plays.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/bulk-extract.ts [concurrency] [limit]
 *
 * Examples:
 *   npx tsx --env-file=.env scripts/bulk-extract.ts 4 20   # test batch
 *   npx tsx --env-file=.env scripts/bulk-extract.ts 8      # full run
 */
import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";
import { runExtraction } from "../lib/extraction";

const CONCURRENCY = Number(process.argv[2] ?? 4);
const LIMIT = process.argv[3] ? Number(process.argv[3]) : undefined;
const MAX_RETRIES = 2;

const LOG_PATH =
  process.env.BULK_EXTRACT_LOG ??
  path.join("/private/tmp/claude-501/-Users-emilyabrams/01931dc5-333d-4a48-b001-528c9dafccb2/scratchpad", "bulk-extract.log");

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + "\n");
}

function estCost(inputTokens: number, outputTokens: number) {
  // Haiku 4.5 pricing: $1/MTok in, $5/MTok out (informational estimate only)
  return (inputTokens / 1e6) * 1 + (outputTokens / 1e6) * 5;
}

function isLowBalance(msg: string) {
  return /credit balance is too low/i.test(msg);
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const message = err instanceof Error ? err.message : String(err);
      // No point retrying — the account is out of credits, not a transient blip.
      if (isLowBalance(message)) throw err;
      if (attempt < MAX_RETRIES) {
        const delay = 2000 * 2 ** attempt;
        log(`  retrying ${label} after error (attempt ${attempt + 1}/${MAX_RETRIES}): ${message} — waiting ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

async function main() {
  const candidates = await prisma.play.findMany({
    where: { driveFileId: { not: null }, castSize: null },
    select: { id: true, title: true, author: true, driveFileId: true },
    orderBy: { id: "asc" },
    take: LIMIT,
  });

  log(`Found ${candidates.length} candidates (concurrency=${CONCURRENCY}, limit=${LIMIT ?? "none"})`);

  let processed = 0;
  let succeeded = 0;
  let noText = 0;
  let errored = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  let idx = 0;
  let halted = false;
  async function worker() {
    while (true) {
      if (halted) return;
      const i = idx++;
      if (i >= candidates.length) return;
      const play = candidates[i];
      try {
        const result = await withRetry(
          () => runExtraction({ title: play.title, author: play.author, driveFileId: play.driveFileId! }),
          play.title
        );
        if (!result.ok) {
          if (result.reason === "no_text") {
            noText++;
          } else {
            errored++;
            if (isLowBalance(result.reason) && !halted) {
              halted = true;
              log(`HALTING: Anthropic account is out of credits. Add funds and re-run — already-completed plays won't be reprocessed.`);
            }
          }
          log(`[${i + 1}/${candidates.length}] SKIP "${play.title}": ${result.reason}`);
        } else {
          await prisma.play.update({
            where: { id: play.id },
            data: {
              castSize: result.data.cast_size,
              maleCount: result.data.male_count,
              femaleCount: result.data.female_count,
              flexibleCount: result.data.flexible_count,
              genre: result.data.genre,
              runtime: result.data.runtime ?? null,
              year: result.data.year ?? null,
              synopsis: result.data.synopsis,
              themes: result.data.themes,
              extractedText: result.extractedText,
              metadataBackfilled: true,
            },
          });
          succeeded++;
          totalInputTokens += result.usage.inputTokens;
          totalOutputTokens += result.usage.outputTokens;
          log(`[${i + 1}/${candidates.length}] OK "${play.title}" (cast ${result.data.cast_size}, ${result.data.themes.length} themes)`);
        }
      } catch (err) {
        errored++;
        log(`[${i + 1}/${candidates.length}] ERROR "${play.title}": ${err instanceof Error ? err.message : err}`);
      }
      processed++;
      if (processed % 25 === 0) {
        log(
          `--- progress: ${processed}/${candidates.length} (${succeeded} ok, ${noText} no-text, ${errored} errors) | est. cost so far: $${estCost(totalInputTokens, totalOutputTokens).toFixed(2)} ---`
        );
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  log(
    `DONE. processed=${processed} succeeded=${succeeded} noText=${noText} errored=${errored} estCost=$${estCost(totalInputTokens, totalOutputTokens).toFixed(2)}`
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
