"use client";

import { useState } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Mic } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { useLocale } from "@/lib/i18n/locale-provider";
import { InterviewSetupForm } from "./interview-setup-form";
import { InterviewSessionView } from "./interview-session-view";
import { InterviewReportView } from "./interview-report-view";
import { InterviewHistory } from "./interview-history";
import type { InterviewSessionData, InterviewSetupInput, WeakSkillRecommendationData } from "./types";

interface InterviewViewProps {
  initialSessions: InterviewSessionData[];
  weakSkill: WeakSkillRecommendationData | null;
  defaultTargetRole: string | null;
  initialCustomRole?: string | null;
}

export function InterviewView({ initialSessions, weakSkill, defaultTargetRole, initialCustomRole }: InterviewViewProps) {
  const { dict } = useLocale();
  const page = dict.dashboard.interviewPage;

  const [sessions, setSessions] = useState(initialSessions);
  const [activeId, setActiveId] = useState<string | null>(
    initialSessions.find((s) => s.status === "IN_PROGRESS")?.id ?? null
  );
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

  const upsertSession = (session: InterviewSessionData) => {
    setSessions((prev) => {
      const exists = prev.some((s) => s.id === session.id);
      return exists ? prev.map((s) => (s.id === session.id ? session : s)) : [session, ...prev];
    });
  };

  const handleStart = async (input: InterviewSetupInput) => {
    setStarting(true);
    setStartError(null);
    try {
      const response = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "generic" }));
        setStartError(body.error === "ai_unavailable" ? dict.common.aiUnavailable : page.setup.errorStart);
        return;
      }
      const data = (await response.json()) as { session: InterviewSessionData };
      upsertSession(data.session);
      setActiveId(data.session.id);
    } catch {
      setStartError(page.setup.errorStart);
    } finally {
      setStarting(false);
    }
  };

  const handleAnswer = async (questionId: string, answer: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/interview/questions/${questionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "generic" }));
        if (body.error === "ai_unavailable") toast.error(dict.common.aiUnavailable);
        return false;
      }
      const data = (await response.json()) as { session: InterviewSessionData };
      upsertSession(data.session);
      return true;
    } catch {
      return false;
    }
  };

  const handleFinish = async () => {
    if (!activeId) return;
    setFinishing(true);
    try {
      const response = await fetch(`/api/interview/${activeId}/finish`, { method: "POST" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "generic" }));
        toast.error(body.error === "ai_unavailable" ? dict.common.aiUnavailable : page.session.errorSubmit);
        return;
      }
      const data = (await response.json()) as { session: InterviewSessionData };
      upsertSession(data.session);
    } catch {
      toast.error(page.session.errorSubmit);
    } finally {
      setFinishing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="space-y-6"
    >
      <PageHeader title={page.title} description={page.subtitle} icon={Mic} tone="interview" />

      {activeSession ? (
        activeSession.status === "IN_PROGRESS" ? (
          <InterviewSessionView session={activeSession} onAnswer={handleAnswer} onFinish={handleFinish} finishing={finishing} />
        ) : (
          <InterviewReportView session={activeSession} weakSkill={weakSkill} onStartNew={() => setActiveId(null)} />
        )
      ) : (
        <>
          <InterviewSetupForm
            defaultTargetRole={defaultTargetRole}
            initialCustomRole={initialCustomRole}
            starting={starting}
            error={startError}
            onStart={handleStart}
          />
          <InterviewHistory sessions={sessions} onOpen={setActiveId} />
        </>
      )}
    </motion.div>
  );
}
