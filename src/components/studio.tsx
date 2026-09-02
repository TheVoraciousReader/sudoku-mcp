"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { ActivityLog } from "@/components/activity-log";
import { HintPanel } from "@/components/hint-panel";
import { SudokuControls } from "@/components/sudoku-controls";
import { SudokuGrid } from "@/components/sudoku-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { useStudio } from "@/hooks/use-studio";
import { cn } from "@/lib/utils";

const PROMPTS = [
  "Give me a hint, don't fill anything.",
  "Check whether r9c9 can be 9.",
  "Apply the next safe step.",
  "Lock r9c7 so you cannot write there, then hint again.",
];

function PromptButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="flex w-full items-start gap-2 rounded-lg border border-ink/10 bg-white/50 px-3 py-2 text-left text-sm leading-5 hover:bg-white"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
    >
      {copied ? <Check className="mt-0.5 size-3.5 shrink-0" /> : <Copy className="mt-0.5 size-3.5 shrink-0 text-ink/40" />}
      <span>{text}</span>
    </button>
  );
}

export function Studio() {
  const studio = useStudio();
  const { state, puzzle, you, webmcp } = studio;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:py-10">
      <header className="flex flex-col gap-4 border-b border-ink/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl space-y-2">
          <p className="text-xs font-medium tracking-[0.22em] text-teal-800 uppercase">WebMCP studio</p>
          <h1 className="font-serif text-4xl tracking-tight text-ink sm:text-5xl">Givens</h1>
          <p className="max-w-md text-sm leading-6 text-ink/70 sm:text-base">
            You and an agent share one Sudoku. It shows the technique. You decide whether to fill it. No dumped
            solutions, no guessing clicks.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={webmcp === "ready" ? "default" : "outline"} className={webmcp === "ready" ? "bg-teal-800" : ""}>
            {webmcp === "checking" && "Checking site tools"}
            {webmcp === "ready" && "Site tools ready"}
            {webmcp === "missing" && "Site tools unavailable"}
          </Badge>
          <Badge variant="secondary">{puzzle.difficulty}</Badge>
          <Badge variant="outline">{studio.empty} empty</Badge>
        </div>
      </header>

      {webmcp === "missing" ? (
        <p className="rounded-lg border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          Open this page in the ChatGPT desktop in-app browser (GPT-5.6 Sol or Terra) or Chrome 149+ with{" "}
          <code className="font-mono text-xs">chrome://flags/#enable-webmcp-testing</code>. The grid stays fully
          playable either way.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {studio.puzzles.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant={item.id === puzzle.id ? "default" : "outline"}
            className={item.id === puzzle.id ? "bg-ink" : "bg-white/60"}
            onClick={() => you.load(item.id)}
          >
            {item.name}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="flex flex-col items-center gap-5">
          <div className="w-full max-w-[min(100%,32rem)]">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl">{puzzle.name}</h2>
                <p className="text-sm text-ink/65">{puzzle.blurb}</p>
              </div>
              <Toggle
                variant="outline"
                pressed={studio.showCandidates}
                onPressedChange={studio.setShowCandidates}
                className="bg-white/70"
              >
                Candidates
              </Toggle>
            </div>
            <SudokuGrid
              state={state}
              candidates={studio.candidates}
              showCandidates={studio.showCandidates}
              lastCheck={studio.lastCheck}
              onSelect={you.select}
            />
          </div>
          <SudokuControls
            state={state}
            onDigit={you.enterDigit}
            onClear={you.clear}
            onHint={you.hint}
            onApply={you.apply}
            onUndo={you.undo}
            onLock={you.toggleLock}
            onMode={you.setMode}
            onRestart={you.restart}
          />
          {studio.solved ? (
            <p className="rounded-lg bg-teal-50 px-4 py-2 text-sm text-teal-900">
              {puzzle.name} is complete. Givens stay ink. Your digits are indigo. Agent digits are teal.
            </p>
          ) : null}
        </section>

        <aside className="flex flex-col gap-4">
          <HintPanel hint={state.hint} lastCheck={studio.lastCheck} solved={studio.solved} empty={studio.empty} />
          <ActivityLog activity={studio.activity} />
          <Card className="bg-[var(--paper-card)] shadow-none ring-ink/10">
            <CardHeader className="border-b border-ink/10">
              <CardTitle className="font-serif text-xl">Try it with Codex</CardTitle>
              <CardDescription>
                Open Givens in ChatGPT’s built-in browser, confirm Site tools in the address bar, then send one of these.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {PROMPTS.map((text) => (
                <PromptButton key={text} text={text} />
              ))}
              <p className={cn("pt-1 text-xs leading-5 text-ink/55")}>
                Tools live on this top-level page: read_board, hint, check_move, apply_next_step, set_cell, lock_cell,
                and undo.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
