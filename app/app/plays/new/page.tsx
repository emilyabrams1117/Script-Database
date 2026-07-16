import { createPlay } from "@/lib/actions";
import { PlayForm } from "@/components/PlayForm";

// Drive download + Claude extraction can take a few seconds.
export const maxDuration = 60;

export default function NewPlayPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-serif text-3xl italic mb-6">Add a play</h1>
      <PlayForm action={createPlay} submitLabel="Add play" />
    </div>
  );
}
