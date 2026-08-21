"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

export function InsightBanner({ text }: { text: string | null }) {
  if (!text) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-primary/5 border-primary/20 flex items-start gap-2.5 rounded-lg border p-3 text-sm"
    >
      <Sparkles className="text-primary mt-0.5 size-4 shrink-0" />
      <p className="text-muted-foreground">{text}</p>
    </motion.div>
  );
}
