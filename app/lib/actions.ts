"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeTitle, extractDriveFileId } from "@/lib/normalize";
import { runExtraction } from "@/lib/extraction";
import type { Play } from "@/app/generated/prisma/client";

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function int(formData: FormData, key: string): number | null {
  const v = str(formData, key);
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : null;
}

type Flag = "read" | "seen" | "favorite";

async function toggleFlag(id: string, flag: Flag) {
  const play = await prisma.play.findUniqueOrThrow({ where: { id } });
  await prisma.play.update({
    where: { id },
    data: { [flag]: !play[flag] },
  });
  revalidatePath("/plays");
  revalidatePath(`/plays/${id}`);
}

export async function toggleRead(id: string) {
  await toggleFlag(id, "read");
}

export async function toggleSeen(id: string) {
  await toggleFlag(id, "seen");
}

export async function toggleFavorite(id: string) {
  await toggleFlag(id, "favorite");
}

// Runs Drive+Claude extraction and saves the result onto the play. In
// fill-blank mode (overwrite: false), only fields the play doesn't already
// have get replaced, so hand-typed data always wins. Never throws — a failed
// extraction (bad credentials, scanned PDF, Claude error, etc.) just leaves
// the play as it was.
async function extractAndFill(play: Play, driveFileId: string, { overwrite }: { overwrite: boolean }) {
  const result = await runExtraction({ title: play.title, author: play.author, driveFileId });
  if (!result.ok) {
    console.error(`Extraction skipped for play ${play.id}: ${result.reason}`);
    return;
  }
  const { data, extractedText } = result;
  const pick = <T>(current: T | null, extracted: T): T => (overwrite || current == null ? extracted : current);

  try {
    await prisma.play.update({
      where: { id: play.id },
      data: {
        castSize: pick(play.castSize, data.cast_size),
        maleCount: pick(play.maleCount, data.male_count),
        femaleCount: pick(play.femaleCount, data.female_count),
        flexibleCount: pick(play.flexibleCount, data.flexible_count),
        genre: pick(play.genre, data.genre),
        runtime: pick(play.runtime, data.runtime ?? null),
        year: pick(play.year, data.year ?? null),
        synopsis: pick(play.synopsis, data.synopsis),
        themes: data.themes,
        extractedText,
        metadataBackfilled: true,
      },
    });
  } catch (err) {
    console.error(`Failed to save extracted metadata for play ${play.id}:`, err);
  }
}

export async function updatePlay(id: string, formData: FormData) {
  const driveLinkInput = str(formData, "driveLink");
  const newDriveFileId = driveLinkInput ? extractDriveFileId(driveLinkInput) : null;

  const before = await prisma.play.findUniqueOrThrow({ where: { id } });

  const play = await prisma.play.update({
    where: { id },
    data: {
      title: str(formData, "title") ?? undefined,
      titleNorm: str(formData, "title") ? normalizeTitle(str(formData, "title")!) : undefined,
      author: str(formData, "author") ?? undefined,
      authorLast: str(formData, "authorLast"),
      type: str(formData, "type"),
      publication: str(formData, "publication"),
      genre: str(formData, "genre"),
      runtime: str(formData, "runtime"),
      year: int(formData, "year"),
      synopsis: str(formData, "synopsis"),
      castSize: int(formData, "castSize"),
      maleCount: int(formData, "maleCount"),
      femaleCount: int(formData, "femaleCount"),
      flexibleCount: int(formData, "flexibleCount"),
      driveFileId: newDriveFileId,
      linkSource: driveLinkInput ? "manual" : null,
      metadataBackfilled: true,
    },
  });

  // Only re-run extraction if the Drive file actually changed — editing
  // other fields shouldn't trigger another Claude call.
  if (newDriveFileId && newDriveFileId !== before.driveFileId) {
    await extractAndFill(play, newDriveFileId, { overwrite: false });
  }

  revalidatePath("/plays");
  revalidatePath(`/plays/${id}`);
  redirect(`/plays/${id}`);
}

export async function createPlay(formData: FormData) {
  const title = str(formData, "title");
  const author = str(formData, "author");
  if (!title || !author) {
    throw new Error("Title and author are required");
  }
  const driveLinkInput = str(formData, "driveLink");
  const driveFileId = driveLinkInput ? extractDriveFileId(driveLinkInput) : null;

  const play = await prisma.play.create({
    data: {
      title,
      titleNorm: normalizeTitle(title),
      author,
      authorLast: str(formData, "authorLast"),
      type: str(formData, "type"),
      publication: str(formData, "publication"),
      genre: str(formData, "genre"),
      runtime: str(formData, "runtime"),
      year: int(formData, "year"),
      synopsis: str(formData, "synopsis"),
      castSize: int(formData, "castSize"),
      maleCount: int(formData, "maleCount"),
      femaleCount: int(formData, "femaleCount"),
      flexibleCount: int(formData, "flexibleCount"),
      driveFileId,
      linkSource: driveLinkInput ? "manual" : null,
    },
  });

  if (driveFileId) {
    await extractAndFill(play, driveFileId, { overwrite: false });
  }

  revalidatePath("/plays");
  redirect(`/plays/${play.id}`);
}

export async function reextractPlay(id: string) {
  const play = await prisma.play.findUniqueOrThrow({ where: { id } });
  if (play.driveFileId) {
    await extractAndFill(play, play.driveFileId, { overwrite: true });
  }

  revalidatePath("/plays");
  revalidatePath(`/plays/${id}`);
  redirect(`/plays/${id}`);
}

export async function deletePlay(id: string) {
  await prisma.play.delete({ where: { id } });
  revalidatePath("/plays");
  redirect("/plays");
}
