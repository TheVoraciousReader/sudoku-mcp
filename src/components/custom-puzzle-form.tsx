"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";

type PlayResult = { ok: boolean; message: string };

type Props = {
  onPlay: (raw: string) => PlayResult;
  onPlayed?: () => void;
};

export function CustomPuzzleForm({ onPlay, onPlayed }: Props) {
  const errorId = useId();
  const hintId = useId();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      id="custom-puzzle-form"
      className="space-y-3 rounded-lg border border-ink/10 bg-white/40 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        const raw = String(new FormData(event.currentTarget).get("grid") ?? "");
        const result = onPlay(raw);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setError(null);
        event.currentTarget.reset();
        onPlayed?.();
      }}
    >
      <div className="space-y-1.5">
        <label htmlFor="custom-puzzle-grid" className="text-sm font-medium text-ink">
          Your puzzle
        </label>
        <p id={hintId} className="text-sm leading-5 text-ink/65">
          Paste 81 cells. Use 0 or a dot for blanks. Spaces and line breaks are fine.
        </p>
        <textarea
          id="custom-puzzle-grid"
          name="grid"
          rows={9}
          required
          spellCheck={false}
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          placeholder={"530070000\n600195000\n098000060"}
          className="w-full resize-y rounded-lg border border-ink/15 bg-white/80 px-3 py-2 font-mono text-sm leading-6 text-ink outline-none placeholder:text-ink/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
        />
      </div>
      <p id={errorId} role="alert" className="min-h-5 text-sm text-destructive empty:hidden">
        {error ?? ""}
      </p>
      <Button type="submit" size="sm" className="bg-ink">
        Play this puzzle
      </Button>
    </form>
  );
}
