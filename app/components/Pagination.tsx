import type { PlaySearchParams } from "@/lib/queries";

function hrefFor(params: PlaySearchParams, page: number) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page") sp.set(key, value);
  }
  sp.set("page", String(page));
  return `/plays?${sp.toString()}`;
}

export function Pagination({
  params,
  page,
  pageCount,
}: {
  params: PlaySearchParams;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-4 py-6 text-sm">
      <a
        href={page > 1 ? hrefFor(params, page - 1) : undefined}
        className={page > 1 ? "underline" : "text-black/30 dark:text-white/30 pointer-events-none"}
      >
        Previous
      </a>
      <span className="text-black/60 dark:text-white/60">
        Page {page} of {pageCount}
      </span>
      <a
        href={page < pageCount ? hrefFor(params, page + 1) : undefined}
        className={
          page < pageCount ? "underline" : "text-black/30 dark:text-white/30 pointer-events-none"
        }
      >
        Next
      </a>
    </div>
  );
}
