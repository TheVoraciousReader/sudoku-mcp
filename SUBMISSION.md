# Devpost submission notes

Hackathon: [The WebMCP Challenge](https://webmcp.devpost.com/)  
Deadline: **September 3, 2026 at 1:00pm PDT**. After that, do not edit the Devpost form, the public GitHub repo, or the live site until winners are announced.

Official rules: [webmcp.devpost.com/rules](https://webmcp.devpost.com/rules)

## Required pieces

Devpost will not accept Origin. The code repository must be **public on GitHub, GitLab, or Bitbucket**.

| Item | Status |
| --- | --- |
| Public GitHub/GitLab/Bitbucket repo | Needs a public GitHub push (this cloud session has no GitHub login) |
| Open-source license at **repo root** | MIT `LICENSE` at repository root |
| `document.modelContext.registerTool` in the repo | `src/lib/webmcp/register-tools.ts` |
| Working **live URL** (not localhost) | Still need to deploy (Vercel, Netlify, Cloudflare, Render, …) |
| Text description (four prompts below) | Draft below |
| Demo video **< 3 minutes**, public **YouTube**, **with audio** | Still need to record and upload |
| Testing instructions | In the root README |

Judges may skip running the app and score from the description, README, and video. The live URL still has to work.

## Judging (equal weight)

1. WebMCP leverage — non-trivial, working tools
2. Execution — complete product, not a PoC
3. Potential impact — real audience, demonstrated
4. Creativity & ambition — not a showcase clone (notes, groceries, crossword)

## Paste into Devpost

**Why this use case is a strong fit for WebMCP**  
Sudoku is a shared visual workspace. The user is present, watching the same grid mutate. WebMCP lets the site expose hint, check, fill-one-step, and lock as structured tools instead of the agent clicking cells or dumping 81 digits in chat.

**How it creates a better user experience**  
You see the technique (naked single, hidden single, pair, pointing) highlighted before anything is filled. You can lock a cell the agent must not touch. Agent fills are teal, yours are indigo, givens stay ink. The shared log shows every tool call.

**What people and agents can do together that was difficult before**  
Teach a deduction on a live board without spoiling the puzzle, and without the agent reverse-engineering the UI. `check_move` distinguishes a clash, a guess that is not forced, and a digit a technique already forces.

**How WebMCP was implemented**  
Imperative `document.modelContext.registerTool` on the top-level page after mount. Feature-detect `document.modelContext`. Tools share the same engine as clicks. `AbortSignal` unregisters on unmount. No iframes, no declarative HTML tools (ChatGPT’s in-app browser does not support those).

## After you publish GitHub + a live URL

1. Join the hackathon on Devpost.
2. Enter a Submission with the public GitHub URL, live URL, description, and YouTube link.
3. Make sure GitHub’s About sidebar shows **MIT**.
4. Freeze the submitted repo and live site after 1:00pm PDT on Sep 3.
