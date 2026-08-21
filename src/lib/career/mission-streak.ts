function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Consecutive days (ending today) with at least one completed mission.
 * If today has no completion yet, counting starts from yesterday instead —
 * otherwise the streak would show as broken the moment midnight passes,
 * before the user has had a chance to act today.
 */
export function computeMissionStreak(completedDates: Date[], today: Date = new Date()): number {
  const days = new Set(completedDates.map(toISODate));
  const cursor = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  if (!days.has(toISODate(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let streak = 0;
  while (days.has(toISODate(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}
