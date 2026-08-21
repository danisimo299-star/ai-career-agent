import { z } from "zod";

export const coachMessageInputSchema = z.object({
  message: z.string().trim().min(1).max(2000),
});
export type CoachMessageInput = z.infer<typeof coachMessageInputSchema>;

export const compareScenariosInputSchema = z.object({
  roleTitles: z.array(z.string().trim().min(1).max(200)).min(2).max(4),
});
export type CompareScenariosInput = z.infer<typeof compareScenariosInputSchema>;
