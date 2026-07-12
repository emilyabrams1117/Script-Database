/**
 * One-off cleanup: removes plays that are Print-only (no PDF ever expected)
 * and had no Drive link. Deletes by exact title+author match only — does
 * NOT touch any other row, so your read/seen/favorite flags and manual
 * edits on everything else are untouched.
 *
 * Run with: npx tsx prisma/remove-print-only.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type ToDelete = { title: string; author: string };

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add your Neon connection string to .env");
  }
  const adapter = new PrismaPg(process.env.DATABASE_URL);
  const prisma = new PrismaClient({ adapter });

  const listPath = path.join(__dirname, "..", "..", "data", "print_only_to_delete.json");
  const toDelete: ToDelete[] = JSON.parse(readFileSync(listPath, "utf-8"));

  let deleted = 0;
  let skipped = 0;
  for (const { title, author } of toDelete) {
    const result = await prisma.play.deleteMany({
      where: { title, author, driveFileId: null },
    });
    if (result.count > 0) {
      deleted += result.count;
    } else {
      skipped++;
    }
  }

  console.log(`Deleted ${deleted} print-only plays.`);
  if (skipped > 0) {
    console.log(
      `Skipped ${skipped} (already deleted, edited, or a Drive link was added since the list was generated).`
    );
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
