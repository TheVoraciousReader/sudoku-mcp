import { createGame, findHint, applyHint, isSolved, solveUnique, parseGrid, formatGrid } from "../src/lib/sudoku/engine";
import { PUZZLES } from "../src/lib/sudoku/puzzles";

for (const puzzle of PUZZLES) {
  const solved = solveUnique(puzzle.givens);
  const stored = formatGrid(parseGrid(puzzle.solution));
  console.log(
    `${puzzle.id}: unique=${solved.unique} solutions=${solved.solutions.length} storedMatch=${solved.solutions[0] === stored} first=${solved.solutions[0] ?? "NONE"}`
  );
  if (solved.unique && solved.solutions[0] !== stored) {
    console.log(`  expected stored: ${stored}`);
    console.log(`  actual unique:   ${solved.solutions[0]}`);
  }

  let state = createGame(puzzle);
  let steps = 0;
  while (!isSolved(state) && steps < 120) {
    const hint = findHint(state);
    if (!hint) break;
    const applied = applyHint({ ...state, hint }, "you");
    if (!applied.result.ok) break;
    state = applied.state;
    steps += 1;
  }
  console.log(`  techniques: steps=${steps} solved=${isSolved(state)} empty=${state.values.filter((v) => v === 0).length}`);
}
