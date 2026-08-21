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
  },
} satisfies NextAuthConfig;
