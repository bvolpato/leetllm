export function constructedFrame(state = {}) {
  const beat = state.beat ?? 0,
    p = Math.max(0, Math.min(1, state.beatP ?? 0)),
    progress = (id, index = beat) =>
      state.cues?.[id]?.progress ?? (state.cues || beat < index ? 0 : beat > index ? 1 : p),
    started = (id) =>
      state.cues?.[id] ? state.cues[id].phase !== 'before' : !state.cues && p > 0.2,
    completed = (id, index = beat) =>
      state.cues?.[id]
        ? state.cues[id].phase === 'after'
        : !state.cues && (beat > index || (beat === index && p === 1));
  return {
    beat,
    p,
    progress,
    started,
    completed,
    freshRevealed: completed('em-fresh-first', 1),
    priorChanged: completed('em-fresh-flip', 3),
  };
}
