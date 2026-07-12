/**
 * Applies AI-extracted metadata (cast/gender counts, genre, runtime,
 * synopsis) from a results file produced by scripts/backfill/extract.js.
 *
 * Matches rows by title+author only, and skips any play you've already
 * manually edited (metadataBackfilled already true from a manual save) or
 * that's already been backfilled by a prior run of this script -- so it's
 * safe to re-run as more extraction batches complete, and it never touches
 * your read/seen/favorite flags or anything else.
 *
 * Run with: npx tsx prisma/apply-metadata.ts <path-to-results.json>
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type ExtractedResult = {
  title: string;
  author: string;
  cast_size?: number;
  male_count?: number;
  female_count?: number;
  flexible_count?: number;
  genre?: string;
  runtime?: string;
  synopsis?: string;
  error?: string;
};

async function main() {
  const resultsPath = process.argv[2];
  if (!resultsPath) {
    console.error("Usage: npx tsx prisma/apply-metadata.ts <path-to-results.json>");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add your Neon connection string to .env");
  }
  const adapter = new PrismaPg(process.env.DATABASE_URL);
  const prisma = new PrismaClient({ adapter });

  const results: ExtractedResult[] = JSON.parse(readFileSync(path.resolve(resultsPath), "utf-8"));

  let applied = 0;
  let skippedManual = 0;
  let skippedError = 0;
  let skippedNotFound = 0;

  for (const r of results) {
    if (r.error) {
      skippedError++;
      continue;
    }

    const existing = await prisma.play.findFirst({
      where: { title: r.title, author: r.author },
    });
    if (!existing) {
      skippedNotFound++;
      continue;
    }
    if (existing.metadataBackfilled) {
      skippedManual++;
      continue;
    }

    await prisma.play.update({
      where: { id: existing.id },
      data: {
        castSize: r.cast_size ?? null,
        maleCount: r.male_count ?? null,
        femaleCount: r.female_count ?? null,
        flexibleCount: r.flexible_count ?? null,
        genre: r.genre ?? null,
        runtime: r.runtime ?? null,
        synopsis: r.synopsis ?? null,
        metadataBackfilled: true,
      },
    });
    applied++;
  }

  console.log(`Applied metadata to ${applied} plays.`);
  if (skippedManual > 0) console.log(`Skipped ${skippedManual} (already tagged/edited).`);
  if (skippedError > 0) console.log(`Skipped ${skippedError} (extraction had no usable text).`);
  if (skippedNotFound > 0) console.log(`Skipped ${skippedNotFound} (no matching title+author in your database).`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
