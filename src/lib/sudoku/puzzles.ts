import type { Puzzle } from "./types";

function compact(rows: string): string {
  return rows.replace(/\s+/g, "");
}

export const PUZZLES: Puzzle[] = [
  {
    id: "last-five",
    name: "Last five",
    difficulty: "demo",
    blurb: "Five empty cells. Best first demo: ask for a hint, then apply one step.",
    givens: compact(`
      534678912
      672195348
      198342567
      859761423
      426853791
      713924856
      961537280
      287419630
      345286000
    `),
    solution: compact(`
      534678912
      672195348
      198342567
      859761423
      426853791
      713924856
      961537284
      287419635
      345286179
    `),
  },
  {
    id: "morning-paper",
    name: "Morning paper",
    difficulty: "easy",
    blurb: "The classic newspaper grid. Naked and hidden singles will carry you.",
    givens: compact(`
      530070000
      600195000
      098000060
      800060003
      400803001
      700020006
      060000280
      000419005
      000080079
    `),
    solution: compact(`
      534678912
      672195348
      198342567
      859761423
      426853791
      713924856
      961537284
      287419635
      345286179
    `),
  },
  {
    id: "coffee-break",
    name: "Coffee break",
    difficulty: "easy",
    blurb: "A gentle grid with an obvious opening. Good for check_move.",
    givens: compact(`
      003020600
      900305001
      001806400
      008102900
      700000008
      006708200
      002609500
      800203009
      005010300
    `),
    solution: compact(`
      483921657
      967345821
      251876493
      548132976
      729564138
      136798245
      372689514
      814253769
      695417382
    `),
  },
  {
    id: "commute",
    name: "Commuter",
    difficulty: "medium",
    blurb: "Singles stall. You will need a naked pair or a pointing claim.",
    givens: compact(`
      000260701
      680070090
      190004500
      820100040
      004602900
      050003028
      009300074
      040050036
      703018000
    `),
    solution: compact(`
      435269781
      682571493
      197834562
      826195347
      374682915
      951743628
      519326874
      248957136
      763418259
    `),
  },
  {
    id: "evening",
    name: "Evening edition",
    difficulty: "medium",
    blurb: "Keep pencil marks honest. Ask it to explain before filling.",
    givens: compact(`
      000000907
      000420180
      000705026
      100904000
      050000040
      000507009
      920108000
      034059000
      507000000
    `),
    solution: compact(`
      462831957
      795426183
      381795426
      173984265
      659312748
      248567319
      926178534
      834259671
      517643892
    `),
  },
  {
    id: "ink-hard",
    name: "Ink-stained",
    difficulty: "hard",
    blurb: "A tougher paper puzzle. Ask for hints; do not dump the solution.",
    givens: compact(`
      400000805
      030000000
      000700000
      020000060
      000080400
      000010000
      000603070
      500200000
      104000000
    `),
    solution: compact(`
      417369825
      632158947
      958724316
      825437169
      791586432
      346912758
      289643571
      573291684
      164875293
    `),
  },
];

export const DEFAULT_PUZZLE_ID = "last-five";

export function getPuzzle(id: string): Puzzle {
  return PUZZLES.find((puzzle) => puzzle.id === id) ?? PUZZLES[0];
}
