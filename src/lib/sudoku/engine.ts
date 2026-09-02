import { getPuzzle, PUZZLES } from "./puzzles";
import type {
  BoardView,
  Digit,
  FillSource,
  GameState,
  Hint,
  HistorySnapshot,
  MoveCheck,
  Puzzle,
  Technique,
  ToolResult,
} from "./types";

export const AGENT_POLICY =
  "Do not print the full 81-digit solution. Change the grid only by calling tools. Prefer hint when the user wants help, and apply_next_step only when they ask to fill a cell. Never overwrite given or locked cells. After every write, trust the returned board snapshot instead of guessing the grid from memory.";

const DIGITS: Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function rowOf(index: number): number {
  return Math.floor(index / 9);
}

export function colOf(index: number): number {
  return index % 9;
}

export function boxOf(index: number): number {
  return Math.floor(rowOf(index) / 3) * 3 + Math.floor(colOf(index) / 3);
}

export function cellRef(index: number): string {
  return `r${rowOf(index) + 1}c${colOf(index) + 1}`;
}

export function indexFromRef(row: number, col: number): number | null {
  if (!Number.isInteger(row) || !Number.isInteger(col) || row < 1 || row > 9 || col < 1 || col > 9) {
    return null;
  }
  return (row - 1) * 9 + (col - 1);
}

export function parseGrid(raw: string): number[] {
  const chars = raw.replace(/[^0-9.]/g, "");
  if (chars.length !== 81) {
    throw new Error(`Grid must have 81 cells, got ${chars.length}`);
  }
  return [...chars].map((char) => {
    if (char === "." || char === "0") return 0;
    return Number(char);
  });
}

export function formatGrid(values: number[]): string {
  return values.map((value) => (value === 0 ? "." : String(value))).join("");
}

function unitIndices(kind: "row" | "col" | "box", n: number): number[] {
  if (kind === "row") {
    return Array.from({ length: 9 }, (_, col) => n * 9 + col);
  }
  if (kind === "col") {
    return Array.from({ length: 9 }, (_, row) => row * 9 + n);
  }
  const startRow = Math.floor(n / 3) * 3;
  const startCol = (n % 3) * 3;
  const cells: number[] = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      cells.push((startRow + row) * 9 + startCol + col);
    }
  }
  return cells;
}

const ROWS = Array.from({ length: 9 }, (_, n) => unitIndices("row", n));
const COLS = Array.from({ length: 9 }, (_, n) => unitIndices("col", n));
const BOXES = Array.from({ length: 9 }, (_, n) => unitIndices("box", n));
const UNITS = [...ROWS, ...COLS, ...BOXES];

const PEERS: number[][] = Array.from({ length: 81 }, (_, index) => {
  const set = new Set([
    ...ROWS[rowOf(index)],
    ...COLS[colOf(index)],
    ...BOXES[boxOf(index)],
  ]);
  set.delete(index);
  return [...set];
});

function asDigit(value: number): Digit | null {
  if (value >= 1 && value <= 9) return value as Digit;
  return null;
}

export function computeCandidates(values: number[], eliminated: number[][]): number[][] {
  return values.map((value, index) => {
    if (value !== 0) return [];
    const used = new Set<number>();
    for (const peer of PEERS[index]) {
      if (values[peer] !== 0) used.add(values[peer]);
    }
    const crossed = new Set(eliminated[index] ?? []);
    return DIGITS.filter((digit) => !used.has(digit) && !crossed.has(digit));
  });
}

export function conflictIndices(values: number[]): number[] {
  const bad = new Set<number>();
  for (const unit of UNITS) {
    const seen = new Map<number, number>();
    for (const index of unit) {
      const value = values[index];
      if (value === 0) continue;
      const previous = seen.get(value);
      if (previous !== undefined) {
        bad.add(previous);
        bad.add(index);
      } else {
        seen.set(value, index);
      }
    }
  }
  return [...bad];
}

