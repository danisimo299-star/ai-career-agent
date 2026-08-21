"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { useLocale } from "@/lib/i18n/locale-provider";

export interface EntryField<T> {
  key: keyof T;
  label: string;
  optional?: boolean;
}

interface EntryListEditorProps<T extends object> {
  entries: T[];
  onChange: (entries: T[]) => void;
  fields: EntryField<T>[];
  emptyEntry: T;
  emptyMessage: string;
  renderSummary: (entry: T) => { title: string; subtitle?: string };
}

export function EntryListEditor<T extends object>({
  entries,
  onChange,
  fields,
  emptyEntry,
  emptyMessage,
  renderSummary,
}: EntryListEditorProps<T>) {
  const { dict } = useLocale();
  const page = dict.dashboard.resumePage;
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<T>(emptyEntry);

  const openNew = () => {
    setDraft(emptyEntry);
    setEditingIndex(entries.length);
  };

  const openEdit = (index: number) => {
    setDraft(entries[index]);
    setEditingIndex(index);
  };

  const remove = (index: number) => {
    onChange(entries.filter((_, i) => i !== index));
  };

  const save = () => {
    if (editingIndex === null) return;
    const next = [...entries];
    next[editingIndex] = draft;
    onChange(next);
    setEditingIndex(null);
  };

  return (
    <div className="space-y-3">
      {entries.length === 0 ? (
        <EmptyState icon={FileText} title={emptyMessage} description="" />
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => {
            const { title, subtitle } = renderSummary(entry);
            return (
              <Card key={i}>
                <CardContent className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{title}</p>
                    {subtitle && <p className="text-muted-foreground truncate text-xs">{subtitle}</p>}
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
            );
          })}
        </div>
      )}

      <Button variant="outline" size="sm" onClick={openNew}>
        <Plus className="size-3.5" />
        {page.addCta}
      </Button>

      <Dialog open={editingIndex !== null} onOpenChange={(open) => !open && setEditingIndex(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{page.addCta}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {fields.map((field) => (
              <div key={String(field.key)} className="space-y-1.5">
                <Label>{field.label}</Label>
                <Input
                  value={(draft as Record<string, string | undefined>)[field.key as string] ?? ""}
                  onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })}
                />
              </div>
            ))}
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
