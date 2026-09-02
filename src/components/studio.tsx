"use client";

import { useState } from "react";
import { Check, ChevronDown, Copy } from "lucide-react";
import { ActivityLog } from "@/components/activity-log";
import { HintPanel } from "@/components/hint-panel";
import { SudokuControls } from "@/components/sudoku-controls";
import { SudokuGrid } from "@/components/sudoku-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { useStudio } from "@/hooks/use-studio";

const PROMPTS = [
  "Give me a hint, don't fill anything.",
  "Check whether r9c9 can be 9.",
  "Apply the next safe step.",
  "Lock r9c7 so you cannot write there, then hint again.",
];

function SetupHelp() {
  return (
    <details className="group rounded-lg border border-ink/10 bg-white/40 px-3 py-2">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm text-ink/70 marker:content-none [&::-webkit-details-marker]:hidden [&_svg]:pointer-events-none">
        If it’s not working
        <ChevronDown className="size-3.5 shrink-0 text-ink/40 transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-3 border-t border-ink/10 pt-3 mt-2 text-sm leading-6 text-ink/70">
        <p>Site tools only appear in ChatGPT’s built-in browser, and only on some models.</p>
        <ol className="list-decimal space-y-1.5 pl-4">
          <li>Update the ChatGPT desktop app.</li>
          <li>Use GPT-5.6 Sol or Terra. Luna, Enterprise, and Edu don’t show site tools.</li>
          <li>Open this page in that browser, then look for Site tools in the address bar.</li>
          <li>
            You can also try Chrome 149+ with{" "}
            <code className="font-mono text-xs">chrome://flags/#enable-webmcp-testing</code>.
          </li>
        </ol>
        <p>The puzzle is fully playable either way.</p>
        <p className="text-xs leading-5 text-ink/55">
          Tools on this page: read_board, hint, check_move, apply_next_step, set_cell, lock_cell, and undo.
        </p>
      </div>
    </details>
  );
}

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
          <p className="text-xs font-medium tracking-[0.22em] text-teal-800 uppercase">Sudoku</p>
          <h1 className="font-serif text-4xl tracking-tight text-ink sm:text-5xl">Givens</h1>
          <p className="max-w-md text-sm leading-6 text-ink/70 sm:text-base">
            You and ChatGPT share one Sudoku. It names the next technique and waits. You fill, lock, or let it take one
            safe step.
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
              {puzzle.name} is complete. Givens stay ink. Yours are indigo. Fills from the chat are teal.
            </p>
          ) : null}
        </section>

        <aside className="flex flex-col gap-4">
          <HintPanel hint={state.hint} lastCheck={studio.lastCheck} solved={studio.solved} empty={studio.empty} />
          <ActivityLog activity={studio.activity} />
          <Card className="bg-[var(--paper-card)] shadow-none ring-ink/10">
            <CardHeader className="border-b border-ink/10">
              <CardTitle className="font-serif text-xl">Try a prompt</CardTitle>
              <CardDescription>Copy one of these into the chat. It will use the tools on this page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {PROMPTS.map((text) => (
                <PromptButton key={text} text={text} />
              ))}
              <p className="pt-1 text-xs leading-5 text-ink/55">
                It can hint, check a move, fill one safe step, lock a cell, and undo.
              </p>
              <SetupHelp />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
