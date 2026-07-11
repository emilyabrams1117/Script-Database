import type { PlaySearchParams } from "@/lib/queries";

export function FilterBar({
  params,
  genres,
  types,
}: {
  params: PlaySearchParams;
  genres: string[];
  types: string[];
}) {
  return (
    <form
      method="get"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6 items-end mb-6"
    >
      <label className="flex flex-col gap-1 col-span-2 md:col-span-2">
        <span className="text-xs text-black/60 dark:text-white/60">Search</span>
        <input
          type="text"
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="title, author, synopsis..."
          className="border border-black/15 dark:border-white/20 rounded px-2 py-1.5 bg-transparent text-sm"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-black/60 dark:text-white/60">Author last name</span>
        <input
          type="text"
          name="author"
          defaultValue={params.author ?? ""}
          className="border border-black/15 dark:border-white/20 rounded px-2 py-1.5 bg-transparent text-sm"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-black/60 dark:text-white/60">Genre</span>
        <select
          name="genre"
          defaultValue={params.genre ?? ""}
          className="border border-black/15 dark:border-white/20 rounded px-2 py-1.5 bg-transparent text-sm"
        >
          <option value="">Any</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-black/60 dark:text-white/60">Type</span>
        <select
          name="type"
          defaultValue={params.type ?? ""}
          className="border border-black/15 dark:border-white/20 rounded px-2 py-1.5 bg-transparent text-sm"
        >
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
        <select
          name="sort"
          defaultValue={params.sort ?? "title"}
          className="border border-black/15 dark:border-white/20 rounded px-2 py-1.5 bg-transparent text-sm"
        >
          <option value="title">Title</option>
          <option value="author">Author</option>
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
          className="border border-black/15 dark:border-white/20 rounded px-2 py-1.5 bg-transparent text-sm"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-black/60 dark:text-white/60">Min. female roles</span>
        <input
          type="number"
          min={0}
          name="minFemale"
          defaultValue={params.minFemale ?? ""}
          className="border border-black/15 dark:border-white/20 rounded px-2 py-1.5 bg-transparent text-sm"
        />
      </label>

      <div className="flex gap-3 items-center col-span-2 md:col-span-2">
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            name="read"
            value="1"
            defaultChecked={params.read === "1"}
          />
          Read
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            name="seen"
            value="1"
            defaultChecked={params.seen === "1"}
          />
          Seen
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            name="favorite"
            value="1"
            defaultChecked={params.favorite === "1"}
          />
          Favorite
        </label>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded bg-foreground text-background px-3 py-1.5 text-sm font-medium"
        >
          Apply
        </button>
        <a
          href="/plays"
          className="rounded border border-black/15 dark:border-white/20 px-3 py-1.5 text-sm"
        >
          Reset
        </a>
      </div>
    </form>
  );
}
