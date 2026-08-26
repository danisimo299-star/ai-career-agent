"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Download, RotateCw, Sparkles, X, FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PersonalInfoSection } from "./personal-info-section";
import { AiTextField } from "./ai-text-field";
import { EntryListEditor } from "./entry-list-editor";
import { ExperienceSection } from "./experience-section";
import { ProjectsSection } from "./projects-section";
import { SkillsSection } from "./skills-section";
import { ResumePreview } from "./resume-preview";
import { ResumeScorePanel } from "./resume-score-panel";
import { ResumeWelcome } from "./resume-welcome";
import { ResumeGenerationLoader } from "./resume-generation-loader";
import { NoExperienceBanner } from "./no-experience-banner";
import { ResumeReviewDialog } from "./resume-review-dialog";
import type { ResumeReviewResult } from "@/lib/ai/career/types";
import { useLocale } from "@/lib/i18n/locale-provider";
import { computeResumeScore } from "@/lib/career/resume-score";
import { isResumeContentMeaningful, type ResumeContent, type ResumeEducationEntry, type ResumeLanguageEntry, type ResumeCertificateEntry } from "@/types";
import type { ResumeData, ResumeTemplateId } from "./types";
import type { ResumeSectionKind } from "@/lib/ai/career/types";

const templates: ResumeTemplateId[] = ["MODERN", "PROFESSIONAL", "MINIMAL"];

