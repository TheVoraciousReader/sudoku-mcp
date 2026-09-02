"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cellRef } from "@/lib/sudoku/engine";
import type { Hint, MoveCheck } from "@/lib/sudoku/types";

type Props = {
  hint: Hint | null;
  lastCheck: MoveCheck | null;
  solved: boolean;
  empty: number;
};

export function HintPanel({ hint, lastCheck, solved, empty }: Props) {
  return (
    <Card className="bg-[var(--paper-card)] shadow-none ring-ink/10">
      <CardHeader className="border-b border-ink/10">
        <CardTitle className="font-serif text-xl">Why this cell</CardTitle>
        <CardDescription>
          {solved
            ? "The grid is complete. You and the agent finished without dumping the solution."
            : hint
              ? "A technique is highlighted on the board. Nothing is filled until you apply it."
              : lastCheck
                ? lastCheck.message
                : `${empty} empty cells. Ask for a hint, or have Codex call the hint tool.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {solved ? (
          <p className="text-sm text-teal-800">Solved. The last fill is still on the grid in teal if the agent wrote it.</p>
        ) : hint ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{hint.title}</Badge>
              <span className="text-xs text-muted-foreground">
                {hint.cells.map(cellRef).join(" · ")}
                {hint.fill ? ` → ${hint.fill.digit}` : ""}
              </span>
            </div>
            <p className="text-sm leading-6">{hint.explanation}</p>
          </>
        ) : lastCheck ? (
          <div className="space-y-2">
            <Badge variant={lastCheck.status === "incorrect" || lastCheck.status === "conflict" ? "destructive" : "secondary"}>
              {lastCheck.status.replace("_", " ")}
            </Badge>
            <p className="text-sm leading-6">{lastCheck.message}</p>
          </div>
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">
            The agent should call <code className="font-mono text-xs">hint</code> rather than filling the puzzle. You can
            lock any cell it must not touch.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
