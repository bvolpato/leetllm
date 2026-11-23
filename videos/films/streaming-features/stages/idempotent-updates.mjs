import { applyUpdate, queueState } from '../arithmetic.mjs';
import { queueEvents } from '../fixtures.mjs';
import { drawFooter, drawPill, drawText, withFocus } from '../defaults.mjs';
export function drawIdempotentUpdates(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cue = (k) => state.cues?.['sf-idempotent-updates-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after';
  api.focus.target('idempotent-updates-mechanism', () => {
    const n =
        currentBeat === 0
          ? 0
          : currentBeat > 1
            ? 4
            : resultComplete('q3')
              ? 4
              : resultComplete('q2')
                ? 3
                : resultComplete('retry')
                  ? 2
                  : resultComplete('q1')
                    ? 1
                    : 0,
      current = queueState(),
      trace = queueEvents.slice(0, n).map((event) => {
        const status = applyUpdate(current, event);
        return {
          ...event,
          status,
          backlog: current.backlog,
        };
      });
    drawText(
      ctx,
      api,
      'Event identity and first outcome travel together',
      960,
      300,
      36,
      themeColors.yellow,
    );
    withFocus(ctx, api, 'idempotent-updates-simulation-37', () =>
      queueEvents.forEach((event, i) => {
        const row = trace[i],
          y = 430 + i * 130;
        withFocus(ctx, api, 'idempotent-event-' + event.id.toLowerCase(), () =>
          drawPill(
            ctx,
            api,
            event.id + ' · delta ' + (event.delta > 0 ? '+' : '') + event.delta,
            420,
            y,
            520,
            row ? themeColors.blue : themeColors.muted,
          ),
        );
        drawPill(
          ctx,
          api,
          row?.status ?? 'not applied',
          1080,
          y,
          660,
          row
            ? row.status === 'applied'
              ? themeColors.green
              : row.status.startsWith('blocked')
                ? themeColors.pink
                : themeColors.yellow
            : themeColors.muted,
          75,
          27,
        );
        if (row) drawText(ctx, api, 'backlog ' + row.backlog, 1610, y + 10, 30, themeColors.cyan);
      }),
    );
    if (currentBeat === 0 && resultComplete('duplicate'))
      drawText(
        ctx,
        api,
        'naive delivery sum: 3 + 3 = 6 · one event',
        960,
        930,
        35,
        themeColors.pink,
      );
    else drawText(ctx, api, 'actual backlog = ' + current.backlog, 960, 960, 40, themeColors.cyan);
    drawFooter(
      ctx,
      api,
      'Sequential dictionary model · durable atomic boundary is the next construction',
    );
  });
}
export default {
  id: 'idempotent-updates',
  draw: drawIdempotentUpdates,
  cues: [
    'idempotent-updates-beat-1-focus-1',
    'sf-idempotent-updates-duplicate',
    'idempotent-updates-beat-2-focus-1',
    'idempotent-updates-beat-2-focus-2',
    'sf-idempotent-updates-q1',
    'sf-idempotent-updates-retry',
    'sf-idempotent-updates-q2',
    'sf-idempotent-updates-q3',
    'idempotent-updates-beat-3-focus-1',
    'sf-idempotent-updates-atomic',
  ],
};
