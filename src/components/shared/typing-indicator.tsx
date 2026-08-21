"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="bg-primary/15 text-primary flex size-8 shrink-0 items-center justify-center rounded-full">
        <Sparkles className="size-4" />
      </div>
      <div className="bg-muted flex items-center gap-1 rounded-2xl rounded-tl-sm px-4 py-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="bg-muted-foreground/60 size-1.5 rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}
