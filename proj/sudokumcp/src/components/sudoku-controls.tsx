"use client";

import { Eraser, Lightbulb, Lock, Pencil, Redo2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import type { Digit, GameState } from "@/lib/sudoku/types";

type Props = {
  state: GameState;
  onDigit: (digit: Digit) => void;
  onClear: () => void;
  onHint: () => void;
  onApply: () => void;
  onUndo: () => void;
  onLock: () => void;
  onMode: (mode: GameState["inputMode"]) => void;
  onRestart: () => void;
};

export function SudokuControls({
  state,
  onDigit,
  onClear,
  onHint,
  onApply,
  onUndo,
  onLock,
  onMode,
  onRestart,
}: Props) {
  const selected = state.selected;
  const locked = selected !== null && state.locked[selected];

  return (
    <div className="flex w-full max-w-[min(100%,32rem)] flex-col gap-3">
      <div className="grid grid-cols-9 gap-1.5">
        {([1, 2, 3, 4, 5, 6, 7, 8, 9] as Digit[]).map((digit) => (
          <Button
            key={digit}
            type="button"
            variant="outline"
            className="h-10 bg-white/70 font-mono text-base"
            onClick={() => onDigit(digit)}
          >
            {digit}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Toggle
          variant="outline"
          pressed={state.inputMode === "pencil"}
          onPressedChange={(pressed) => onMode(pressed ? "pencil" : "digit")}
          className={cn("bg-white/70", state.inputMode === "pencil" && "border-teal-700 text-teal-800")}
        >
          <Pencil />
          Pencil
        </Toggle>
        <Button type="button" variant="outline" className="bg-white/70" onClick={onClear}>
          <Eraser />
          Erase
        </Button>
        <Button type="button" variant="outline" className="bg-white/70" onClick={onLock}>
          <Lock />
          {locked ? "Unlock" : "Lock"}
        </Button>
        <Button type="button" variant="outline" className="bg-white/70" onClick={onUndo} disabled={state.history.length === 0}>
          <Undo2 />
          Undo
        </Button>
        <Button type="button" variant="outline" className="bg-white/70" onClick={onRestart}>
          <Redo2 />
          Restart
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <Button type="button" variant="secondary" className="h-10" onClick={onHint}>
          <Lightbulb />
          Hint, don’t fill
        </Button>
        <Button type="button" className="h-10" onClick={onApply}>
          Apply next step
        </Button>
      </div>
    </div>
  );
}
