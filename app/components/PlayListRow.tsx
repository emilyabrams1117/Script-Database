import Link from "next/link";
import type { Play } from "@/app/generated/prisma/client";
import { toggleRead, toggleSeen, toggleFavorite } from "@/lib/actions";
import { PlayToggle } from "@/components/PlayToggle";

// Header and every row render as flat children of ONE grid container (see
// PlayResults) rather than each having its own grid — independent grids
// with a trailing `auto` column drift out of alignment whenever that
// column's content width differs from row to row (the header's is empty,
// each row's holds the toggle buttons), so every fr-based column shifts.
export const LIST_GRID_COLS = "grid-cols-1 sm:grid-cols-[2fr_1fr_1.1fr_1.3fr_auto]";

const headerCellClass =
  "hidden sm:block pb-2 border-b border-black/10 dark:border-white/10 text-xs uppercase tracking-wide text-black/50 dark:text-white/50";

export function PlayListHeader() {
  return (
    <>
      <span className={headerCellClass}>Title</span>
      <span className={headerCellClass}>Playwright</span>
      <span className={headerCellClass}>Details</span>
      <span className={headerCellClass}>Themes</span>
      <span className={headerCellClass}></span>
    </>
  );
}

// sm and up: every cell sits on the same visual row, so each gets its own
// bottom border/padding. Below sm: fields stack per play, so only the last
// cell carries the separator (otherwise each field would get its own line).
const cellClass = "py-2 sm:py-3 border-black/10 dark:border-white/10 sm:border-b";
const lastCellClass = `${cellClass} border-b`;

export function PlayListRow({ play }: { play: Play }) {
  return (
    <>
      <div className={`min-w-0 flex items-center gap-2 ${cellClass}`}>
        <Link
          href={`/plays/${play.id}`}
          className="font-serif text-base leading-snug truncate hover:text-accent transition-colors"
        >
          {play.title}
        </Link>
        {!play.driveFileId && (
          <span className="text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            No PDF
          </span>
        )}
      </div>

      <p className={`min-w-0 text-sm text-black/70 dark:text-white/70 truncate ${cellClass}`}>{play.author}</p>

      <div className={`text-xs text-black/50 dark:text-white/50 flex flex-wrap gap-x-3 ${cellClass}`}>
        {play.type && <span>{play.type}</span>}
        {play.genre && <span>{play.genre}</span>}
        {play.year != null && <span>{play.year}</span>}
        {play.castSize != null && <span>Cast: {play.castSize}</span>}
      </div>

      <div className={`flex flex-wrap gap-1 ${cellClass}`}>
        {play.themes.slice(0, 3).map((theme) => (
          <span key={theme} className="text-[10px] rounded-full px-2 py-0.5 bg-accent/10 text-accent">
            {theme}
          </span>
        ))}
      </div>

      <div className={`flex gap-2 sm:justify-end ${lastCellClass}`}>
        <PlayToggle label="Read" active={play.read} action={toggleRead.bind(null, play.id)} />
        <PlayToggle label="Seen" active={play.seen} action={toggleSeen.bind(null, play.id)} />
        <PlayToggle
          label="★ Favorite"
          active={play.favorite}
          action={toggleFavorite.bind(null, play.id)}
          accent
        />
      </div>
    </>
  );
}
