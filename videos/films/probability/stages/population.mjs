import { cueProgress } from '../construction.mjs';
import { focus, rectangle, text } from '../defaults.mjs';

export function drawPopulation(ctx, scene, state, api) {
  const { C } = api;
  const cleanTiles = Math.floor(99 * cueProgress(state, 'population-build', 0));
  const prior = cueProgress(state, 'population-prior', 1);
  focus(api, 'population-grid', () => {
    for (let i = 0; i < 100; i++) {
      const x = 180 + (i % 10) * 78;
      const y = 280 + Math.floor(i / 10) * 62;
      rectangle(ctx, api, x, y, 65, 48, i === 0 ? C.red : i <= cleanTiles ? C.blue : C.panel);
    }
    text(ctx, api, '100 signups per tile', 560, 970, 39, C.muted);
  });
  focus(api, 'population-fraction', () => {
    text(ctx, api, 'All labeled signups', 1340, 380, 52);
    text(ctx, api, '100 abusive', 1340, 505, 46, C.red);
    if (cleanTiles === 99) text(ctx, api, '9,900 clean', 1340, 585, 46, C.blue);
    text(ctx, api, prior === 1 ? '100 / 10,000 = 1%' : 'P(abuse) = ?', 1340, 755, 54, C.yellow);
    if (prior === 1) text(ctx, api, 'Before seeing a flag', 1340, 835, 36, C.muted);
  });
}
export default { id: 'population', draw: drawPopulation, cues: ['population-build', 'population-prior'] };
