// Measured cues drive production. Untimed storyboards divide the beat between its cues.
export function cueProgress(scene, state, api) {
  return (id) => {
    if (state.cues) return api.focus.progress(id, 0);
    for (const [b, beat] of scene.beats.entries()) {
      const cues = beat.visual_cues ?? [];
      const i = cues.findIndex((cue) => cue.id === id);
      if (i >= 0) {
        if (state.beat !== b) return state.beat > b ? 1 : 0;
        return Math.min(1, Math.max(0, (state.beatP ?? 0) * cues.length - i));
      }
    }
    throw new Error(`Unknown ${scene.id} cue ${id}`);
  };
}

// Each segment is a simultaneous allocation in the same pool, in decimal GB.
export function memoryRail(ctx, api, { x, y, width, height, maximum, segments }) {
  api.rect(ctx, x, y, width, height, api.C.panel, api.C.muted, 2);
  let left = x;
  for (const { gb, color } of segments) {
    const size = (width * gb) / maximum;
    if (size > 0) api.rect(ctx, left, y, size, height, color, undefined, 2);
    left += size;
  }
  return left;
}
