"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeTitle, extractDriveFileId } from "@/lib/normalize";

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

export async function updatePlay(id: string, formData: FormData) {
  const driveLinkInput = str(formData, "driveLink");

  await prisma.play.update({
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
      synopsis: str(formData, "synopsis"),
      castSize: int(formData, "castSize"),
      maleCount: int(formData, "maleCount"),
      femaleCount: int(formData, "femaleCount"),
      flexibleCount: int(formData, "flexibleCount"),
      driveFileId: driveLinkInput ? extractDriveFileId(driveLinkInput) : null,
      linkSource: driveLinkInput ? "manual" : null,
    },
  });

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
      synopsis: str(formData, "synopsis"),
      castSize: int(formData, "castSize"),
      maleCount: int(formData, "maleCount"),
      femaleCount: int(formData, "femaleCount"),
      flexibleCount: int(formData, "flexibleCount"),
      driveFileId: driveLinkInput ? extractDriveFileId(driveLinkInput) : null,
      linkSource: driveLinkInput ? "manual" : null,
    },
  });

  revalidatePath("/plays");
  redirect(`/plays/${play.id}`);
}
