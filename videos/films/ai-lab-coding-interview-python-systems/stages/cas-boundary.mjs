import { codingChapterState } from '../construction.mjs';
import {
  drawChapterCard,
  drawChapterText,
  drawFooter,
  drawHeading,
  drawRow,
} from '../defaults.mjs';
export function drawCasBoundary(ctx, scene, state, api) {
  api.focus.target('ci-cas-boundary-trace', () => {
    const { C: themeColors } = api,
      modelState = codingChapterState('cas-boundary', state),
      currentBeat = modelState.beat,
      progress = modelState.p,
      q = modelState.q;
    {
      if (currentBeat === 0) {
        drawHeading(ctx, api, 'Actual no-TTL compare-and-set fixture');
        const event = Math.min(3, Math.floor(q * 4)),
          values = ['missing', 'running', 'running', 'ready'];
        drawChapterCard(
          ctx,
          api,
          'stored value: ' + values[event],
          250,
          430,
          1420,
          120,
          themeColors.cyan,
          39,
        );
        const calls = ['CAS(None, running)', 'CAS(None, running)', 'CAS(running, ready)'];
        calls.forEach((v, i) => {
          const active = event > i;
          drawChapterCard(
            ctx,
            api,
            v,
            230 + i * 540,
            710,
            480,
            100,
            active ? (i === 1 ? themeColors.pink : themeColors.green) : themeColors.muted,
            27,
          );
          if (active)
            drawChapterText(
              ctx,
              api,
              i === 1 ? 'False · unchanged' : 'True · wrote value',
              470 + i * 540,
              900,
              28,
              i === 1 ? themeColors.pink : themeColors.green,
              'center',
            );
        });
        drawFooter(ctx, api, 'Compare and replacement form one transition');
      } else if (currentBeat === 1) {
        drawHeading(ctx, api, 'Proposed TTL + CAS extension · one acquisition');
        const e = Math.min(3, Math.floor(q * 4)),
          value = ['running', 'missing', 'missing', 'ready'][e];
        api.rect(ctx, 230, 390, 1460, 380, themeColors.panel, themeColors.yellow, 3, 16);
        drawChapterText(ctx, api, 'LOCK HELD', 960, 440, 31, themeColors.yellow, 'center');
        drawRow(
          ctx,
          api,
          ['expire at 15', 'compare None', 'write ready'],
          330,
          520,
          1260,
          95,
          themeColors.yellow,
        );
        drawChapterCard(
          ctx,
          api,
          'current value: ' + value,
          500,
          665,
          920,
          80,
          themeColors.cyan,
          29,
        );
        drawChapterText(
          ctx,
          api,
          'Supplied deadline 15 · expected None can match',
          960,
          870,
          31,
          themeColors.green,
          'center',
        );
        drawFooter(
          ctx,
          api,
          'Unlocking between comparison and write lets another writer intervene',
        );
      } else {
        drawHeading(ctx, api, 'Keep executed scope and proposed atomic scope explicit');
        drawChapterCard(
          ctx,
          api,
          'Executed: AtomicStore without TTL',
          220,
          420,
          1480,
          100,
          themeColors.blue,
          32,
        );
        drawChapterCard(
          ctx,
          api,
          'Extension: expire + compare + write',
          220,
          625,
          1480,
          100,
          themeColors.yellow,
          32,
        );
        const version = q > 0.6 ? 2 : 1;
        drawRow(
          ctx,
          api,
          [
            'snapshot v1: running',
            'live v' + version + ': ' + (version === 2 ? 'ready' : 'running'),
          ],
          300,
          840,
          1320,
          90,
          themeColors.cyan,
        );
        drawFooter(ctx, api, 'Versioned records or copy-on-write preserve the frozen snapshot');
      }
    }
  });
}
export default {
  id: 'cas-boundary',
  draw: drawCasBoundary,
  cues: [
    'ci-cas-boundary-0-build',
    'ci-cas-boundary-write',
    'ci-cas-boundary-1-build',
    'ci-cas-boundary-expired',
    'ci-cas-boundary-2-build',
  ],
};
