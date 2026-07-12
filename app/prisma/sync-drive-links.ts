/**
 * One-off patch: updates driveFileId/linkSource on existing rows to pick up
 * newly-verified Drive matches, WITHOUT touching read/seen/favorite flags or
 * anything you've manually edited (rows with linkSource "manual" are left
 * alone on purpose).
 *
 * Run with: npx tsx prisma/sync-drive-links.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

type SourcePlay = {
  title: string;
  author: string;
  drive_file_id: string | null;
  link_source: string | null;
};

async function main() {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  });
  const prisma = new PrismaClient({ adapter });

  const dataPath = path.join(__dirname, "..", "..", "data", "plays.json");
  const source: SourcePlay[] = JSON.parse(readFileSync(dataPath, "utf-8"));
  const withLinks = source.filter((p) => p.drive_file_id);

  let updated = 0;
  let unchanged = 0;
  let skippedManual = 0;

  for (const p of withLinks) {
    const existing = await prisma.play.findFirst({
      where: { title: p.title, author: p.author },
    });
    if (!existing) continue;

    if (existing.linkSource === "manual") {
      skippedManual++;
      continue;
    }

    if (existing.driveFileId === p.drive_file_id) {
      unchanged++;
      continue;
    }

    await prisma.play.update({
      where: { id: existing.id },
      data: { driveFileId: p.drive_file_id, linkSource: p.link_source },
    });
    updated++;
  }

  console.log(`Updated ${updated} plays with a new/better Drive link.`);
  console.log(`${unchanged} already had the correct link.`);
  if (skippedManual > 0) {
    console.log(`Left ${skippedManual} alone since you'd manually set their link.`);
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
