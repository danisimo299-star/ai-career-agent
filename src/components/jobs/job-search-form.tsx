"use client";

import { useState } from "react";
import { Search, Sparkles, RotateCw, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/locale-provider";
import { SUPPORTED_CITIES } from "@/lib/jobs/hh-reference";
import { cn } from "@/lib/utils";
import type { JobSearchFiltersState, JobWorkFormat, JobExperience, JobEmployment, JobSort } from "./types";

const workFormats: JobWorkFormat[] = ["ANY", "REMOTE", "HYBRID", "ONSITE"];
const experiences: JobExperience[] = ["noExperience", "between1And3", "between3And6", "moreThan6"];
const employments: JobEmployment[] = ["full", "part", "project", "volunteer", "probation"];
const sorts: JobSort[] = ["bestMatch", "highestSalary", "newest", "lowestExperience"];

interface JobSearchFormProps {
  initialFilters: JobSearchFiltersState;
  searching: boolean;
  onSearch: (filters: JobSearchFiltersState) => void;
  onAssistant: (freeText: string) => Promise<void>;
  assistantThinking: boolean;
  assistantError: string | null;
}

export function JobSearchForm({ initialFilters, searching, onSearch, onAssistant, assistantThinking, assistantError }: JobSearchFormProps) {
  const { locale, dict } = useLocale();
  const page = dict.dashboard.jobsPage;

  const [targetRole, setTargetRole] = useState(initialFilters.targetRole);
  const [city, setCity] = useState(initialFilters.city ?? "");
  const [workFormat, setWorkFormat] = useState<JobWorkFormat>(initialFilters.workFormat ?? "ANY");
  const [experience, setExperience] = useState<JobExperience | "">(initialFilters.experience ?? "");
  const [employment, setEmployment] = useState<JobEmployment | "">(initialFilters.employmentTypes?.[0] ?? "");
  const [salaryMin, setSalaryMin] = useState(initialFilters.salaryMin ? String(initialFilters.salaryMin) : "");
  const [internshipOnly, setInternshipOnly] = useState(initialFilters.internshipOnly ?? false);
  const [sort, setSort] = useState<JobSort>(initialFilters.sort ?? "bestMatch");
  const [assistantText, setAssistantText] = useState("");

  const buildFilters = (): JobSearchFiltersState => ({
    targetRole: targetRole.trim(),
    city: city.trim() || undefined,
    workFormat: workFormat === "ANY" ? undefined : workFormat,
    experience: experience || undefined,
    employmentTypes: employment ? [employment] : undefined,
    salaryMin: salaryMin ? Number(salaryMin) : undefined,
    internshipOnly: internshipOnly || undefined,
    sort,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRole.trim()) return;
    onSearch(buildFilters());
  };

  const handleAssistantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantText.trim()) return;
    await onAssistant(assistantText.trim());
  };

  const handleClear = () => {
    setCity("");
    setWorkFormat("ANY");
    setExperience("");
    setEmployment("");
    setSalaryMin("");
    setInternshipOnly(false);
    setSort("bestMatch");
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleAssistantSubmit} className="flex gap-2">
        <Input
          value={assistantText}
          onChange={(e) => setAssistantText(e.target.value)}
          placeholder={page.assistant.placeholder}
          disabled={assistantThinking}
        />
        <Button type="submit" variant="secondary" disabled={assistantThinking || !assistantText.trim()}>
          {assistantThinking ? <RotateCw className="animate-spin" /> : <Sparkles />}
          {assistantThinking ? page.assistant.thinking : page.assistant.cta}
        </Button>
      </form>
      <p className="text-muted-foreground text-xs">{page.assistant.hint}</p>
      {assistantError && <p className="text-destructive text-sm">{assistantError}</p>}

      <Card>
        <CardContent className="space-y-4 pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{page.filters.targetRoleLabel}</Label>
                <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder={page.filters.targetRolePlaceholder} required />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>{page.filters.cityLabel}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {SUPPORTED_CITIES.map((c) => {
                    const label = locale === "ru" ? c.ru : c.en;
                    const active = workFormat !== "REMOTE" && city.trim().toLowerCase() === label.toLowerCase();
                    return (
                      <Badge
                        key={c.key}
                        variant={active ? "default" : "outline"}
                        className={cn("cursor-pointer", !active && "hover:bg-muted")}
                        onClick={() => {
                          setCity(label);
                          if (workFormat === "REMOTE") setWorkFormat("ANY");
                        }}
                      >
                        {label}
                      </Badge>
                    );
                  })}
                  <Badge
                    variant={workFormat === "REMOTE" ? "default" : "outline"}
                    className={cn("cursor-pointer", workFormat !== "REMOTE" && "hover:bg-muted")}
                    onClick={() => {
                      setWorkFormat("REMOTE");
                      setCity("");
                    }}
                  >
                    {page.filters.remoteQuickOption}
                  </Badge>
                </div>
                <Input
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (workFormat === "REMOTE") setWorkFormat("ANY");
                  }}
                  placeholder={page.filters.cityPlaceholder}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{page.filters.workFormatLabel}</Label>
                <Select value={workFormat} onValueChange={(v) => v && setWorkFormat(v as JobWorkFormat)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v: JobWorkFormat) => page.filters.workFormat[v]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {workFormats.map((f) => (
                      <SelectItem key={f} value={f}>
                        {page.filters.workFormat[f]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{page.filters.experienceLabel}</Label>
                <Select value={experience || "__any"} onValueChange={(v) => setExperience(v === "__any" ? "" : (v as JobExperience))}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v: string) => (v === "__any" ? page.filters.workFormat.ANY : page.filters.experience[v as JobExperience])}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__any">{page.filters.workFormat.ANY}</SelectItem>
                    {experiences.map((exp) => (
                      <SelectItem key={exp} value={exp}>
                        {page.filters.experience[exp]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{page.filters.employmentLabel}</Label>
                <Select value={employment || "__any"} onValueChange={(v) => setEmployment(v === "__any" ? "" : (v as JobEmployment))}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v: string) => (v === "__any" ? page.filters.workFormat.ANY : page.filters.employment[v as JobEmployment])}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__any">{page.filters.workFormat.ANY}</SelectItem>
                    {employments.map((emp) => (
                      <SelectItem key={emp} value={emp}>
                        {page.filters.employment[emp]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{page.filters.salaryMinLabel}</Label>
                <Input type="number" min={0} value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{page.sort.label}</Label>
                <Select value={sort} onValueChange={(v) => v && setSort(v as JobSort)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v: JobSort) => page.sort[v]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {sorts.map((s) => (
                      <SelectItem key={s} value={s}>
                        {page.sort[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 self-end pb-1.5">
                <Checkbox id="internshipOnly" checked={internshipOnly} onCheckedChange={(c) => setInternshipOnly(c === true)} />
                <Label htmlFor="internshipOnly" className="cursor-pointer font-normal">
                  {page.filters.internshipOnlyLabel}
                </Label>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={searching || !targetRole.trim()}>
                {searching ? <RotateCw className="animate-spin" /> : <Search />}
                {searching ? page.filters.searching : page.filters.searchCta}
              </Button>
              <Button type="button" variant="ghost" onClick={handleClear}>
                <X />
                {page.filters.clearCta}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
