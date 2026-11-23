import { attend } from '../arithmetic.mjs';
import { ps } from '../fixtures.mjs';
import { a, sw } from '../model.mjs';
import { largeEquation, largeText } from '../defaults.mjs';
export function drawPositions(ctx, scene, state, api) {
  {
    const { C: themeColors, components: components } = api,
      currentBeat = state.beat ?? 0,
      progress = api.clamp(state.beatP ?? 0),
      phaseForBeat = (i) =>
        currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.12, 0.88),
      F = components.fade;
    {
      if (currentBeat === 2) {
        largeText(
          ctx,
          api,
          'prepend one learned vector',
          960,
          300,
          42,
          themeColors.yellow,
          'center',
        );
        api.focus.target('class-and-patch-sequence', () =>
          components.tokenRow({
            values: ['CLS', 'patch B', 'patch A'],
            width: 380,
            gap: 140,
            centerX: 960,
            y: 480,
            height: 110,
            fontSize: 42,
            padding: 18,
            fill: themeColors.panel,
            stroke: themeColors.cyan,
            textColor: themeColors.ink,
          }),
        );
        largeText(ctx, api, 'separate class slot', 440, 700, 34, themeColors.cyan, 'center');
        largeText(
          ctx,
          api,
          'patch positions stay on their grid',
          1220,
          700,
          34,
          themeColors.ink,
          'center',
        );
        largeEquation(
          ctx,
          api,
          String.raw`z_0=[x_{\rm cls};E(x_1);E(x_2)]+E_{\rm pos}`,
          960,
          850,
          50,
          themeColors.yellow,
          'center',
        );
        largeText(
          ctx,
          api,
          'Interpolate the patch grid; preserve the class slot',
          960,
          955,
          34,
          themeColors.green,
          'center',
        );
        return;
      }
      const shuffled =
        currentBeat === 0 ? phaseForBeat(0) : currentBeat === 1 ? phaseForBeat(1) : 1;
      const without = attend(ps),
        withPos = currentBeat >= 1;
      const original = withPos ? a : without,
        reversed = withPos ? sw : without;
      largeText(ctx, api, 'fixed slot 1', 470, 300, 38, themeColors.muted, 'center');
      largeText(ctx, api, 'fixed slot 2', 1430, 300, 38, themeColors.muted, 'center');
      if (withPos) {
        api.focus.target('position-slot-vectors', () => {
          largeText(ctx, api, 'slot1 + [0,0.6]', 470, 805, 29, themeColors.yellow, 'center');
          largeText(ctx, api, 'slot2 + [0.5,0]', 1430, 805, 29, themeColors.yellow, 'center');
        });
      }
      const [first, second] = api.swap(330, 500, 1290, 500, shuffled, 160);
      api.focus.target('permuted-patch-a', () =>
        components.card({
          label: 'patch A',
          x: first.x,
          y: first.y,
          width: 280,
          height: 100,
          fontSize: 38,
          fill: themeColors.panel,
          stroke: themeColors.cyan,
          textColor: themeColors.cyan,
          padding: 14,
        }),
      );
      api.focus.target('permuted-patch-b', () =>
        components.card({
          label: 'patch B',
          x: second.x,
          y: second.y,
          width: 280,
          height: 100,
          fontSize: 38,
          fill: themeColors.panel,
          stroke: themeColors.pink,
          textColor: themeColors.pink,
          padding: 14,
        }),
      );
      largeText(
        ctx,
        api,
        withPos ? 'slot vectors added' : 'position-free summary',
        960,
        300,
        38,
        themeColors.yellow,
        'center',
      );
      api.focus.target('position-free-summary', () =>
        largeText(
          ctx,
          api,
          `before ≈ [${original.map((v) => v.toFixed(3)).join(', ')}]`,
          500,
          900,
          36,
          themeColors.ink,
          'center',
        ),
      );
      api.focus.target('permuted-position-summary', () =>
        largeText(
          ctx,
          api,
          `after ≈ [${reversed.map((v) => v.toFixed(3)).join(', ')}]`,
          1420,
          900,
          36,
          themeColors.ink,
          'center',
        ),
      );
      F(phaseForBeat(2), () =>
        largeText(
          ctx,
          api,
          'Class token gets its own separate slot',
          960,
          960,
          36,
          themeColors.green,
          'center',
        ),
      );
    }
  }
}
export default {
  id: 'positions',
  draw: drawPositions,
  cues: [
    'positions-permuted-patch-a-b1-1',
    'positions-permuted-position-summary-b2-1',
    'positions-class-and-patch-sequence-b3-1',
  ],
};
