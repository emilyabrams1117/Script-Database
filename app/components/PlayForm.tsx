import type { Play } from "@/app/generated/prisma/client";

const fieldClass =
  "border border-black/15 dark:border-white/20 rounded-md px-2 py-1.5 bg-transparent text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-black/60 dark:text-white/60">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        min={type === "number" ? 0 : undefined}
        className={fieldClass}
      />
    </label>
  );
}

export function PlayForm({
  play,
  action,
  submitLabel,
}: {
  play?: Play;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-4 max-w-xl">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Title *" name="title" defaultValue={play?.title} />
        <Field label="Author *" name="author" defaultValue={play?.author} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Author last name" name="authorLast" defaultValue={play?.authorLast} />
        <Field label="Type (PDF / Print / Print + PDF)" name="type" defaultValue={play?.type} />
      </div>
      <Field label="Publication" name="publication" defaultValue={play?.publication} />
      <Field label="Genre" name="genre" defaultValue={play?.genre} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Runtime" name="runtime" defaultValue={play?.runtime} placeholder="e.g. 90 minutes" />
        <Field label="Year" name="year" type="number" defaultValue={play?.year} placeholder="e.g. 1998" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Cast size" name="castSize" type="number" defaultValue={play?.castSize} />
        <Field label="Male roles" name="maleCount" type="number" defaultValue={play?.maleCount} />
        <Field label="Female roles" name="femaleCount" type="number" defaultValue={play?.femaleCount} />
      </div>
      <Field
        label="Flexible / any-gender roles"
        name="flexibleCount"
        type="number"
        defaultValue={play?.flexibleCount}
      />

      <label className="flex flex-col gap-1">
        <span className="text-xs text-black/60 dark:text-white/60">Synopsis</span>
        <textarea
          name="synopsis"
          defaultValue={play?.synopsis ?? ""}
          rows={4}
          className={fieldClass}
        />
      </label>

      <Field
        label="Google Drive link"
        name="driveLink"
        defaultValue={
          play?.driveFileId ? `https://drive.google.com/file/d/${play.driveFileId}/view` : ""
        }
        placeholder="Paste a Drive share link"
      />

      <div>
        <button
          type="submit"
          className="rounded-md bg-accent text-accent-foreground px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
