"use client";

import { useState } from "react";
import { RotateCw, Plus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { CareerScenarioData } from "./types";

export function ComparePanel() {
  const { dict } = useLocale();
  const page = dict.dashboard.coachPage.compare;
  const growthPotentialLabels = dict.dashboard.careerAnalysisPage.growthPotential;

  const [roles, setRoles] = useState<string[]>([]);
  const [roleInput, setRoleInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CareerScenarioData[]>([]);

  const addRole = () => {
    const trimmed = roleInput.trim();
    if (!trimmed || roles.includes(trimmed) || roles.length >= 4) return;
    setRoles((prev) => [...prev, trimmed]);
    setRoleInput("");
  };

  const compare = async () => {
    if (roles.length < 2) {
      setError(page.needTwoRoles);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/coach/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleTitles: roles }),
      });
      if (!response.ok) throw new Error("failed");
      const data = (await response.json()) as { scenarios: CareerScenarioData[] };
      setResults(data.scenarios);
    } catch {
      setError(page.needTwoRoles);
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
        <CardContent className="space-y-3 pt-6">
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <Badge key={role} variant="secondary" className="gap-1">
                {role}
                <button type="button" onClick={() => setRoles((prev) => prev.filter((r) => r !== role))} aria-label={page.removeCta}>
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addRole();
            }}
            className="flex gap-2"
          >
            <Input value={roleInput} onChange={(e) => setRoleInput(e.target.value)} placeholder={page.addRolePlaceholder} />
            <Button type="submit" variant="outline" disabled={roles.length >= 4}>
              <Plus />
              {page.addCta}
            </Button>
          </form>
          <Button onClick={compare} disabled={loading || roles.length < 2}>
            {loading ? <RotateCw className="animate-spin" /> : null}
            {loading ? page.comparing : page.compareCta}
          </Button>
          {error && <p className="text-destructive text-sm">{error}</p>}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {results.map((scenario) => (
            <Card key={scenario.title}>
              <CardContent className="space-y-2 pt-6">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{scenario.title}</h3>
                  {scenario.label && <Badge>{page.label[scenario.label]}</Badge>}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">{page.fitLabel}</p>
                    <p className="font-medium">{scenario.fitPercent}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{page.gapLabel}</p>
                    <p className="font-medium">{scenario.skillGapPercent}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{page.jobsLabel}</p>
                    <p className="font-medium">{scenario.jobCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">{page.growthLabel}</p>
                    <p className="font-medium">{growthPotentialLabels[scenario.growthPotential]}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
