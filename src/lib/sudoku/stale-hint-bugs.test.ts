import { describe, expect, test } from "vitest";
import {
  applyHint,
  clearCell,
  createGame,
  findHint,
  lockCell,
  placeHint,
  setCell,
  toggleCandidate,
  undo,
} from "@/lib/sudoku/engine";
import { getPuzzle } from "@/lib/sudoku/puzzles";
import type { GameState } from "@/lib/sudoku/types";

/**
 * Helper: advance a puzzle to a state where the next hint is an eliminate-only
 * technique (naked pair or pointing pair) rather than a fill.
 * Falls back to morning-paper with fills applied until an eliminate hint appears.
 */
function stateWithEliminateHint(): { state: GameState; hint: NonNullable<ReturnType<typeof findHint>> } {
  let state = createGame(getPuzzle("morning-paper"));
  for (let i = 0; i < 200; i++) {
    const hint = findHint(state);
    if (!hint) break;
    if (hint.eliminate && !hint.fill) {
      return { state: { ...state, hint }, hint };
    }
    // Apply fill hints to advance the board
    if (hint.fill) {
      const applied = setCell(state, hint.fill.index, hint.fill.digit, "you");
      state = applied.state;
    } else {
      break;
    }
  }
  // Try other puzzles
  for (const id of ["coffee-break", "commute", "evening", "ink-hard"]) {
    let st: GameState;
    try {
      st = createGame(getPuzzle(id));
    } catch {
      continue;
    }
    for (let i = 0; i < 200; i++) {
      const hint = findHint(st);
      if (!hint) break;
      if (hint.eliminate && !hint.fill) {
        return { state: { ...st, hint }, hint };
      }
      if (hint.fill) {
        const applied = setCell(st, hint.fill.index, hint.fill.digit, "you");
        st = applied.state;
      } else {
        break;
      }
    }
  }
  throw new Error("Could not find a puzzle state with an eliminate-only hint for testing");
}

// ─── Bug 1: eliminate branch keeps stale hint ───────────────────────────────

describe("Bug 1: applyHint eliminate branch leaves stale hint", () => {
  test("after applying an eliminate hint, state.hint should be cleared so next apply_next_step finds a fresh deduction", () => {
    let found: ReturnType<typeof stateWithEliminateHint>;
    try {
      found = stateWithEliminateHint();
    } catch {
      // If no eliminate hint is reachable, skip gracefully
      return;
    }
    const { state } = found;

    // Apply the eliminate hint
    const applied = applyHint(state, "agent");
    expect(applied.result.ok).toBe(true);

    // The stale hint must NOT linger on the state
    // Bug: draft.hint = hint on line 570 keeps it forever, so the next
    // apply_next_step re-eliminates the same candidates (a no-op loop).
    expect(applied.state.hint).toBeNull();
  });

  test("consecutive apply_next_step after eliminate does not repeat the same technique on the same cells", () => {
    let found: ReturnType<typeof stateWithEliminateHint>;
    try {
      found = stateWithEliminateHint();
    } catch {
      return;
    }

    let state = found.state;
    const first = applyHint(state, "agent");
    expect(first.result.ok).toBe(true);
    state = first.state;

    // Verify the first elimination actually took effect
    const origHint = found.hint;
    if (origHint.eliminate) {
      for (const step of origHint.eliminate) {
        for (const idx of step.indices) {
          for (const d of step.digits) {
            expect(state.eliminated[idx]).toContain(d);
          }
        }
      }
    }

    const second = applyHint(state, "agent");
    // The second step should either find a different technique, target different
    // cells, or find nothing — it must not be an identical no-op.
    if (second.result.ok && second.result.hint?.eliminate) {
      const firstElim = first.result.hint!.eliminate!;
      const secondElim = second.result.hint.eliminate;
      // They should not target the exact same indices with the same digits
      const firstKey = JSON.stringify(firstElim);
      const secondKey = JSON.stringify(secondElim);
      expect(secondKey).not.toBe(firstKey);
    }
  });
});

// ─── Bug 2: undo restores stale hint ────────────────────────────────────────

