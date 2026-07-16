import Link from "next/link";
import type { PlaySearchParams } from "@/lib/queries";

const fieldClass =
  "border border-black/15 dark:border-white/20 rounded-md px-2 py-1.5 bg-transparent text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent";

export function FilterBar({
  params,
  genres,
  types,
  themes,
}: {
  params: PlaySearchParams;
  genres: string[];
  types: string[];
  themes: string[];
}) {
  return (
    <form
      method="get"
      className="rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6 items-end mb-6"
    >
      <label className="flex flex-col gap-1 col-span-2 md:col-span-2">
        <span className="text-xs text-black/60 dark:text-white/60">Search</span>
        <input
          type="text"
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="title, playwright, synopsis..."
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-black/60 dark:text-white/60">Playwright&apos;s name</span>
        <input type="text" name="author" defaultValue={params.author ?? ""} className={fieldClass} />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-black/60 dark:text-white/60">Genre</span>
        <select name="genre" defaultValue={params.genre ?? ""} className={fieldClass}>
          <option value="">Any</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-black/60 dark:text-white/60">Theme</span>
        <select name="theme" defaultValue={params.theme ?? ""} className={fieldClass}>
          <option value="">Any</option>
          {themes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-black/60 dark:text-white/60">Type</span>
        <select name="type" defaultValue={params.type ?? ""} className={fieldClass}>
          <option value="">Any</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-black/60 dark:text-white/60">Sort by</span>
        <select name="sort" defaultValue={params.sort ?? "title"} className={fieldClass}>
          <option value="title">Title</option>
          <option value="author">Playwright</option>
          <option value="recent">Recently added</option>
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-black/60 dark:text-white/60">Min. male roles</span>
        <input
          type="number"
          min={0}
          name="minMale"
          defaultValue={params.minMale ?? ""}
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-black/60 dark:text-white/60">Min. female roles</span>
        <input
          type="number"
          min={0}
          name="minFemale"
          defaultValue={params.minFemale ?? ""}
          className={fieldClass}
        />
      </label>

      <div className="flex flex-wrap gap-3 items-center col-span-2 md:col-span-2">
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" name="read" value="1" defaultChecked={params.read === "1"} className="accent-accent" />
          Read
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" name="seen" value="1" defaultChecked={params.seen === "1"} className="accent-accent" />
          Seen
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            name="favorite"
            value="1"
            defaultChecked={params.favorite === "1"}
            className="accent-accent"
          />
          Favorite
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            name="missingLink"
            value="1"
            defaultChecked={params.missingLink === "1"}
            className="accent-accent"
          />
          Missing PDF link
        </label>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-accent text-accent-foreground px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-90"
        >
          Apply
        </button>
        <Link
          href="/plays"
          className="rounded-md border border-black/15 dark:border-white/20 px-3 py-1.5 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}
