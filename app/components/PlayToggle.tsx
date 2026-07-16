export function PlayToggle({
  label,
  active,
  action,
  accent = false,
}: {
  label: string;
  active: boolean;
  action: () => Promise<void>;
  accent?: boolean;
}) {
  return (
    <form action={action}>
      <button
        type="submit"
        className={`text-xs rounded-full px-2 py-0.5 border transition-colors ${
          active
            ? accent
              ? "bg-accent text-accent-foreground border-accent"
              : "bg-foreground text-background border-foreground"
            : "border-black/20 dark:border-white/25 text-black/60 dark:text-white/60 hover:border-black/40 dark:hover:border-white/40"
        }`}
      >
        {label}
      </button>
    </form>
  );
}