function snapshotOf(state: GameState): HistorySnapshot {
  return {
    values: state.values.slice(),
    locked: state.locked.slice(),
    sources: state.sources.slice(),
    eliminated: state.eliminated.map((entry) => entry.slice()),
    selected: state.selected,
    hint: state.hint,
  };
}

function cloneState(state: GameState): GameState {
  return {
    puzzleId: state.puzzleId,
    values: state.values.slice(),
    givens: state.givens.slice(),
    locked: state.locked.slice(),
    sources: state.sources.slice(),
    eliminated: state.eliminated.map((entry) => entry.slice()),
    selected: state.selected,
    inputMode: state.inputMode,
    hint: state.hint,
    conflicts: state.conflicts.slice(),
    history: state.history,
  };
}

function commit(state: GameState, mutate: (next: GameState) => void): GameState {
  const next = cloneState(state);
  next.history = [...state.history, snapshotOf(state)].slice(-80);
  mutate(next);
  next.conflicts = conflictIndices(next.values);
  return next;
}

export function createGame(puzzle: Puzzle = getPuzzle("last-five")): GameState {
  const values = parseGrid(puzzle.givens);
  const givens = values.map((value) => value !== 0);
  return {
    puzzleId: puzzle.id,
    values,
    givens,
    locked: Array(81).fill(false),
    sources: givens.map((given) => (given ? "given" : null)),
    eliminated: Array.from({ length: 81 }, () => []),
    selected: values.findIndex((value) => value === 0),
    inputMode: "digit",
    hint: null,
    conflicts: conflictIndices(values),
    history: [],
  };
}

export function puzzleOf(state: GameState): Puzzle {
  return getPuzzle(state.puzzleId);
}

export function isSolved(state: GameState): boolean {
  const solution = parseGrid(puzzleOf(state).solution);
  return state.values.every((value, index) => value === solution[index]);
}

export function emptyCount(state: GameState): number {
  return state.values.filter((value) => value === 0).length;
}

function techniqueTitle(technique: Technique): string {
  switch (technique) {
    case "naked_single":
      return "Naked single";
    case "hidden_single":
      return "Hidden single";
    case "naked_pair":
      return "Naked pair";
    case "pointing":
      return "Pointing pair";
  }
}

