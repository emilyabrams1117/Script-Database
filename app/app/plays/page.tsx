import { getPlays, getFilterOptions, type PlaySearchParams } from "@/lib/queries";
import { FilterBar } from "@/components/FilterBar";
import { PlayCard } from "@/components/PlayCard";
import { Pagination } from "@/components/Pagination";

export default async function PlaysPage({
  searchParams,
}: {
  searchParams: Promise<PlaySearchParams>;
}) {
  const params = await searchParams;
  const [{ plays, total, page, pageCount }, { genres, types }] = await Promise.all([
    getPlays(params),
    getFilterOptions(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-1">Browse the collection</h1>
      <p className="text-sm text-black/60 dark:text-white/60 mb-6">
        {total.toLocaleString()} plays
      </p>

      <FilterBar params={params} genres={genres} types={types} />

      {plays.length === 0 ? (
        <p className="text-black/60 dark:text-white/60 py-12 text-center">
          No plays match those filters.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plays.map((play) => (
            <PlayCard key={play.id} play={play} />
          ))}
        </div>
      )}

      <Pagination params={params} page={page} pageCount={pageCount} />
    </div>
  );
}
