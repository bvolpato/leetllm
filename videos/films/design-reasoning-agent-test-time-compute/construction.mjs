import { SENTENCES } from './fixtures.mjs';
export function sentence(state, id, beat, index) {
  const n = SENTENCES[id]?.[beat];
  if (!n || index < 0 || index >= n)
    throw Error(`Unknown reasoning sentence ${id}/${beat}/${index}`);
  if (state.beat > beat) return 1;
  if (state.beat < beat) return 0;
  if (state.cues) {
    const cue = state.cues[`ra-${id}-${beat}-${index}`];
    if (!cue) throw Error(`Missing reasoning cue ra-${id}-${beat}-${index}`);
    return cue.phase === 'after'
      ? 1
      : cue.phase === 'before'
        ? 0
        : Math.max(0, Math.min(1, cue.progress ?? 0));
  }
  return Math.max(0, Math.min(1, (state.beatP ?? 0) * n - index));
}

export function beatCue(state, id, beat, at = 0.45) {
  const cue = state.cues?.[id];
  if (cue) return { started: cue.phase !== 'before', done: cue.phase === 'after', p: cue.progress };
  const local = (state.beat ?? 0) - beat + (state.beatP ?? 0);
  const p = Math.max(0, Math.min(1, (local - at) / 0.15));
  return { started: local >= at, done: p === 1, p };
}
