"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IdCard, Map, FileText, Mic, Percent, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/locale-provider";

interface MetricItem {
  label: string;
  value: string;
  percent: number | null;
  href: string;
  icon: LucideIcon;
  toneClass: string;
}

interface ProfileSnapshotRowProps {
  profilePercent: number | null;
  planPercent: number | null;
  resumeScore: number | null;
  interviewCount: number;
  interviewAvgScore: number | null;
}

/** "Твой прогресс" — five compact metric cards, each a real already-computed number with its own small colored icon, never a dense single-card grid. */
export function ProfileSnapshotRow({ profilePercent, planPercent, resumeScore, interviewCount, interviewAvgScore }: ProfileSnapshotRowProps) {
  const { dict } = useLocale();
  const s = dict.dashboard.snapshot;

  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const items: MetricItem[] = [
    {
      label: s.profile.label,
      value: profilePercent !== null ? `${profilePercent}%` : "—",
      percent: profilePercent,
      href: "/dashboard/passport",
      icon: IdCard,
      toneClass: "bg-tool-profile-solid text-white",
    },
    {
      label: s.plan.label,
      value: planPercent !== null ? `${planPercent}%` : s.plan.notStarted,
      percent: planPercent,
      href: "/dashboard/roadmap",
      icon: Map,
      toneClass: "bg-tool-roadmap-solid text-white",
    },
    {
      label: s.resume.label,
      value: resumeScore !== null ? `${resumeScore}%` : s.resume.notStarted,
      percent: resumeScore,
      href: "/dashboard/resume",
      icon: FileText,
      toneClass: "bg-tool-resume-solid text-white",
    },
    {
      label: s.interview.label,
      value: interviewCount > 0 ? String(interviewCount) : s.interview.notStarted,
      percent: null,
      href: "/dashboard/interview",
      icon: Mic,
      toneClass: "bg-tool-interview-solid text-white",
    },
    {
      label: s.interview.avgScoreLabel,
      value: interviewAvgScore !== null ? `${interviewAvgScore}%` : "—",
      percent: interviewAvgScore,
      href: "/dashboard/interview",
      icon: Percent,
      toneClass: "bg-tool-interview-solid text-white",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <Link key={item.label} href={item.href}>
          <Card className="card-interactive h-full">
            <CardContent className="space-y-2.5 py-4">
              <span className={`flex size-8 items-center justify-center rounded-lg ${item.toneClass}`}>
                <item.icon className="size-4" />
              </span>
              <div className="space-y-1">
                <p className="text-muted-foreground truncate text-xs font-medium tracking-wide uppercase">{item.label}</p>
                <p className="text-lg font-semibold">{item.value}</p>
              </div>
              {item.percent !== null && (
                <div className="bg-muted h-1 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
                    style={{ width: filled ? `${item.percent}%` : "0%" }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