export function findHint(state: GameState): Hint | null {
  const candidates = computeCandidates(state.values, state.eliminated);

  for (let index = 0; index < 81; index += 1) {
    if (state.values[index] !== 0) continue;
    if (state.locked[index]) continue;
    if (candidates[index].length === 1) {
      const digit = candidates[index][0] as Digit;
      return {
        technique: "naked_single",
        title: techniqueTitle("naked_single"),
        explanation: `${cellRef(index)} has only one candidate left: ${digit}. Every other digit already appears in its row, column, or box.`,
        cells: [index],
        unitCells: [index, ...PEERS[index]],
        digit,
        fill: { index, digit },
      };
    }
  }

  for (const unit of UNITS) {
    for (const digit of DIGITS) {
      const places = unit.filter(
        (index) => state.values[index] === 0 && !state.locked[index] && candidates[index].includes(digit)
      );
      if (places.length === 1) {
        const index = places[0];
        return {
          technique: "hidden_single",
          title: techniqueTitle("hidden_single"),
          explanation: `${digit} can only go in ${cellRef(index)} in this unit. Every other empty cell in the unit has already ruled it out.`,
          cells: [index],
          unitCells: unit.slice(),
          digit,
          fill: { index, digit },
        };
      }
    }
  }

  for (const unit of UNITS) {
    const pairs = new Map<string, number[]>();
    for (const index of unit) {
      if (state.values[index] !== 0 || state.locked[index]) continue;
      if (candidates[index].length !== 2) continue;
      const key = candidates[index].slice().sort().join(",");
      const list = pairs.get(key) ?? [];
      list.push(index);
      pairs.set(key, list);
    }
    for (const [key, cells] of pairs) {
      if (cells.length !== 2) continue;
      const digits = key.split(",").map(Number) as Digit[];
      const others = unit.filter(
        (index) =>
          !cells.includes(index) &&
          state.values[index] === 0 &&
          !state.locked[index] &&
          digits.some((digit) => candidates[index].includes(digit))
      );
      if (others.length === 0) continue;
      return {
        technique: "naked_pair",
        title: techniqueTitle("naked_pair"),
        explanation: `${cellRef(cells[0])} and ${cellRef(cells[1])} both contain only ${digits[0]} and ${digits[1]}, so those two digits are taken. Cross them off the rest of the unit.`,
        cells,
        unitCells: unit.slice(),
        digit: digits[0],
        eliminate: [{ indices: others, digits }],
      };
    }
  }

  for (let box = 0; box < 9; box += 1) {
    const boxCells = BOXES[box];
    for (const digit of DIGITS) {
      const places = boxCells.filter(
        (index) => state.values[index] === 0 && candidates[index].includes(digit)
      );
      if (places.length < 2) continue;
      const rows = new Set(places.map(rowOf));
      const cols = new Set(places.map(colOf));
      if (rows.size === 1) {
        const row = [...rows][0];
        const others = ROWS[row].filter(
          (index) =>
            !boxCells.includes(index) &&
            state.values[index] === 0 &&
            !state.locked[index] &&
            candidates[index].includes(digit)
        );
        if (others.length > 0) {
          return {
            technique: "pointing",
            title: techniqueTitle("pointing"),
            explanation: `In this box, ${digit} only appears in row ${row + 1}. It cannot appear in the rest of that row outside the box.`,
            cells: places,
            unitCells: [...boxCells, ...ROWS[row]],
            digit,
            eliminate: [{ indices: others, digits: [digit] }],
          };
        }
      }
      if (cols.size === 1) {
        const col = [...cols][0];
        const others = COLS[col].filter(
          (index) =>
            !boxCells.includes(index) &&
            state.values[index] === 0 &&
            !state.locked[index] &&
            candidates[index].includes(digit)
        );
        if (others.length > 0) {
          return {
            technique: "pointing",
            title: techniqueTitle("pointing"),
            explanation: `In this box, ${digit} only appears in column ${col + 1}. It cannot appear in the rest of that column outside the box.`,
            cells: places,
            unitCells: [...boxCells, ...COLS[col]],
            digit,
            eliminate: [{ indices: others, digits: [digit] }],
          };
        }
      }
    }
  }

  return null;
}

function boardView(state: GameState): BoardView {
  const puzzle = puzzleOf(state);
  const candidates = computeCandidates(state.values, state.eliminated);
  const candidateMap: Record<string, number[]> = {};
  candidates.forEach((digits, index) => {
    if (digits.length > 0) candidateMap[cellRef(index)] = digits;
  });
  return {
    puzzleId: puzzle.id,
    name: puzzle.name,
    difficulty: puzzle.difficulty,
    grid: formatGrid(state.values),
    empty: emptyCount(state),
    selected: state.selected === null ? null : cellRef(state.selected),
    locked: state.locked.flatMap((locked, index) => (locked ? [cellRef(index)] : [])),
    givens: state.givens.flatMap((given, index) => (given ? [cellRef(index)] : [])),
    candidates: candidateMap,
    conflicts: state.conflicts.map(cellRef),
    hint: state.hint,
    solved: isSolved(state),
    agentPolicy: AGENT_POLICY,
  };
}

function result(state: GameState, ok: boolean, message: string, extra?: Partial<ToolResult>): ToolResult {
  return {
    ok,
    message,
    board: boardView(state),
    ...extra,
  };
}

export function loadPuzzle(id: string): GameState {
  return createGame(getPuzzle(id));
}

export function selectCell(state: GameState, index: number): GameState {
  return {
    ...state,
    selected: index,
  };
}

