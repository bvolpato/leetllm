import { weightWorksheet } from '../arithmetic.mjs';
import { heard, movement } from '../construction.mjs';

const proposals = 5;
const inputs = ['Pending token', 'Draft 1', 'Draft 2', 'Draft 3', 'Draft 4', 'Draft 5'];
const draftGB = 2;
const oneReadMs = draftGB / 3.35;

export function drawWeightReuse(ctx, scene, state, api) {
  const { C } = api;
  const text = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  const count = 1 + Math.floor(proposals * movement(state, 0, 'sd-reuse-six', 0.18, 0.34));
  const f = weightWorksheet(count);
  const draft = movement(state, 1, 'sd-weight-reuse-b1', 0.14, 0.32);
  const remaining = movement(state, 1, 'sd-draft-cost', 0.46, 0.63);
  const reads = draft > 0 ? 1 + Math.floor((proposals - 1) * remaining) : 0;

  api.focus.target('sd-weight-reuse-mechanism', () => {
    api.rect(ctx, 180, 243, 1560, 103, C.panel, C.blue, 8);
    text('Target weights', 215, 313, 46, C.ink);
    text((f.bytes / 1e9) + ' GB read once', 1704, 313, 49, C.blue, 'right');
    for (let i = 0; i < count; i++) {
      const x = 310 + 260 * i;
      api.arrow(ctx, x, 365, x, 418, C.cyan, 4);
      text(inputs[i], x, 490, 36, C.cyan, 'center');
    }
    text((f.flops / 1e9) + ' GFLOPs', 180, 637, 56, C.ink);
    text('÷', 525, 637, 53, C.muted);
    text((f.bytes / 1e9) + ' GB', 632, 637, 56, C.blue);
    text('=', 905, 637, 53, C.muted);
    text(f.intensity + (count === 1 ? ' FLOP/byte' : ' FLOPs/byte'), 1010, 637, 56, C.cyan);
    if (heard(state, 0, 'sd-reuse-compute', 0.82))
      text('Transfer floor ≈ ' + f.memoryMs.toFixed(2) + ' ms     ·     Compute floor ≈ ' +
        f.computeMs.toFixed(3) + ' ms', 180, 735, 37, C.muted);
    if (reads > 0) {
      text('Sequential draft reads', 180, 850, 37, C.pink);
      for (let i = 0; i < reads; i++) {
        const x = 180 + 300 * i;
        api.rect(ctx, x, 889, 176, 71, C.panel, C.pink, 6);
        text(draftGB + ' GB', x + 88, 940, 38, C.pink, 'center');
        if (i > 0) api.arrow(ctx, x - 100, 925, x - 20, 925, C.pink, 3);
      }
      if (remaining >= 1)
        text('Transfer floor ≈ ' + (proposals * oneReadMs).toFixed(2) + ' ms',
          1735, 850, 38, C.yellow, 'right');
    }
  });
}

export default {
  id: 'weight-reuse', draw: drawWeightReuse,
  cues: ['sd-weight-reuse-b0', 'sd-reuse-six', 'sd-reuse-compute', 'sd-weight-reuse-b1', 'sd-draft-cost'],
};
