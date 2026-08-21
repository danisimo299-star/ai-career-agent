import {
  School,
  Building2,
  GraduationCap,
  Briefcase,
  Code,
  Megaphone,
  HeartPulse,
  Cog,
  Landmark,
  Palette,
  FlaskConical,
  Scale,
  BookOpen,
  MoreHorizontal,
  Target,
  Handshake,
  Repeat,
  TrendingUp,
  MessagesSquare,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { educationStageValues, interestKeys, goalKeys } from "@/lib/validation/onboarding.schema";

export const educationStageOptions: { value: (typeof educationStageValues)[number]; icon: LucideIcon }[] = [
  { value: "SCHOOL", icon: School },
  { value: "COLLEGE", icon: Building2 },
  { value: "UNIVERSITY", icon: GraduationCap },
  { value: "WORKING", icon: Briefcase },
];

export const interestOptions: { value: (typeof interestKeys)[number]; icon: LucideIcon }[] = [
  { value: "programming", icon: Code },
  { value: "business", icon: Briefcase },
  { value: "marketing", icon: Megaphone },
  { value: "medicine", icon: HeartPulse },
  { value: "engineering", icon: Cog },
  { value: "finance", icon: Landmark },
  { value: "design", icon: Palette },
  { value: "science", icon: FlaskConical },
  { value: "law", icon: Scale },
  { value: "education", icon: BookOpen },
  { value: "other", icon: MoreHorizontal },
];

export const goalOptions: { value: (typeof goalKeys)[number]; icon: LucideIcon }[] = [
  { value: "chooseProfession", icon: Target },
  { value: "findInternship", icon: Handshake },
  { value: "findFirstJob", icon: Briefcase },
  { value: "changeCareer", icon: Repeat },
  { value: "improveSalary", icon: TrendingUp },
  { value: "prepareInterview", icon: MessagesSquare },
  { value: "createResume", icon: FileText },
  { value: "other", icon: MoreHorizontal },
];