export function setInputMode(state: GameState, inputMode: GameState["inputMode"]): GameState {
  return { ...state, inputMode };
}

function canAgentWrite(state: GameState, index: number, source: FillSource): string | null {
  if (state.givens[index]) return `${cellRef(index)} is a given and cannot be changed.`;
  if (source === "agent" && state.locked[index]) {
    return `${cellRef(index)} is locked. Unlock it before the agent may write there.`;
  }
  return null;
}

export function setCell(
  state: GameState,
  index: number,
  digit: Digit,
  source: FillSource
): { state: GameState; result: ToolResult } {
  const blocked = canAgentWrite(state, index, source);
  if (blocked) return { state, result: result(state, false, blocked) };
  if (state.values[index] === digit) {
    return { state, result: result(state, true, `${cellRef(index)} is already ${digit}.`) };
  }

  const next = commit(state, (draft) => {
    draft.values[index] = digit;
    draft.sources[index] = source;
    draft.eliminated[index] = [];
    draft.selected = index;
    draft.hint = null;
    for (const peer of PEERS[index]) {
      draft.eliminated[peer] = draft.eliminated[peer].filter((value) => value !== digit);
    }
  });
  const conflicts = next.conflicts.includes(index);
  return {
    state: next,
    result: result(
      next,
      !conflicts,
      conflicts
        ? `${digit} in ${cellRef(index)} clashes with another ${digit} in the same unit.`
        : `Set ${cellRef(index)} to ${digit}.`,
      { hint: next.hint }
    ),
  };
}

export function clearCell(
  state: GameState,
  index: number,
  source: FillSource
): { state: GameState; result: ToolResult } {
  const blocked = canAgentWrite(state, index, source);
  if (blocked) return { state, result: result(state, false, blocked) };
  if (state.values[index] === 0 && state.eliminated[index].length === 0) {
    return { state, result: result(state, true, `${cellRef(index)} is already empty.`) };
  }
  const next = commit(state, (draft) => {
    draft.values[index] = 0;
    draft.sources[index] = null;
    draft.eliminated[index] = [];
    draft.selected = index;
    draft.hint = null;
  });
  return { state: next, result: result(next, true, `Cleared ${cellRef(index)}.`) };
}

export function toggleCandidate(
  state: GameState,
  index: number,
  digit: Digit,
  source: FillSource
): { state: GameState; result: ToolResult } {
  const blocked = canAgentWrite(state, index, source);
  if (blocked) return { state, result: result(state, false, blocked) };
  if (state.values[index] !== 0) {
    return { state, result: result(state, false, `${cellRef(index)} is filled. Clear it before pencilling.`) };
  }
  const next = commit(state, (draft) => {
    const has = draft.eliminated[index].includes(digit);
    draft.eliminated[index] = has
      ? draft.eliminated[index].filter((value) => value !== digit)
      : [...draft.eliminated[index], digit].sort();
    draft.selected = index;
  });
  const crossed = next.eliminated[index].includes(digit);
  return {
    state: next,
    result: result(
      next,
      true,
      crossed ? `Crossed ${digit} off ${cellRef(index)}.` : `Restored candidate ${digit} on ${cellRef(index)}.`
    ),
  };
}

export function lockCell(state: GameState, index: number, locked: boolean): { state: GameState; result: ToolResult } {
  if (state.givens[index] && locked) {
    return { state, result: result(state, true, `${cellRef(index)} is a given, so it is already protected.`) };
  }
  const next = commit(state, (draft) => {
    draft.locked[index] = locked;
    draft.selected = index;
  });
  return {
    state: next,
    result: result(next, true, locked ? `Locked ${cellRef(index)} from the agent.` : `Unlocked ${cellRef(index)}.`),
  };
}

export function placeHint(state: GameState): { state: GameState; hint: Hint | null } {
  const hint = findHint(state);
  return { state: { ...state, hint, selected: hint?.cells[0] ?? state.selected }, hint };
}

