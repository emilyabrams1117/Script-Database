import Link from "next/link";
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
  const linkClass = "font-medium text-accent hover:underline";
  const disabledClass = "text-black/25 dark:text-white/25 pointer-events-none";
  return (
    <div className="flex items-center justify-center gap-4 py-8 text-sm">
      {page > 1 ? (
        <Link href={hrefFor(params, page - 1)} className={linkClass}>
          ← Previous
        </Link>
      ) : (
        <span className={disabledClass}>← Previous</span>
      )}
      <span className="text-black/60 dark:text-white/60">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={hrefFor(params, page + 1)} className={linkClass}>
          Next →
        </Link>
      ) : (
        <span className={disabledClass}>Next →</span>
      )}
    </div>
  );
}
