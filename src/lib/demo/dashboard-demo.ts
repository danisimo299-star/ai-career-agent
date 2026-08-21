/**
 * Fallback path for `CareerTimelineWidget` before a user has generated a
 * Career Roadmap — once one exists, the widget renders its real milestones
 * instead (see `roadmap.service.ts`).
 */
export const careerTimelineStages = [
  "today",
  "learnPython",
  "firstProject",
  "resume",
  "interview",
  "firstJob",
  "middle",
  "senior",
] as const;

export const careerTimelineCurrentIndex = 0;
