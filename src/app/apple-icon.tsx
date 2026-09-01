import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Same mark as `icon.tsx`, scaled up for the iPhone/iPad home-screen size
 * Apple recommends (180×180). Full-bleed square, no pre-rounded corners —
 * iOS applies its own squircle mask on top, so a self-rounded image here
 * would just double up as a visible inset square behind Apple's mask.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
        }}
      >
        <svg width="112" height="112" viewBox="0 0 24 24" fill="#ffffff">
          <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
          <circle cx="19" cy="5" r="1.6" />
          <circle cx="4" cy="20" r="1.6" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
