import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { resumeService } from "@/server/services/resume.service";
import { ResumeView } from "@/components/resume/resume-view";
import type { ResumeData } from "@/components/resume/types";

export default async function ResumePage() {
  const user = await getCurrentUser();
  if (!user?.id) redirect("/login");

  const resume = await resumeService.getCurrent(user.id);

  const resumeData: ResumeData = {
    ...(resume as unknown as ResumeData),
    createdAt: resume.createdAt.toISOString(),
    updatedAt: resume.updatedAt.toISOString(),
  };

  return <ResumeView initialResume={resumeData} />;
}
