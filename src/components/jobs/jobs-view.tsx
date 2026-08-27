"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Search as SearchIcon, ExternalLink, Briefcase } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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

interface BroaderMarket {
  nationwideCount: number;
  remoteCount: number;
}

interface JobsViewProps {
  initialResults: JobSearchResultItemData[];
  initialHhSearchUrl: string;
  initialProviderName: string;
  initialBroaderMarket?: BroaderMarket | null;
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
  initialBroaderMarket,
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
  const [broaderMarket, setBroaderMarket] = useState(initialBroaderMarket ?? null);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  // `new Date()` can never be the initial value here — the server renders
  // this same component for the initial HTML, and by the time the client
  // hydrates (a slow dev compile, or just real time passing), `new Date()`
  // evaluated fresh on the client no longer matches what the server
  // embedded, which is exactly the hydration mismatch this used to throw.
  // Starts `null` on both sides (no mismatch possible), then fills in the
  // real timestamp once mounted — same pattern as the dashboard's
  // time-of-day greeting.
  const [resultsFetchedAt, setResultsFetchedAt] = useState<Date | null>(null);
  useEffect(() => {
    if (initialResults.length === 0) return;
    const id = requestAnimationFrame(() => setResultsFetchedAt(new Date()));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only: reflects the initial results this component was first given, not later re-renders.
  }, []);

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

  const [lastFilters, setLastFilters] = useState<JobSearchFiltersState>({ targetRole: defaultTargetRole, city: defaultCity, sort: "bestMatch" });
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const runSearch = async (filters: JobSearchFiltersState) => {
    setSearching(true);
    setHasSearched(true);
    setLastFilters(filters);
    setHasMore(true);
    try {
      const response = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });
      if (!response.ok) throw new Error("failed");
      const data = (await response.json()) as {
        results: JobSearchResultItemData[];
        hhSearchUrl: string;
        providerName: string;
        broaderMarket?: BroaderMarket;
      };
      setResults(data.results);
      setHhSearchUrl(data.hhSearchUrl);
      setProviderName(data.providerName);
      setBroaderMarket(data.broaderMarket ?? null);
      setResultsFetchedAt(new Date());
    } catch {
      toast.error(page.results.errorSearch);
    } finally {
      setSearching(false);
    }
  };

  const searchNationwide = () => runSearch({ ...lastFilters, city: undefined });
  const searchRemote = () => runSearch({ ...lastFilters, city: undefined, workFormat: "REMOTE" });

  /** "Показать ещё вакансии" — fetches the next page and appends, never re-fetches or discards what's already shown. */
  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = Math.ceil(results.length / 20);
      const response = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lastFilters, page: nextPage }),
      });
      if (!response.ok) throw new Error("failed");
      const data = (await response.json()) as { results: JobSearchResultItemData[] };
      if (data.results.length === 0) {
        setHasMore(false);
        toast(page.results.noMoreResults);
        return;
      }
      const existingUrls = new Set(results.map((r) => r.vacancy.sourceUrl));
      const fresh = data.results.filter((r) => !existingUrls.has(r.vacancy.sourceUrl));
      if (fresh.length === 0) setHasMore(false);
      setResults((prev) => [...prev, ...fresh]);
    } catch {
      toast.error(page.results.errorSearch);
    } finally {
      setLoadingMore(false);
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
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "generic" }));
        setAssistantError(body.error === "ai_unavailable" ? dict.common.aiUnavailable : page.assistant.error);
        return;
      }
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
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "generic" }));
        setPrepareError(body.error === "ai_unavailable" ? dict.common.aiUnavailable : page.prepare.error);
        return;
      }
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-6"
    >
      <PageHeader title={page.title} description={page.subtitle} icon={Briefcase} tone="jobs" />

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
                {broaderMarket && (broaderMarket.nationwideCount > 0 || broaderMarket.remoteCount > 0) ? (
                  <div className="bg-secondary/50 space-y-2 rounded-lg p-3 text-sm">
                    <p>
                      {page.results.broaderMarketTemplate
                        .replace("{nationwide}", String(broaderMarket.nationwideCount))
                        .replace("{remote}", String(broaderMarket.remoteCount))}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {broaderMarket.nationwideCount > 0 && (
                        <Button size="sm" variant="outline" onClick={searchNationwide}>
                          {page.results.searchNationwideCta.replace("{count}", String(broaderMarket.nationwideCount))}
                        </Button>
                      )}
                      {broaderMarket.remoteCount > 0 && (
                        <Button size="sm" variant="outline" onClick={searchRemote}>
                          {page.results.searchRemoteCta.replace("{count}", String(broaderMarket.remoteCount))}
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <ul className="text-muted-foreground list-disc space-y-1 pl-6 text-sm">
                    <li>{page.results.suggestions.changeCity}</li>
                    <li>{page.results.suggestions.removeSalary}</li>
                    <li>{page.results.suggestions.tryAnotherRole}</li>
                    <li>{page.results.suggestions.tryRemote}</li>
                  </ul>
                )}
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
                {results.map((item, i) => (
                  <motion.div
                    key={vacancyKey(item.vacancy)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(i, 8) * 0.04, ease: "easeOut" }}
                  >
                    <JobCard
                      item={item}
                      saved={savedUrls.has(item.vacancy.sourceUrl)}
                      onSave={() => handleSave(item)}
                      onPrepare={() => handlePrepare(item.vacancy)}
                    />
                  </motion.div>
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center pt-1">
                  <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? page.results.loadingMore : page.results.loadMoreCta}
                  </Button>
                </div>
              )}
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
    </motion.div>
  );
}
