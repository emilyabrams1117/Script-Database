import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";

export const PAGE_SIZE = 30;

export type PlaySearchParams = {
  q?: string;
  author?: string;
  genre?: string;
  type?: string;
  read?: string;
  seen?: string;
  favorite?: string;
  missingLink?: string;
  minMale?: string;
  minFemale?: string;
  sort?: string;
  page?: string;
};

export function buildWhere(params: PlaySearchParams): Prisma.PlayWhereInput {
  const where: Prisma.PlayWhereInput = {};
  const and: Prisma.PlayWhereInput[] = [];

  if (params.q) {
    and.push({
      OR: [
        { title: { contains: params.q } },
        { author: { contains: params.q } },
        { synopsis: { contains: params.q } },
        { extractedText: { contains: params.q } },
      ],
    });
  }
  if (params.author) and.push({ authorLast: { contains: params.author } });
  if (params.genre) and.push({ genre: { contains: params.genre } });
  if (params.type) and.push({ type: params.type });
  if (params.read === "1") and.push({ read: true });
  if (params.seen === "1") and.push({ seen: true });
  if (params.favorite === "1") and.push({ favorite: true });
  if (params.missingLink === "1") and.push({ driveFileId: null });
  if (params.minMale) and.push({ maleCount: { gte: Number(params.minMale) } });
  if (params.minFemale) and.push({ femaleCount: { gte: Number(params.minFemale) } });

  if (and.length) where.AND = and;
  return where;
}

export function buildOrderBy(sort?: string): Prisma.PlayOrderByWithRelationInput {
  switch (sort) {
    case "author":
      return { authorLast: "asc" };
    case "recent":
      return { createdAt: "desc" };
    default:
      return { titleNorm: "asc" };
  }
}

export async function getPlays(params: PlaySearchParams) {
  const where = buildWhere(params);
  const orderBy = buildOrderBy(params.sort);
  const page = Math.max(1, Number(params.page) || 1);

  const [plays, total] = await Promise.all([
    prisma.play.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.play.count({ where }),
  ]);

  return { plays, total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getFilterOptions() {
  const [genres, types] = await Promise.all([
    prisma.play.findMany({
      where: { genre: { not: null } },
      select: { genre: true },
      distinct: ["genre"],
      orderBy: { genre: "asc" },
    }),
    prisma.play.findMany({
      where: { type: { not: null } },
      select: { type: true },
      distinct: ["type"],
      orderBy: { type: "asc" },
    }),
  ]);
  return {
    genres: genres.map((g) => g.genre!).filter(Boolean),
    types: types.map((t) => t.type!).filter(Boolean),
  };
}
