"use client";

import { Video, FileText, GraduationCap, BookOpen, Newspaper, ExternalLink, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { ResourceData } from "./types";

const typeIcons = {
  YOUTUBE: Video,
  DOCUMENTATION: FileText,
  COURSE: GraduationCap,
  BOOK: BookOpen,
  ARTICLE: Newspaper,
};

export function ResourceItem({ resource }: { resource: ResourceData }) {
  const { dict } = useLocale();
  const Icon = typeIcons[resource.type];

  const content = (
    <>
      <Icon className="text-muted-foreground size-4 shrink-0" />
      <span className="flex-1 truncate">{resource.title}</span>
      {resource.difficulty && (
        <Badge variant="secondary" className="shrink-0 text-xs">
          {resource.difficulty}
        </Badge>
      )}
      {resource.verified ? (
        <ExternalLink className="text-muted-foreground size-3.5 shrink-0" />
      ) : (
        <ShieldAlert className="text-muted-foreground/60 size-3.5 shrink-0" />
      )}
    </>
  );

  const baseClass = "flex items-center gap-2 rounded-md border px-2.5 py-2 text-sm";

  if (resource.verified && resource.url) {
    return (
      <a href={resource.url} target="_blank" rel="noopener noreferrer" className={`${baseClass} hover:bg-muted/50`}>
        {content}
      </a>
    );
  }

  return (
    <div className={`${baseClass} text-muted-foreground`} title={dict.dashboard.roadmapPage.notVerifiedNote}>
      {content}
    </div>
  );
}
