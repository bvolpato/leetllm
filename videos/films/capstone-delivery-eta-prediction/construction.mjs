import { motion, sum } from './arithmetic.mjs';
import { track } from './fixtures.mjs';
import { decisions, historySummary } from './model.mjs';
export function sampleModel(id, state) {
  const b = track.sample(state).snapshot;
  const p = motion(state.beatP ?? 0);
  const threshold = id === 'selection' ? Number((b ? 0.8 : 0.4 + 0.4 * p).toFixed(2)) : 0.4;
  const rows = decisions(threshold);
  const count = b ? 4 : 1 + Math.floor(3 * p);
  const durations = [8, 10, 12, 14].slice(0, count);
  const median =
    count % 2 ? durations[(count - 1) / 2] : (durations[count / 2 - 1] + durations[count / 2]) / 2;
  return {
    b,
    p,
    threshold,
    rows,
    durations,
    median,
    history: historySummary(durations),
    penalty: sum(rows.map((row) => row.penalty)),
    age: b ? 31 : 5 + 26 * p,
  };
}
export function costSnapshot(beat, progress) {
  const seconds = progress * [16.206, 18.706][beat],
    ageRows = decisions(0, true),
    candidate = decisions(0.4);
  const ageShown = beat > 0 ? 4 : Math.max(0, Math.min(4, Math.floor((seconds - 3) / 0.5) + 1));
  const candidateShown =
    beat === 0 ? 0 : Math.max(0, Math.min(4, Math.floor((seconds - 0.45) / 0.7) + 1));
  const agePriced = beat > 0 || seconds >= 14.2,
    candidatePriced =
      beat === 0 ? 0 : Math.max(0, Math.min(4, Math.floor((seconds - 4.675) / 0.5) + 1));
  return {
    seconds,
    ageRows,
    candidate,
    ageShown,
    candidateShown,
    agePriced,
    candidatePriced,
    ageTotal: agePriced ? sum(ageRows.map((r) => r.penalty)) : null,
    candidateTotal: sum(candidate.slice(0, candidatePriced).map((r) => r.penalty)),
  };
}
