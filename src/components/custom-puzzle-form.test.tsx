import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { CustomPuzzleForm } from "@/components/custom-puzzle-form";

test("plays a pasted grid", async () => {
  const user = userEvent.setup();
  const onPlay = vi.fn(() => ({ ok: true, message: "Loaded Your own." }));
  const onPlayed = vi.fn();

  render(<CustomPuzzleForm onPlay={onPlay} onPlayed={onPlayed} />);

  await user.type(screen.getByLabelText(/your puzzle/i), "530070000");
  await user.click(screen.getByRole("button", { name: /play this puzzle/i }));

  expect(onPlay).toHaveBeenCalledWith("530070000");
  expect(onPlayed).toHaveBeenCalled();
});

test("shows the play error and does not close", async () => {
  const user = userEvent.setup();
  const onPlay = vi.fn(() => ({
    ok: false,
    message: "Need 81 cells (digits or dots). This has 9.",
  }));
  const onPlayed = vi.fn();

  render(<CustomPuzzleForm onPlay={onPlay} onPlayed={onPlayed} />);

  await user.type(screen.getByLabelText(/your puzzle/i), "530070000");
  await user.click(screen.getByRole("button", { name: /play this puzzle/i }));

  expect(screen.getByRole("alert").textContent).toBe("Need 81 cells (digits or dots). This has 9.");
  expect(onPlayed).not.toHaveBeenCalled();
});
