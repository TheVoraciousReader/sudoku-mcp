import { ImageResponse } from "next/og";
import { brand } from "@/lib/seo";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
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
          padding: 3,
          gap: 1,
        }}
      >
        {cells.map((filled, index) => (
          <div
            key={index}
            style={{
              width: 8,
              height: 8,
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
