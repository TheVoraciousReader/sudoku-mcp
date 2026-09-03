import { describe, expect, test } from "vitest";
import {
  checkMove,
  createCustomPuzzle,
  createGame,
  isSolved,
  parseGrid,
} from "@/lib/sudoku/engine";
import { getPuzzle } from "@/lib/sudoku/puzzles";

const morning = getPuzzle("morning-paper");

function gridOf(rows: string[]): string {
  return rows.join("");
}

describe("createCustomPuzzle", () => {
  test("accepts a unique 81-digit grid with zeros for blanks", () => {
    const result = createCustomPuzzle(morning.givens);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.puzzle.id).toBe("custom");
    expect(result.puzzle.name).toBe("Your own");
    expect(result.puzzle.difficulty).toBe("custom");
    expect(result.puzzle.solution).toBe(morning.solution);
    expect(parseGrid(result.puzzle.givens)).toEqual(parseGrid(morning.givens));
  });

  test("accepts dots, spaces, and line breaks", () => {
    const result = createCustomPuzzle(`
      53..7....
      6..195...
      .98....6.
      8...6...3
      4..8.3..1
      7...2...6
      .6....28.
      ...419..5
      ....8..79
    `);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.puzzle.solution).toBe(morning.solution);
  });

  test("rejects a grid that is not 81 cells", () => {
    const result = createCustomPuzzle("530070000");

    expect(result).toEqual({
      ok: false,
      message: "Need 81 cells (digits or dots). This has 9.",
    });
  });

  test("rejects empty or non-grid input", () => {
    const result = createCustomPuzzle("not-a-grid");

    expect(result).toEqual({
      ok: false,
      message: "Need 81 cells (digits or dots). This has 0.",
    });
  });

  test("rejects givens that clash in a unit", () => {
    const result = createCustomPuzzle("55" + "0".repeat(79));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toMatch(/clash/i);
    expect(result.message).toContain("r1c1");
    expect(result.message).toContain("r1c2");
  });

  test("rejects a grid with no solution", () => {
    const result = createCustomPuzzle(
      gridOf(["123456780", "000000009", ...Array.from({ length: 7 }, () => "000000000")])
    );

    expect(result).toEqual({
      ok: false,
      message: "This grid has no solution.",
    });
  });

  test("rejects a grid with more than one solution", () => {
    const result = createCustomPuzzle("0".repeat(81));

    expect(result).toEqual({
      ok: false,
      message: "This grid has more than one solution. Add more givens so it is unique.",
    });
  });

  test("normalizes blanks to dots in stored givens", () => {
    const result = createCustomPuzzle(morning.givens);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.puzzle.givens).toContain(".");
    expect(result.puzzle.givens).not.toContain("0");
  });

  test("accepts a solved unique grid", () => {
    const result = createCustomPuzzle(morning.solution);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.puzzle.givens).toBe(morning.solution);
    expect(result.puzzle.solution).toBe(morning.solution);
  });
});

describe("createGame with a custom puzzle", () => {
  test("uses the custom solution for solved and check_move", () => {
    const created = createCustomPuzzle(morning.givens);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const state = createGame(created.puzzle);
    expect(state.puzzleId).toBe("custom");
    expect(state.puzzle).toEqual(created.puzzle);
    expect(isSolved(state)).toBe(false);

    const empty = state.values.findIndex((value) => value === 0);
    const wrong = checkMove(state, empty, 2);
    const rightDigit = parseGrid(created.puzzle.solution)[empty] as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    const right = checkMove(state, empty, rightDigit);

    expect(wrong.status === "incorrect" || wrong.status === "conflict").toBe(true);
    expect(["forced", "correct", "guess"]).toContain(right.status);
  });

  test("restarting rebuilds the same custom givens", () => {
    const created = createCustomPuzzle(morning.givens);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const started = createGame(created.puzzle);
    const restarted = createGame(started.puzzle);

    expect(restarted.values).toEqual(started.values);
    expect(restarted.puzzle.id).toBe("custom");
  });

  test("marks a fully solved custom puzzle as solved", () => {
    const created = createCustomPuzzle(morning.solution);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const state = createGame(created.puzzle);
    expect(isSolved(state)).toBe(true);
  });
});
