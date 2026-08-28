import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * `profymind.ru` (the bare apex) is the canonical production host — `www`
   * permanently redirects to it. Without this, a session cookie set while
   * signed in on one host is never sent on the other (this app deliberately
   * uses a host-only cookie, no shared `Domain` attribute — see
   * `auth.config.ts`), which reads as "got logged out" the moment a user
   * lands on the non-canonical host. This closes that off by making sure
   * the app is only ever actually used from one host. Matches on the
   * request's `Host` header, so this never fires for `localhost` in dev or
   * a `*.vercel.app` preview URL.
   */
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.profymind.ru" }],
        destination: "https://profymind.ru/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
