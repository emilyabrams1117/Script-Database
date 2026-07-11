import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toggleRead, toggleSeen, toggleFavorite } from "@/lib/actions";

function ToggleButton({
  label,
  active,
  action,
}: {
  label: string;
  active: boolean;
  action: () => Promise<void>;
}) {
  return (
    <form action={action}>
      <button
        type="submit"
        className={`rounded-full px-3 py-1 text-sm border ${
          active
            ? "bg-foreground text-background border-foreground"
            : "border-black/20 dark:border-white/25"
        }`}
      >
        {active ? "✓ " : ""}
        {label}
      </button>
    </form>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
        {label}
      </dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

export default async function PlayDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const play = await prisma.play.findUnique({ where: { id } });
  if (!play) notFound();

  const genderParts: string[] = [];
  if (play.maleCount != null) genderParts.push(`${play.maleCount}M`);
  if (play.femaleCount != null) genderParts.push(`${play.femaleCount}F`);
  if (play.flexibleCount != null) genderParts.push(`${play.flexibleCount} flexible`);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 grid gap-8 md:grid-cols-[1fr_1.2fr]">
      <div>
        <h1 className="text-2xl font-semibold mb-1">{play.title}</h1>
        <p className="text-black/60 dark:text-white/60 mb-4">{play.author}</p>

        <div className="flex gap-2 mb-6">
          <ToggleButton label="Read" active={play.read} action={toggleRead.bind(null, play.id)} />
          <ToggleButton label="Seen" active={play.seen} action={toggleSeen.bind(null, play.id)} />
          <ToggleButton
            label="★ Favorite"
            active={play.favorite}
            action={toggleFavorite.bind(null, play.id)}
          />
        </div>

        <dl className="grid grid-cols-2 gap-4 mb-6">
          {play.type && <Stat label="Format" value={play.type} />}
          {play.publication && <Stat label="Publication" value={play.publication} />}
          {play.genre && <Stat label="Genre" value={play.genre} />}
          {play.runtime && <Stat label="Runtime" value={play.runtime} />}
          {play.castSize != null && <Stat label="Cast size" value={String(play.castSize)} />}
          {genderParts.length > 0 && <Stat label="Gender breakdown" value={genderParts.join(", ")} />}
        </dl>

        {play.synopsis ? (
          <div className="mb-6">
            <h2 className="text-sm font-medium mb-1">Synopsis</h2>
            <p className="text-sm text-black/70 dark:text-white/70 leading-relaxed">
              {play.synopsis}
            </p>
          </div>
        ) : (
          <p className="text-sm text-black/40 dark:text-white/40 italic mb-6">
            Cast, genre, runtime, and synopsis haven&apos;t been tagged for this play yet.
          </p>
        )}
      </div>

      <div>
        {play.driveFileId ? (
          <iframe
            src={`https://drive.google.com/file/d/${play.driveFileId}/preview`}
            className="w-full aspect-[3/4] rounded-lg border border-black/10 dark:border-white/10"
            allow="autoplay"
          />
        ) : (
          <div className="w-full aspect-[3/4] rounded-lg border border-dashed border-black/20 dark:border-white/20 flex items-center justify-center text-center p-6 text-sm text-black/50 dark:text-white/50">
            No Drive file linked to this play yet.
          </div>
        )}
      </div>
    </div>
  );
}
