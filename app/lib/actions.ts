"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
