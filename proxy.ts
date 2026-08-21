import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

/**
 * Route guard, evaluated on the Edge runtime before a request reaches
 * `/dashboard/*` or `/onboarding`. Only uses the edge-safe `authConfig`
 * (see that file for why Credentials/Prisma are excluded here). This is an
 * optimistic check only — real authorization still happens server-side in
 * each route.
 */
export const { auth: proxy } = NextAuth(authConfig);

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding"],
};
