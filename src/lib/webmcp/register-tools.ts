import type { Digit, FillSource, GameState, ToolResult } from "@/lib/sudoku/types";
import { indexFromRef } from "@/lib/sudoku/engine";

type WebMcpTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute: (input: Record<string, unknown>, extras?: { signal?: AbortSignal }) => Promise<unknown> | unknown;
};

type WebMcpContext = {
  registerTool: (tool: WebMcpTool, options?: { signal?: AbortSignal }) => Promise<void>;
};

export function getModelContext(): WebMcpContext | null {
  if (typeof document === "undefined") return null;
  const fromDocument = document.modelContext;
  const fromNavigator = navigator.modelContext;
  const ctx = fromDocument ?? fromNavigator;
  return ctx && typeof ctx.registerTool === "function" ? ctx : null;
}

type StudioMethods = {
  readBoard: () => ToolResult;
  selectCell: (row: number, col: number) => ToolResult;
  setCell: (row: number, col: number, digit: Digit, source: FillSource) => ToolResult;
  clearCell: (row: number, col: number, source: FillSource) => ToolResult;
  toggleCandidate: (row: number, col: number, digit: Digit, source: FillSource) => ToolResult;
  lockCell: (row: number, col: number, locked: boolean) => ToolResult;
  hint: () => ToolResult;
  explainCell: (row: number, col: number) => ToolResult;
  checkMove: (row: number, col: number, digit: Digit) => ToolResult;
  applyNextStep: (source: FillSource) => ToolResult;
  undo: () => ToolResult;
  loadPuzzle: (id: string) => ToolResult;
  loadCustomPuzzle: (grid: string) => ToolResult;
  listPuzzles: () => { id: string; name: string; difficulty: string; blurb: string }[];
};

const cellProps = {
  row: { type: "integer", minimum: 1, maximum: 9, description: "Row number, 1 at the top." },
  col: { type: "integer", minimum: 1, maximum: 9, description: "Column number, 1 at the left." },
} as const;

const digitProp = {
  type: "integer",
  minimum: 1,
  maximum: 9,
  description: "Digit 1-9.",
} as const;

function cellInput(input: Record<string, unknown>): { row: number; col: number } | string {
  const row = Number(input.row);
  const col = Number(input.col);
  if (indexFromRef(row, col) === null) {
    return "row and col must be integers from 1 to 9.";
  }
  return { row, col };
}

function digitInput(input: Record<string, unknown>): Digit | string {
  const digit = Number(input.digit);
  if (!Number.isInteger(digit) || digit < 1 || digit > 9) return "digit must be an integer from 1 to 9.";
  return digit as Digit;
}

