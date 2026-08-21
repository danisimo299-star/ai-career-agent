"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Sparkles, RotateCw, FolderGit2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { ResumeProjectEntry } from "@/types";

interface ProjectsSectionProps {
  entries: ResumeProjectEntry[];
  onChange: (entries: ResumeProjectEntry[]) => void;
  onSuggestDescription: (name: string, technologies: string[]) => Promise<string | null>;
}

const emptyEntry: ResumeProjectEntry = { name: "", description: "", technologies: [], url: "" };

export function ProjectsSection({ entries, onChange, onSuggestDescription }: ProjectsSectionProps) {
  const { dict } = useLocale();
  const page = dict.dashboard.resumePage;
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<ResumeProjectEntry>(emptyEntry);
  const [techInput, setTechInput] = useState("");
  const [suggesting, setSuggesting] = useState(false);

  const openNew = () => {
    setDraft(emptyEntry);
    setTechInput("");
    setEditingIndex(entries.length);
  };
  const openEdit = (i: number) => {
    setDraft(entries[i]);
    setTechInput(entries[i].technologies.join(", "));
    setEditingIndex(i);
  };
  const remove = (i: number) => onChange(entries.filter((_, idx) => idx !== i));
  const save = () => {
    if (editingIndex === null) return;
    const technologies = techInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const next = [...entries];
    next[editingIndex] = { ...draft, technologies };
    onChange(next);
    setEditingIndex(null);
  };

  const suggest = async () => {
    setSuggesting(true);
    const technologies = techInput.split(",").map((t) => t.trim()).filter(Boolean);
    const description = await onSuggestDescription(draft.name, technologies);
    setSuggesting(false);
    if (description) setDraft({ ...draft, description });
  };

  return (
    <div className="space-y-3">
      {entries.length === 0 ? (
        <EmptyState icon={FolderGit2} title={page.emptySections.projects} description="" />
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <Card key={i}>
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{entry.name}</p>
                  <p className="text-muted-foreground truncate text-xs">{entry.technologies.join(", ")}</p>
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
            <DialogTitle>{page.sections.projects}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{page.fields.projectName}</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{page.fields.technologies}</Label>
              <Input value={techInput} onChange={(e) => setTechInput(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>{page.fields.description}</Label>
                <Button size="sm" variant="outline" onClick={suggest} disabled={suggesting}>
                  {suggesting ? <RotateCw className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                  {page.aiAssistCta}
                </Button>
              </div>
              <Textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{page.fields.url}</Label>
              <Input value={draft.url ?? ""} onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
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
