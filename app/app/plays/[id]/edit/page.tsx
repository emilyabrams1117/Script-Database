import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updatePlay, deletePlay } from "@/lib/actions";
import { PlayForm } from "@/components/PlayForm";
import { DeleteButton } from "@/components/DeleteButton";

// Drive download + Claude extraction can take a few seconds.
export const maxDuration = 60;

export default async function EditPlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const play = await prisma.play.findUnique({ where: { id } });
  if (!play) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold">Edit &ldquo;{play.title}&rdquo;</h1>
        <DeleteButton
          action={deletePlay.bind(null, play.id)}
          confirmMessage={`Delete "${play.title}"? This can't be undone.`}
        />
      </div>
      <PlayForm play={play} action={updatePlay.bind(null, play.id)} submitLabel="Save changes" />
    </div>
  );
}
