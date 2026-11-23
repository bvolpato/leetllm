export const cueProgress = (state, id) => state.cues?.[`gov-${id}`]?.progress ?? 0;
export function governancePermission(state, id) {
  const cue = state.cues?.[`gov-${id}`];
  return cue?.phase === undefined ? cue?.progress === 1 : cue.phase === 'after';
}
