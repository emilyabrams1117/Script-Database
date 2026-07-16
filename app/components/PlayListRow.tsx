import Link from "next/link";
import type { Play } from "@/app/generated/prisma/client";
import { toggleRead, toggleSeen, toggleFavorite } from "@/lib/actions";
import { PlayToggle } from "@/components/PlayToggle";

// Column widths below must stay in sync between the header and each row —
// Tailwind needs the full class name written out literally in each spot
// (a variable holding "grid-cols-[...]" can't be composed with "sm:" at
// runtime; the compiler only picks up complete literal class strings).

export function PlayListHeader() {
  return (
    <div className="hidden sm:grid sm:grid-cols-[2fr_1fr_1.1fr_1.3fr_auto] gap-x-4 px-1 pb-2 border-b border-black/10 dark:border-white/10 text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
      <span>Title</span>
      <span>Playwright</span>
      <span>Details</span>
      <span>Themes</span>
      <span></span>
    </div>
  );
}

export function PlayListRow({ play }: { play: Play }) {
  return (
    <div className="group border-b border-black/10 dark:border-white/10 py-3 px-1 grid grid-cols-1 sm:grid-cols-[2fr_1fr_1.1fr_1.3fr_auto] gap-x-4 gap-y-1 items-center">
      <div className="min-w-0 flex items-center gap-2">
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

      <p className="min-w-0 text-sm text-black/70 dark:text-white/70 truncate">{play.author}</p>

      <div className="text-xs text-black/50 dark:text-white/50 flex flex-wrap gap-x-3">
        {play.type && <span>{play.type}</span>}
        {play.genre && <span>{play.genre}</span>}
        {play.year != null && <span>{play.year}</span>}
        {play.castSize != null && <span>Cast: {play.castSize}</span>}
      </div>

      <div className="flex flex-wrap gap-1">
        {play.themes.slice(0, 3).map((theme) => (
          <span key={theme} className="text-[10px] rounded-full px-2 py-0.5 bg-accent/10 text-accent">
            {theme}
          </span>
        ))}
      </div>

      <div className="flex gap-2 justify-end">
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
