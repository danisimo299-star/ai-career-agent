"use client";

import { useState } from "react";
import { ExternalLink, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Bookmark } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { formatSalary } from "@/lib/career/salary-format";
import { isSafeExternalUrl } from "@/lib/security/url-safety";
import type { SavedJobData, SavedJobStatus } from "./types";

const statuses: SavedJobStatus[] = ["SAVED", "PREPARING", "APPLIED", "INTERVIEW", "REJECTED", "OFFER"];

interface SavedJobsListProps {
  savedJobs: SavedJobData[];
  onStatusChange: (id: string, status: SavedJobStatus) => void;
  onRemove: (id: string) => void;
  onFindJobs: () => void;
}

export function SavedJobsList({ savedJobs, onStatusChange, onRemove, onFindJobs }: SavedJobsListProps) {
  const { locale, dict } = useLocale();
  const page = dict.dashboard.jobsPage;
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

  if (savedJobs.length === 0) {
    return (
      <EmptyState
        icon={Bookmark}
        title={page.saved.emptyTitle}
        description={page.saved.emptyDescription}
        action={
          <Button size="sm" onClick={onFindJobs}>
            <Search />
            {page.saved.findJobsCta}
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {savedJobs.map((job) => {
        const salary = formatSalary(job.salaryMin ?? undefined, job.salaryMax ?? undefined, job.currency ?? undefined, locale);
        const salaryLabel =
          salary.kind === "range"
            ? page.card.salary.range.replace("{min}", salary.min!).replace("{max}", salary.max!).replace("{currency}", salary.currencySymbol ?? "")
            : salary.kind === "from"
              ? page.card.salary.from.replace("{min}", salary.min!).replace("{currency}", salary.currencySymbol ?? "")
              : salary.kind === "to"
                ? page.card.salary.to.replace("{max}", salary.max!).replace("{currency}", salary.currencySymbol ?? "")
                : page.card.salary.undisclosed;
        const isSearchLink = job.source !== "HH_RU";
        const canOpen = isSafeExternalUrl(job.sourceUrl);

        return (
          <Card key={job.id}>
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
              <div className="min-w-0 space-y-1">
                <CardTitle className="text-base leading-snug break-words">{job.title}</CardTitle>
                <p className="text-muted-foreground text-sm break-words">{job.company}</p>
                <p className="text-muted-foreground text-xs">{salaryLabel}</p>
              </div>
              {job.matchScore !== null && <Badge variant="secondary">{page.card.matchTemplate.replace("{score}", String(job.matchScore))}</Badge>}
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted-foreground text-xs">
                {page.saved.savedAtTemplate.replace("{time}", new Date(job.savedAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US"))}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={job.status} onValueChange={(v) => v && onStatusChange(job.id, v as SavedJobStatus)}>
                  <SelectTrigger className="w-40">
                    <SelectValue>{(v: SavedJobStatus) => page.saved.status[v]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {page.saved.status[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {canOpen && (
                  <Button
                    size="sm"
                    variant="outline"
                    nativeButton={false}
                    render={
                      <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink />
                        {isSearchLink ? page.card.openSearchCta : page.card.openVacancyCta}
                      </a>
                    }
                  />
                )}
                <Button size="sm" variant="ghost" onClick={() => setPendingRemoveId(job.id)}>
                  <Trash2 />
                  {page.saved.removeCta}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={pendingRemoveId !== null} onOpenChange={(open) => !open && setPendingRemoveId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{page.saved.removeConfirmTitle}</DialogTitle>
            <DialogDescription>{page.saved.removeConfirmDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingRemoveId(null)}>
              {dict.common.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingRemoveId) onRemove(pendingRemoveId);
                setPendingRemoveId(null);
              }}
            >
              {page.saved.removeCta}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
