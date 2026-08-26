import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { resumeService } from "@/server/services/resume.service";
import { coachService } from "@/server/services/coach.service";
import { ResumeView } from "@/components/resume/resume-view";
import type { ResumeData } from "@/components/resume/types";

export default async function ResumePage() {
  const user = await getCurrentUser();
  if (!user?.id) redirect("/login");

  const locale = await getLocale();

  // The Coach's own context snapshot already resolves "what's the user's
  // real target role" (roadmap career title, else top recommendation) — the
  // welcome flow reuses it instead of asking again for something the app
  // already knows (item 3).
  const [resume, coachContext] = await Promise.all([resumeService.getCurrent(user.id), coachService.getContext(user.id, locale)]);

  const resumeData: ResumeData = {
    ...(resume as unknown as ResumeData),
    createdAt: resume.createdAt.toISOString(),
    updatedAt: resume.updatedAt.toISOString(),
  };

  return <ResumeView initialResume={resumeData} suggestedTargetRole={coachContext.targetRole} />;
}
