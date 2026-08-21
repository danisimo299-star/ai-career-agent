import bcrypt from "bcryptjs";
import { userRepository } from "@/server/repositories/user.repository";
import type { RegisterInput } from "@/lib/validation/auth.schema";

export class EmailTakenError extends Error {
  constructor() {
    super("An account with this email already exists.");
    this.name = "EmailTakenError";
  }
}

export const authService = {
  async register({ email, password }: RegisterInput) {
    const existing = await userRepository.findByEmail(email);
    if (existing) throw new EmailTakenError();

    const passwordHash = await bcrypt.hash(password, 12);
    return userRepository.create({ email, passwordHash });
  },
};
