import { standardizedFixture } from '../model.mjs';
import { box, code, datum, focusProgress, footer, label } from '../defaults.mjs';
export function drawStandardizeUncertainty(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = (id) => focusProgress(ctx, api, 'cau-' + id),
    done = (id) => q(id) >= 1;
  const pc = (v, d = 1) => Number((100 * v).toFixed(d)) + '%',
    points = (v, d = 1) => Number((100 * v).toFixed(d)) + ' points',
    num = (v, d = 3) => Number(v.toFixed(d));
  api.focus.target('cau-standardize-uncertainty-mechanism', () => {
    const changed = done('cell-change') && !done('counts-restore'),
      f = standardizedFixture(changed ? 8 : 9);
    box(
      ctx,
      api,
      changed ? 'Separate one-outcome sensitivity' : 'Original low-risk assistant cell',
      [`${changed ? 8 : 9} successes / 10 tickets`, 'same 70% target share'],
      180,
      310,
      720,
      180,
      themeColors.cyan,
    );
    Array.from(
      {
        length: 10,
      },
      (_, i) =>
        api.rect(
          ctx,
          220 + i * 60,
          575,
          44,
          65,
          i < (changed ? 8 : 9) ? themeColors.green : themeColors.red,
          undefined,
          5,
        ),
    );
    box(
      ctx,
      api,
      'Same target-standardized comparison',
      [`assistant ${pc(f.assistant)} / control ${pc(f.control)}`],
      1040,
      310,
      700,
      180,
      themeColors.yellow,
    );
    datum(
      ctx,
      api,
      points(f.difference) + ' difference',
      1390,
      615,
      currentBeat > 0 || done('sensitivity-three'),
      themeColors.yellow,
      39,
    );
    if (currentBeat >= 1) {
      const original = standardizedFixture(),
        max = Math.max(...original.varianceParts);
      label(ctx, api, 'Independent-cell variance contributions', 960, 745, themeColors.ink, 29);
      original.varianceParts.forEach((v, i) => {
        api.rect(
          ctx,
          260 + i * 390,
          790,
          280,
          (90 * v) / max,
          themeColors.panel,
          [themeColors.cyan, themeColors.pink, themeColors.cyan, themeColors.pink][i],
          6,
        );
        code(ctx, api, num(v, 6), 400 + i * 390, 930, 27, themeColors.muted, 'center');
      });
    }
    if (done('se-result'))
      label(
        ctx,
        api,
        'SE = ' + points(standardizedFixture().se, 2),
        960,
        675,
        themeColors.green,
        34,
      );
    if (done('interval-result'))
      label(ctx, api, 'Rough 95% interval: −7.2 to 27.2 points', 960, 285, themeColors.yellow, 32);
    footer(
      ctx,
      api,
      'Fixed weights and independent conditional binomial cells; the normal approximation can be poor.',
    );
  });
}
export default {
  id: 'standardize-uncertainty',
  draw: drawStandardizeUncertainty,
  cues: [
    'cau-standardize-uncertainty-0',
    'cau-cell-change',
    'cau-sensitivity-three',
    'cau-standardize-uncertainty-1',
    'cau-counts-restore',
    'cau-standardize-uncertainty-2',
    'cau-se-result',
    'cau-interval-result',
  ],
};
