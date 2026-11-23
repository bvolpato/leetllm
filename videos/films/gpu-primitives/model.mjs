import { exclusive } from './arithmetic.mjs';
import { ALL, FIRST, ODD_ROW } from './fixtures.mjs';
export function onlineRescale(progress) {
  const p = Math.max(0, Math.min(1, progress)),
    oldContribution = FIRST.denominator * Math.exp(FIRST.maximum - ALL.maximum),
    newContribution = [4, 0].reduce((sum, value) => sum + Math.exp(value - ALL.maximum), 0);
  return {
    progress: p,
    maximum: ALL.maximum,
    scale: Math.exp(FIRST.maximum - ALL.maximum),
    oldContribution,
    newContribution,
    total: oldContribution + newContribution,
    stage: p < 0.2 ? 0 : p < 0.42 ? 1 : p < 0.66 ? 2 : p < 0.88 ? 3 : 4,
  };
}
export function scanTeachingSnapshot(beat, progress, cues) {
  const phase = (a, z) => Math.max(0, Math.min(1, (progress - a) / (z - a)));
  return {
    round1:
      beat === 0 ? 0 : beat > 1 ? 1 : (cues?.['scan-first-stride']?.progress ?? phase(0.05, 0.43)),
    round2:
      beat < 1 ? 0 : beat > 1 ? 1 : (cues?.['scan-second-stride']?.progress ?? phase(0.55, 0.94)),
    prefixCount:
      beat > 0
        ? 4
        : cues
          ? cues['scan-final-prefix']?.phase !== 'before'
            ? 4
            : cues['scan-third-prefix']?.phase !== 'before'
              ? 3
              : 0
          : progress > 0.6
            ? 4
            : progress > 0.25
              ? 3
              : 0,
  };
}
export function freshPrefixSnapshot(beat, progress, cues = {}) {
  const completed = (id, fallback) => (cues[id] ? cues[id].phase === 'after' : fallback);
  const input = ODD_ROW,
    local = [...exclusive(input.slice(0, 4)), ...exclusive(input.slice(4))],
    offset = input.slice(0, 4).reduce((a, b) => a + b, 0);
  const offsetShown = beat > 1 || (beat === 1 && completed('fresh-offset-five', progress > 0.02));
  const revealed = beat > 1 || (beat === 1 && completed('fresh-odd-row-step-2', progress > 0.3));
  const reductionShown = beat > 1 || (beat === 1 && completed('fresh-reduction', progress > 0.55));
  return {
    input,
    local,
    offset,
    offsetShown,
    revealed,
    reductionShown,
    output: revealed ? exclusive(input) : null,
    total: reductionShown ? input.reduce((a, b) => a + b, 0) : null,
  };
}
