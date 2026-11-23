import { monotoneCompliance } from '../model.mjs';
import { code, datum, detailText, focusProgress, footer, label } from '../defaults.mjs';
export function drawWaldLate(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = (id) => focusProgress(ctx, api, 'cau-' + id),
    done = (id) => q(id) >= 1;
  const pc = (v, d = 1) => Number((100 * v).toFixed(d)) + '%';
  api.focus.target('cau-wald-late-mechanism', () => {
    const ready = done('wald-inputs'),
      rat = done('wald-ratio'),
      groups = done('compliance-groups');
    if (groups) {
      const types = monotoneCompliance(),
        people = Object.entries(types).flatMap(([type, p]) =>
          Array.from(
            {
              length: Math.round(100 * p),
            },
            () => type,
          ),
        );
      label(
        ctx,
        api,
        'Hypothetical types under monotonicity · same 100 positions',
        960,
        280,
        themeColors.yellow,
        31,
      );
      for (const flag of [0, 1]) {
        const x = 220 + flag * 900;
        label(
          ctx,
          api,
          flag ? 'With encouragement Z=1' : 'Without encouragement Z=0',
          x + 250,
          355,
          themeColors.ink,
          31,
        );
        people.forEach((type, i) => {
          const assistant = type === 'always' || (flag === 1 && type === 'compliers');
          api.rect(
            ctx,
            x + (i % 20) * 26,
            405 + Math.floor(i / 20) * 38,
            20,
            28,
            assistant ? themeColors.cyan : themeColors.pink,
            undefined,
            3,
          );
        });
      }
      label(ctx, api, 'Cyan: assistant · pink: control', 960, 660, themeColors.muted, 28);
      let x = 420;
      for (const [type, color] of [
        ['always', themeColors.blue],
        ['compliers', themeColors.green],
        ['never', themeColors.muted],
      ]) {
        const w = types[type] * 1080;
        api.rect(ctx, x, 725, w, 40, color, undefined, 4);
        label(ctx, api, type + ' ' + pc(types[type], 0), x + w / 2, 820, color, 28);
        x += w;
      }
    } else {
      const rows = [
        ['workflow uptake', 0.3, 0.7, themeColors.cyan],
        ['resolution', 0.68, 0.72, themeColors.pink],
      ];
      rows.forEach(([name, a, z, color], i) => {
        const yy = 350 + i * 200;
        detailText(ctx, api, name, 200, yy + 45, 31, color);
        api.rect(ctx, 650, yy, a * 950, 60, themeColors.panel, color, 7);
        api.rect(ctx, 650, yy + 85, (ready ? z : a) * 950, 60, color, undefined, 7);
        code(
          ctx,
          api,
          pc(a, 0) + ' → ' + (ready ? pc(z, 0) : '?'),
          1660,
          yy + 70,
          30,
          color,
          'right',
        );
      });
    }
    datum(ctx, api, '0.04 / 0.40 = 0.10', 960, 865, rat, themeColors.yellow, 41);
    if (groups)
      label(
        ctx,
        api,
        'Always 30% · compliers 40% · never 30% · defiers 0%',
        960,
        940,
        themeColors.green,
        29,
      );
    footer(
      ctx,
      api,
      'The ratio identifies a complier effect only under the instrument and monotonicity assumptions.',
    );
  });
}
export default {
  id: 'wald-late',
  draw: drawWaldLate,
  cues: [
    'cau-wald-late-0',
    'cau-wald-inputs',
    'cau-wald-ratio',
    'cau-wald-late-1',
    'cau-compliance-groups',
    'cau-wald-late-2',
  ],
};
