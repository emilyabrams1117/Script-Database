"use client";

export function DeleteButton({
  action,
  label = "Delete play",
  confirmMessage = "Delete this play? This can't be undone.",
}: {
  action: () => Promise<void>;
  label?: string;
  confirmMessage?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="text-xs rounded-md border border-red-500/40 text-red-600 dark:text-red-400 px-2.5 py-1.5 transition-colors hover:bg-red-500/10"
      >
        {label}
      </button>
    </form>
  );
}
