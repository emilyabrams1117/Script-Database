import Link from "next/link";
import type { Play } from "@/app/generated/prisma/client";
import { toggleRead, toggleSeen, toggleFavorite } from "@/lib/actions";
import { PlayToggle } from "@/components/PlayToggle";

export function PlayListRow({ play }: { play: Play }) {
  return (
    <div className="group border-b border-black/10 dark:border-white/10 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="min-w-0 flex-1 basis-64">
        <div className="flex items-center gap-2">
          <Link
            href={`/plays/${play.id}`}
            className="font-serif text-base leading-snug truncate group-hover:text-accent transition-colors"
          >
            {play.title}
          </Link>
          {!play.driveFileId && (
            <span className="text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              No PDF
            </span>
          )}
        </div>
        <p className="text-sm text-black/60 dark:text-white/60 truncate">{play.author}</p>
      </div>

      <div className="text-xs text-black/50 dark:text-white/50 flex flex-wrap gap-x-3 basis-48 shrink-0">
        {play.type && <span>{play.type}</span>}
        {play.genre && <span>{play.genre}</span>}
        {play.year != null && <span>{play.year}</span>}
        {play.castSize != null && <span>Cast: {play.castSize}</span>}
      </div>

      {play.themes.length > 0 && (
        <div className="flex flex-wrap gap-1 basis-56 shrink-0">
          {play.themes.slice(0, 3).map((theme) => (
            <span key={theme} className="text-[10px] rounded-full px-2 py-0.5 bg-accent/10 text-accent">
              {theme}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 ml-auto shrink-0">
        <PlayToggle label="Read" active={play.read} action={toggleRead.bind(null, play.id)} />
        <PlayToggle label="Seen" active={play.seen} action={toggleSeen.bind(null, play.id)} />
        <PlayToggle
          label="★ Favorite"
          active={play.favorite}
          action={toggleFavorite.bind(null, play.id)}
          accent
        />
      </div>
    </div>
  );
}
