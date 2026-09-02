"use client";

import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { cellRef, colOf, rowOf } from "@/lib/sudoku/engine";
import type { GameState, Hint, MoveCheck } from "@/lib/sudoku/types";

type Props = {
  state: GameState;
  candidates: number[][];
  showCandidates: boolean;
  lastCheck: MoveCheck | null;
  onSelect: (index: number) => void;
};

function cellTone(state: GameState, index: number, hint: Hint | null, lastCheck: MoveCheck | null) {
  if (state.conflicts.includes(index)) return "conflict";
  if (lastCheck?.cells?.includes(index)) {
    if (lastCheck.status === "conflict" || lastCheck.status === "incorrect") return "conflict";
    if (lastCheck.status === "forced" || lastCheck.status === "correct") return "good";
    if (lastCheck.status === "guess") return "guess";
  }
  if (hint?.cells.includes(index)) return "focus";
  if (hint?.unitCells.includes(index)) return "unit";
  if (state.selected === index) return "selected";
  return "plain";
}

export function SudokuGrid({ state, candidates, showCandidates, lastCheck, onSelect }: Props) {
  return (
    <div
      className="grid aspect-square w-full max-w-[min(100%,32rem)] grid-cols-9 overflow-hidden rounded-sm border-[3px] border-ink bg-[var(--paper-grid)] shadow-[0_20px_50px_-28px_rgba(48,32,16,0.45)]"
      role="grid"
      aria-label="Sudoku grid"
    >
      {state.values.map((value, index) => {
        const row = rowOf(index);
        const col = colOf(index);
        const tone = cellTone(state, index, state.hint, lastCheck);
        const given = state.givens[index];
        const source = state.sources[index];
        const locked = state.locked[index];
        const selected = state.selected === index;
        return (
          <button
            key={index}
            type="button"
            role="gridcell"
            aria-selected={selected}
            aria-label={`${cellRef(index)}${value ? `, ${value}` : ", empty"}`}
            onClick={() => onSelect(index)}
            className={cn(
              "relative flex aspect-square items-center justify-center border-[0.5px] border-ink/25 text-2xl leading-none sm:text-[1.7rem]",
              col === 2 || col === 5 ? "border-r-2 border-r-ink" : null,
              row === 2 || row === 5 ? "border-b-2 border-b-ink" : null,
              tone === "conflict" && "bg-rose-200/80",
              tone === "focus" && "bg-amber-200/90",
              tone === "good" && "bg-teal-100",
              tone === "guess" && "bg-sky-100",
              tone === "unit" && "bg-amber-50",
              tone === "selected" && "bg-amber-100/80",
              selected && "z-10 ring-2 ring-inset ring-amber-500"
            )}
          >
            {value !== 0 ? (
              <span
                className={cn(
                  "font-mono font-medium tabular-nums",
                  given && "text-ink",
                  source === "agent" && !given && "text-teal-800",
                  source === "you" && !given && "text-indigo-800"
                )}
              >
                {value}
              </span>
            ) : showCandidates && candidates[index].length > 0 ? (
              <span className="grid size-[86%] grid-cols-3 grid-rows-3 place-items-center text-[0.55rem] leading-none text-ink/45 sm:text-[0.62rem]">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                  <span key={digit} className={cn(!candidates[index].includes(digit) && "opacity-0")}>
                    {digit}
                  </span>
                ))}
              </span>
            ) : null}
            {locked && !given ? (
              <Lock className="absolute top-0.5 right-0.5 size-2.5 text-ink/50" aria-hidden />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
