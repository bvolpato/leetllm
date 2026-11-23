import { cueAmount, cueDone } from '../defaults.mjs';
import { canonicalAgentAction, periodicWithoutProgress } from '../protocols.mjs';

export function drawCycleAndProgress(ctx, scene, state, api) {
  const { C } = api;
  if (!state.beat) {
    api.focus.target('encoding', () => {
      api.text(ctx, 'Two validated queries', 150, 306, 37, C.muted);
      for (const [i, q] of ['team id', 'teamid'].entries()) {
        const y = 474 + i * 180;
        api.text(ctx, 'Value', 150, y, 34, C.muted);
        api.text(ctx, '“' + q + '”', 365, y, 47, C.ink);
        api.arrow(ctx, 680, y - 16, 875, y - 16, C.blue, 5);
        api.text(ctx, canonicalAgentAction({ q }), 970, y, 48, C.blue, 'left', 'mono');
      }
      if (cueDone(state, 'cycle-space'))
        api.text(ctx, 'The space is part of the value.', 960, 910, 38, C.ink, 'center');
    });
    return;
  }
  const changed = cueDone(state, 'cycle-change');
  const actions = ['A', 'B', 'A', 'B'];
  const markers = [0, 0, 0, 0, changed ? 1 : 0];
  const stuck = periodicWithoutProgress(
    actions.map((tool) => ({ tool })),
    markers,
  );
  api.focus.target('trace', () => {
    api.text(ctx, 'Same actions, same arguments', 145, 303, 36, C.ink);
    api.text(ctx, 'Host-verified cursor', 145, 699, 31, C.muted);
    const x = (i) => 250 + 355 * i;
    for (const [i, marker] of markers.entries()) {
      api.line(ctx, x(i), 558, x(i), 593, C.muted, 3);
      api.text(ctx, 'p' + marker, x(i), 646, 40, marker === 1 ? C.green : C.ink, 'center', 'mono');
      if (i >= actions.length) continue;
      api.line(ctx, x(i), 548, x(i + 1), 548, i % 2 ? C.blue : C.cyan, 6);
      api.text(ctx, actions[i], (x(i) + x(i + 1)) / 2, 489, 50, i % 2 ? C.blue : C.cyan, 'center');
    }
  });
  api.focus.target('verdict', () => {
    const verdictKnown =
      state.beat === 1 ? cueDone(state, 'cycle-flag') : cueDone(state, 'cycle-continue');
    const label = verdictKnown
      ? stuck
        ? 'Repeated A B   /   cursor unchanged   /   stagnation detected'
        : 'Repeated A B   /   cursor advanced   /   continue within budget'
      : state.beat === 2
        ? 'Should the host flag this repeated pair?'
        : 'Read the cursor on both sides of each call.';
    api.text(ctx, label, 960, 933, 38, verdictKnown ? (stuck ? C.pink : C.green) : C.ink, 'center');
  });
}
export default {
  id: 'cycle-and-progress',
  draw: drawCycleAndProgress,
  cues: [
    'cycle-space',
    'cycle-start',
    'cycle-still',
    'cycle-flag',
    'cycle-change',
    'cycle-ask',
    'cycle-continue',
  ],
};