// Modern browsers handle Unicode in a `download` attribute filename fine —
// this only strips characters that are genuinely unsafe in a filename
// (path separators, quotes, control chars) and turns spaces into
// underscores, so "Иван Иванов" becomes "Иван_Иванов_Resume.pdf" rather
// than a meaningless "resume.pdf".
function safeFileName(fullName: string): string {
  const cleaned = fullName
    .trim()
    .replace(/[/\\:*?"<>|]/g, "")
    .replace(/\s+/g, "_");
  return cleaned || "Resume";
}

function formatSavedAt(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale === "ru" ? "ru-RU" : "en-US", { dateStyle: "medium", timeStyle: "short" });
}

export function ResumeView({ initialResume, suggestedTargetRole }: { initialResume: ResumeData; suggestedTargetRole: string | null }) {
  const { locale, dict } = useLocale();
  const page = dict.dashboard.resumePage;

  const [title, setTitle] = useState(initialResume.title || suggestedTargetRole || "");
  const [content, setContent] = useState<ResumeContent>(initialResume.content);
  const [template, setTemplate] = useState<ResumeTemplateId>(initialResume.template);
  const [resumeId] = useState(initialResume.id);
  const [updatedAt, setUpdatedAt] = useState(initialResume.updatedAt);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [saving, setSaving] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  // The welcome screen (item 27) instead of a blank editor whenever there's
  // nothing meaningful yet — `justAppeared` only drives the one-time
  // entrance animation for the editor right after leaving welcome, not on
  // every normal page load.
  const [showWelcome, setShowWelcome] = useState(!isResumeContentMeaningful(initialResume.content));
  const [justAppeared, setJustAppeared] = useState(false);
  const [creatingWithAi, setCreatingWithAi] = useState(false);
  const [aiGenerationDone, setAiGenerationDone] = useState(false);
  // One-step undo for AI-applied free-text fields (item 32) — the value
  // just before the last "Apply", cleared once undone. Manual typing never
  // touches this; only `applyAiField` writes to it.
  const [undoStack, setUndoStack] = useState<Partial<Record<"careerObjective" | "summary", string>>>({});

  const applyAiField = (field: "careerObjective" | "summary", newText: string) => {
    setUndoStack((prev) => ({ ...prev, [field]: content[field] }));
    setContent((prev) => ({ ...prev, [field]: newText }));
  };

  const undoField = (field: "careerObjective" | "summary") => {
    const previous = undoStack[field];
    if (previous === undefined) return;
    setContent((prev) => ({ ...prev, [field]: previous }));
    setUndoStack((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    toast.success(page.undoneToast);
  };
  const [draftSuggestion, setDraftSuggestion] = useState<{ careerObjective: string; summary: string; skills: string[] } | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [review, setReview] = useState<ResumeReviewResult | null>(null);

  const score = computeResumeScore(content, title, locale);

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/resume/${resumeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, template }),
      });
      if (!response.ok) throw new Error("failed");
      const data = (await response.json()) as { resume: ResumeData };
      setUpdatedAt(data.resume.updatedAt);
      toast.success(page.saved);
    } catch {
      toast.error(page.errorSave);
    } finally {
      setSaving(false);
    }
  };

  const generateDraft = async () => {
    if (!title.trim()) return;
    setGeneratingDraft(true);
    try {
      const response = await fetch(`/api/resume/${resumeId}/generate-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole: title }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "generic" }));
        toast.error(body.error === "ai_unavailable" ? dict.common.aiUnavailable : page.errorAi);
        return;
      }
      const data = (await response.json()) as { draft: { careerObjective: string; summary: string; skills: string[] } };
      setDraftSuggestion(data.draft);
    } catch {
      toast.error(page.errorAi);
    } finally {
      setGeneratingDraft(false);
    }
  };

  const acceptDraft = () => {
    if (!draftSuggestion) return;
    setContent((prev) => ({
      ...prev,
      careerObjective: draftSuggestion.careerObjective,
      summary: draftSuggestion.summary,
      skills: Array.from(new Set([...prev.skills, ...draftSuggestion.skills])),
    }));
    setDraftSuggestion(null);
  };

  /**
   * The welcome screen's "Create with ProfyMind" — unlike `generateDraft`
   * above (which shows a suggestion card for review on an already-active
   * resume), this applies directly: there is nothing to overwrite yet, so
   * the confirmation step `AiTextField`/`draftSuggestion` exist for
   * elsewhere would just be friction here.
   */
  const createWithProfyMind = async () => {
    if (!title.trim()) return;
    setCreatingWithAi(true);
    setAiGenerationDone(false);
    try {
      const response = await fetch(`/api/resume/${resumeId}/generate-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole: title }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "generic" }));
        toast.error(body.error === "ai_unavailable" ? dict.common.aiUnavailable : page.errorAi);
        setCreatingWithAi(false);
        return;
      }
      const data = (await response.json()) as { draft: { careerObjective: string; summary: string; skills: string[] } };
      setAiGenerationDone(true);
      // A short beat so the loader's steps visibly land on "complete"
      // instead of the resume snapping into view mid-animation.
      await new Promise((resolve) => setTimeout(resolve, 500));
      setContent((prev) => ({
        ...prev,
        careerObjective: data.draft.careerObjective,
        summary: data.draft.summary,
        skills: Array.from(new Set([...prev.skills, ...data.draft.skills])),
      }));
      setShowWelcome(false);
      setJustAppeared(true);
    } catch {
      toast.error(page.errorAi);
    } finally {
      setCreatingWithAi(false);
    }
  };

  const enterManually = () => {
    setShowWelcome(false);
    setJustAppeared(true);
  };

  const scrollToExperience = () => {
    document.getElementById("resume-experience-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const generateSection = async (section: ResumeSectionKind, sectionInput: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/resume/${resumeId}/generate-section`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, sectionInput, targetRole: title }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "generic" }));
        toast.error(body.error === "ai_unavailable" ? dict.common.aiUnavailable : page.errorAi);
        return null;
      }
      const data = (await response.json()) as { suggestion: { text?: string; bullets?: string[]; skills?: string[] } };
      return data.suggestion;
    } catch {
      toast.error(page.errorAi);
      return null;
    }
  };

  const checkResume = async () => {
    if (!isResumeContentMeaningful(content)) {
      toast.error(page.errorEmptyResume);
      return;
    }
    setReviewing(true);
    try {
      const response = await fetch(`/api/resume/${resumeId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole: title }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "generic" }));
        toast.error(body.error === "ai_unavailable" ? dict.common.aiUnavailable : page.errorAi);
        return;
      }
      const data = (await response.json()) as { review: ResumeReviewResult };
      setReview(data.review);
    } catch {
      toast.error(page.errorAi);
    } finally {
      setReviewing(false);
    }
  };

  const downloadPdf = async () => {
    if (!isResumeContentMeaningful(content)) {
      toast.error(page.errorEmptyResume);
      return;
    }
    setDownloadingPdf(true);
    try {
      const response = await fetch(`/api/resume/${resumeId}/pdf`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "generic" }));
        toast.error(body.error === "empty_resume" ? page.errorEmptyResume : page.errorPdf);
        return;
      }
      const blob = await response.blob();
      // A 0-byte or near-empty response would otherwise silently download a
      // broken/blank file — surfaced as the same error as a failed request.
      if (blob.size < 100) throw new Error("empty_pdf");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeFileName(content.personalInfo.fullName)}_Resume.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(page.errorPdf);
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (showWelcome) {
    return (
      <div className="space-y-6">
        <PageHeader title={page.title} description={page.subtitle} icon={FileText} tone="resume" />
        {creatingWithAi ? (
          <ResumeGenerationLoader done={aiGenerationDone} />
        ) : (
          <ResumeWelcome
            targetRole={title}
            onTargetRoleChange={setTitle}
            onGenerate={createWithProfyMind}
            onManual={enterManually}
            generating={creatingWithAi}
          />
        )}
      </div>
    );
  }

  const showNoExperienceBanner = content.experience.length === 0 && content.projects.length === 0;

  return (
    <motion.div
      initial={justAppeared ? { opacity: 0, y: 10, scale: 0.985 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title={page.title} description={page.subtitle} icon={FileText} tone="resume" />
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:flex-nowrap">
          <Button variant="outline" onClick={downloadPdf} disabled={downloadingPdf || !isResumeContentMeaningful(content)}>
            {downloadingPdf ? <RotateCw className="animate-spin" /> : <Download />}
            {downloadingPdf ? page.generatingPdf : page.downloadPdfCta}
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <RotateCw className="animate-spin" /> : null}
            {saving ? page.saving : page.saveCta}
          </Button>
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        {updatedAt ? page.lastSavedTemplate.replace("{time}", formatSavedAt(updatedAt, locale)) : page.neverSaved}
      </p>

      {showNoExperienceBanner && <NoExperienceBanner onAddExperience={scrollToExperience} />}

      <Tabs value={tab} onValueChange={(v) => v && setTab(v as "edit" | "preview")}>
        <TabsList>
          <TabsTrigger value="edit">{page.editTab}</TabsTrigger>
          <TabsTrigger value="preview">{page.previewTab}</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="min-w-0 space-y-4 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{page.targetRoleLabel}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-1.5">
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={page.targetRolePlaceholder} />
                  </div>
                  <div className="w-full space-y-1.5 sm:w-40">
                    <Label>{page.templateLabel}</Label>
                    <Select value={template} onValueChange={(v) => v && setTemplate(v as ResumeTemplateId)}>
                      <SelectTrigger className="w-full">
                        <SelectValue>{(v: ResumeTemplateId) => page.templates[v]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((t) => (
                          <SelectItem key={t} value={t}>
                            {page.templates[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" onClick={generateDraft} disabled={generatingDraft || !title.trim()}>
                    {generatingDraft ? <RotateCw className="animate-spin" /> : <Sparkles />}
                    {page.generateDraftCta}
                  </Button>
                </CardContent>
              </Card>

              {draftSuggestion && (
                <Card className="border-primary/40">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-sm">
                      {page.aiSuggestionTitle}
                      <Button size="icon-sm" variant="ghost" onClick={() => setDraftSuggestion(null)} aria-label={page.dismissCta}>
                        <X className="size-3.5" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">{page.sections.careerObjective}: </span>
                      {draftSuggestion.careerObjective}
                    </p>
                    <p>
                      <span className="text-muted-foreground">{page.sections.summary}: </span>
                      {draftSuggestion.summary}
                    </p>
                    <p>
                      <span className="text-muted-foreground">{page.sections.skills}: </span>
                      {draftSuggestion.skills.join(", ")}
                    </p>
                    <Button size="sm" onClick={acceptDraft}>
                      {page.acceptCta}
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{page.sections.personalInfo}</CardTitle>
                </CardHeader>
                <CardContent>
                  <PersonalInfoSection
                    personalInfo={content.personalInfo}
                    onChange={(personalInfo) => setContent({ ...content, personalInfo })}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{page.sections.careerObjective}</CardTitle>
                </CardHeader>
                <CardContent>
                  <AiTextField
                    label={page.sections.careerObjective}
                    value={content.careerObjective}
                    rows={2}
                    onManualChange={(text) => setContent((prev) => ({ ...prev, careerObjective: text }))}
                    onApply={(text) => applyAiField("careerObjective", text)}
                    onGenerate={async () => {
                      const s = await generateSection("careerObjective", {});
                      return s?.text ?? null;
                    }}
                    canUndo={undoStack.careerObjective !== undefined}
                    onUndo={() => undoField("careerObjective")}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{page.sections.summary}</CardTitle>
                </CardHeader>
                <CardContent>
                  <AiTextField
                    label={page.sections.summary}
                    value={content.summary}
                    rows={3}
                    onManualChange={(text) => setContent((prev) => ({ ...prev, summary: text }))}
                    onApply={(text) => applyAiField("summary", text)}
                    onGenerate={async () => {
                      const s = await generateSection("summary", { existingSkills: content.skills });
                      return s?.text ?? null;
                    }}
                    canUndo={undoStack.summary !== undefined}
                    onUndo={() => undoField("summary")}
                  />
                </CardContent>
              </Card>

              <Card id="resume-experience-section">
                <CardHeader>
                  <CardTitle className="text-base">{page.sections.experience}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ExperienceSection
                    entries={content.experience}
                    onChange={(experience) => setContent({ ...content, experience })}
                    onSuggestBullets={async (role, company, existingBullets) => {
                      const s = await generateSection("experienceBullets", { role, company, existingBullets });
                      return s?.bullets ?? null;
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{page.sections.projects}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProjectsSection
                    entries={content.projects}
                    onChange={(projects) => setContent({ ...content, projects })}
                    onSuggestDescription={async (name, technologies) => {
                      const s = await generateSection("projectDescription", { projectName: name, technologies });
                      return s?.text ?? null;
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{page.sections.education}</CardTitle>
                </CardHeader>
                <CardContent>
                  <EntryListEditor<ResumeEducationEntry>
                    entries={content.education}
                    onChange={(education) => setContent({ ...content, education })}
                    fields={[
                      { key: "school", label: page.fields.school },
                      { key: "degree", label: page.fields.degree },
                      { key: "startDate", label: page.fields.startDate },
                      { key: "endDate", label: page.fields.endDate, optional: true },
                    ]}
                    emptyEntry={{ school: "", degree: "", startDate: "", endDate: "" }}
                    emptyMessage={page.emptySections.education}
                    renderSummary={(e) => ({ title: e.school, subtitle: e.degree })}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{page.sections.skills}</CardTitle>
                </CardHeader>
                <CardContent>
                  <SkillsSection
                    skills={content.skills}
                    onChange={(skills) => setContent({ ...content, skills })}
                    onSuggest={async (existingSkills) => {
                      const s = await generateSection("skills", { existingSkills });
                      return s?.skills ?? null;
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{page.sections.languages}</CardTitle>
                </CardHeader>
                <CardContent>
                  <EntryListEditor<ResumeLanguageEntry>
                    entries={content.languages}
                    onChange={(languages) => setContent({ ...content, languages })}
                    fields={[
                      { key: "name", label: page.fields.languageName },
                      { key: "level", label: page.fields.level },
                    ]}
                    emptyEntry={{ name: "", level: "" }}
                    emptyMessage={page.emptySections.languages}
                    renderSummary={(e) => ({ title: e.name, subtitle: e.level })}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{page.sections.certificates}</CardTitle>
                </CardHeader>
                <CardContent>
                  <EntryListEditor<ResumeCertificateEntry>
                    entries={content.certificates}
                    onChange={(certificates) => setContent({ ...content, certificates })}
                    fields={[
                      { key: "name", label: page.fields.certificateName },
                      { key: "issuer", label: page.fields.issuer, optional: true },
                      { key: "date", label: page.fields.date, optional: true },
                      { key: "url", label: page.fields.url, optional: true },
                    ]}
                    emptyEntry={{ name: "", issuer: "", date: "", url: "" }}
                    emptyMessage={page.emptySections.certificates}
                    renderSummary={(e) => ({ title: e.name, subtitle: e.issuer })}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="min-w-0 space-y-4">
              <ResumeScorePanel result={score} />
              <Button
                variant="outline"
                className="hover-lift w-full"
                onClick={checkResume}
                disabled={reviewing || !isResumeContentMeaningful(content)}
              >
                {reviewing ? <RotateCw className="animate-spin" /> : <Sparkles />}
                {reviewing ? page.review.checking : page.review.cta}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <ResumePreview content={content} template={template} />
        </TabsContent>
      </Tabs>

      <ResumeReviewDialog review={review} onOpenChange={(open) => !open && setReview(null)} />
    </motion.div>
  );
}
