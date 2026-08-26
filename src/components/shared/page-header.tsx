import type { LucideIcon } from "lucide-react";

export type PageHeaderTone = "neutral" | "chat" | "profile" | "roadmap" | "tasks" | "resume" | "interview" | "jobs";

const TONE_CLASSES: Record<PageHeaderTone, string> = {
  neutral: "bg-primary text-primary-foreground",
  chat: "bg-tool-chat-solid text-white",
  profile: "bg-tool-profile-solid text-white",
  roadmap: "bg-tool-roadmap-solid text-white",
  tasks: "bg-tool-tasks-solid text-white",
  resume: "bg-tool-resume-solid text-white",
  interview: "bg-tool-interview-solid text-white",
  jobs: "bg-tool-jobs-solid text-white",
};

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
  /** Which small per-feature accent color the icon badge uses — never a whole-page color, just this one badge. Defaults to the neutral ink accent. */
  tone?: PageHeaderTone;
}

/** The one page-title pattern every dashboard route uses — icon + title + subtitle, actions on the right. Owns the icon's colored-circle wrapper itself so every page renders the exact same badge instead of each view hand-rolling a slightly different one. */
export function PageHeader({ title, description, action, icon: Icon, tone = "neutral" }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${TONE_CLASSES[tone]}`}>
            <Icon className="size-5" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