export function applyHint(
  state: GameState,
  source: FillSource
): { state: GameState; result: ToolResult } {
  const hint = state.hint ?? findHint(state);
  if (!hint) {
    return {
      state: { ...state, hint: null },
      result: result(state, false, "No singles, pairs, or pointing claims are available. The grid may need a harder technique, or it is already solved."),
    };
  }
  if (hint.fill) {
    const applied = setCell(state, hint.fill.index, hint.fill.digit, source);
    return {
      state: { ...applied.state, hint },
      result: {
        ...applied.result,
        hint,
        message: applied.result.ok
          ? `Applied ${hint.title.toLowerCase()}: set ${cellRef(hint.fill.index)} to ${hint.fill.digit}. ${hint.explanation}`
          : applied.result.message,
      },
    };
  }
  if (hint.eliminate) {
    const next = commit(state, (draft) => {
      draft.hint = hint;
      for (const step of hint.eliminate ?? []) {
        for (const index of step.indices) {
          if (draft.givens[index] || (source === "agent" && draft.locked[index])) continue;
          const extra = step.digits.filter((digit) => !draft.eliminated[index].includes(digit));
          draft.eliminated[index] = [...draft.eliminated[index], ...extra].sort();
        }
      }
    });
    return {
      state: next,
      result: result(next, true, `Applied ${hint.title.toLowerCase()} and updated pencil marks.`, { hint }),
    };
  }
  return { state, result: result(state, false, "That hint has nothing to apply.") };
}

export function checkMove(state: GameState, index: number, digit: Digit): MoveCheck {
  if (state.givens[index]) {
    return { status: "given", message: `${cellRef(index)} is a printed given.`, cells: [index], digit };
  }
  if (state.locked[index]) {
    return {
      status: "locked",
      message: `${cellRef(index)} is locked. Unlock it if you want to write there.`,
      cells: [index],
      digit,
    };
  }
  if (state.values[index] !== 0 && state.values[index] !== digit) {
    return {
      status: "occupied",
      message: `${cellRef(index)} already holds ${state.values[index]}. Clear it first.`,
      cells: [index],
      digit,
    };
  }
  const clash = PEERS[index].filter((peer) => state.values[peer] === digit);
  if (clash.length > 0) {
    return {
      status: "conflict",
      message: `${digit} already appears in ${clash.map(cellRef).join(", ")}.`,
      cells: [index, ...clash],
      digit,
    };
  }
  const solutionDigit = asDigit(parseGrid(puzzleOf(state).solution)[index]);
  const hint = findHint({ ...state, selected: index });
  if (hint?.fill?.index === index && hint.fill.digit === digit) {
    return {
      status: "forced",
      message: `${digit} is forced in ${cellRef(index)} by a ${hint.title.toLowerCase()}.`,
      cells: hint.cells,
      digit,
      technique: hint.technique,
    };
  }
  if (solutionDigit !== digit) {
    return {
      status: "incorrect",
      message: `${digit} does not belong in ${cellRef(index)} for this puzzle's unique solution. That is a guess that will not hold.`,
      cells: [index],
      digit,
    };
  }
  const candidates = computeCandidates(state.values, state.eliminated)[index];
  if (candidates.length > 1) {
    return {
      status: "guess",
      message: `${digit} is the right answer, but it is not forced yet. ${cellRef(index)} still has candidates ${candidates.join(", ")}. Prefer a hint instead of guessing.`,
      cells: [index],
      digit,
    };
  }
  return {
    status: "correct",
    message: `${digit} is valid in ${cellRef(index)}.`,
    cells: [index],
    digit,
  };
}

