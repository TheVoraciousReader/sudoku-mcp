# Givens

A Sudoku studio for people and agents. You share one live grid. The agent names the next technique, highlights the cells, and waits. You fill, lock, or take one safe step. No dumped solutions.

Built for the [WebMCP Challenge](https://webmcp.devpost.com/).

License: MIT (this file is at the repository root so GitHub can detect it).

## Run

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43147](http://127.0.0.1:43147). The puzzle is playable without WebMCP.

## How WebMCP is implemented

Tools register on the **top-level page** (ChatGPT does not discover iframe or declarative HTML tools):

```js
document.modelContext.registerTool({
  name: "hint",
  description: "Find the next safe Sudoku technique. Highlights cells. Does not fill.",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  execute: async (input) => { /* ... */ },
});
```

Registration lives in [`src/lib/webmcp/register-tools.ts`](src/lib/webmcp/register-tools.ts).

### Tools

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

## Test with ChatGPT / Codex (judges)

1. Open the **live URL** in the ChatGPT desktop in-app browser (GPT-5.6 Sol or Terra). Luna, Enterprise, and Edu do not expose site tools.
2. Confirm **Site tools** in the address bar.
3. Start on puzzle **Last five**, then try:

- Give me a hint, don't fill anything.
- Check whether r9c9 can be 9.
- Apply the next safe step.
- Lock r9c7 so you cannot write there, then hint again.

Or Chrome 149+ with `chrome://flags/#enable-webmcp-testing`.

## Why this is a WebMCP app

The grid is the shared workspace. Fills and highlights happen in the same session you are watching. The agent cannot overwrite givens or locked cells. `read_board` tells it not to print the full solution.

## Stack

Next.js, TypeScript, Tailwind, shadcn/ui. Solver and tools run in the client. No account, no API key.
