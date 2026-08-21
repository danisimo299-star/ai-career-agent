export interface OnboardingProgressFields {
  name: string;
  age: string;
  city: string;
  educationStage: string | null;
  interests: string[];
  goals: string[];
}

const TOTAL_FIELDS = 6;

export function computeProfileCompletion(fields: OnboardingProgressFields): number {
  const filled = [
    fields.name.trim().length > 0,
    fields.age.trim().length > 0,
    fields.city.trim().length > 0,
    Boolean(fields.educationStage),
    fields.interests.length > 0,
    fields.goals.length > 0,
  ].filter(Boolean).length;

  return Math.round((filled / TOTAL_FIELDS) * 100);
}
