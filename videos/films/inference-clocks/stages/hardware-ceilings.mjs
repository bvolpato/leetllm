import { passage, spoken } from '../trace.mjs';

const sparse = 1979;
const dense = sparse / 2;
const bandwidth = 3350;
const weightGB = 54;
const reads = Math.floor(bandwidth / weightGB);

export function drawHardwareCeilings(ctx, scene, state, api) {
  const { C } = api;
  const left = 240;
  const width = 1440;
  api.focus.target('hardware-ceilings-mechanism', () => {
    if (state.beat === 0) {
      api.text(ctx, 'H100 SXM  ·  BF16 peak arithmetic rate', left, 290, 41, C.ink);
      api.text(
        ctx,
        'Structured sparsity   ' + sparse.toLocaleString('en-US') + ' TFLOP/s',
        left,
        414,
        40,
        C.muted,
      );
      api.rect(ctx, left, 450, width, 65, C.muted);
      const p = passage(state, 0, 'hardware-ceilings-b1', 0.25, 0.48);
      if (p > 0) api.rect(ctx, left, 626, (width / 2) * p, 65, C.blue);
      if (p === 1) {
        api.text(ctx, 'Dense   ' + dense + ' TFLOP/s', left, 596, 40, C.blue);
        const tbPerSecond = bandwidth / 1000;
        api.text(
          ctx,
          'Ridge   ' +
            dense +
            ' TFLOP/s  ÷  ' +
            tbPerSecond +
            ' TB/s  ≈  ' +
            (dense / tbPerSecond).toFixed(1) +
            ' FLOPs/byte',
          960,
          867,
          48,
          C.yellow,
          'center',
        );
      }
    } else if (state.beat === 1) {
      const p = passage(state, 1, 'weight-read-count', 0.5, 0.62);
      const shown = passage(state, 1, 'hardware-ceilings-b2', 0.2, 0.41) > 0;
      api.text(ctx, 'One second at peak bandwidth', left, 319, 53, C.ink);
      api.text(
        ctx,
        bandwidth.toLocaleString('en-US') + ' GB',
        left + width,
        480,
        48,
        C.cyan,
        'right',
      );
      api.rect(ctx, left, 520, width, 112, C.panel, C.muted, 4);
      if (shown) {
        const count = 1 + Math.floor((reads - 1) * p);
        const unit = (width * weightGB) / bandwidth;
        for (let i = 0; i < count; i++)
          api.rect(ctx, left + i * unit + 1, 522, unit - 2, 108, C.blue, undefined, 2);
        api.text(
          ctx,
          'One block = ' + weightGB + ' GB of weights per token',
          left,
          713,
          39,
          C.blue,
        );
      }
      if (p === 1)
        api.text(
          ctx,
          reads + ' full weight reads in one second',
          960,
          887,
          57,
          C.yellow,
          'center',
        );
    } else {
      const p = passage(state, 2, 'hardware-ceilings-b3', 0.4, 0.67);
      api.text(
        ctx,
        'Full attention  ·  keys and values read for one new token',
        left,
        310,
        42,
        C.ink,
      );
      [4, 4 + Math.round(28 * p)].forEach((count, i) => {
        const y = 478 + i * 210;
        const color = i ? C.pink : C.blue;
        api.text(
          ctx,
          (count * 1000).toLocaleString('en-US') + ' cached positions',
          left,
          y - 30,
          39,
          color,
        );
        for (let j = 0; j < count; j++)
          api.rect(ctx, left + j * 45, y, 38, 85, color, undefined, 4);
      });
      if (spoken(state, 2, 'hardware-ceilings-b3', 0.67))
        api.text(ctx, '8× as much KV data per step', 960, 939, 51, C.yellow, 'center');
    }
  });
}

export default {
  id: 'hardware-ceilings',
  draw: drawHardwareCeilings,
  cues: [
    'hardware-ceilings-b1',
    'hardware-ceilings-b2',
    'weight-read-count',
    'hardware-ceilings-b3',
  ],
};
