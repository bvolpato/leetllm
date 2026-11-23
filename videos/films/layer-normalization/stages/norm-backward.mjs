import { mean } from '../arithmetic.mjs';
import { backwardTrace } from '../model.mjs';
import { text } from '../defaults.mjs';
import { landed } from '../timing.mjs';
export function drawNormBackward(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    fade = components.fade;
  {
    const trace = backwardTrace(),
      rows = [
        ['upstream × gain', trace.u, themeColors.cyan],
        ['subtract feature mean', trace.centered, themeColors.yellow],
        ['adjust scale component', trace.corrected, themeColors.pink],
        ['divide by forward scale', trace.dx, themeColors.green],
      ];
    text(
      ctx,
      api,
      'Same token [3, 1, −1, 5] · supplied upstream [1, 2, 0, −1]',
      960,
      265,
      31,
      themeColors.muted,
      'center',
    );
    if (currentBeat === 0) {
      const count = state.cues?.['backward-center']
        ? api.focus.visible('backward-divide')
          ? 4
          : api.focus.visible('backward-correct')
            ? 3
            : api.focus.visible('backward-center')
              ? 2
              : 1
        : Math.min(4, 1 + Math.floor(progress * 4.4));
      rows.slice(0, count).forEach(([label, values, color], i) => {
        const y = 375 + i * 160;
        text(ctx, api, label, 155, y + 40, 30, color);
        values.forEach((v, j) => {
          const cx = 760 + j * 255;
          api.focus.target('backward-feature-' + j, () =>
            components.card({
              label: v.toFixed(3),
              x: cx - 100,
              y,
              width: 200,
              height: 88,
              fontSize: 36,
              fill: themeColors.panel,
              stroke: color,
              textColor: color,
            }),
          );
          if (i > 0) api.arrow(ctx, cx, y - 63, cx, y - 12, color, 3);
        });
      });
      text(
        ctx,
        api,
        `mean(u) = ${mean(trace.u).toFixed(3)} · mean(u × x̂) = ${trace.component.toFixed(3)} · scale = ${trace.divisor.toFixed(3)}`,
        960,
        1040,
        29,
        themeColors.muted,
        'center',
      );
    } else {
      const g1 = [1, 2, 0, -1],
        g2 = [0.5, -0.5, 1, 0],
        db = g1.map((v, i) => v + g2[i]),
        dg = db.map((v, i) => v * trace.standardized[i]);
      text(
        ctx,
        api,
        'Each token has its own statistics · shared affine weights sum contributions',
        960,
        340,
        31,
        themeColors.muted,
        'center',
      );
      [
        ['token 1 upstream', g1, themeColors.cyan],
        ['token 2 upstream', g2, themeColors.blue],
        ['shift gradient: sum', db, themeColors.yellow],
        ['gain gradient: sum g × x̂', dg, themeColors.green],
      ].forEach(([label, values, color], i) => {
        const y = 430 + i * 145;
        text(ctx, api, label, 160, y + 32, 30, color);
        const show = i < 2 || (i === 2 ? landed(state, 'shared-shift-sum', 1, 0.32, 0.47) : landed(state, 'shared-gain-sum', 1, 0.72, 0.81));
        values.forEach((v, j) => {
          const xx = 795 + j * 245;
          const paint = () => {
            text(ctx, api, show ? v.toFixed(3) : '?', xx, y + 32, 38, color, 'center');
            if (i === 2) api.line(ctx, xx - 90, y - 25, xx + 90, y - 25, themeColors.muted, 2);
          };
          if (i === 2 && j === 0) api.focus.target('shared-shift', paint);
          else if (i === 3 && j === 0) api.focus.target('shared-gain', paint);
          else paint();
        });
      });
      text(
        ctx,
        api,
        'Token 2 uses [4, 2, 0, 6]: a shifted input with the same standardized pattern',
        960,
        1040,
        27,
        themeColors.muted,
        'center',
      );
    }
    return;
  }
}
export default {
  id: 'norm-backward',
  draw: drawNormBackward,
  cues: ['backward-center', 'backward-correct', 'backward-divide', 'shared-shift-sum', 'shared-gain-sum'],
};
