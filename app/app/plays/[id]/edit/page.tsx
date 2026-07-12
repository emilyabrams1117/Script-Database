import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updatePlay } from "@/lib/actions";
import { PlayForm } from "@/components/PlayForm";

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
      <h1 className="text-2xl font-semibold mb-6">Edit &ldquo;{play.title}&rdquo;</h1>
      <PlayForm play={play} action={updatePlay.bind(null, play.id)} submitLabel="Save changes" />
    </div>
  );
}
