import { coreScenes } from './fixtures.mjs';
export function drawUnrecognizedScene(ctx, scene, state, api) {
  coreScenes.has(scene.id);
  const { C, components: c, teaching: t, phase } = api,
    beat = state.beat ?? 0,
    p = state.beatP ?? 0,
    q = phase(p, 0.05, 0.88);
  const route = (a, b, color = C.cyan, progress = q) => {
    const r = api.connect(ctx, a, b, {
      color,
      gap: 40,
      width: 3,
    });
    c.particle({
      points: [r.from, r.to],
      progress,
      fill: color,
      radius: 8,
    });
  };
  throw new Error(`Unknown reranking scene: ${scene.id}`);
}