export async function registerSudokuTools(
  ctx: WebMcpContext,
  methods: StudioMethods,
  signal: AbortSignal
): Promise<void> {
  const options = { signal };

  await ctx.registerTool(
    {
      name: "read_board",
      description:
        "Read the live Sudoku grid, empty-cell candidates, locks, conflicts, and the next safe technique. Use this before acting. Do not print the full solution. Follow board.agentPolicy.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: async () => methods.readBoard(),
    },
    options
  );

  await ctx.registerTool(
    {
      name: "select_cell",
      description: "Select a cell so the human can see where you are looking. Does not change digits.",
      inputSchema: {
        type: "object",
        properties: cellProps,
        required: ["row", "col"],
        additionalProperties: false,
      },
      execute: async (input) => {
        const cell = cellInput(input);
        if (typeof cell === "string") return { ok: false, message: cell };
        return methods.selectCell(cell.row, cell.col);
      },
    },
    options
  );

  await ctx.registerTool(
    {
      name: "set_cell",
      description:
        "Fill one empty cell with a digit. Prefer hint or apply_next_step unless the user asked you to enter a specific digit. Cannot change givens or locked cells.",
      inputSchema: {
        type: "object",
        properties: { ...cellProps, digit: digitProp },
        required: ["row", "col", "digit"],
        additionalProperties: false,
      },
      execute: async (input) => {
        const cell = cellInput(input);
        if (typeof cell === "string") return { ok: false, message: cell };
        const digit = digitInput(input);
        if (typeof digit === "string") return { ok: false, message: digit };
        return methods.setCell(cell.row, cell.col, digit, "agent");
      },
    },
    options
  );

  await ctx.registerTool(
    {
      name: "clear_cell",
      description: "Clear a non-given cell. Cannot clear givens or locked cells.",
      inputSchema: {
        type: "object",
        properties: cellProps,
        required: ["row", "col"],
        additionalProperties: false,
      },
      execute: async (input) => {
        const cell = cellInput(input);
        if (typeof cell === "string") return { ok: false, message: cell };
        return methods.clearCell(cell.row, cell.col, "agent");
      },
    },
    options
  );

  await ctx.registerTool(
    {
      name: "toggle_candidate",
      description: "Pencil or cross off a candidate digit in an empty cell.",
      inputSchema: {
        type: "object",
        properties: { ...cellProps, digit: digitProp },
        required: ["row", "col", "digit"],
        additionalProperties: false,
      },
      execute: async (input) => {
        const cell = cellInput(input);
        if (typeof cell === "string") return { ok: false, message: cell };
        const digit = digitInput(input);
        if (typeof digit === "string") return { ok: false, message: digit };
        return methods.toggleCandidate(cell.row, cell.col, digit, "agent");
      },
    },
    options
  );

  await ctx.registerTool(
    {
      name: "lock_cell",
      description: "Lock a cell so the agent cannot write there. The human can still edit it.",
      inputSchema: {
        type: "object",
        properties: cellProps,
        required: ["row", "col"],
        additionalProperties: false,
      },
      execute: async (input) => {
        const cell = cellInput(input);
        if (typeof cell === "string") return { ok: false, message: cell };
        return methods.lockCell(cell.row, cell.col, true);
      },
    },
    options
  );

  await ctx.registerTool(
    {
      name: "unlock_cell",
      description: "Allow the agent to write in a previously locked cell.",
      inputSchema: {
        type: "object",
        properties: cellProps,
        required: ["row", "col"],
        additionalProperties: false,
      },
      execute: async (input) => {
        const cell = cellInput(input);
        if (typeof cell === "string") return { ok: false, message: cell };
        return methods.lockCell(cell.row, cell.col, false);
      },
    },
    options
  );

  await ctx.registerTool(
    {
      name: "hint",
      description:
        "Find the next safe Sudoku technique (naked single, hidden single, naked pair, or pointing pair). Highlights the cells and explains why. Does not fill anything. Use this when the user wants help without spoilers.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: async () => methods.hint(),
    },
    options
  );

  await ctx.registerTool(
    {
      name: "explain_cell",
      description: "Explain one cell: current digit or remaining candidates, and why other digits are impossible.",
      inputSchema: {
        type: "object",
        properties: cellProps,
        required: ["row", "col"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const cell = cellInput(input);
        if (typeof cell === "string") return { ok: false, message: cell };
        return methods.explainCell(cell.row, cell.col);
      },
    },
    options
  );

  await ctx.registerTool(
    {
      name: "check_move",
      description:
        "Check whether a proposed digit belongs in a cell. Distinguishes conflicts, guesses that are not yet forced, and digits that a technique already forces. Does not fill the cell.",
      inputSchema: {
        type: "object",
        properties: { ...cellProps, digit: digitProp },
        required: ["row", "col", "digit"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: async (input) => {
        const cell = cellInput(input);
        if (typeof cell === "string") return { ok: false, message: cell };
        const digit = digitInput(input);
        if (typeof digit === "string") return { ok: false, message: digit };
        return methods.checkMove(cell.row, cell.col, digit);
      },
    },
    options
  );

  await ctx.registerTool(
    {
      name: "apply_next_step",
      description:
        "Apply exactly one safe deduction: fill a forced cell or cross off candidates from a pair/pointing claim. Never solves the whole puzzle in one call. Use only when the user wants a fill, not just an explanation.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute: async () => methods.applyNextStep("agent"),
    },
    options
  );

  await ctx.registerTool(
    {
      name: "undo",
      description: "Undo the last grid change (fill, clear, pencil, or lock).",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute: async () => methods.undo(),
    },
    options
  );

  await ctx.registerTool(
    {
      name: "load_puzzle",
      description:
        "Load a bundled puzzle by id. Ids: last-five, morning-paper, coffee-break, commute, evening, ink-hard. Resets the board.",
      inputSchema: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Puzzle id from read_board or this list: last-five, morning-paper, coffee-break, commute, evening, ink-hard.",
          },
        },
        required: ["id"],
        additionalProperties: false,
      },
      execute: async (input) => {
        const id = String(input.id ?? "");
        if (!id) return { ok: false, message: "Provide a puzzle id." };
        return methods.loadPuzzle(id);
      },
    },
    options
  );

  await ctx.registerTool(
    {
      name: "load_custom_puzzle",
      description:
        "Load a Sudoku the human pasted. grid is 81 cells (digits, 0 or . for blanks). Spaces and line breaks are allowed. Rejects invalid, unsolvable, or non-unique grids. Resets the board.",
      inputSchema: {
        type: "object",
        properties: {
          grid: {
            type: "string",
            description: "81 Sudoku cells as digits. Use 0 or . for empty cells.",
          },
        },
        required: ["grid"],
        additionalProperties: false,
      },
      execute: async (input) => {
        const grid = String(input.grid ?? "");
        if (!grid.trim()) return { ok: false, message: "Provide a grid of 81 cells." };
        return methods.loadCustomPuzzle(grid);
      },
    },
    options
  );
}

export type { StudioMethods, GameState };
