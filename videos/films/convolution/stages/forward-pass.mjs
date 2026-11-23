import { cropForward } from '../model.mjs';
import { cueClock, footprint } from '../footprint.mjs';
import { formatChapterValue as fmt, text, valueGrid } from '../defaults.mjs';

const crop = cropForward();
export function drawForwardPass(ctx, scene, state, api) {
  const cue = cueClock(scene, state, api);
  const { C } = api;
  const relu = cue('crop-relu') === 1;
  const pool = cue('crop-pool') === 1;
  const head = cue('head-weights');
  const winner = crop.pool.owners[0].input;
  api.focus.target('forward-image', () => {
    text(ctx, api, 'Panel crop', 355, 282, 39, C.ink, 'center');
    valueGrid(ctx, api, crop.image, 118, 335, 119, { kind: 'image', font: 35 });
    if (pool) footprint(ctx, api, 118, 335, 119, ...winner, 3, 3, C.green);
    if (cue('forward-pass-b3') > 0) text(ctx, api, '1 × 1 × 4 × 4', 355, 935, 38, C.blue, 'center');
  });
  api.focus.target('forward-map', () => {
    text(ctx, api, relu ? 'After ReLU' : 'Ridge responses', 914, 282, 39, C.ink, 'center');
    valueGrid(ctx, api, relu ? crop.activated : crop.raw, 746, 390, 170, { font: 46 });
    if (pool) {
      footprint(ctx, api, 746, 390, 170, ...winner, 1, 1, C.green);
      text(ctx, api, 'Saved (' + winner.join(', ') + ')', 914, 815, 36, C.green, 'center');
    }
    if (cue('forward-map-shape') > 0)
      text(ctx, api, '1 × 1 × 2 × 2', 914, 935, 38, C.blue, 'center');
  });
  api.focus.target('forward-head', () => {
    text(ctx, api, 'Two-class head', 1495, 282, 39, C.ink, 'center');
    const amounts = [cue('head-first'), cue('head-logits')];
    for (const [i, endpoint] of amounts.entries()) {
      const y = 400 + i * 225;
      const color = i === 0 ? C.green : C.pink;
      text(ctx, api, i === 0 ? 'First score' : 'Second score', 1230, y, 32, color);
      const expression =
        i === 0 ? '1.4 × ' + fmt(crop.value) + ' − 0.2' : '−0.9 × ' + fmt(crop.value) + ' + 0.1';
      text(ctx, api, head === 1 ? expression : 'Pooled value  ?', 1230, y + 77, 41, C.ink);
      text(ctx, api, endpoint === 1 ? '= ' + fmt(crop.logits[i], 4) : '', 1230, y + 150, 49, color);
    }
    if (state.beat === 2 && cue('forward-pass-b2') === 1)
      text(ctx, api, 'NumPy and PyTorch agree within 0.000001', 1464, 963, 31, C.cyan, 'center');
    if (cue('forward-shapes') > 0) {
      text(ctx, api, 'Pool  1 × 1 × 1 × 1', 1490, 912, 32, C.blue, 'center');
      text(ctx, api, 'Flatten  1 × 1      Head  1 × 2', 1490, 984, 32, C.blue, 'center');
    }
  });
}
export default {
  id: 'forward-pass',
  draw: drawForwardPass,
  cues: [
    'forward-pass-b1',
    'crop-relu',
    'crop-pool',
    'head-weights',
    'head-first',
    'head-logits',
    'forward-pass-b2',
    'forward-pass-b3',
    'forward-map-shape',
    'forward-shapes',
  ],
};
