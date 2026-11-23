import { stablePolicy } from '../arithmetic.mjs';
import { policyCueProgress } from '../construction.mjs';
import { drawCaption, drawPolicyCard, drawPolicyEquation, drawPolicyText } from '../defaults.mjs';
export function drawLengthConventions(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const progress = policyCueProgress('length-conventions', state),
    currentBeat = Math.min(beat, scene.beats.length - 1);
  const target = (paint) =>
    api.focus ? api.focus.target(`${'length-conventions'}-state-${currentBeat}`, paint) : paint();
  const colors = [themeColors.blue, themeColors.pink, themeColors.cyan, themeColors.yellow];
  const policy = stablePolicy();
  {
    if (beat === 0) {
      target(() => {
        drawPolicyCard(
          ctx,
          api,
          'length-conventions',
          'EOS now',
          220,
          405,
          500,
          90,
          themeColors.blue,
          34,
        );
        drawPolicyText(ctx, api, 'P = .01', 470, 590, 43, themeColors.blue, 'center');
        drawPolicyCard(
          ctx,
          api,
          'length-conventions',
          'create → EOS',
          1120,
          405,
          570,
          90,
          themeColors.green,
          34,
        );
        drawPolicyText(
          ctx,
          api,
          `.99 × .90 = ${(0.99 * 0.9).toFixed(3)}`,
          1405,
          590,
          43,
          themeColors.green,
          'center',
        );
      });
      drawCaption(
        ctx,
        api,
        'Extending one path cannot raise its joint probability. Different branches have different starting mass.',
      );
    } else {
      const rows = [
        {
          name: 'short · L=2',
          log: -1,
          length: 2,
        },
        {
          name: 'long · L=5',
          log: -1.6,
          length: 5,
        },
      ];
      drawPolicyText(
        ctx,
        api,
        'Count EOS in the declared generated length',
        960,
        310,
        33,
        themeColors.muted,
        'center',
      );
      drawPolicyText(ctx, api, 'Per-token mean', 870, 405, 30, themeColors.cyan, 'center');
      drawPolicyText(ctx, api, 'GNMT · α=1', 1520, 405, 30, themeColors.yellow, 'center');
      rows.forEach((r, i) => {
        const y = 500 + i * 215;
        drawPolicyText(ctx, api, r.name, 180, y + 42, 33, colors[i]);
        drawPolicyEquation(
          ctx,
          api,
          String.raw`\frac{${r.log}}{${r.length}}=${(r.log / r.length).toFixed(3)}`,
          870,
          y + 45,
          43,
          colors[i],
          'center',
        );
        target(() => {
          const divisor = (5 + r.length) / 6;
          if (progress > 0)
            drawPolicyEquation(
              ctx,
              api,
              String.raw`\frac{${r.log}}{${5 + r.length}/6}=${(r.log / divisor).toFixed(3)}`,
              1520,
              y + 45,
              43,
              colors[i],
              'center',
            );
          else drawPolicyText(ctx, api, '?', 1520, y + 45, 43, themeColors.muted, 'center');
        });
      });
      drawCaption(
        ctx,
        api,
        'Per-token mean favors long; GNMT favors short here. The exact denominator defines the objective.',
      );
    }
  }
  return;
}
export default {
  id: 'length-conventions',
  draw: drawLengthConventions,
  cues: ['length-conventions-build-0', 'length-conventions-build-1'],
};
