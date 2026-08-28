import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge-safe config: no Prisma or bcrypt imports here, so this file can be
 * bundled into `proxy.ts`, which runs on the Edge runtime. The
 * Node-only pieces (Credentials `authorize`, Prisma adapter) are added
 * in `auth.ts`, which only ever runs in the Node.js runtime (route
 * handlers, server components, server actions).
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    authorized: ({ auth, request }) => {
      const { pathname } = request.nextUrl;
      const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");
      return isProtected ? Boolean(auth?.user) : true;
    },
    jwt: ({ token, user }) => {
      if (user) token.sub = user.id;
      return token;
    },
    session: ({ session, token }) => {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
  session: {
    strategy: "jwt",
    // Auth.js's own default is already 30 days, computed into the session
    // cookie's `expires` at sign-in — set explicitly so it's not silently
    // dependent on a library default that could change, and so it's
    // obvious this is a deliberate "stay signed in" product decision, not
    // an oversight. A real Expires/Max-Age on the cookie (not a
    // browser-session-only cookie) is what actually keeps the user signed
    // in after fully closing the browser — see `cookies.sessionToken`
    // below for the explicit cookie-level configuration.
    maxAge: 30 * 24 * 60 * 60, // 30 days
    // Re-issues the session cookie (refreshing its Expires) once a day for
    // an active user, instead of on every single request — keeps a user
    // who visits regularly signed in indefinitely without writing a fresh
    // cookie on every page load.
    updateAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        // Only over HTTPS in production — matches Auth.js's own
        // `useSecureCookies` default (true whenever `NEXTAUTH_URL`/the
        // request is HTTPS), made explicit here rather than left implicit.
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
} satisfies NextAuthConfig;
