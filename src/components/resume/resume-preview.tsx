"use client";

import { Mail, Phone, MapPin, Link2, type LucideIcon } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { getResumeContactItems, type ResumeContactItem, type ResumeContent } from "@/types";
import type { ResumeTemplateId } from "./types";
import { cn, getInitials } from "@/lib/utils";

interface ResumePreviewProps {
  content: ResumeContent;
  template: ResumeTemplateId;
  /** The resume's target role (`Resume.title`) — shown as a tagline under the name, the single biggest thing separating a real resume header from a plain contact-info dump. */
  targetRole?: string;
}

const CONTACT_ICONS: Record<ResumeContactItem["type"], LucideIcon> = {
  email: Mail,
  phone: Phone,
  city: MapPin,
  linkedin: Link2,
  github: Link2,
  website: Link2,
};

function SectionHeading({ children, template }: { children: React.ReactNode; template: ResumeTemplateId }) {
  if (template === "MODERN") {
    return <h3 className="text-primary mb-2 text-[11px] font-bold tracking-widest uppercase">{children}</h3>;
  }
  if (template === "PROFESSIONAL") {
    return <h3 className="mb-2 border-b border-neutral-300 pb-1 text-sm font-bold text-neutral-800">{children}</h3>;
  }
  return <h3 className="mb-2 text-xs font-semibold tracking-wide text-black uppercase">{children}</h3>;
}

function Avatar({ initials, template }: { initials: string; template: ResumeTemplateId }) {
  if (template === "MINIMAL") {
    return (
      <div className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-black text-base font-bold text-black">
        {initials}
      </div>
    );
  }
  return (
    <div
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-full text-base font-bold text-white",
        template === "MODERN" ? "bg-primary" : "bg-neutral-800"
      )}
    >
      {initials}
    </div>
  );
}

function ContactList({ items, className, itemClassName }: { items: ResumeContactItem[]; className?: string; itemClassName?: string }) {
  return (
    <div className={className}>
      {items.map((item, i) => {
        const Icon = CONTACT_ICONS[item.type];
        return (
          <span key={i} className={cn("flex min-w-0 items-center gap-1.5", itemClassName)}>
            <Icon className="size-3 shrink-0 opacity-70" />
            <span className="truncate">{item.value}</span>
          </span>
        );
      })}
    </div>
  );
}

export function ResumePreview({ content, template, targetRole }: ResumePreviewProps) {
  const { dict } = useLocale();
  const labels = dict.dashboard.resumePage.sections;
  const contact = getResumeContactItems(content.personalInfo);
  const initials = getInitials(content.personalInfo.fullName);

  const mainSections = (
    <>
      {content.careerObjective && (
        <div>
          <SectionHeading template={template}>{labels.careerObjective}</SectionHeading>
          <p className="text-sm leading-relaxed text-neutral-700">{content.careerObjective}</p>
        </div>
      )}
      {content.summary && (
        <div>
          <SectionHeading template={template}>{labels.summary}</SectionHeading>
          <p className="text-sm leading-relaxed text-neutral-700">{content.summary}</p>
        </div>
      )}
      {content.experience.length > 0 && (
        <div>
          <SectionHeading template={template}>{labels.experience}</SectionHeading>
          <div className="space-y-3">
            {content.experience.map((exp, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-neutral-900">
                    {exp.role} — {exp.company}
                  </p>
                  <p className="shrink-0 text-xs text-neutral-500">
                    {exp.startDate}
                    {exp.endDate ? ` – ${exp.endDate}` : ""}
                  </p>
                </div>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-neutral-700">
                  {exp.bullets.map((bullet, j) => (
                    <li key={j}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
      {content.projects.length > 0 && (
        <div>
          <SectionHeading template={template}>{labels.projects}</SectionHeading>
          <div className="space-y-2">
            {content.projects.map((project, i) => (
              <div key={i}>
                <p className="text-sm font-semibold text-neutral-900">
                  {project.name}
                  {project.technologies.length > 0 ? ` — ${project.technologies.join(", ")}` : ""}
                </p>
                <p className="text-sm text-neutral-700">{project.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {content.education.length > 0 && (
        <div>
          <SectionHeading template={template}>{labels.education}</SectionHeading>
          <div className="space-y-2">
            {content.education.map((edu, i) => (
              <div key={i} className="flex items-baseline justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{edu.school}</p>
                  {edu.degree && <p className="text-xs text-neutral-600">{edu.degree}</p>}
                </div>
                <p className="shrink-0 text-xs text-neutral-500">
                  {edu.startDate}
                  {edu.endDate ? ` – ${edu.endDate}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  const sideSections = (
    <>
      {content.skills.length > 0 && (
        <div>
          <SectionHeading template={template}>{labels.skills}</SectionHeading>
          <div className="flex flex-wrap gap-1.5">
            {content.skills.map((skill, i) => (
              <span
                key={i}
                className={cn(
                  "rounded px-2 py-0.5 text-xs",
                  template === "MINIMAL" ? "border border-neutral-400 text-black" : "bg-white/70 text-neutral-700"
                )}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
      {content.languages.length > 0 && (
        <div>
          <SectionHeading template={template}>{labels.languages}</SectionHeading>
          <ul className="space-y-0.5 text-sm text-neutral-700">
            {content.languages.map((l, i) => (
              <li key={i}>
                {l.name} — {l.level}
              </li>
            ))}
          </ul>
        </div>
      )}
      {content.certificates.length > 0 && (
        <div>
          <SectionHeading template={template}>{labels.certificates}</SectionHeading>
          <ul className="space-y-1 text-sm text-neutral-700">
            {content.certificates.map((c, i) => (
              <li key={i}>
                {c.name}
                {c.issuer ? ` — ${c.issuer}` : ""}
                {c.date ? ` (${c.date})` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );

  return (
    <div className="mx-auto w-full max-w-[210mm] overflow-hidden rounded-lg border bg-white shadow-sm">
      {template === "MODERN" ? (
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr]">
          <div className="bg-primary/5 space-y-5 p-6">
            <div className="space-y-3">
              <Avatar initials={initials} template={template} />
              <div>
                <h1 className="text-xl font-bold text-neutral-900">{content.personalInfo.fullName || "—"}</h1>
                {targetRole && <p className="text-primary text-sm font-semibold">{targetRole}</p>}
              </div>
              <div className="border-primary/15 border-t pt-3">
                <ContactList items={contact} className="space-y-1.5 text-xs text-neutral-600" />
              </div>
            </div>
            {sideSections}
          </div>
          <div className="space-y-5 p-6">{mainSections}</div>
        </div>
      ) : (
        <div className="space-y-5 p-8">
          <div className={cn("flex items-center gap-4", template === "PROFESSIONAL" ? "border-b border-neutral-300 pb-4" : "")}>
            <Avatar initials={initials} template={template} />
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-black">{content.personalInfo.fullName || "—"}</h1>
              {targetRole && <p className="text-sm font-semibold text-neutral-600">{targetRole}</p>}
              <ContactList items={contact} className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-neutral-600" />
            </div>
          </div>
          {mainSections}
          {sideSections}
        </div>
      )}
    </div>
  );
}
