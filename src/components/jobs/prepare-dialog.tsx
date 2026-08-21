"use client";

import Link from "next/link";
import { RotateCw, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { PrepareResponseData, VacancyData } from "./types";

interface PrepareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacancy: VacancyData | null;
  loading: boolean;
  error: string | null;
  data: PrepareResponseData | null;
}

export function PrepareDialog({ open, onOpenChange, vacancy, loading, error, data }: PrepareDialogProps) {
  const { dict } = useLocale();
  const page = dict.dashboard.jobsPage;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{vacancy ? page.prepare.title.replace("{title}", vacancy.title).replace("{company}", vacancy.company) : ""}</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
            <RotateCw className="animate-spin" />
            {page.prepare.loading}
          </div>
        )}

        {error && <p className="text-destructive text-sm">{error}</p>}

        {data && (
          <div className="space-y-5">
            <section className="space-y-1.5">
              <h3 className="text-sm font-semibold">{page.prepare.resumeMatchTitle}</h3>
              {data.resumeMatch ? (
                <>
                  <p className="text-sm">{page.prepare.resumeMatchTemplate.replace("{score}", String(data.resumeMatch.score))}</p>
                  {data.resumeMatch.missingKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {data.resumeMatch.missingKeywords.map((k) => (
                        <Badge key={k} variant="outline">
                          {k}
                        </Badge>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">{page.prepare.noResume}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    nativeButton={false}
                    render={
                      <Link href="/dashboard/resume">
                        {page.prepare.buildResumeCta}
                        <ArrowRight />
                      </Link>
                    }
                  />
                </div>
              )}
            </section>

            <section className="space-y-1.5">
              <h3 className="text-sm font-semibold">{page.prepare.resumeRecommendationsTitle}</h3>
              <ul className="list-disc space-y-1 pl-4 text-sm">
                {data.plan.resumeRecommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </section>

            <section className="space-y-1.5">
              <h3 className="text-sm font-semibold">{page.prepare.skillsToImproveTitle}</h3>
              <div className="flex flex-wrap gap-1.5">
                {data.plan.skillsToImprove.map((s) => (
                  <Badge key={s} variant="outline">
                    {s}
                  </Badge>
                ))}
              </div>
            </section>

            <section className="space-y-1.5">
              <h3 className="text-sm font-semibold">{page.prepare.hrQuestionsTitle}</h3>
              <ul className="list-disc space-y-1 pl-4 text-sm">
                {data.plan.hrQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </section>

            <section className="space-y-1.5">
              <h3 className="text-sm font-semibold">{page.prepare.technicalQuestionsTitle}</h3>
              <ul className="list-disc space-y-1 pl-4 text-sm">
                {data.plan.technicalQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </section>

            <section className="space-y-1.5">
              <h3 className="text-sm font-semibold">{page.prepare.planTitle}</h3>
              <ol className="list-decimal space-y-1 pl-4 text-sm">
                {data.plan.preparationPlan.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </section>

            {vacancy && (
              <Button
                className="w-full"
                nativeButton={false}
                render={<Link href={`/dashboard/interview?role=${encodeURIComponent(vacancy.title)}`}>{page.prepare.startInterviewCta}</Link>}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
