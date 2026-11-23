export const begun = (cue) => cue && cue.phase !== 'before';
export function voiceDirection(state) {
  const b = state.beat ?? 0,
    p = Math.max(0, Math.min(1, state.beatP ?? 0)),
    cues = state.cues;
  const progress = (id, fallback) => (cues?.[id] ? cues[id].progress : fallback);
  const factual = begun(cues?.['chunks-factual-start']);
  let bufferMs = b === 0 ? 30 : b === 1 ? 30 + 30 * p : 60;
  if (cues?.['transport-expand-buffer'])
    bufferMs = 30 + 30 * progress('transport-expand-buffer', 0);
  if (begun(cues?.['transport-absorb-p3'])) bufferMs = 60;
  return {
    bufferMs,
    factual: cues ? !!factual : b >= 2,
    native: cues ? !!begun(cues['native-audio-path']) : b >= 1,
  };
}
