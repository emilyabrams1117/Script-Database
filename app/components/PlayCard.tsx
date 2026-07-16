import Link from "next/link";
import type { Play } from "@/app/generated/prisma/client";
import { toggleRead, toggleSeen, toggleFavorite } from "@/lib/actions";
import { PlayToggle } from "@/components/PlayToggle";

export function PlayCard({ play }: { play: Play }) {
  return (
    <div className="group border border-black/10 dark:border-white/10 rounded-xl p-5 flex flex-col gap-2 transition-all hover:border-accent/40 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/plays/${play.id}`}
          className="font-serif text-lg leading-snug group-hover:text-accent transition-colors"
        >
          {play.title}
        </Link>
        {!play.driveFileId && (
          <span className="text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            No PDF
          </span>
        )}
      </div>
      <p className="text-sm text-black/60 dark:text-white/60">{play.author}</p>
      <div className="text-xs text-black/50 dark:text-white/50 flex flex-wrap gap-x-3">
        {play.type && <span>{play.type}</span>}
        {play.genre && <span>{play.genre}</span>}
        {play.year != null && <span>{play.year}</span>}
        {play.castSize != null && <span>Cast: {play.castSize}</span>}
      </div>
      {play.synopsis && (
        <p className="text-sm text-black/70 dark:text-white/70 line-clamp-3">{play.synopsis}</p>
      )}
      {play.themes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {play.themes.map((theme) => (
            <span
              key={theme}
              className="text-[10px] rounded-full px-2 py-0.5 bg-accent/10 text-accent"
            >
              {theme}
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2 mt-1">
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