export function explainCell(state: GameState, index: number): { message: string; candidates: number[]; hint: Hint | null } {
  const value = state.values[index];
  const candidates = computeCandidates(state.values, state.eliminated)[index];
  if (value !== 0) {
    const source = state.sources[index];
    const origin =
      source === "given" ? "printed as a given" : source === "agent" ? "filled by the agent" : "filled by you";
    return {
      message: `${cellRef(index)} is ${value}, ${origin}.${state.locked[index] ? " It is locked." : ""}`,
      candidates: [],
      hint: state.hint,
    };
  }
  const blockers = DIGITS.filter((digit) => !candidates.includes(digit)).map((digit) => {
    const peer = PEERS[index].find((item) => state.values[item] === digit);
    return peer ? `${digit} is in ${cellRef(peer)}` : `${digit} was pencilled off`;
  });
  const hint = findHint(state);
  const forced = hint?.fill?.index === index ? ` A ${hint.title.toLowerCase()} forces ${hint.digit}.` : "";
  return {
    message: `${cellRef(index)} is empty. Candidates: ${candidates.join(", ") || "none"}. Ruled out because ${blockers.join("; ")}.${forced}`,
    candidates,
    hint,
  };
}

export function undo(state: GameState): { state: GameState; result: ToolResult } {
  const previous = state.history[state.history.length - 1];
  if (!previous) return { state, result: result(state, false, "Nothing to undo.") };
  const next: GameState = {
    ...state,
    values: previous.values.slice(),
    locked: previous.locked.slice(),
    sources: previous.sources.slice(),
    eliminated: previous.eliminated.map((entry) => entry.slice()),
    selected: previous.selected,
    hint: previous.hint,
    history: state.history.slice(0, -1),
    conflicts: conflictIndices(previous.values),
  };
  return { state: next, result: result(next, true, "Undid the last change.") };
}

export function readBoard(state: GameState): ToolResult {
  const puzzle = puzzleOf(state);
  const hint = findHint(state);
  const solved = isSolved(state);
  return result(
    state,
    true,
    solved
      ? `${puzzle.name} is complete.`
      : `${puzzle.name} (${puzzle.difficulty}) has ${emptyCount(state)} empty cells.${hint ? ` Next technique: ${hint.title.toLowerCase()} at ${hint.cells.map(cellRef).join(", ")}.` : " No basic technique is available."}`
  );
}

export function enterDigit(
  state: GameState,
  digit: Digit,
  source: FillSource
): { state: GameState; result: ToolResult } {
  if (state.selected === null) {
    return { state, result: result(state, false, "Select a cell first.") };
  }
  if (state.inputMode === "pencil" && source === "you") {
    return toggleCandidate(state, state.selected, digit, source);
  }
  return setCell(state, state.selected, digit, source);
}

export function listPuzzles(): { id: string; name: string; difficulty: string; blurb: string }[] {
  return PUZZLES.map(({ id, name, difficulty, blurb }) => ({ id, name, difficulty, blurb }));
}

/** Brute-force unique solver used to verify bundled puzzles. */
export function solveUnique(givens: string): { solutions: string[]; unique: boolean } {
  const start = parseGrid(givens);
  const solutions: number[][] = [];

  function search(values: number[]): boolean {
    if (solutions.length > 1) return true;
    const candidates = computeCandidates(
      values,
      Array.from({ length: 81 }, () => [])
    );
    let best = -1;
    let bestLen = 10;
    for (let index = 0; index < 81; index += 1) {
      if (values[index] !== 0) continue;
      if (candidates[index].length === 0) return false;
      if (candidates[index].length < bestLen) {
        best = index;
        bestLen = candidates[index].length;
      }
    }
    if (best === -1) {
      solutions.push(values.slice());
      return solutions.length > 1;
    }
    for (const digit of candidates[best]) {
      values[best] = digit;
      if (search(values)) {
        values[best] = 0;
        return true;
      }
      values[best] = 0;
    }
    return false;
  }

  search(start);
  return {
    solutions: solutions.map(formatGrid),
    unique: solutions.length === 1,
  };
}

export { PUZZLES, getPuzzle };
