import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Code-generated per Next's App Router `icon` file convention — no binary
 * asset to go stale or 404. Draws the exact same Sparkles glyph
 * `ProfyMindLogo` already falls back to everywhere in the UI (sidebar,
 * auth pages, landing header) whenever the real `/brand/profymind-logo.png`
 * isn't present — see that component. Filled solid (not stroked, unlike
 * the in-app icon) because a 2px stroke on a 24-unit path all but
 * disappears once scaled down to an actual 16px browser tab.
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
        <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff">
          <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
          <circle cx="19" cy="5" r="1.6" />
          <circle cx="4" cy="20" r="1.6" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