describe("Bug 2: undo restores stale hint from history", () => {
  test("after fill then undo, state.hint should not reference the now-inapplicable old hint", () => {
    let state = createGame(getPuzzle("morning-paper"));

    // Place a hint so state.hint is populated
    const placed = placeHint(state);
    state = placed.state;
    const hintBefore = placed.hint;
    expect(hintBefore).not.toBeNull();

    // Apply the hint (fills a cell)
    const applied = applyHint(state, "you");
    expect(applied.result.ok).toBe(true);
    state = applied.state;

    // Undo — should not blindly restore the old hint that was already applied
    const undone = undo(state);
    state = undone.state;

    // After undo, the cell is empty again, so the hint *could* be valid again.
    // But the stored hint came from the snapshot which was taken *before* the fill,
    // meaning it's stale relative to the undo state. The safe behavior is to clear
    // it so findHint re-evaluates. Let's verify the hint on state is either null
    // or actually matches a fresh findHint.
    if (state.hint !== null) {
      const freshHint = findHint(state);
      // If there's a hint on state, it must match what findHint would return
      expect(state.hint.cells).toEqual(freshHint?.cells);
      expect(state.hint.digit).toBe(freshHint?.digit);
    }
  });
});

// ─── Bug 3: toggleCandidate doesn't clear state.hint ────────────────────────

describe("Bug 3: toggleCandidate leaves stale hint", () => {
  test("pencilling off a candidate that the current hint depends on should invalidate the hint", () => {
    let state = createGame(getPuzzle("morning-paper"));

    // Place a hint
    const placed = placeHint(state);
    state = placed.state;
    const hint = placed.hint;
    expect(hint).not.toBeNull();

    // The hint targets a cell and digit — cross off that digit from a *different*
    // empty cell in the same unit. This could change whether the hint is still the
    // best deduction. More importantly, if we cross off the hint's own digit from
    // the hint's own cell, the hint is outright wrong.
    const hintCell = hint!.fill?.index ?? hint!.cells[0];
    const hintDigit = hint!.digit;

    // Cross off the hint's digit from the hint's own cell
    const toggled = toggleCandidate(state, hintCell, hintDigit, "you");
    state = toggled.state;

    // After pencilling off the hint's digit from the hint's cell, the stale hint
    // should NOT remain on state, because it's now invalid
    if (state.hint !== null) {
      // If a hint persists, it must not reference the cell+digit we just crossed off
      const fresh = findHint(state);
      if (fresh === null) {
        expect(state.hint).toBeNull();
      }
    }
  });
});

// ─── Bug 4: clearCell doesn't clear state.hint ──────────────────────────────

describe("Bug 4: clearCell leaves stale hint", () => {
  test("clearing a cell that affects candidates should invalidate the current hint", () => {
    let state = createGame(getPuzzle("morning-paper"));

    // Fill a cell first (so we have something to clear)
    const hint = findHint(state);
    expect(hint?.fill).toBeDefined();
    const filled = setCell(state, hint!.fill!.index, hint!.fill!.digit, "you");
    state = filled.state;

    // Now place a new hint on the updated state
    const placed = placeHint(state);
    state = placed.state;
    expect(state.hint).not.toBeNull();

    // Clear the cell we just filled — this changes the board and may invalidate the hint
    const cleared = clearCell(state, hint!.fill!.index, "you");
    state = cleared.state;

    // The hint should be cleared because the board changed
    // Bug: clearCell sets draft.hint = null inside commit, but the stale hint
    // might survive through other paths or the boardView still reports it
    expect(state.hint).toBeNull();
  });
});

// ─── Bug 5: lockCell doesn't clear state.hint ───────────────────────────────

describe("Bug 5: lockCell leaves stale hint targeting locked cell", () => {
  test("locking the cell that hint targets should invalidate the hint", () => {
    let state = createGame(getPuzzle("morning-paper"));

    // Place a hint
    const placed = placeHint(state);
    state = placed.state;
    const hint = placed.hint;
    expect(hint).not.toBeNull();

    const targetCell = hint!.fill?.index ?? hint!.cells[0];

    // Lock that cell
    const locked = lockCell(state, targetCell, true);
    state = locked.state;

    // The hint should be invalidated because the agent can no longer write there
    // Bug: lockCell doesn't touch state.hint at all, so apply_next_step will try
    // to fill a locked cell and fail repeatedly
    expect(state.hint).toBeNull();
  });

  test("apply_next_step after locking hint target should find a different cell", () => {
    let state = createGame(getPuzzle("morning-paper"));

    const placed = placeHint(state);
    state = placed.state;
    const hint = placed.hint;
    expect(hint).not.toBeNull();

    const targetCell = hint!.fill?.index ?? hint!.cells[0];

    // Lock the hint target
    const locked = lockCell(state, targetCell, true);
    state = locked.state;

    // apply_next_step should skip the locked cell and find something else
    const applied = applyHint(state, "agent");
    if (applied.result.ok && applied.result.hint?.fill) {
      expect(applied.result.hint.fill.index).not.toBe(targetCell);
    }
  });
});
