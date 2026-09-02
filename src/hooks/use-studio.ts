"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  applyHint,
  cellRef,
  checkMove,
  clearCell,
  computeCandidates,
  createGame,
  emptyCount,
  explainCell,
  indexFromRef,
  isSolved,
  listPuzzles,
  loadPuzzle,
  lockCell,
  placeHint,
  readBoard,
  selectCell,
  setCell,
  setInputMode,
  toggleCandidate,
  undo,
} from "@/lib/sudoku/engine";
import { PUZZLES } from "@/lib/sudoku/puzzles";
import type { Digit, FillSource, GameState, MoveCheck, ToolResult } from "@/lib/sudoku/types";
import { getModelContext, registerSudokuTools, type StudioMethods } from "@/lib/webmcp/register-tools";

export type Activity = {
  id: string;
  at: number;
  source: "you" | "agent";
  tool: string;
  message: string;
};

export type WebmcpStatus = "checking" | "ready" | "missing";

let activitySeq = 0;

function subscribeNever(): () => void {
  return () => {};
}

function sourceOf(tool: string, fillSource: FillSource): Activity["source"] {
  if (fillSource === "agent") return "agent";
  if (tool.startsWith("agent:")) return "agent";
  return "you";
}

function getWebmcpSnapshot(): boolean {
  return Boolean(getModelContext());
}

