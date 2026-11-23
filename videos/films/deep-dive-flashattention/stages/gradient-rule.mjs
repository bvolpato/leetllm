import { clamp, gradientFixture, sum } from '../arithmetic.mjs';
import { scores } from '../fixtures.mjs';
import { complete, progress, sampleModel } from '../construction.mjs';
import {
  drawExtensionCell,
  drawExtensionFooter,
  drawExtensionText,
  drawExtensionTravelling,
  drawExtensionVector,
} from '../defaults.mjs';
export function drawGradientRule(ctx, scene, state, api) {
  return api.focus.target('fa-' + scene.id + '-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('gradient-rule', state),
      { b: currentBeat, p: progress2 } = modelState,
      teaching2 = gradientFixture();
    {
      if (currentBeat === 2) {
        const q = progress(state, 'fa-gradient-deposit', progress2),
          n = Math.min(4, Math.floor(q * 4 + 1e-9));
        drawExtensionText(
          ctx,
          api,
          'Temporary P tile → retained input-gradient rows',
          960,
          295,
          33,
          themeColors.yellow,
          'center',
        );
        for (let i = 0; i < 4; i++) {
          const y = 365 + i * 145;
          drawExtensionText(ctx, api, 'key' + i, 180, y + 48, 28, themeColors.blue);
          drawExtensionCell(
            ctx,
            api,
            i < n ? 'discarded' : 'P ' + teaching2.p[i].toFixed(4),
            350,
            y,
            350,
            85,
            i < n ? themeColors.muted : themeColors.cyan,
          );
          const active = clamp(q * 4 - i);
          drawExtensionTravelling(ctx, api, 700, y + 42, 1150, y + 42, active, themeColors.cyan);
          drawExtensionCell(
            ctx,
            api,
            i < n ? 'dV [' + teaching2.dV[i].map((v) => v.toFixed(4)).join(', ') + ']' : 'dV [0,0]',
            1150,
            y,
            570,
            85,
            i < n ? themeColors.green : themeColors.muted,
          );
        }
        drawExtensionFooter(
          ctx,
          api,
          'With dropout active, replay the forward mask for these keys',
        );
        return;
      }
      if (currentBeat === 3) {
        const rows = [
          [
            'Repeat a run',
            'Fix the device, kernel, inputs and dropout mask',
            'Compare the same configuration',
          ],
          [
            'Deterministic backward',
            'Uses a different backward implementation',
            'Can cost time and memory',
          ],
          [
            'Check accuracy',
            'Compare both errors to a higher-precision result',
            'Several tests allow 2 × reference error, some with an absolute allowance',
          ],
        ];
        rows.forEach(([a, v, lim], i) => {
          const y = 360 + i * 210;
          drawExtensionCell(ctx, api, a, 180, y, 430, 90, themeColors.blue);
          drawExtensionCell(ctx, api, v, 690, y, 990, 90, themeColors.cyan);
          drawExtensionText(ctx, api, lim, 960, y + 155, 26, themeColors.yellow, 'center');
        });
        return;
      }
      const showDP = currentBeat > 0 || complete(state, 'fa-gradient-d', progress2),
        showD = currentBeat > 0 || complete(state, 'fa-gradient-d', progress2);
      drawExtensionText(
        ctx,
        api,
        'Same four keys · G = [1, −1] · head-width 1',
        960,
        290,
        33,
        themeColors.yellow,
        'center',
      );
      drawExtensionVector(
        ctx,
        api,
        scores.map((v, i) => 'K' + i + ' = ' + v),
        250,
        360,
        1410,
        75,
        themeColors.blue,
      );
      drawExtensionVector(
        ctx,
        api,
        teaching2.p.map((v) => v.toFixed(4)),
        250,
        465,
        1410,
        75,
        themeColors.cyan,
      );
      drawExtensionText(ctx, api, 'P', 150, 515, 30, themeColors.cyan);
      drawExtensionVector(
        ctx,
        api,
        showDP ? teaching2.dP : Array(4).fill('?'),
        250,
        575,
        1410,
        75,
        themeColors.pink,
      );
      drawExtensionText(ctx, api, 'dP', 135, 625, 30, themeColors.pink);
      drawExtensionText(
        ctx,
        api,
        showD ? 'D = ΣP·dP = ' + teaching2.D.toFixed(4) : 'D = ?',
        960,
        735,
        35,
        themeColors.yellow,
        'center',
      );
      if (currentBeat > 0) {
        const n = Math.min(4, Math.floor(progress2 * 4 + 1e-9));
        drawExtensionVector(
          ctx,
          api,
          teaching2.dS.map((v, i) => (i < n ? v.toFixed(4) : '?')),
          250,
          805,
          1410,
          75,
          themeColors.green,
        );
        drawExtensionText(ctx, api, 'dS', 135, 855, 30, themeColors.green);
        const total = sum(teaching2.dS.slice(0, n)),
          dq = sum(teaching2.dS.slice(0, n).map((v, i) => v * scores[i]));
        drawExtensionText(
          ctx,
          api,
          'Admitted ' + n + '/4 · ΣdS ' + total.toFixed(4) + ' · Σ(dS·K) ' + dq.toFixed(4),
          960,
          960,
          31,
          themeColors.green,
          'center',
        );
      } else drawExtensionFooter(ctx, api, 'Each dP = dot(G,V); D is shared by every key');
    }
  });
}
export default {
  id: 'gradient-rule',
  draw: drawGradientRule,
  cues: [
    'fa-gradient-rule-0',
    'fa-gradient-d',
    'fa-gradient-rule-1',
    'fa-gradient-rule-2',
    'fa-gradient-deposit',
    'fa-gradient-rule-3',
  ],
};
