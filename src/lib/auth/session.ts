import { auth } from "./auth";
import { userRepository } from "@/server/repositories/user.repository";

/**
 * Server-side helper for getting the current user in server components /
 * route handlers. `name` is re-fetched from the database rather than read
 * off the JWT claim, since the claim is frozen at sign-in time and
 * onboarding sets the name afterwards — trusting the token would show a
 * stale (empty) name until the session cookie is re-issued.
 */
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const dbUser = await userRepository.findById(session.user.id);
  return { ...session.user, name: dbUser?.name ?? session.user.name };
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