export function useStudio() {
  const [state, setState] = useState<GameState>(() => createGame(PUZZLES[0]));
  const [activity, setActivity] = useState<Activity[]>([]);
  const [registered, setRegistered] = useState(false);
  const [showCandidates, setShowCandidates] = useState(true);
  const [lastCheck, setLastCheck] = useState<MoveCheck | null>(null);
  const stateRef = useRef(state);
  const methodsRef = useRef<StudioMethods | null>(null);
  const hasModelContext = useSyncExternalStore(subscribeNever, getWebmcpSnapshot, () => false);

  const pushLog = useCallback((source: Activity["source"], tool: string, message: string) => {
    activitySeq += 1;
    setActivity((current) =>
      [
        {
          id: String(activitySeq),
          at: Date.now(),
          source,
          tool,
          message,
        },
        ...current,
      ].slice(0, 40)
    );
  }, []);

  const run = useCallback(
    (tool: string, fillSource: FillSource, fn: (current: GameState) => { state: GameState; result: ToolResult }) => {
      const applied = fn(stateRef.current);
      setState(applied.state);
      stateRef.current = applied.state;
      setLastCheck(applied.result.check ?? null);
      pushLog(sourceOf(tool, fillSource), tool, applied.result.message);
      return applied.result;
    },
    [pushLog]
  );

  const methods = useMemo<StudioMethods>(
    () => ({
      readBoard: () => {
        const result = readBoard(stateRef.current);
        pushLog("agent", "read_board", result.message);
        return result;
      },
      selectCell: (row, col) => {
        const index = indexFromRef(row, col);
        if (index === null) return { ok: false, message: "Invalid cell.", board: readBoard(stateRef.current).board };
        const next = selectCell(stateRef.current, index);
        setState(next);
        stateRef.current = next;
        const message = `Looking at ${cellRef(index)}.`;
        pushLog("agent", "select_cell", message);
        return { ok: true, message, board: readBoard(next).board };
      },
      setCell: (row, col, digit, source) => {
        const index = indexFromRef(row, col);
        if (index === null) return { ok: false, message: "Invalid cell.", board: readBoard(stateRef.current).board };
        return run("set_cell", source, (current) => setCell(current, index, digit, source));
      },
      clearCell: (row, col, source) => {
        const index = indexFromRef(row, col);
        if (index === null) return { ok: false, message: "Invalid cell.", board: readBoard(stateRef.current).board };
        return run("clear_cell", source, (current) => clearCell(current, index, source));
      },
      toggleCandidate: (row, col, digit, source) => {
        const index = indexFromRef(row, col);
        if (index === null) return { ok: false, message: "Invalid cell.", board: readBoard(stateRef.current).board };
        return run("toggle_candidate", source, (current) => toggleCandidate(current, index, digit, source));
      },
      lockCell: (row, col, locked) => {
        const index = indexFromRef(row, col);
        if (index === null) return { ok: false, message: "Invalid cell.", board: readBoard(stateRef.current).board };
        return run(locked ? "lock_cell" : "unlock_cell", "agent", (current) => lockCell(current, index, locked));
      },
      hint: () => {
        const placed = placeHint(stateRef.current);
        setState(placed.state);
        stateRef.current = placed.state;
        const message = placed.hint
          ? `${placed.hint.title}: ${placed.hint.explanation}`
          : "No basic technique is available on this grid.";
        pushLog("agent", "hint", message);
        return {
          ok: Boolean(placed.hint),
          message,
          board: readBoard(placed.state).board,
          hint: placed.hint,
        };
      },
      explainCell: (row, col) => {
        const index = indexFromRef(row, col);
        if (index === null) return { ok: false, message: "Invalid cell.", board: readBoard(stateRef.current).board };
        const next = selectCell(stateRef.current, index);
        setState(next);
        stateRef.current = next;
        const explained = explainCell(next, index);
        pushLog("agent", "explain_cell", explained.message);
        return {
          ok: true,
          message: explained.message,
          board: readBoard(next).board,
          hint: explained.hint,
        };
      },
      checkMove: (row, col, digit) => {
        const index = indexFromRef(row, col);
        if (index === null) return { ok: false, message: "Invalid cell.", board: readBoard(stateRef.current).board };
        const next = selectCell(stateRef.current, index);
        const check = checkMove(next, index, digit);
        setState({ ...next, hint: next.hint });
        stateRef.current = next;
        setLastCheck(check);
        pushLog("agent", "check_move", check.message);
        return {
          ok: check.status === "forced" || check.status === "correct" || check.status === "guess",
          message: check.message,
          board: readBoard(next).board,
          check,
        };
      },
      applyNextStep: (source) => run("apply_next_step", source, (current) => applyHint(current, source)),
      undo: () => run("undo", "you", (current) => undo(current)),
      loadPuzzle: (id) => {
        const next = loadPuzzle(id);
        setState(next);
        stateRef.current = next;
        setLastCheck(null);
        const result = readBoard(next);
        pushLog("agent", "load_puzzle", `Loaded ${result.board.name}.`);
        return { ...result, message: `Loaded ${result.board.name}. ${result.board.difficulty} · ${result.board.empty} empty cells.` };
      },
      listPuzzles,
    }),
    [pushLog, run]
  );

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    methodsRef.current = methods;
  }, [methods]);

  useEffect(() => {
    const ctx = getModelContext();
    if (!ctx) return;
    const controller = new AbortController();
    const proxy: StudioMethods = {
      readBoard: () => methodsRef.current!.readBoard(),
      selectCell: (row, col) => methodsRef.current!.selectCell(row, col),
      setCell: (row, col, digit, source) => methodsRef.current!.setCell(row, col, digit, source),
      clearCell: (row, col, source) => methodsRef.current!.clearCell(row, col, source),
      toggleCandidate: (row, col, digit, source) => methodsRef.current!.toggleCandidate(row, col, digit, source),
      lockCell: (row, col, locked) => methodsRef.current!.lockCell(row, col, locked),
      hint: () => methodsRef.current!.hint(),
      explainCell: (row, col) => methodsRef.current!.explainCell(row, col),
      checkMove: (row, col, digit) => methodsRef.current!.checkMove(row, col, digit),
      applyNextStep: (source) => methodsRef.current!.applyNextStep(source),
      undo: () => methodsRef.current!.undo(),
      loadPuzzle: (id) => methodsRef.current!.loadPuzzle(id),
      listPuzzles: () => methodsRef.current!.listPuzzles(),
    };
    registerSudokuTools(ctx, proxy, controller.signal)
      .then(() => setRegistered(true))
      .catch(() => setRegistered(false));
    return () => controller.abort();
  }, [hasModelContext]);

  const you = useMemo(
    () => ({
      select: (index: number) => setState((current) => selectCell(current, index)),
      enterDigit: (digit: Digit) => {
        if (stateRef.current.selected === null) return;
        const index = stateRef.current.selected;
        if (stateRef.current.inputMode === "pencil") {
          run("pencil", "you", (current) => toggleCandidate(current, index, digit, "you"));
        } else {
          run("set_cell", "you", (current) => setCell(current, index, digit, "you"));
        }
      },
      clear: () => {
        if (stateRef.current.selected === null) return;
        const index = stateRef.current.selected;
        run("clear_cell", "you", (current) => clearCell(current, index, "you"));
      },
      hint: () => {
        const placed = placeHint(stateRef.current);
        setState(placed.state);
        stateRef.current = placed.state;
        pushLog(
          "you",
          "hint",
          placed.hint ? `${placed.hint.title}: ${placed.hint.explanation}` : "No basic technique is available."
        );
      },
      apply: () => run("apply_next_step", "you", (current) => applyHint(current, "you")),
      undo: () => run("undo", "you", (current) => undo(current)),
      toggleLock: () => {
        if (stateRef.current.selected === null) return;
        const index = stateRef.current.selected;
        const locked = !stateRef.current.locked[index];
        run(locked ? "lock_cell" : "unlock_cell", "you", (current) => lockCell(current, index, locked));
      },
      setMode: (mode: GameState["inputMode"]) => setState((current) => setInputMode(current, mode)),
      load: (id: string) => {
        const next = loadPuzzle(id);
        setState(next);
        stateRef.current = next;
        setLastCheck(null);
        pushLog("you", "load_puzzle", `Loaded ${next.puzzleId}.`);
      },
      restart: () => {
        const next = loadPuzzle(stateRef.current.puzzleId);
        setState(next);
        stateRef.current = next;
        setLastCheck(null);
        pushLog("you", "restart", "Restarted the puzzle.");
      },
    }),
    [pushLog, run]
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      const selected = stateRef.current.selected;
      if (event.key >= "1" && event.key <= "9") {
        you.enterDigit(Number(event.key) as Digit);
        return;
      }
      if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
        event.preventDefault();
        you.clear();
        return;
      }
      if (event.key === "p") {
        you.setMode(stateRef.current.inputMode === "pencil" ? "digit" : "pencil");
        return;
      }
      if (event.key === "h") {
        you.hint();
        return;
      }
      if (event.key === "l") {
        you.toggleLock();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "z") {
        event.preventDefault();
        you.undo();
        return;
      }
      if (selected === null) return;
      const row = Math.floor(selected / 9);
      const col = selected % 9;
      const move: Record<string, [number, number]> = {
        ArrowUp: [row - 1, col],
        ArrowDown: [row + 1, col],
        ArrowLeft: [row, col - 1],
        ArrowRight: [row, col + 1],
      };
      const next = move[event.key];
      if (!next) return;
      event.preventDefault();
      const [nextRow, nextCol] = next;
      if (nextRow < 0 || nextRow > 8 || nextCol < 0 || nextCol > 8) return;
      you.select(nextRow * 9 + nextCol);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [you]);

  const candidates = useMemo(
    () => computeCandidates(state.values, state.eliminated),
    [state.values, state.eliminated]
  );

  const puzzle = PUZZLES.find((item) => item.id === state.puzzleId) ?? PUZZLES[0];
  const webmcp: WebmcpStatus = hasModelContext ? (registered ? "ready" : "checking") : "missing";

  return {
    state,
    puzzle,
    puzzles: PUZZLES,
    candidates,
    activity,
    webmcp,
    showCandidates,
    setShowCandidates,
    lastCheck,
    solved: isSolved(state),
    empty: emptyCount(state),
    you,
  };
}
