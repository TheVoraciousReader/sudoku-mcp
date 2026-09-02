# Givens

A Sudoku studio for people and agents. You share one live grid. The agent names the next technique, highlights the cells, and waits. You fill, lock, or tell it to take one safe step.

This is a [WebMCP](https://webmachinelearning.github.io/webmcp/) app for the [WebMCP Challenge](https://webmcp.devpost.com/). Site tools are registered on the top-level page with `document.modelContext.registerTool`. ChatGPT Work and Codex can call them from the ChatGPT desktop in-app browser.

## Why WebMCP

Sudoku is a bad fit for a dumped answer and a good fit for a shared page:

- The grid is the workspace. Fills and highlights happen in the same session you are looking at.
- `hint` explains a naked single, hidden single, naked pair, or pointing pair without writing a digit.
- `check_move` tells you if a digit is a conflict, a guess, or forced.
- `apply_next_step` writes exactly one deduction.
- `lock_cell` fences a cell the agent must not touch.

The agent is told, in tool descriptions and in every `read_board` snapshot, not to print the full solution.

## Run locally

From the repo root:

```bash
cd proj/sudokumcp
npm install
npm run dev
```

Open [http://127.0.0.1:43147](http://127.0.0.1:43147). The puzzle is fully playable in any browser.

### Site tools (ChatGPT / Codex)

1. Update the ChatGPT desktop app.
2. Use GPT-5.6 Sol or Terra (Luna, Enterprise, and Edu do not expose site tools).
3. Open the live URL in ChatGPT’s built-in browser.
4. Confirm **Site tools** in the address bar.
5. Try: `Give me a hint, don't fill anything.`

Or test in Chrome 149+ with `chrome://flags/#enable-webmcp-testing`.

Declarative HTML tools and iframe tools are not used. ChatGPT does not discover those.

## Tools

| Tool | What it does |
| --- | --- |
| `read_board` | Grid, candidates, locks, next technique, agent policy |
| `select_cell` | Point at a cell |
| `hint` | Explain the next technique, do not fill |
| `explain_cell` | Candidates and blockers for one cell |
| `check_move` | Validate a proposed digit |
| `apply_next_step` | Apply one deduction |
| `set_cell` / `clear_cell` | Write or erase one cell |
| `toggle_candidate` | Pencil mark |
| `lock_cell` / `unlock_cell` | Agent fence |
| `undo` | Revert the last change |
| `load_puzzle` | Switch bundled puzzles |

## Scripts

```bash
npm run dev      # http://127.0.0.1:43147
npm run build
npm run verify   # unique solutions + technique solver
```

## Stack

Next.js, TypeScript, Tailwind, shadcn/ui. The solver and all tools run in the client. No account, no API key.
