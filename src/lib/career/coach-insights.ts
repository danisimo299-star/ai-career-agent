import { normalizeSkill, normalizeSkills } from "./skill-normalization";

export interface SavedJobSkillInsight {
  skill: string;
  jobCount: number;
}

/**
 * "You've saved 3 jobs that need Docker, which isn't in your profile" —
 * computed from real `SavedJob.requiredSkills` (captured at save time from
 * the actual vacancy), never invented. Only surfaces once a skill is
 * missing from at least 2 saved jobs — a single job isn't a pattern worth
 * interrupting the user about.
 */
export function findTopMissingSkillAcrossSavedJobs(
  savedJobs: { requiredSkills: string[] }[],
  userSkills: string[]
): SavedJobSkillInsight | null {
  const userSet = new Set(normalizeSkills(userSkills));
  const freq = new Map<string, { count: number; original: string }>();

  for (const job of savedJobs) {
    const seenInThisJob = new Set<string>();
    for (const skill of job.requiredSkills) {
      const norm = normalizeSkill(skill);
      if (userSet.has(norm) || seenInThisJob.has(norm)) continue;
      seenInThisJob.add(norm);
      const entry = freq.get(norm);
      if (entry) entry.count += 1;
      else freq.set(norm, { count: 1, original: skill });
    }
  }

  let best: SavedJobSkillInsight | null = null;
  for (const { count, original } of freq.values()) {
    if (!best || count > best.jobCount) best = { skill: original, jobCount: count };
  }
  return best && best.jobCount >= 2 ? best : null;
}
