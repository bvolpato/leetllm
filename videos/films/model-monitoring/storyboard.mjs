export function monitoringScene(id, keys, paint) {
  const cueId = (key) => `m-${id}-${key}`;
  return {
    id,
    cues: keys.map(cueId),
    draw(ctx, scene, state, api) {
      const cue = (key) => state.cues?.[cueId(key)];
      const clock = {
        started: (key) => ['during', 'after'].includes(cue(key)?.phase),
        done: (key) => cue(key)?.phase === 'after',
        progress: (key) => cue(key)?.progress ?? 0,
      };
      const draw = () => paint(ctx, api, clock, state);
      return api.focus?.target ? api.focus.target(`${id}-mechanism`, draw) : draw();
    },
  };
}
