import { cueProgress } from '../arithmetic.mjs';
import { dispatchReaderEvaluation, sameSuiteToolComparison } from '../model.mjs';
import { chapterText, heading, table } from '../defaults.mjs';
export function drawSameSuiteReader(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    cueProgress2 = (id, beat = currentBeat) =>
      currentBeat < beat
        ? 0
        : currentBeat > beat
          ? 1
          : cueProgress(state.cues, 'tu-' + id, Math.max(0, Math.min(1, (progress - 0.08) / 0.8))),
    resultComplete = (id, beat = currentBeat) =>
      currentBeat > beat ||
      (currentBeat === beat &&
        (state.cues ? state.cues['tu-' + id]?.phase === 'after' : progress >= 0.9)),
    num = (x) => Number(x.toFixed(6)).toString();
  api.focus.target('tu-same-suite-reader-mechanism', () => {
    if (currentBeat === 0) {
      const rows = ['17', '16'].map((version) => dispatchReaderEvaluation({
        call_id: 'c' + version,
        name: 'get_eval',
        arguments: JSON.stringify({ version: 'reranker-v' + version }),
      }));
      rows.forEach((receipt, i) => {
        const x = 150 + 850 * i;
        const ready = resultComplete(i === 0 ? 'eval-reader-inputs' : 'eval-reader-sixteen', 0);
        api.rect(ctx, x, 315, 730, 325, themeColors.panel, themeColors.blue, 8);
        chapterText(ctx, api, receipt.version + '   /   ' + receipt.call_id, x + 40, 388, 41, themeColors.blue);
        chapterText(ctx, api, receipt.suite, x + 40, 454, 35);
        chapterText(ctx, api, ready ? receipt.score.toFixed(2) : '?', x + 40, 588, 86, themeColors.cyan);
      });
      if (resultComplete('eval-reader-sixteen', 0)) {
        const delta = resultComplete('eval-reader-delta', 0) ? '+' + num(sameSuiteToolComparison(rows).delta) : '?';
        const [left, right] = rows.map((r) => r.score.toFixed(2));
        chapterText(ctx, api, left + ' − ' + right + ' = ' + delta, 150, 855, 76, themeColors.ink, 'left', 'mono');
      }
    } else if (currentBeat === 1) {
      heading(ctx, api, 'Which requests reach the evaluation service?');
      const bad = [
          [
            'invented promote tool',
            {
              name: 'promote_model',
              arguments: '{}',
            },
          ],
          [
            'version outside allowed set',
            {
              name: 'get_eval',
              arguments: '{"version":"reranker-v99"}',
            },
          ],
          [
            'added approved field',
            {
              name: 'get_eval',
              arguments: '{"version":"reranker-v17","approved":true}',
            },
          ],
          [
            'duplicate version keys',
            {
              name: 'get_eval',
              arguments: '{"version":"reranker-v17","version":"reranker-v16"}',
            },
          ],
          [
            'truncated JSON',
            {
              name: 'get_eval',
              arguments: '{"version":',
            },
          ],
        ],
        q = cueProgress2('eval-reader-reject', 1),
        shown = Math.ceil(bad.length * q);
      let rejected = 0;
      bad.forEach(([label, call], i) => {
        let reason;
        try {
          dispatchReaderEvaluation(call);
        } catch (e) {
          reason = e.message;
          rejected++;
        }
        chapterText(ctx, api, label, 150, 400 + i * 100, 29, themeColors.blue);
        if (i < shown)
          chapterText(
            ctx,
            api,
            reason ?? 'allowed',
            1000,
            400 + i * 100,
            28,
            reason ? themeColors.pink : themeColors.green,
          );
      });
      if (shown === bad.length)
        chapterText(
          ctx,
          api,
          rejected + ' rejected proposals · 0 dictionary reads',
          150,
          890,
          29,
          themeColors.pink,
        );
      chapterText(
        ctx,
        api,
        'Only get_eval · exactly one allowed version',
        150,
        970,
        29,
        themeColors.yellow,
      );
    } else {
      heading(ctx, api, 'Which evaluation did each call return?');
      table(
        ctx,
        api,
        ['retained field', 'value'],
        [
          ['call identity', 'c17 / c16'],
          ['result version', 'immutable evaluation ID'],
          ['suite + revision', 'ranking-suite-v1'],
          ['score and gate', 'retained with that same result'],
        ],
        150,
        400,
        [650, 930],
        115,
      );
      chapterText(
        ctx,
        api,
        'Connector text can still contain untrusted instructions',
        150,
        965,
        29,
        themeColors.yellow,
      );
    }
  });
}
export default {
  id: 'same-suite-reader',
  draw: drawSameSuiteReader,
  cues: [
    'tu-same-suite-reader-1',
    'tu-eval-reader-inputs',
    'tu-eval-reader-sixteen',
    'tu-eval-reader-delta',
    'tu-same-suite-reader-2',
    'tu-eval-reader-reject',
    'tu-same-suite-reader-3',
  ],
};
