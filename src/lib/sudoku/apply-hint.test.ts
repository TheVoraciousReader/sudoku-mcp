import { describe, expect, test } from "vitest";
import { applyHint, createCustomPuzzle, createGame, findHint } from "@/lib/sudoku/engine";
import { getPuzzle } from "@/lib/sudoku/puzzles";

const imagePuzzle = [
  "007020300",
  "030600029",
  "000007100",
  "104350090",
  "600042000",
  "000000050",
  "070000030",
  "000006400",
  "005080000",
].join("");

describe("applyHint", () => {
  test("consecutive apply_next_step calls fill different cells", () => {
    let state = createGame(getPuzzle("morning-paper"));

    const first = applyHint(state, "agent");
    expect(first.result.ok).toBe(true);
    const firstMsg = first.result.message;
    state = first.state;

    const second = applyHint(state, "agent");
    expect(second.result.ok).toBe(true);
    const secondMsg = second.result.message;

    // The two steps must not be identical — the bug was repeating the same cell
    expect(secondMsg).not.toBe(firstMsg);
  });

  test("state.hint is cleared after a successful fill", () => {
    let state = createGame(getPuzzle("morning-paper"));
    // Place a hint so state.hint is populated
    const hint = findHint(state);
    expect(hint).not.toBeNull();
    state = { ...state, hint };

    const applied = applyHint(state, "agent");
    expect(applied.result.ok).toBe(true);
    expect(applied.state.hint).toBeNull();
  });

  test("every next step changes the image puzzle instead of replaying a deduction", () => {
    const created = createCustomPuzzle(imagePuzzle);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    let state = createGame(created.puzzle);
    let appliedSteps = 0;

    while (findHint(state) && appliedSteps < 200) {
      const before = JSON.stringify({
        values: state.values,
        eliminated: state.eliminated,
      });
      const applied = applyHint(state, "agent");

      expect(applied.result.ok).toBe(true);
      expect(
        JSON.stringify({
          values: applied.state.values,
          eliminated: applied.state.eliminated,
        })
      ).not.toBe(before);
      expect(applied.state.hint).toBeNull();

      state = applied.state;
      appliedSteps += 1;
    }

    expect(appliedSteps).toBeGreaterThan(0);
    expect(appliedSteps).toBeLessThan(200);
  });
});
