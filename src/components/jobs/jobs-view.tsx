"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Search as SearchIcon, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLocale } from "@/lib/i18n/locale-provider";
import { isSafeExternalUrl } from "@/lib/security/url-safety";
import { JobSearchForm } from "./job-search-form";
import { JobCard } from "./job-card";
import { PrepareDialog } from "./prepare-dialog";
import { SavedJobsList } from "./saved-jobs-list";
import type {
  JobSearchFiltersState,
  JobSearchResultItemData,
  SavedJobData,
  SavedJobStatus,
  VacancyData,
  PrepareResponseData,
} from "./types";

interface JobsViewProps {
  initialResults: JobSearchResultItemData[];
  initialHhSearchUrl: string;
  initialProviderName: string;
  initialSavedJobs: SavedJobData[];
  defaultTargetRole: string;
  defaultCity?: string;
}

function vacancyKey(vacancy: VacancyData): string {
  return vacancy.sourceUrl;
}

export function JobsView({
  initialResults,
  initialHhSearchUrl,
  initialProviderName,
  initialSavedJobs,
  defaultTargetRole,
  defaultCity,
}: JobsViewProps) {
  const { locale, dict } = useLocale();
  const page = dict.dashboard.jobsPage;

  const [tab, setTab] = useState<"search" | "saved">("search");
  const [results, setResults] = useState(initialResults);
  const [hhSearchUrl, setHhSearchUrl] = useState(initialHhSearchUrl);
  const [providerName, setProviderName] = useState(initialProviderName);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [resultsFetchedAt, setResultsFetchedAt] = useState<Date | null>(initialResults.length > 0 ? new Date() : null);

  const [assistantThinking, setAssistantThinking] = useState(false);
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const [assistantFilters, setAssistantFilters] = useState<JobSearchFiltersState | null>(null);
  const [formGeneration, setFormGeneration] = useState(0);

  const [savedJobs, setSavedJobs] = useState(initialSavedJobs);
  const savedUrls = new Set(savedJobs.map((j) => j.sourceUrl));

  const [prepareOpen, setPrepareOpen] = useState(false);
  const [prepareVacancy, setPrepareVacancy] = useState<VacancyData | null>(null);
  const [prepareLoading, setPrepareLoading] = useState(false);
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const [prepareData, setPrepareData] = useState<PrepareResponseData | null>(null);

  const runSearch = async (filters: JobSearchFiltersState) => {
    setSearching(true);
    setHasSearched(true);
    try {
      const response = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });
      if (!response.ok) throw new Error("failed");
      const data = (await response.json()) as { results: JobSearchResultItemData[]; hhSearchUrl: string; providerName: string };
      setResults(data.results);
      setHhSearchUrl(data.hhSearchUrl);
      setProviderName(data.providerName);
      setResultsFetchedAt(new Date());
    } catch {
      toast.error(page.results.errorSearch);
    } finally {
      setSearching(false);
    }
  };

  const handleAssistant = async (freeText: string) => {
    setAssistantThinking(true);
    setAssistantError(null);
    try {
      const response = await fetch("/api/jobs/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freeText }),
      });
      if (!response.ok) throw new Error("failed");
      const data = (await response.json()) as { filters: JobSearchFiltersState };
      setAssistantFilters({ ...data.filters, sort: "bestMatch" });
      setFormGeneration((g) => g + 1);
      await runSearch({ ...data.filters, sort: "bestMatch" });
    } catch {
      setAssistantError(page.assistant.error);
    } finally {
      setAssistantThinking(false);
    }
  };

  const handleSave = async (item: JobSearchResultItemData) => {
    try {
      const response = await fetch("/api/jobs/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.vacancy.title,
          company: item.vacancy.company,
          location: item.vacancy.location,
          salaryMin: item.vacancy.salaryMin,
          salaryMax: item.vacancy.salaryMax,
          currency: item.vacancy.currency,
          sourceUrl: item.vacancy.sourceUrl,
          source: providerName === "hh" ? "HH_RU" : "MOCK",
          requiredSkills: item.vacancy.requiredSkills,
          matchScore: item.match.score,
          matchBreakdown: item.match.breakdown,
        }),
      });
      if (!response.ok) throw new Error("failed");
      const data = (await response.json()) as { savedJob: SavedJobData };
      setSavedJobs((prev) => [data.savedJob, ...prev.filter((j) => j.id !== data.savedJob.id)]);
    } catch {
      toast.error(page.results.errorSearch);
    }
  };

  const handleStatusChange = async (id: string, status: SavedJobStatus) => {
    setSavedJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status } : j)));
    try {
      const response = await fetch(`/api/jobs/saved/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("failed");
    } catch {
      toast.error(page.results.errorSearch);
    }
  };

  const handleRemove = async (id: string) => {
    const previous = savedJobs;
    setSavedJobs((prev) => prev.filter((j) => j.id !== id));
    try {
      const response = await fetch(`/api/jobs/saved/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("failed");
    } catch {
      setSavedJobs(previous);
      toast.error(page.results.errorSearch);
    }
  };

  const handlePrepare = async (vacancy: VacancyData) => {
    setPrepareVacancy(vacancy);
    setPrepareOpen(true);
    setPrepareLoading(true);
    setPrepareError(null);
    setPrepareData(null);
    try {
      const response = await fetch("/api/jobs/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: vacancy.title, company: vacancy.company, requiredSkills: vacancy.requiredSkills }),
      });
      if (!response.ok) throw new Error("failed");
      const data = (await response.json()) as PrepareResponseData;
      setPrepareData(data);
    } catch {
      setPrepareError(page.prepare.error);
    } finally {
      setPrepareLoading(false);
    }
  };

  const initialFilters: JobSearchFiltersState = assistantFilters ?? { targetRole: defaultTargetRole, city: defaultCity, sort: "bestMatch" };

  return (
    <div className="space-y-6">
      <PageHeader title={page.title} description={page.subtitle} />

      <Tabs value={tab} onValueChange={(v) => v && setTab(v as "search" | "saved")}>
        <TabsList>
          <TabsTrigger value="search">{page.tabs.search}</TabsTrigger>
          <TabsTrigger value="saved">{page.tabs.saved}</TabsTrigger>
        </TabsList>

        <TabsContent value="search" keepMounted className="mt-4 space-y-4">
          <JobSearchForm
            key={formGeneration}
            initialFilters={initialFilters}
            searching={searching}
            onSearch={runSearch}
            onAssistant={handleAssistant}
            assistantThinking={assistantThinking}
            assistantError={assistantError}
          />

          <p className="text-muted-foreground text-xs">{providerName === "hh" ? page.providerNoteHh : page.providerNoteMock}</p>

          {results.length === 0 ? (
            hasSearched ? (
              <div className="space-y-3">
                <EmptyState icon={SearchIcon} title={page.results.emptyTitle} description={page.results.emptyDescription} />
                <ul className="text-muted-foreground list-disc space-y-1 pl-6 text-sm">
                  <li>{page.results.suggestions.changeCity}</li>
                  <li>{page.results.suggestions.removeSalary}</li>
                  <li>{page.results.suggestions.tryAnotherRole}</li>
                  <li>{page.results.suggestions.tryRemote}</li>
                </ul>
              </div>
            ) : (
              <EmptyState icon={SearchIcon} title={page.results.emptyTitle} description={page.results.emptyDescription} />
            )
          ) : (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-muted-foreground text-sm">{page.results.countTemplate.replace("{count}", String(results.length))}</p>
                {resultsFetchedAt && (
                  <p className="text-muted-foreground text-xs">
                    {page.results.updatedTemplate.replace("{time}", resultsFetchedAt.toLocaleTimeString(locale === "ru" ? "ru-RU" : "en-US"))}
                  </p>
                )}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {results.map((item) => (
                  <JobCard
                    key={vacancyKey(item.vacancy)}
                    item={item}
                    saved={savedUrls.has(item.vacancy.sourceUrl)}
                    onSave={() => handleSave(item)}
                    onPrepare={() => handlePrepare(item.vacancy)}
                  />
                ))}
              </div>
            </>
          )}

          {hhSearchUrl && isSafeExternalUrl(hhSearchUrl) && (
            <a href={hhSearchUrl} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-1.5 text-sm hover:underline">
              <ExternalLink className="size-3.5" />
              {page.results.searchOnHhCta}
            </a>
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-4">
          <SavedJobsList savedJobs={savedJobs} onStatusChange={handleStatusChange} onRemove={handleRemove} onFindJobs={() => setTab("search")} />
        </TabsContent>
      </Tabs>

      <PrepareDialog open={prepareOpen} onOpenChange={setPrepareOpen} vacancy={prepareVacancy} loading={prepareLoading} error={prepareError} data={prepareData} />
    </div>
  );
}
