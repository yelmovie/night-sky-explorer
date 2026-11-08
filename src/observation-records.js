// Keep the whole observed time span visible without changing saved evidence.
export function representativeDays(days, limit = 6) {
  const ordered = [...new Set(days.filter(day => Number.isInteger(day) && day >= 0 && day <= 29))].sort((a, b) => a - b);
  if (ordered.length <= limit) return ordered;
  return Array.from({ length: limit }, (_, i) => ordered[Math.round(i * (ordered.length - 1) / (limit - 1))]);
}
export const recordCountLabel = days => `관측 기록 ${new Set(days).size}개 보기`;
