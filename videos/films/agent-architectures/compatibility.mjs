import { AA_ORIGINAL } from './fixtures.mjs';
import { drawFocusTarget } from './defaults.mjs';
export function drawUnknownAgentScene(ctx, scene, state, api) {
  const { C } = api,
    b = state.beat ?? 0,
    P = (id) => (state.cues?.[id] ? api.focus.progress(id, 0) : 0),
    done = (id) => P(id) === 1,
    U = AA_ORIGINAL.has(scene.id) ? (state.beatP ?? 0) : P('aa-' + scene.id + '-' + b),
    count = (u, n) => Math.min(n, Math.floor(u * n + 1e-8)),
    mix = (a, z, u) => a + (z - a) * u;
  const paint = () => {
    throw new Error('Missing agent construction ' + scene.id);
  };
  drawFocusTarget(ctx, api, 'aa-' + scene.id + '-mechanism', paint);
}
