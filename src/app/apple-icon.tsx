import { ImageResponse } from "next/og";
import { brand } from "@/lib/seo";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  const cells = [1, 0, 1, 0, 1, 0, 1, 0, 1];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexWrap: "wrap",
          background: brand.teal,
          padding: 18,
          gap: 6,
        }}
      >
        {cells.map((filled, index) => (
          <div
            key={index}
            style={{
              width: 44,
              height: 44,
              display: "flex",
              background: filled ? brand.paper : "rgba(251, 248, 241, 0.28)",
            }}
          />
        ))}
      </div>
    ),
    { ...size },
  );
}
