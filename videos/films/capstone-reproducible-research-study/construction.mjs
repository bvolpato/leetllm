import { rsClamp, sum } from './arithmetic.mjs';
import { RS_SENTENCES } from './fixtures.mjs';
export function researchEvent(id, state, beat, sentence) {
  const current = state.beat ?? 0;
  if (current > beat) return 1;
  if (current < beat) return 0;
  const name = `rsx-${id}-b${beat}-s${sentence}`;
  if (state.cues) {
    const cue = state.cues[name];
    return !cue || cue.phase === 'before'
      ? 0
      : cue.phase === 'after'
        ? 1
        : Math.min(0.999999, rsClamp(cue.progress ?? 0));
  }
  const rows = RS_SENTENCES[id]?.[beat] ?? [],
    weights = rows.map((x) => x.split(/\s+/).length),
    total = sum(weights),
    start = sum(weights.slice(0, sentence)) / total,
    end = start + weights[sentence] / total;
  return rsClamp((rsClamp(((state.beatP ?? 0) - 0.04) / 0.92) - start) / (end - start));
}
