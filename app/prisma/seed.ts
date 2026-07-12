import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type RawPlay = {
  title: string;
  title_norm: string;
  author: string;
  author_last: string;
  read: boolean;
  seen: boolean;
  type: string;
  publication: string;
  drive_file_id: string | null;
  link_source: string | null;
};

// WARNING: this wipes every row in Play before reloading from data/plays.json --
// including any read/seen/favorite flags or manual edits. Only meant for the
// very first seed of a fresh database. For updates afterward, use
// sync-drive-links.ts / apply-metadata.ts, which patch specific fields instead.
async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add your Neon connection string to .env");
  }
  const adapter = new PrismaPg(process.env.DATABASE_URL);
  const prisma = new PrismaClient({ adapter });

  const dataPath = path.join(__dirname, "..", "..", "data", "plays.json");
  const raw: RawPlay[] = JSON.parse(readFileSync(dataPath, "utf-8"));

  await prisma.play.deleteMany();

  const batchSize = 500;
  for (let i = 0; i < raw.length; i += batchSize) {
    const batch = raw.slice(i, i + batchSize);
    await prisma.play.createMany({
      data: batch.map((p) => ({
        title: p.title,
        titleNorm: p.title_norm,
        author: p.author,
        authorLast: p.author_last || null,
        type: p.type || null,
        publication: p.publication || null,
        driveFileId: p.drive_file_id,
        linkSource: p.link_source,
        read: p.read,
        seen: p.seen,
      })),
    });
    console.log(`Seeded ${Math.min(i + batchSize, raw.length)} / ${raw.length}`);
  }

  console.log("Done.");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
