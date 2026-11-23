import { box, chapterText, footer, heading, table } from '../defaults.mjs';
export function drawErrorClasses(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    resultComplete = (id, beat = currentBeat) =>
      currentBeat > beat ||
      (currentBeat === beat &&
        (state.cues ? state.cues['tu-' + id]?.phase === 'after' : progress >= 0.9));
  api.focus.target('tu-error-classes-mechanism', () => {
    heading(ctx, api, 'A different failure class requires a different recovery');
    if (currentBeat === 0) {
      box(ctx, api, 'Schema failure', 'missing release_id', 150, 405, 720, themeColors.pink, 125);
      box(
        ctx,
        api,
        'Later corrected proposal',
        resultComplete('error-revalidate', 0)
          ? 'restart all validation gates'
          : 'bounded feedback only',
        1050,
        405,
        680,
        themeColors.cyan,
        125,
      );
      box(
        ctx,
        api,
        'Authorization denial',
        resultComplete('error-denial-waits', 0)
          ? 'wait for trusted state change'
          : 'a spelling change cannot grant access',
        150,
        720,
        1580,
        themeColors.yellow,
        130,
      );
    } else if (currentBeat === 1) {
      box(
        ctx,
        api,
        'Transient idempotent read',
        ['bounded backoff', 'same end-to-end deadline'],
        150,
        410,
        720,
        themeColors.blue,
        165,
      );
      box(
        ctx,
        api,
        'Timed-out write',
        resultComplete('error-unknown-write', 1)
          ? ['outcome: unknown', 'reconcile original operation']
          : ['destination may have committed', 'new write is not a safe inference'],
        1050,
        410,
        680,
        themeColors.yellow,
        165,
      );
      chapterText(
        ctx,
        api,
        'Retry transport inside the runtime; retain the original selector',
        150,
        820,
        30,
        themeColors.cyan,
      );
    } else {
      table(
        ctx,
        api,
        ['transport receipt', 'application state'],
        [
          ['HTTP 200', 'may carry failed application result'],
          [
            'queued',
            resultComplete('error-queued', 2)
              ? 'accepted; not completed'
              : 'pending interpretation',
          ],
          ['bounded error code', 'useful fields; no raw secrets'],
        ],
        150,
        420,
        [650, 950],
        155,
      );
      chapterText(
        ctx,
        api,
        'Bound collection bytes before returning model tokens',
        150,
        970,
        30,
        themeColors.yellow,
      );
    }
    footer(ctx, api, 'Missing, denied, transient and unknown remain different states.');
  });
}
export default {
  id: 'error-classes',
  draw: drawErrorClasses,
  cues: [
    'tu-error-classes-1',
    'tu-error-revalidate',
    'tu-error-denial-waits',
    'tu-error-classes-2',
    'tu-error-unknown-write',
    'tu-error-classes-3',
    'tu-error-queued',
  ],
};
