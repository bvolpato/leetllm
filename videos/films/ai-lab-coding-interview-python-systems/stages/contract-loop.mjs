import { codingChapterState } from '../construction.mjs';
import {
  drawChapterCard,
  drawChapterText,
  drawFooter,
  drawHeading,
  drawRow,
} from '../defaults.mjs';
export function drawContractLoop(ctx, scene, state, api) {
  api.focus.target('ci-contract-loop-trace', () => {
    const { C: themeColors } = api,
      modelState = codingChapterState('contract-loop', state),
      currentBeat = modelState.beat,
      progress = modelState.p,
      q = modelState.q;
    {
      if (currentBeat < 2) {
        drawHeading(
          ctx,
          api,
          currentBeat === 0
            ? 'One retained /ci item gains the state each follow-up needs'
            : 'Local deterministic exercises · Python 3.14 · no network',
        );
        drawRow(ctx, api, ['/ci', '/guide', '/api'], 200, 390, 1520, 100, themeColors.blue, 31);
        drawChapterText(ctx, api, 'FIFO queue', 200, 365, 28, themeColors.blue);
        const fields = [
            ['claim /ci', 'one owner'],
            ['expires_at', '15.000'],
            ['attempt', '1 of 2'],
            ['request key', 'effect-1'],
          ],
          n = currentBeat === 1 ? 4 : Math.floor(q * 4.99);
        fields.forEach(([name, value], i) => {
          const x = 200 + i * 400;
          drawChapterText(ctx, api, name, x, 600, 26, themeColors.muted);
          if (i < n)
            drawChapterCard(
              ctx,
              api,
              value,
              x,
              640,
              330,
              110,
              [themeColors.cyan, themeColors.yellow, themeColors.pink, themeColors.green][i],
              30,
            );
        });
        if (currentBeat === 1) {
          drawChapterCard(
            ctx,
            api,
            'assessment instructions',
            280,
            835,
            630,
            90,
            themeColors.yellow,
            29,
          );
          drawChapterCard(
            ctx,
            api,
            'fixture assertions',
            1010,
            835,
            630,
            90,
            themeColors.green,
            29,
          );
        } else
          drawFooter(
            ctx,
            api,
            'Each field owns a different decision; the queue order remains intact',
          );
      } else {
        drawHeading(ctx, api, 'Shrink duplicate output to one check-and-insert transition');
        const safe = q > 0.5,
          local = safe ? (q - 0.5) * 2 : q * 2;
        drawChapterText(
          ctx,
          api,
          safe ? 'REPAIRED · one atomic claim' : 'UNSAFE · both read absent',
          960,
          365,
          29,
          safe ? themeColors.green : themeColors.pink,
          'center',
        );
        ['A', 'B'].forEach((id, i) => {
          const y = 450 + i * 200;
          drawChapterCard(ctx, api, 'worker ' + id + ' /ci', 180, y, 360, 90, themeColors.blue);
          drawChapterCard(
            ctx,
            api,
            safe && i && local > 0.5
              ? 'already present → skip'
              : local > 0.5
                ? safe
                  ? 'claim recorded'
                  : 'observed absent'
                : 'check pending',
            720,
            y,
            490,
            90,
            safe && i ? themeColors.green : themeColors.yellow,
          );
          if (local > 0.7 && (!safe || !i))
            drawChapterCard(
              ctx,
              api,
              'fetch receipt /ci',
              1370,
              y,
              370,
              90,
              safe ? themeColors.green : themeColors.pink,
            );
        });
        drawChapterText(
          ctx,
          api,
          'Fetch receipts: ' + (local > 0.7 ? (safe ? 1 : 2) : 0),
          960,
          920,
          35,
          safe ? themeColors.green : themeColors.pink,
          'center',
        );
        drawFooter(ctx, api, 'Retain the broken transition as a focused regression');
      }
    }
  });
}
export default {
  id: 'contract-loop',
  draw: drawContractLoop,
  cues: ['ci-contract-loop-0-build', 'ci-contract-loop-1-build', 'ci-contract-loop-2-build'],
};
