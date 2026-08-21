"use client";

import { motion } from "motion/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dna } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { CareerDnaScores } from "@/lib/ai/career/types";

const traitKeys: (keyof CareerDnaScores)[] = [
  "leadership",
  "communication",
  "analyticalThinking",
  "creativity",
  "responsibility",
  "problemSolving",
  "learningSpeed",
];

export function CareerDnaWidget({ dna }: { dna: CareerDnaScores | null }) {
  const { dict } = useLocale();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dict.dashboard.careerDna.title}</CardTitle>
        <CardDescription>{dict.dashboard.careerDna.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!dna ? (
          <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center text-sm">
            <Dna className="size-6" />
            {dict.dashboard.careerDna.empty}
          </div>
        ) : (
          traitKeys.map((key, index) => {
            const value = dna[key];
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{dict.dashboard.careerDna.traits[key]}</span>
                  <span className="text-muted-foreground">{value}%</span>
                </div>
                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                  <motion.div
                    className="bg-primary h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.6, delay: index * 0.08, ease: "easeOut" }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
