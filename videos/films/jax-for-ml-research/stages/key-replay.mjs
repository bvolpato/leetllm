import { JAX_KEY_FIXTURE } from '../fixtures.mjs';
import {
  drawArrow,
  drawBox,
  drawEquation,
  drawMatrix,
  drawText,
  footer,
  mark,
} from '../defaults.mjs';
export function drawKeyReplay(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (id) => (state.cues?.[id] ? api.focus.progress(id, 0) : 0),
    resultComplete = (id) => cueProgress(id) === 1;
  const paint = () => {
    const hex = (ws) => ws.map((v) => v.toString(16).padStart(8, '0'));
    drawText(
      ctx,
      api,
      currentBeat === 2 ? 'Seed 7 produced False, False' : 'Seed 7 · Threefry · CPU',
      960,
      275,
      32,
      themeColors.yellow,
    );
    if (currentBeat === 0) {
      drawBox(ctx, api, 'scalar dtype: key<fry>', 160, 420, 650, 100, themeColors.pink);
      drawArrow(ctx, api, 840, 470, 1050, 470);
      drawMatrix(ctx, api, hex(JAX_KEY_FIXTURE.root), 1120, 420, {
        cw: 270,
        ch: 100,
        color: themeColors.pink,
        label: 'two wrapped uint32 words',
      });
      drawText(
        ctx,
        api,
        'Keep implementation tag with raw checkpoint key data',
        960,
        800,
        34,
        themeColors.yellow,
      );
      drawBox(
        ctx,
        api,
        'legacy key data: implementation not encoded',
        370,
        880,
        1180,
        85,
        themeColors.muted,
      );
    } else if (currentBeat === 1) {
      for (const [i, key] of ['next', 'A', 'B'].entries())
        drawMatrix(ctx, api, hex(JAX_KEY_FIXTURE[key]), 220 + i * 560, 350, {
          cw: 230,
          ch: 80,
          color: i === 0 ? themeColors.yellow : themeColors.pink,
          label: key === 'next' ? 'Retain next key' : 'One-use key ' + key,
        });
      const known = resultComplete('key-repeat');
      if (cueProgress('key-sequences') === 0) {
        drawMatrix(
          ctx,
          api,
          JAX_KEY_FIXTURE.sampleA.map((v) => Number(v.toFixed(3))),
          300,
          590,
          {
            cw: 170,
            ch: 85,
            color: themeColors.cyan,
            label: 'normal(A, [4])',
          },
        );
        drawMatrix(
          ctx,
          api,
          JAX_KEY_FIXTURE.sampleA.map((v) => Number(v.toFixed(3))),
          1030,
          590,
          {
            cw: 170,
            ch: 85,
            color: themeColors.cyan,
            known,
            label: 'deliberate replay A',
          },
        );
        drawMatrix(
          ctx,
          api,
          JAX_KEY_FIXTURE.sampleB.map((v) => Number(v.toFixed(3))),
          650,
          820,
          {
            cw: 170,
            ch: 85,
            color: themeColors.green,
            label: 'normal(B, [4])',
          },
        );
      } else {
        drawText(
          ctx,
          api,
          'Separate derivation comparison · same starting parent',
          960,
          540,
          30,
          themeColors.yellow,
        );
        drawMatrix(ctx, api, JAX_KEY_FIXTURE.scalarSequence, 290, 670, {
          cw: 180,
          ch: 85,
          color: themeColors.blue,
          label: 'three split scalar draws',
        });
        drawMatrix(ctx, api, JAX_KEY_FIXTURE.vectorSequence, 1100, 670, {
          cw: 180,
          ch: 85,
          color: themeColors.green,
          label: 'one parent vector draw',
        });
        drawText(
          ctx,
          api,
          'Splitting and batching specify different random operations',
          960,
          900,
          31,
          themeColors.yellow,
        );
      }
    } else {
      const outcomes = [
        [false, false],
        [false, true],
        [true, false],
        [true, true],
      ];
      const p = 0.5;
      const select = cueProgress('key-equal') > 0;
      drawText(ctx, api, 'Two independent draws with p = ½', 960, 393, 39, themeColors.ink);
      outcomes.forEach(([a, b], i) => {
        const x = 360 + 400 * i;
        const equal = a === b;
        const color = select && equal ? themeColors.cyan : themeColors.muted;
        drawText(ctx, api, a ? 'True' : 'False', x, 540, 48, color);
        drawText(ctx, api, b ? 'True' : 'False', x, 645, 48, color);
        api.line(ctx, x - 100, 683, x + 100, 683, color, 4);
        const chance = (a ? p : 1 - p) * (b ? p : 1 - p);
        drawText(ctx, api, Math.round(chance * 100) + '%', x, 763, 34, color);
      });
      api.text(ctx, 'Bit 1', 110, 540, 32, themeColors.ink, 'left');
      api.text(ctx, 'Bit 2', 110, 645, 32, themeColors.ink, 'left');
      if (resultComplete('key-agreement'))
        drawEquation(ctx, api, 'P(\\mathrm{equal})=p^2+(1-p)^2=0.5', 960, 920, 45);
    }
    footer(
      ctx,
      api,
      'Reproducing a sampler requires its derivation, operation, shapes, implementation and version',
    );
  };
  mark(ctx, api, 'jx-key-replay-mechanism', paint);
}
export default {
  id: 'key-replay',
  draw: drawKeyReplay,
  cues: [
    'jx-key-replay-b0',
    'key-words',
    'jx-key-replay-b1',
    'key-repeat',
    'key-sequences',
    'jx-key-replay-b2',
    'key-equal',
    'key-agreement',
  ],
};
