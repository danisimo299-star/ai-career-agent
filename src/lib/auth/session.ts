import { auth } from "./auth";
import { userRepository } from "@/server/repositories/user.repository";

/**
 * Server-side helper for getting the current user in server components /
 * route handlers. `name` and `image` are re-fetched from the database
 * rather than read off the JWT claims, since those claims are frozen at
 * sign-in time — onboarding sets `name` afterwards, and a Google account's
 * `image` can likewise change after the session was issued — so trusting
 * the token would show stale values until the session cookie is re-issued.
 */
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const dbUser = await userRepository.findById(session.user.id);
  return { ...session.user, name: dbUser?.name ?? session.user.name, image: dbUser?.image ?? session.user.image };
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
