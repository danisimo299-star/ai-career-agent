"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Sparkles, RotateCw, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { ResumeExperienceEntry } from "@/types";

interface ExperienceSectionProps {
  entries: ResumeExperienceEntry[];
  onChange: (entries: ResumeExperienceEntry[]) => void;
  onSuggestBullets: (role: string, company: string, existingBullets: string[]) => Promise<string[] | null>;
}

const emptyEntry: ResumeExperienceEntry = { role: "", company: "", startDate: "", endDate: "", bullets: [] };

export function ExperienceSection({ entries, onChange, onSuggestBullets }: ExperienceSectionProps) {
  const { dict } = useLocale();
  const page = dict.dashboard.resumePage;
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<ResumeExperienceEntry>(emptyEntry);
  const [suggesting, setSuggesting] = useState(false);

  const openNew = () => {
    setDraft(emptyEntry);
    setEditingIndex(entries.length);
  };
  const openEdit = (i: number) => {
    setDraft(entries[i]);
    setEditingIndex(i);
  };
  const remove = (i: number) => onChange(entries.filter((_, idx) => idx !== i));
  const save = () => {
    if (editingIndex === null) return;
    const next = [...entries];
    next[editingIndex] = draft;
    onChange(next);
    setEditingIndex(null);
  };

  const updateBullet = (i: number, value: string) => {
    const bullets = [...draft.bullets];
    bullets[i] = value;
    setDraft({ ...draft, bullets });
  };
  const removeBullet = (i: number) => setDraft({ ...draft, bullets: draft.bullets.filter((_, idx) => idx !== i) });
  const addBullet = () => setDraft({ ...draft, bullets: [...draft.bullets, ""] });

  const suggest = async () => {
    setSuggesting(true);
    const bullets = await onSuggestBullets(draft.role, draft.company, draft.bullets.filter(Boolean));
    setSuggesting(false);
    if (bullets) setDraft({ ...draft, bullets });
  };

  return (
    <div className="space-y-3">
      {entries.length === 0 ? (
        <EmptyState icon={Briefcase} title={page.emptySections.experience} description="" />
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <Card key={i}>
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {entry.role} — {entry.company}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {entry.startDate}
                    {entry.endDate ? ` – ${entry.endDate}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button size="icon-sm" variant="ghost" onClick={() => openEdit(i)} aria-label={page.editCta}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => remove(i)} aria-label={page.deleteCta}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button variant="outline" size="sm" onClick={openNew}>
        <Plus className="size-3.5" />
        {page.addCta}
      </Button>

      <Dialog open={editingIndex !== null} onOpenChange={(open) => !open && setEditingIndex(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{page.sections.experience}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{page.fields.role}</Label>
                <Input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{page.fields.company}</Label>
                <Input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{page.fields.startDate}</Label>
                <Input value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{page.fields.endDate}</Label>
                <Input value={draft.endDate ?? ""} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>{page.fields.bullets}</Label>
                <Button size="sm" variant="outline" onClick={suggest} disabled={suggesting}>
                  {suggesting ? <RotateCw className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                  {page.aiAssistCta}
                </Button>
              </div>
              <div className="space-y-1.5">
                {draft.bullets.map((bullet, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Input value={bullet} onChange={(e) => updateBullet(i, e.target.value)} />
                    <Button size="icon-sm" variant="ghost" onClick={() => removeBullet(i)} aria-label={page.deleteCta}>
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button size="sm" variant="ghost" onClick={addBullet}>
                <Plus className="size-3.5" />
                {page.fields.addBullet}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingIndex(null)}>
              {page.cancelCta}
            </Button>
            <Button onClick={save}>{page.saveEntryCta}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
