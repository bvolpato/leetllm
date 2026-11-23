import { EXAMPLE } from '../fixtures.mjs';
import { forward } from '../model.mjs';
import { point } from '../geometry.mjs';
import { text, rect, line, arrow, matrix } from '../defaults.mjs';
export function drawExportContract(ctx, scene, state, api) {
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
    api.focus.target('export-contract-mechanism', () => {
      const save = earned('export-save', 0, 0.05, 0.2),
        merge = api.focus.progress('export-mutate', stage(0, 0.2, 0.6));
      const merged = forward(2);
      text(
        ctx,
        api,
        'PRESERVE CLEAN BASE + SEPARATE ADAPTER BEFORE MUTATION',
        190,
        285,
        29,
        themeColors.muted,
      );
      if (beat < 2) {
        const values = EXAMPLE.W.map((row, i) =>
          row.map((v, j) => api.lerp(v, merged.merged[i][j], merge)),
        );
        text(ctx, api, 'wrapped base → returned dense model', 190, 370, 31, themeColors.blue);
        matrix(
          ctx,
          api,
          values,
          300,
          445,
          120,
          merge >= 0.999 ? themeColors.green : themeColors.blue,
        );
        if (save) {
          rect(ctx, api, 860, 400, 350, 180, themeColors.panel, themeColors.yellow);
          text(ctx, api, 'saved adapter', 1035, 465, 32, themeColors.yellow, 'center');
          text(ctx, api, 'A + B + config', 1035, 530, 28, themeColors.yellow, 'center', 'mono');
          text(ctx, api, 'clean W₀ revision retained', 1320, 470, 30, themeColors.blue);
        }
        text(
          ctx,
          api,
          'dense = wrapped.merge_and_unload()',
          190,
          740,
          35,
          themeColors.ink,
          'left',
          'mono',
        );
        if (merge >= 0.999)
          text(
            ctx,
            api,
            'Use the return value; wrapped adapter machinery is removed.',
            190,
            825,
            31,
            themeColors.green,
          );
        if (beat === 1 && earned('export-output', 1, 0.15, 0.5)) {
          text(
            ctx,
            api,
            '[[2, 1], [5, 2]] × [2, 1] = [5, 12]',
            190,
            930,
            38,
            themeColors.green,
            'left',
            'mono',
          );
          text(
            ctx,
            api,
            'eval mode · dropout off · justified floating-point tolerance',
            190,
            1005,
            28,
            themeColors.muted,
          );
        }
      } else {
        const evaluate = api.focus.progress('export-reevaluate', stage(2, 0.2, 0.65));
        const names = ['training base', 'BF16 merged export', 're-quantized export'];
        for (let i = 0; i < 3; i++) {
          const x = 190 + i * 550;
          rect(
            ctx,
            api,
            x,
            435,
            430,
            190,
            themeColors.panel,
            i === 0 ? themeColors.blue : themeColors.yellow,
          );
          text(
            ctx,
            api,
            names[i],
            x + 215,
            500,
            30,
            i === 0 ? themeColors.blue : themeColors.yellow,
            'center',
          );
          text(
            ctx,
            api,
            i === 0 ? 'original numerical weights' : 'different numerical artifact',
            x + 215,
            565,
            25,
            themeColors.muted,
            'center',
          );
          if (i < 2)
            arrow(ctx, api, point(x + 450, 530), point(x + 525, 530), themeColors.muted, 3);
          if (i > 0 && evaluate >= i / 2) {
            text(ctx, api, 'new evaluation required', x + 215, 735, 29, themeColors.pink, 'center');
            line(ctx, api, point(x + 80, 780), point(x + 350, 780), themeColors.pink, 4);
          }
        }
        text(
          ctx,
          api,
          'Resume from the training checkpoint. Keep each export with its source base.',
          190,
          955,
          31,
          themeColors.muted,
        );
      }
    });
  }
  ctx.restore();
}
export default {
  id: 'export-contract',
  draw: drawExportContract,
  cues: [
    'export-contract-1',
    'export-save',
    'export-mutate',
    'export-contract-2',
    'export-output',
    'export-contract-3',
    'export-reevaluate',
  ],
};
