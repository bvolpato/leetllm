import { cueProgress, focusOn, line, text } from '../defaults.mjs';
import { fixedSampleLosses } from '../fixtures.mjs';

export function drawPopulationRisk(ctx, scene, state, api) {
  const { C } = api;
  const toy = state.beat > 0;
  focusOn(api, 'sample-losses', () => {
    text(ctx, api, 'P7 on the 40 scored tickets', 540, 320, 44, C.ink, 'center');
    for (let j = 0; j < 40; j++) {
      const x = 210 + (j % 10) * 74;
      const y = 412 + Math.floor(j / 10) * 85;
      const miss = fixedSampleLosses[j] === 1;
      const color = miss ? C.pink : C.blue;
      api.rect(ctx, x, y, 54, 57, C.panel, color, 7);
      text(ctx, api, miss ? '1' : '0', x + 27, y + 39, 36, color, 'center');
    }
    text(ctx, api, '4 / 40 = 10%', 550, 850, 60, C.yellow, 'center');
    text(ctx, api, 'Observed mean loss', 550, 920, 33, C.muted, 'center');
  });
  focusOn(api, 'target-tickets', () => {
    text(
      ctx,
      api,
      toy ? 'Toy population' : 'Next ticket from the queue',
      1390,
      320,
      44,
      C.ink,
      'center',
    );
    if (!toy) {
      api.rect(ctx, 1250, 453, 280, 194, C.panel, C.muted, 12);
      text(ctx, api, '?', 1390, 587, 96, C.muted, 'center');
      return;
    }
    const visible = Math.ceil(100 * cueProgress(state, 'toy-types'));
    for (let i = 0; i < 100; i++) {
      const x = 1150 + (i % 10) * 49;
      const y = 392 + Math.floor(i / 10) * 38;
      const color = i >= visible ? C.panel : i % 5 === 0 ? C.pink : C.blue;
      api.rect(ctx, x, y, 35, 25, color, undefined, 3);
    }
    if (visible === 100) {
      text(ctx, api, '20 / 100 = 20%', 1390, 850, 60, C.cyan, 'center');
      text(ctx, api, 'Expected loss over equally likely types', 1390, 920, 33, C.muted, 'center');
    }
  });
  if (state.beat >= 2) {
    line(ctx, api, 785, 989, 1115, 989, C.muted, 3);
    text(ctx, api, 'Toy gap', 750, 1001, 31, C.muted, 'right');
    text(ctx, api, '20% − 10% = 10 percentage points', 1150, 1001, 31, C.ink);
  }
}
export default {
  id: 'population-risk',
  draw: drawPopulationRisk,
  cues: ['score-losses', 'toy-types', 'toy-gap'],
};
