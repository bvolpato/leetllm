import { ADMISSION_FIXTURES, ADMISSION_GATES, GENERATED_CASES } from './fixtures.mjs';
import { screenCandidates } from './model.mjs';
// The retry example is considered last. A row withheld by the judge never joins the pool.
const receipts = screenCandidates([...ADMISSION_FIXTURES].reverse()).reverse();
export function admissionTrace(beat, beatProgress) {
  const elapsed = Math.max(0, Math.min(1, beatProgress)) * [18.022, 16.222, 21.582][beat];
  const phase = (start, end) => {
    const q = Math.max(0, Math.min(1, (elapsed - start) / (end - start)));
    return q * q * (3 - 2 * q);
  };
  // Each gate reaches its stop on the corresponding measured spoken clause.
  const progress =
    beat === 0
      ? elapsed < 10.3125
        ? phase(7.1875, 7.9375)
        : 1 + phase(10.3125, 11.3125)
      : beat === 1
        ? elapsed < 6.25
          ? 2 + phase(0.1, 4.55)
          : 3 + phase(6.25, 7.7125)
        : 4 + phase(0.175, 5.025);
  const completedGates = beat === 2 && elapsed < 8.25 ? 4 : Math.min(5, Math.floor(progress));
  const judgedDisagreement = beat === 2 && elapsed >= 5.025;
  return admissionAt(progress, completedGates, judgedDisagreement);
}

export function admissionAt(progress, completedGates, judgedDisagreement) {
  const rows = receipts.map((row) => ({
    ...row,
    failed: completedGates > row.passedGates || (judgedDisagreement && row.passedGates === 4),
  }));
  const survivors = rows.filter((row) => !row.failed).length;
  return {
    progress,
    completedGates,
    activeGate: Math.min(4, completedGates),
    gateProgress: progress - completedGates,
    survivors,
    acceptedRows: completedGates === 5 ? survivors : 0,
    gateCounts: ADMISSION_GATES.map(
      (_gate, index) => receipts.filter((row) => row.passedGates >= index + 1).length,
    ),
    rows,
  };
}
export function judgeSnapshot(beat, beatProgress, resultProgress) {
  const elapsed = beatProgress * 10.534; // Legacy fallback for callers without explicit narration cues.
  return {
    comparisonVisible:
      beat > 1 ||
      (beat === 1 && (Number.isFinite(resultProgress) ? resultProgress === 1 : elapsed >= 4.4875)),
  };
}
export function generationState(beat, progress) {
  const seconds = progress * [19.174, 12.118, 22.518][beat],
    ramp = (a, z) => Math.max(0, Math.min(1, (seconds - a) / (z - a)));
  const built = beat > 0 ? 3 : seconds < 5.4625 ? 0 : seconds < 7.175 ? 1 : seconds < 9.525 ? 2 : 3;
  const count =
    beat === 0 ? built : beat === 1 ? (seconds < 5.55 ? 3 : 4) : seconds < 17.4625 ? 4 : 5;
  const rows = GENERATED_CASES.slice(0, count),
    families = [...new Set(rows.map((r) => r.family))];
  return {
    seconds,
    rows,
    families,
    expectedVisible: beat > 0 || seconds >= 14.2625,
    move: beat === 0 ? 0 : beat > 1 ? 1 : ramp(0.1, 3.75),
    familyCount: families.length,
  };
}
export function diversityState(beat, progress, nearCueProgress) {
  const seconds = progress * [19.918, 12.838, 18.798][beat],
    ramp = (a, z) => Math.max(0, Math.min(1, (seconds - a) / (z - a)));
  const cueProgress = Number.isFinite(nearCueProgress)
    ? Math.max(0, Math.min(1, nearCueProgress))
    : null;
  const near = beat === 0 ? null : [0.99, 0.02],
    novel = beat > 1 || (beat === 1 && seconds >= 8.0375) ? [0.25, 0.95] : null;
  const nearProgress =
    beat === 0
      ? 0
      : beat > 1
        ? 1
        : cueProgress === null
          ? ramp(1.525, 5.1875)
          : 1 - (1 - cueProgress) ** 2;
  return {
    seconds,
    near,
    novel,
    nearProgress,
    novelProgress: beat > 1 ? 1 : ramp(8.0375, 10.5875),
    review: beat > 1 || (beat === 1 && seconds >= 7.2125),
    nearAngle: Math.atan2(0.02, 0.99),
    novelAngle: Math.atan2(0.95, 0.25),
    angleProgress: beat === 2 ? ramp(2.775, 5.075) : 0,
    nearComparison: beat === 2 ? ramp(5.45, 8.0125) : 0,
    novelComparison: beat === 2 ? ramp(8.5875, 10.875) : 0,
  };
}
