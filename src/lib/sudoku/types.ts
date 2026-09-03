export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Difficulty = "demo" | "easy" | "medium" | "hard" | "custom";
export type FillSource = "given" | "you" | "agent";
export type InputMode = "digit" | "pencil";

export type Puzzle = {
  id: string;
  name: string;
  difficulty: Difficulty;
  givens: string;
  solution: string;
  blurb: string;
};

export type Technique =
  | "naked_single"
  | "hidden_single"
  | "naked_pair"
  | "pointing";

export type Hint = {
  technique: Technique;
  title: string;
  explanation: string;
  cells: number[];
  unitCells: number[];
  digit: Digit;
  fill?: { index: number; digit: Digit };
  eliminate?: { indices: number[]; digits: Digit[] }[];
};

export type MoveCheck =
  | {
      status: "given" | "locked" | "occupied" | "conflict" | "incorrect" | "guess" | "forced" | "correct";
      message: string;
      cells?: number[];
      digit?: Digit;
      technique?: Technique;
    };

export type GameState = {
  puzzleId: string;
  puzzle: Puzzle;
  values: number[];
  givens: boolean[];
  locked: boolean[];
  sources: (FillSource | null)[];
  eliminated: number[][];
  selected: number | null;
  inputMode: InputMode;
  hint: Hint | null;
  conflicts: number[];
  history: HistorySnapshot[];
};

export type HistorySnapshot = {
  values: number[];
  locked: boolean[];
  sources: (FillSource | null)[];
  eliminated: number[][];
  selected: number | null;
  hint: Hint | null;
};

export type BoardView = {
  puzzleId: string;
  name: string;
  difficulty: Difficulty;
  grid: string;
  empty: number;
  selected: string | null;
  locked: string[];
  givens: string[];
  candidates: Record<string, number[]>;
  conflicts: string[];
  hint: Hint | null;
  solved: boolean;
  agentPolicy: string;
};

export type ToolResult = {
  ok: boolean;
  message: string;
  board: BoardView;
  hint?: Hint | null;
  check?: MoveCheck;
};
