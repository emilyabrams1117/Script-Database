"use client";

import { useEffect, useRef, useState } from "react";

export function MultiSelectFilter({
  name,
  label,
  options,
  selected,
}: {
  name: string;
  label: string;
  options: string[];
  selected: string[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [values, setValues] = useState<string[]>(selected);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  function toggle(option: string) {
    setValues((prev) => (prev.includes(option) ? prev.filter((v) => v !== option) : [...prev, option]));
  }

  return (
    <div className="flex flex-col gap-1 relative" ref={containerRef}>
      <span className="text-xs text-black/60 dark:text-white/60">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="border border-black/15 dark:border-white/20 rounded-md px-2 py-1.5 bg-transparent text-sm text-left transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
      >
        {values.length === 0 ? "Any" : `${values.length} selected`}
      </button>

      {open && (
        <div className="absolute z-20 top-full mt-1 w-64 max-h-72 flex flex-col rounded-md border border-black/15 dark:border-white/20 bg-background shadow-lg p-2">
          {options.length > 8 && (
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Filter ${options.length.toLocaleString()} options...`}
              autoFocus
              className="border border-black/15 dark:border-white/20 rounded px-2 py-1 text-sm bg-transparent mb-2 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
          )}
          <div className="overflow-auto">
            {filtered.length === 0 && (
              <p className="text-xs text-black/40 dark:text-white/40 px-1 py-1">No matches</p>
            )}
            {filtered.map((option) => (
              <label
                key={option}
                className="flex items-center gap-2 px-1 py-1 text-sm rounded hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="accent-accent shrink-0"
                  checked={values.includes(option)}
                  onChange={() => toggle(option)}
                />
                <span className="truncate">{option}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {values.map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}
    </div>
  );
}
