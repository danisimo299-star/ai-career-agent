import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * `www.profymind.ru` is the canonical production host — the bare apex
   * domain permanently redirects to it. Without this, a session cookie set
   * while signed in on one host is never sent on the other (no shared
   * `Domain` attribute), which reads as "got logged out" the moment a user
   * lands on the non-canonical host — this closes that off by making sure
   * the app is only ever actually used from one host. Matches on the
   * request's `Host` header, so this never fires for `localhost` in dev or
   * a `*.vercel.app` preview URL.
   */
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "profymind.ru" }],
        destination: "https://www.profymind.ru/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
