import { ImageResponse } from "next/og";
import { brand } from "@/lib/seo";
import { PUZZLES } from "@/lib/sudoku/puzzles";

export const alt = "Givens — share one Sudoku with ChatGPT. It names the next technique; you take the next step.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const CELL = 46;
const givens = PUZZLES[0].givens;

function boxLine(index: number): boolean {
  return index === 2 || index === 5 || index === 8;
}

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: brand.paper,
          color: brand.ink,
          padding: 64,
          gap: 56,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: 520,
            gap: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 22,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: brand.teal,
              fontWeight: 600,
            }}
          >
            Sudoku
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 88,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              fontWeight: 500,
            }}
          >
            Givens
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 32,
              lineHeight: 1.3,
              color: brand.muted,
              maxWidth: 480,
            }}
          >
            You and ChatGPT share one Sudoku. It names the next technique; you take the next step.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 12,
              fontSize: 22,
              color: brand.teal,
              fontWeight: 600,
            }}
          >
            One shared grid. One safe step.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flexGrow: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              background: brand.card,
              border: `3px solid ${brand.ink}`,
              boxShadow: "0 24px 50px rgba(48, 32, 16, 0.18)",
            }}
          >
            {Array.from({ length: 9 }, (_, row) => (
              <div key={row} style={{ display: "flex" }}>
                {Array.from({ length: 9 }, (_, col) => {
                  const digit = givens[row * 9 + col];
                  const filled = digit !== "0";
                  return (
                    <div
                      key={col}
                      style={{
                        width: CELL,
                        height: CELL,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                        fontFamily: "monospace",
                        fontWeight: 600,
                        color: brand.ink,
                        borderRight: `${boxLine(col) ? 3 : 1}px solid ${brand.ink}`,
                        borderBottom: `${boxLine(row) ? 3 : 1}px solid ${brand.ink}`,
                        background: filled ? brand.card : "#F7F1E6",
                      }}
                    >
                      {filled ? digit : ""}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
