"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Sparkles, ArrowRight, ArrowLeft, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptionCard } from "@/components/onboarding/option-card";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { educationStageOptions, interestOptions, goalOptions } from "@/lib/onboarding/options";
import { computeProfileCompletion } from "@/lib/onboarding/profile-completion";
import type { InterestKey, GoalKey } from "@/lib/validation/onboarding.schema";
import { educationStageValues } from "@/lib/validation/onboarding.schema";
import { useLocale } from "@/lib/i18n/locale-provider";

const DRAFT_KEY = "onboarding-draft-v1";

type EducationStage = (typeof educationStageValues)[number];

interface OnboardingData {
  name: string;
  age: string;
  city: string;
  educationStage: EducationStage | null;
  interests: InterestKey[];
  goals: GoalKey[];
}

const emptyData: OnboardingData = {
  name: "",
  age: "",
  city: "",
  educationStage: null,
  interests: [],
  goals: [],
};

const steps = ["welcome", "name", "age", "city", "education", "interests", "goals"] as const;
type Step = (typeof steps)[number] | "complete";

function loadDraft(): OnboardingData {
  if (typeof window === "undefined") return emptyData;

  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) return emptyData;

  try {
    return { ...emptyData, ...JSON.parse(raw) };
  } catch {
    return emptyData;
  }
}

