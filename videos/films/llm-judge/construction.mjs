import { labels, records } from './fixtures.mjs';
import { attempts } from './model.mjs';
export function coverageFrame(beat, progress) {
  const phase = (a, z) => Math.max(0, Math.min(1, (progress - a) / (z - a)));
  const resolvedCount = beat > 0 ? 8 : Math.min(8, Math.floor(phase(0.63, 0.72) * 8 + 1e-9));
  const checked =
    beat < 1 ? 0 : beat > 1 ? 8 : Math.min(8, Math.floor(phase(0.08, 0.27) * 8 + 1e-9));
  const rows = records.map((record, index) => ({
    id: 'J' + String(index + 1).padStart(2, '0'),
    ...record,
    classified:
      beat > 0 ||
      (index < 8 && index < resolvedCount) ||
      (index === 8 && progress >= 0.38) ||
      (index === 9 && progress >= 0.59),
    compared: index < checked,
  }));
  const classified = rows.filter((row) => row.classified),
    resolvedRows = classified.filter((row) => labels.includes(row.outcome));
  const compared = rows.filter((row) => row.compared),
    matching = compared.filter((row) => row.human === row.outcome).length;
  return {
    rows,
    resolved: resolvedRows.length,
    pending: attempts - classified.length,
    unresolved: classified.filter((row) => row.outcome === 'unresolved').length,
    review: classified.filter((row) => row.outcome === 'review').length,
    checked: compared.length,
    matching,
  };
}
