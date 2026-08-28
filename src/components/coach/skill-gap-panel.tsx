"use client";

import { useState } from "react";
import { RotateCw, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { SkillGapResponseData, SkillPriority } from "./types";

interface SkillGapPanelProps {
  defaultTargetRole: string | null;
  defaultCity: string | null;
}

const PRIORITY_VARIANT: Record<SkillPriority, "destructive" | "default" | "secondary" | "outline"> = {
  critical: "destructive",
  high: "default",
  medium: "secondary",
  low: "outline",
};

export function SkillGapPanel({ defaultTargetRole, defaultCity }: SkillGapPanelProps) {
  const { dict } = useLocale();
  const page = dict.dashboard.coachPage.skillGap;

  const [targetRole, setTargetRole] = useState(defaultTargetRole ?? "");
  const [city, setCity] = useState(defaultCity ?? "");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SkillGapResponseData | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const runAnalysis = async (role: string) => {
    if (!role.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams({ targetRole: role.trim() });
      if (city.trim()) params.set("city", city.trim());
      const response = await fetch(`/api/coach/skill-gap?${params.toString()}`);
      if (!response.ok) throw new Error("failed");
      const json = (await response.json()) as { skillGap: SkillGapResponseData | null };
      setData(json.skillGap);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">{page.title}</h2>
        <p className="text-muted-foreground text-sm">{page.subtitle}</p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runAnalysis(targetRole);
            }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          >
            <div className="space-y-1.5">
              <Label>{page.targetRoleLabel}</Label>
              <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder={page.targetRolePlaceholder} required />
            </div>
            <div className="space-y-1.5">
              <Label>{page.cityLabel}</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <Button type="submit" disabled={loading || !targetRole.trim()}>
              {loading ? <RotateCw className="animate-spin" /> : <Search />}
              {page.searchCta}
            </Button>
          </form>
        </CardContent>
      </Card>

      {!hasSearched && !defaultTargetRole && <p className="text-muted-foreground text-sm">{page.noTargetRole}</p>}

      {data && (
        <>
          {data.targetGap && (
            <Card>
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{page.targetBasedTitle}</h3>
                  <span className="text-lg font-bold">{data.targetGap.gapPercent}%</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-muted-foreground text-xs">{page.matchedLabel}:</span>
                  {data.targetGap.matched.map((s) => (
                    <Badge key={s} variant="secondary">
                      {s}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-muted-foreground text-xs">{page.missingLabel}:</span>
                  {data.targetGap.missing.map((item) => (
                    <Badge key={item.skill} variant={PRIORITY_VARIANT[item.priority]}>
                      {item.skill} · {page.priority[item.priority]}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{page.marketBasedTitle}</h3>
                <span className="text-lg font-bold">{data.marketGap.gapPercent}%</span>
              </div>
              <p className="text-muted-foreground text-xs">{page.analyzedTemplate.replace("{count}", String(data.marketGap.analyzedVacancyCount))}</p>
              {data.marketGap.analyzedVacancyCount === 0 ? (
                <p className="text-muted-foreground text-sm">{page.noVacancies}</p>
              ) : (
                <div className="space-y-1.5">
                  {data.marketGap.missing.map((item) => (
                    <div key={item.skill} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Badge variant={PRIORITY_VARIANT[item.priority]}>{page.priority[item.priority]}</Badge>
                        <span>{item.skill}</span>
                      </div>
                      <span className="text-muted-foreground text-xs">{page.frequencyTemplate.replace("{percent}", String(item.marketFrequencyPercent ?? 0))}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
