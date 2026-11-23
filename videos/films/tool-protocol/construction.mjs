export const cueAmount = (cues, id, fallback) => {
  const cue = cues?.[id];
  return cue ? (cue.phase === 'before' ? 0 : cue.phase === 'after' ? 1 : cue.progress) : fallback;
};
