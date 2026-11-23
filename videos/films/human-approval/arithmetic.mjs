export const progressBetween = (value, start, end) =>
  Math.max(0, Math.min(1, (value - start) / (end - start)));
export function admissionBudget(events, now, reservations = []) {
  return [...events, ...reservations]
    .filter((e) => e.at > now - 3600 && e.at <= now)
    .reduce((sum, e) => sum + Math.max(0, e.to - e.from), 0);
}
