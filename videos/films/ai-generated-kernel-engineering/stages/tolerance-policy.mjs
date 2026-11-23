import { tolerance } from '../arithmetic.mjs';
import { kernelChapterFrame } from '../construction.mjs';
import { drawChapterText, drawNote, drawRow, drawTitle } from '../defaults.mjs';
export function drawTolerancePolicy(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress, at } = kernelChapterFrame('tolerance-policy', state);
  api.focus.target('tolerance-policy-construction', () => {
    const reference = 1e-8,
      candidate = 0,
      zoom = currentBeat === 1 && at('zoom', 1),
      allowance = zoom ? 1e-10 : 1e-6,
      check = tolerance(reference, candidate, allowance, 0);
    if (currentBeat < 2) {
      drawTitle(
        ctx,
        api,
        'Does zero fall inside the allowed interval?',
        zoom ? 'Magnified near zero   ·   same candidate and reference' : 'Center the interval on the reference value',
      );
      const plot = api.teaching.axes({
          x: 300,
          y: 490,
          width: 1260,
          height: 260,
          xDomain: zoom ? [-3e-9, 1.3e-8] : [-1.15e-6, 1.15e-6],
          yDomain: [0, 1],
          xTicks: zoom ? [0] : [-1e-6, 0, 1e-6],
          yTicks: [],
          fontSize: 26,
        }),
        pt = (x) => plot.point(x, 0.5);
      const left = pt(reference - check.allowance),
        right = pt(reference + check.allowance),
        r = pt(reference),
        c = pt(candidate);
      api.line(ctx, left.x, left.y, right.x, right.y, themeColors.green, 18);
      api.line(ctx, r.x, r.y - 30, r.x, r.y + 30, themeColors.blue, 4);
      api.circle(ctx, c.x, c.y, 10, themeColors.pink);
      drawChapterText(ctx, api, 'reference 1e−8', r.x, 435, 29, themeColors.blue, 'center');
      drawChapterText(ctx, api, 'candidate 0', c.x, 815, 29, themeColors.pink, 'center');
      drawChapterText(
        ctx,
        api,
        'allowance = ' + allowance.toExponential(0) + ' + 0 × |reference|',
        960,
        875,
        30,
        themeColors.yellow,
        'center',
      );
      if (at(currentBeat === 0 ? 'allowance' : 'tight', currentBeat))
        drawChapterText(
          ctx,
          api,
          check.pass ? 'inside interval · ACCEPT' : 'outside interval · REJECT',
          960,
          375,
          34,
          check.pass ? themeColors.green : themeColors.pink,
          'center',
        );
      drawNote(
        ctx,
        api,
        'Choose the tolerance for the application before evaluating the candidate',
      );
    } else {
      drawTitle(
        ctx,
        api,
        'Check nonfinite placements separately',
        'Declared equal-NaN policy · infinities retain their signs',
      );
      const pairs = [
          ['NaN', 'NaN', true],
          ['+∞', '−∞', false],
          ['finite', 'NaN', false],
          ['+∞', '+∞', true],
        ],
        n = Math.ceil(4 * progress);
      pairs.forEach(([r, c, ok], i) => {
        drawRow(
          ctx,
          api,
          [r, c],
          300,
          400 + i * 120,
          800,
          i < n ? (ok ? themeColors.green : themeColors.pink) : themeColors.muted,
        );
        drawChapterText(
          ctx,
          api,
          i < n ? (ok ? 'placements agree' : 'nonfinite mismatch') : 'compare positions',
          1300,
          445 + i * 120,
          30,
          i < n && ok ? themeColors.green : themeColors.muted,
          'center',
        );
      });
      drawNote(
        ctx,
        api,
        'Dtype / device / layout checks stay independent · exact stride checking is optional',
      );
    }
  });
}
export default {
  id: 'tolerance-policy',
  draw: drawTolerancePolicy,
  cues: [
    'kg-tolerance-policy-voice-0',
    'kg-tolerance-policy-allowance',
    'kg-tolerance-policy-voice-1',
    'kg-tolerance-policy-zoom',
    'kg-tolerance-policy-tight',
    'kg-tolerance-policy-voice-2',
  ],
};
