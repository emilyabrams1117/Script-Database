"use client";

import { useState, useTransition } from "react";
import type { Play } from "@/app/generated/prisma/client";
import type { PlaySearchParams } from "@/lib/queries";
import { loadMorePlays } from "@/lib/actions";
import { PlayCard } from "@/components/PlayCard";
import { PlayListRow, PlayListHeader } from "@/components/PlayListRow";
import { FILTER_FORM_ID } from "@/lib/constants";

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="1.5" y1="3" x2="14.5" y2="3" />
      <line x1="1.5" y1="8" x2="14.5" y2="8" />
      <line x1="1.5" y1="13" x2="14.5" y2="13" />
    </svg>
  );
}

export function PlayResults({
  initialPlays,
  initialPage,
  initialPageCount,
  initialView,
  params,
}: {
  initialPlays: Play[];
  initialPage: number;
  initialPageCount: number;
  initialView: "grid" | "list";
  params: PlaySearchParams;
}) {
  const [plays, setPlays] = useState(initialPlays);
  const [page, setPage] = useState(initialPage);
  const [pageCount, setPageCount] = useState(initialPageCount);
  const [view, setView] = useState<"grid" | "list">(initialView);
  const [isPending, startTransition] = useTransition();

  function setViewMode(mode: "grid" | "list") {
    setView(mode);
    const url = new URL(window.location.href);
    url.searchParams.set("view", mode);
    window.history.replaceState(null, "", url);
  }

  function loadMore() {
    startTransition(async () => {
      const next = page + 1;
      const result = await loadMorePlays(params, next);
      setPlays((prev) => [...prev, ...result.plays]);
      setPage(next);
      setPageCount(result.pageCount);
    });
  }

  // Associated with the filter form by id (not a DOM descendant of it — this
  // component renders separately from FilterBar), so the currently active
  // view mode is included whenever that form is submitted.
  const viewInput = <input type="hidden" name="view" value={view} form={FILTER_FORM_ID} />;

  if (plays.length === 0) {
    return (
      <>
        {viewInput}
        <p className="text-black/60 dark:text-white/60 py-16 text-center">
          No plays match those filters.
        </p>
      </>
    );
  }

  return (
    <>
      {viewInput}
      <div className="flex justify-end mb-3">
        <div className="inline-flex rounded-md border border-black/15 dark:border-white/20 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
            className={`rounded px-2 py-1 transition-colors ${
              view === "grid" ? "bg-accent text-accent-foreground" : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
            }`}
          >
            <GridIcon />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            aria-label="List view"
            className={`rounded px-2 py-1 transition-colors ${
              view === "list" ? "bg-accent text-accent-foreground" : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
            }`}
          >
            <ListIcon />
          </button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plays.map((play) => (
            <PlayCard key={play.id} play={play} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col">
          <PlayListHeader />
          {plays.map((play) => (
            <PlayListRow key={play.id} play={play} />
          ))}
        </div>
      )}

      {page < pageCount && (
        <div className="flex justify-center py-8">
          <button
            type="button"
            onClick={loadMore}
            disabled={isPending}
            className="rounded-md border border-black/15 dark:border-white/20 px-4 py-2 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
          >
            {isPending ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </>
  );
}
