import { rectangularExample } from '../model.mjs';
import { resultAfter } from '../construction.mjs';
import { point } from '../geometry.mjs';
import { text, rect, arrow, matrix } from '../defaults.mjs';
export function drawRectangularContract(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, start = 0.06, end = 0.88) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(progress, start, end);
  const earned = (id, index, start = 0.1, end = 0.8) =>
    beat > index ||
    (beat === index && api.focus.progress(id, api.phase(progress, start, end)) >= 0.999);
  ctx.save();
  {
    api.focus.target('rectangular-contract-mechanism', () => {
      if (beat < 3) {
        const change = api.focus.progress('rectangular-change', stage(1, 0.45, 0.7));
        const f = rectangularExample(change);
        const baseReady = resultAfter(state, 'rectangular-base', 1, 0.23);
        const middleReady = resultAfter(state, 'rectangular-middle', 2, 0.3);
        const outputReady = resultAfter(state, 'rectangular-output', 2, 0.68);
        text(ctx, api, 'Input   x = [1, −0.5, 0.25, 2]', 190, 285, 29, themeColors.cyan);
        text(ctx, api, 'W₀ : 3 × 4', 190, 355, 31, themeColors.blue);
        matrix(ctx, api, f.W, 190, 400, 83, themeColors.blue);
        text(ctx, api, 'A : 2 × 4', 740, 355, 31, themeColors.yellow);
        matrix(ctx, api, f.A, 740, 400, 83, themeColors.yellow);
        text(ctx, api, 'B : 3 × 2', 1300, 355, 31, themeColors.cyan);
        matrix(ctx, api, f.B, 1300, 400, 83, themeColors.cyan);
        if (beat === 1 && change > 0) {
          for (const [row, column] of [
            [0, 0],
            [2, 1],
          ]) {
            rect(
              ctx,
              api,
              1303 + column * 83,
              403 + row * 83,
              77,
              77,
              '#00000000',
              themeColors.cyan,
              5,
            );
          }
        }
        if (beat === 0) {
          arrow(ctx, api, point(740, 720), point(1100, 720), themeColors.yellow, 4);
          text(ctx, api, '4 coordinates → 2 → 3', 740, 795, 35, themeColors.yellow, 'left', 'mono');
          text(
            ctx,
            api,
            'B returns three coordinates, one for each output of the base.',
            190,
            940,
            32,
            themeColors.muted,
          );
        } else {
          if (middleReady) {
            rect(ctx, api, 1303, 486, 160, 77, '#00000000', themeColors.yellow, 5);
          }
          text(ctx, api, 'Frozen output', 190, 824, 35, themeColors.blue);
          text(ctx, api, 'With adapter', 190, 925, 35, themeColors.green);
          for (const [i, value] of f.output.entries()) {
            const x = 720 + 375 * i;
            text(ctx, api, 'Output ' + (i + 1), x, 735, 31, themeColors.muted, 'center');
            text(
              ctx,
              api,
              baseReady ? String(f.base[i]) : '?',
              x,
              824,
              45,
              themeColors.blue,
              'center',
              'mono',
            );
            const visible = i === 1 ? middleReady : outputReady;
            const label = visible ? String(Number(value.toFixed(4))) : '?';
            text(
              ctx,
              api,
              label,
              x,
              925,
              45,
              visible ? themeColors.green : themeColors.muted,
              'center',
              'mono',
            );
          }
          if (beat === 1 && change > 0)
            text(ctx, api, 'Which output will stay put?', 190, 1010, 35, themeColors.ink);
        }
      } else {
        const adapterReady = earned('rectangular-flops-adapter', 3, 0.15, 0.4),
          baseReady = earned('rectangular-flops-base', 3, 0.4, 0.6);
        const ratioReady = earned('rectangular-flops-ratio', 3, 0.6, 0.8);
        const base = 2 * 4096 ** 2,
          adapter = 4 * 4096 * 16;
        text(
          ctx,
          api,
          'ONE 4096 × 4096 PROJECTION · r = 16 · multiply-add = 2 FLOPs',
          190,
          290,
          29,
          themeColors.muted,
        );
        text(ctx, api, 'base matrix-vector product', 190, 420, 34, themeColors.blue);
        rect(ctx, api, 190, 455, 1400, 80, themeColors.panel, themeColors.blue);
        if (baseReady) {
          rect(ctx, api, 190, 455, 1400, 80, themeColors.blue);
          text(
            ctx,
            api,
            `${base.toLocaleString('en-US')} FLOPs`,
            190,
            600,
            38,
            themeColors.blue,
            'left',
            'mono',
          );
        }
        text(ctx, api, 'two thin matrix-vector products', 190, 730, 34, themeColors.yellow);
        rect(ctx, api, 190, 770, 1400, 35, themeColors.panel);
        if (adapterReady) {
          rect(ctx, api, 190, 770, (1400 * adapter) / base, 35, themeColors.yellow, undefined, 2);
          text(
            ctx,
            api,
            `${adapter.toLocaleString('en-US')} FLOPs`,
            190,
            870,
            38,
            themeColors.yellow,
            'left',
            'mono',
          );
        }
        if (ratioReady)
          text(
            ctx,
            api,
            'Two thin products add 0.78125% to the base projection’s FLOP count.',
            190,
            975,
            36,
            themeColors.ink,
          );
      }
    });
  }
  ctx.restore();
}
export default {
  id: 'rectangular-contract',
  draw: drawRectangularContract,
  cues: [
    'rectangular-contract-1',
    'rectangular-contract-2',
    'rectangular-base',
    'rectangular-change',
    'rectangular-middle',
    'rectangular-output',
    'rectangular-contract-3',
    'rectangular-flops-adapter',
    'rectangular-flops-base',
    'rectangular-flops-ratio',
  ],
};
