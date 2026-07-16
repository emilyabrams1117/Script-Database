import { getPlays, getFilterOptions, type PlaySearchParams } from "@/lib/queries";
import { FilterBar } from "@/components/FilterBar";
import { PlayResults } from "@/components/PlayResults";

export default async function PlaysPage({
  searchParams,
}: {
  searchParams: Promise<PlaySearchParams>;
}) {
  const params = await searchParams;
  const [{ plays, total, page, pageCount }, { genres, types, themes }] = await Promise.all([
    getPlays(params),
    getFilterOptions(),
  ]);

  // Only the filters (not view/page) should reset the loaded-results state
  // on navigation — view toggling and "Load more" are handled client-side.
  const filterParams: PlaySearchParams = { ...params };
  delete filterParams.view;
  delete filterParams.page;
  const filterKey = JSON.stringify(filterParams);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-serif text-3xl italic mb-1">Browse the collection</h1>
      <p className="text-sm text-black/60 dark:text-white/60 mb-6">
        {total.toLocaleString()} plays
      </p>

      <FilterBar params={params} genres={genres} types={types} themes={themes} />

      <PlayResults
        key={filterKey}
        initialPlays={plays}
        initialPage={page}
        initialPageCount={pageCount}
        initialView={params.view === "list" ? "list" : "grid"}
        params={params}
      />
    </div>
  );
}
