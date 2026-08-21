import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { interviewService, getWeakSkillRecommendation } from "@/server/services/interview.service";
import { roadmapRepository } from "@/server/repositories/roadmap.repository";
import { InterviewView } from "@/components/interview/interview-view";
import type { InterviewSessionData } from "@/components/interview/types";

export default async function InterviewPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) redirect("/login");

  const [sessions, weakSkill, roadmap, params] = await Promise.all([
    interviewService.listByUser(user.id),
    getWeakSkillRecommendation(user.id),
    roadmapRepository.findByUser(user.id),
    searchParams,
  ]);

  const initialSessions: InterviewSessionData[] = sessions.map((session) => ({
    ...(session as unknown as InterviewSessionData),
    createdAt: session.createdAt.toISOString(),
    finishedAt: session.finishedAt ? session.finishedAt.toISOString() : null,
  }));

  return (
    <InterviewView
      initialSessions={initialSessions}
      weakSkill={weakSkill}
      defaultTargetRole={roadmap?.careerTitle ?? null}
      initialCustomRole={params.role ?? null}
    />
  );
}