export function OnboardingWizard() {
  const { dict } = useLocale();
  const router = useRouter();

  const [stepIndex, setStepIndex] = useState(0);
  const [step, setStep] = useState<Step>("welcome");
  const [data, setData] = useState<OnboardingData>(loadDraft);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (step === "complete") return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  }, [data, step]);

  const percent = useMemo(() => computeProfileCompletion(data), [data]);

  const goTo = (index: number) => {
    setDirection(index > stepIndex ? 1 : -1);
    setStepIndex(index);
    setStep(steps[index]);
  };

  const isStepValid = (current: Step): boolean => {
    switch (current) {
      case "name":
        return data.name.trim().length > 0;
      case "age": {
        const age = Number(data.age);
        return Number.isInteger(age) && age >= 10 && age <= 100;
      }
      case "city":
        return data.city.trim().length > 0;
      case "education":
        return data.educationStage !== null;
      case "interests":
        return data.interests.length > 0;
      case "goals":
        return data.goals.length > 0;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!isStepValid(step)) return;

    if (step === "goals") {
      await submit();
      return;
    }

    goTo(stepIndex + 1);
  };

  const handleBack = () => {
    if (stepIndex === 0) return;
    goTo(stepIndex - 1);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          age: Number(data.age),
          city: data.city.trim(),
          educationStage: data.educationStage,
          interests: data.interests,
          goals: data.goals,
        }),
      });

      if (!response.ok) throw new Error("request_failed");

      localStorage.removeItem(DRAFT_KEY);
      setDirection(1);
      setStep("complete");
    } catch {
      toast.error(dict.auth.register.errors.generic);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleInterest = (value: InterestKey) => {
    setData((prev) => ({
      ...prev,
      interests: prev.interests.includes(value)
        ? prev.interests.filter((v) => v !== value)
        : [...prev.interests, value],
    }));
  };

  const toggleGoal = (value: GoalKey) => {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.includes(value) ? prev.goals.filter((v) => v !== value) : [...prev.goals, value],
    }));
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  };

  const showProgress = step !== "welcome";
  const showNav = step !== "welcome" && step !== "complete";

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        {showProgress && <OnboardingProgress percent={percent} />}

        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {step === "welcome" && (
                <div className="flex flex-col items-center gap-6 text-center">
                  <div className="bg-primary/10 flex size-16 items-center justify-center rounded-2xl">
                    <Sparkles className="text-primary size-8" />
                  </div>
                  <div className="space-y-3">
                    <h1 className="text-2xl font-semibold tracking-tight">
                      {dict.onboarding.steps.welcome.title}
                    </h1>
                    <p className="text-muted-foreground text-balance">
                      {dict.onboarding.steps.welcome.description}
                    </p>
                  </div>
                  <Button size="lg" onClick={() => goTo(1)}>
                    {dict.onboarding.steps.welcome.cta}
                    <ArrowRight />
                  </Button>
                </div>
              )}

              {step === "name" && (
                <StepShell title={dict.onboarding.steps.name.title} description={dict.onboarding.steps.name.description}>
                  <Input
                    autoFocus
                    value={data.name}
                    placeholder={dict.onboarding.steps.name.placeholder}
                    onChange={(e) => setData((prev) => ({ ...prev, name: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && handleNext()}
                  />
                </StepShell>
              )}

              {step === "age" && (
                <StepShell title={dict.onboarding.steps.age.title} description={dict.onboarding.steps.age.description}>
                  <Input
                    autoFocus
                    type="number"
                    min={10}
                    max={100}
                    value={data.age}
                    placeholder={dict.onboarding.steps.age.placeholder}
                    onChange={(e) => setData((prev) => ({ ...prev, age: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && handleNext()}
                  />
                </StepShell>
              )}

              {step === "city" && (
                <StepShell title={dict.onboarding.steps.city.title} description={dict.onboarding.steps.city.description}>
                  <Input
                    autoFocus
                    value={data.city}
                    placeholder={dict.onboarding.steps.city.placeholder}
                    onChange={(e) => setData((prev) => ({ ...prev, city: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && handleNext()}
                  />
                </StepShell>
              )}

              {step === "education" && (
                <StepShell
                  title={dict.onboarding.steps.education.title}
                  description={dict.onboarding.steps.education.description}
                >
                  <div className="grid grid-cols-2 gap-3">
                    {educationStageOptions.map(({ value, icon }) => (
                      <OptionCard
                        key={value}
                        icon={icon}
                        label={dict.onboarding.steps.education.options[educationKeyToDictKey(value)]}
                        selected={data.educationStage === value}
                        onClick={() => setData((prev) => ({ ...prev, educationStage: value }))}
                      />
                    ))}
                  </div>
                </StepShell>
              )}

              {step === "interests" && (
                <StepShell
                  title={dict.onboarding.steps.interests.title}
                  description={dict.onboarding.steps.interests.description}
                >
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {interestOptions.map(({ value, icon }) => (
                      <OptionCard
                        key={value}
                        icon={icon}
                        label={dict.onboarding.steps.interests.options[value]}
                        selected={data.interests.includes(value)}
                        onClick={() => toggleInterest(value)}
                      />
                    ))}
                  </div>
                </StepShell>
              )}

              {step === "goals" && (
                <StepShell title={dict.onboarding.steps.goals.title} description={dict.onboarding.steps.goals.description}>
                  <div className="grid grid-cols-2 gap-3">
                    {goalOptions.map(({ value, icon }) => (
                      <OptionCard
                        key={value}
                        icon={icon}
                        label={dict.onboarding.steps.goals.options[value]}
                        selected={data.goals.includes(value)}
                        onClick={() => toggleGoal(value)}
                      />
                    ))}
                  </div>
                </StepShell>
              )}

              {step === "complete" && (
                <div className="flex flex-col items-center gap-6 text-center">
                  <div className="bg-primary/10 flex size-16 items-center justify-center rounded-2xl">
                    <PartyPopper className="text-primary size-8" />
                  </div>
                  <div className="space-y-3">
                    <h1 className="text-2xl font-semibold tracking-tight">
                      {dict.onboarding.completeTitle}
                    </h1>
                    <p className="text-muted-foreground text-balance">
                      {dict.onboarding.completeSubtitle}
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => {
                      router.push("/dashboard");
                      router.refresh();
                    }}
                  >
                    {dict.onboarding.finishCta}
                    <ArrowRight />
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {showNav && (
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft />
              {dict.onboarding.nav.back}
            </Button>
            <Button onClick={handleNext} disabled={!isStepValid(step) || submitting}>
              {step === "goals" ? dict.onboarding.nav.finish : dict.onboarding.nav.next}
              <ArrowRight />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {children}
    </div>
  );
}

function educationKeyToDictKey(value: EducationStage): "school" | "college" | "university" | "working" {
  return value.toLowerCase() as "school" | "college" | "university" | "working";
}
