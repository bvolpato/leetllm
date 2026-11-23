import { coreText } from '../defaults.mjs';
import { heard, movement } from '../spoken.mjs';

export function drawSearchQuality(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  api.focus.target('dec-search-quality-mechanism', () => {
    if (beat === 0) {
      coreText(ctx, api, 'GPT-2 text generation', 185, 420, 49, C.ink, 'left');
      coreText(
        ctx,
        api,
        'High-scoring answers often repeated phrases.',
        185,
        517,
        47,
        C.blue,
        'left',
      );
      if (heard(state, 'dec-search-quality-1', 0, 0.64)) {
        api.arrow(ctx, 225, 575, 225, 735, C.muted, 4);
        coreText(
          ctx,
          api,
          'Some very wide beams chose the end token immediately.',
          185,
          845,
          45,
          C.yellow,
          'left',
        );
      }
      return;
    }
    if (beat === 1) {
      const checks = [
        ['Translation', 'Compare with the source meaning.'],
        ['Code completion', 'Run the tests.'],
        ['Canary update', 'Read the deployment record.'],
      ];
      checks.forEach(([task, check], i) => {
        const y = 380 + i * 195;
        coreText(ctx, api, task, 205, y, 51, C.ink, 'left');
        api.arrow(ctx, 730, y - 17, 895, y - 17, C.muted, 4);
        coreText(ctx, api, check, 955, y, 44, C.cyan, 'left');
      });
      return;
    }

    const expand = movement(state, 'dec-search-quality-3', 2, 0.25, 0.53);
    const count = 1 + Math.floor(7 * expand);
    const complete = heard(state, 'dec-beam-work', 2, 0.53);
    coreText(ctx, api, 'Child scores for one decoding step', 190, 280, 44, C.ink, 'left');
    for (let r = 0; r < count; r++) {
      const y = 342 + r * 67;
      coreText(ctx, api, 'Prefix ' + (r + 1), 195, y + 36, 31, C.muted, 'left');
      for (let c = 0; c < 10; c++)
        api.rect(ctx, 425 + c * 94, y, 82, 39, r ? C.cyan : C.blue, undefined, 3);
      coreText(ctx, api, '50,000', 1505, y + 35, 31, C.ink, 'right');
    }
    if (complete) coreText(ctx, api, '8 × 50,000 = 400,000 child scores', 960, 984, 44, C.yellow);
  });
}

export default {
  id: 'search-quality',
  draw: drawSearchQuality,
  cues: ['dec-search-quality-1', 'dec-search-quality-2', 'dec-search-quality-3', 'dec-beam-work'],
};
