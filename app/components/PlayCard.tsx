import Link from "next/link";
import type { Play } from "@/app/generated/prisma/client";
import { toggleRead, toggleSeen, toggleFavorite } from "@/lib/actions";

function Toggle({
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
        className={`text-xs rounded-full px-2 py-0.5 border ${
          active
            ? "bg-foreground text-background border-foreground"
            : "border-black/20 dark:border-white/25 text-black/60 dark:text-white/60"
        }`}
      >
        {label}
      </button>
    </form>
  );
}

export function PlayCard({ play }: { play: Play }) {
  return (
    <div className="border border-black/10 dark:border-white/10 rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/plays/${play.id}`} className="font-medium hover:underline">
          {play.title}
        </Link>
        {!play.driveFileId && (
          <span className="text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-400 shrink-0">
            No PDF linked
          </span>
        )}
      </div>
      <p className="text-sm text-black/60 dark:text-white/60">{play.author}</p>
      <div className="text-xs text-black/50 dark:text-white/50 flex flex-wrap gap-x-3">
        {play.type && <span>{play.type}</span>}
        {play.genre && <span>{play.genre}</span>}
        {play.castSize != null && <span>Cast: {play.castSize}</span>}
      </div>
      <div className="flex gap-2 mt-1">
        <Toggle label="Read" active={play.read} action={toggleRead.bind(null, play.id)} />
        <Toggle label="Seen" active={play.seen} action={toggleSeen.bind(null, play.id)} />
        <Toggle
          label="★ Favorite"
          active={play.favorite}
          action={toggleFavorite.bind(null, play.id)}
        />
      </div>
    </div>
  );
}
