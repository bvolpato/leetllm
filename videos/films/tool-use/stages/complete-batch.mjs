import { cueProgress } from '../arithmetic.mjs';
import { releaseCall, validatedReleaseCalls } from '../model.mjs';
import { box, chapterCode, chapterLine, chapterText, footer, heading } from '../defaults.mjs';
export function drawCompleteBatch(ctx, scene, state, api) {
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
        (state.cues ? state.cues['tu-' + id]?.phase === 'after' : progress >= 0.9));
  api.focus.target('tu-complete-batch-mechanism', () => {
    heading(ctx, api, 'A batch leaves the adapter only after every call validates');
    if (currentBeat === 2) {
      const response = {
          status: 'completed',
          output: [
            {
              type: 'message',
              content: 'No current service observation.',
            },
          ],
        },
        calls = validatedReleaseCalls(response),
        q = cueProgress2('batch-zero-calls', 2);
      box(
        ctx,
        api,
        'Separate completed response',
        ['type: message', 'No current service observation.'],
        150,
        390,
        1580,
        themeColors.blue,
        155,
      );
      chapterCode(ctx, api, 'dispatchable calls: []', 150, 645, 33, themeColors.cyan);
      if (q > 0) {
        box(
          ctx,
          api,
          'Retained non-call output',
          'Preserve required history item',
          1050,
          745,
          680,
          themeColors.green,
          135,
        );
        chapterLine(ctx, api, 930, 470, 930, 810, themeColors.cyan, 3);
        chapterLine(ctx, api, 930, 810, 930 + 90 * q, 810, themeColors.cyan, 3);
      }
      if (resultComplete('batch-zero-calls', 2)) {
        chapterText(
          ctx,
          api,
          calls.length + ' dispatchable calls · answer or refusal handling',
          150,
          930,
          31,
          themeColors.green,
        );
        chapterText(ctx, api, 'No service operation', 150, 985, 29, themeColors.yellow);
      }
      footer(
        ctx,
        api,
        'Other batches keep distinct call identities and a declared scheduling policy.',
      );
    } else {
      const limit = 2048,
        rows = [releaseCall('status-1'), releaseCall('status-2', 'reranker-v17')],
        q = currentBeat === 0 ? cueProgress2('batch-byte-limit', 0) : 1,
        broken = currentBeat >= 1 && resultComplete('batch-late-invalid', 1);
      box(
        ctx,
        api,
        'Required final statuses',
        currentBeat === 0 && !resultComplete('batch-response-complete', 0)
          ? 'response and every call must complete'
          : 'response: completed · each call: completed',
        150,
        365,
        720,
        themeColors.yellow,
        105,
      );
      chapterText(
        ctx,
        api,
        'UTF-8 argument limit: ' + limit + ' bytes',
        1050,
        425,
        28,
        themeColors.yellow,
      );
      rows.forEach((r, i) => {
        const y = 535 + i * 170,
          wire =
            i === 1 && currentBeat === 1
              ? '{"release_id":'
              : r.arguments.slice(0, Math.ceil(r.arguments.length * (i === 0 ? 1 : q)));
        box(
          ctx,
          api,
          r.call_id,
          [r.name, wire],
          150,
          y,
          1300,
          i === 1 && broken ? themeColors.pink : themeColors.blue,
          135,
        );
        chapterText(
          ctx,
          api,
          Buffer.byteLength(wire, 'utf8') + ' B',
          1500,
          y + 75,
          28,
          themeColors.cyan,
        );
      });
      if (currentBeat === 0)
        chapterText(
          ctx,
          api,
          'Internal candidate list · no service operation yet',
          150,
          950,
          31,
          themeColors.yellow,
        );
      if (currentBeat === 1) {
        chapterText(
          ctx,
          api,
          broken
            ? 'Reject whole batch · 0 dispatches'
            : 'Validate the second call before releasing either',
          150,
          950,
          31,
          broken ? themeColors.pink : themeColors.yellow,
        );
        if (broken) chapterLine(ctx, api, 1475, 550, 1475, 850, themeColors.pink, 5);
      }
      if (currentBeat === 2) {
        chapterText(
          ctx,
          api,
          'Zero calls → answer or refusal; preserve other output items',
          150,
          950,
          29,
          themeColors.cyan,
        );
      }
      footer(ctx, api, 'The adapter holds the first call while it checks the second.');
    }
  });
}
export default {
  id: 'complete-batch',
  draw: drawCompleteBatch,
  cues: [
    'tu-complete-batch-1',
    'tu-batch-response-complete',
    'tu-batch-byte-limit',
    'tu-complete-batch-2',
    'tu-batch-late-invalid',
    'tu-complete-batch-3',
    'tu-batch-zero-calls',
  ],
};
