import { DEADLINE } from '../fixtures.mjs';
import { retrySchedule } from '../model.mjs';
import { text } from '../defaults.mjs';
export function drawRetryClock(ctx, scene, state, api) {
  const { C: themeColors, phase } = api;
  const beat = state.beat ?? 0;
  const progress2 = state.beatP ?? 0;
  const q = phase(progress2, 0.04, 0.9);
  {
    const schedule = retrySchedule(beat > 0);
    const floorProgress =
      beat > 1 ? 1 : beat === 1 ? api.focus.progress('retry-after-floor', q) : 0;
    const jitterProgress =
      beat > 1 ? 1 : api.focus.progress(beat === 0 ? 'sample-full-jitter' : 'bounded-offset', q);
    const deadlineChecked =
      beat > 1 || (beat === 1 && api.focus.progress('combined-deadline', q) === 1);
    const axisX = 470,
      scale = 132,
      axisY = 860;
    api.focus.target('retry-clock-readout', () =>
      text(
        ctx,
        api,
        beat === 0
          ? 'Full-jitter samples'
          : beat === 1
            ? 'Retry-After floor + bounded jitter'
            : 'Deadline admits only waits that fit',
        960,
        245,
        38,
        themeColors.ink,
        'center',
      ),
    );
    schedule.forEach((row, i) =>
      api.focus.target('retry-wait-' + row.attempt, () => {
        const y = 365 + i * 145;
        api.focus.target('retry-clock-readout-2', () =>
          text(ctx, api, `Attempt ${row.attempt}`, 440, y + 43, 30, themeColors.blue, 'right'),
        );
        const segmentX = axisX + row.elapsedBefore * scale;
        api.rect(ctx, segmentX, y, row.wait * scale, 64, themeColors.panel, themeColors.muted, 8);
        if (row.floor > 0)
          api.rect(
            ctx,
            segmentX,
            y,
            row.floor * floorProgress * scale,
            64,
            themeColors.yellow,
            undefined,
            8,
          );
        const jitterStart = segmentX + row.floor * scale;
        api.rect(
          ctx,
          jitterStart,
          y,
          row.jitter * jitterProgress * scale,
          64,
          deadlineChecked && !row.admitted ? themeColors.pink : themeColors.cyan,
          undefined,
          8,
        );
        const verdictColor = deadlineChecked
          ? row.admitted
            ? themeColors.green
            : themeColors.pink
          : themeColors.muted;
        api.line(
          ctx,
          segmentX + row.wait * scale,
          y - 8,
          segmentX + row.wait * scale,
          y + 72,
          verdictColor,
          3,
        );
        api.focus.target('retry-clock-readout-3', () =>
          text(
            ctx,
            api,
            `${row.wait.toFixed(1)} s · total ${row.elapsedAfter.toFixed(1)}`,
            axisX + 8 * scale + 40,
            y + 42,
            25,
            verdictColor,
          ),
        );
        if (deadlineChecked && !row.admitted)
          api.focus.target('retry-clock-blocked-wait-would-miss-deadline', () =>
            text(
              ctx,
              api,
              'BLOCKED · wait would miss deadline',
              axisX + DEADLINE * scale + 45,
              y + 107,
              23,
              themeColors.pink,
            ),
          );
      }),
    );
    api.focus.target('whole-task-deadline', () =>
      api.line(
        ctx,
        axisX + DEADLINE * scale,
        335,
        axisX + DEADLINE * scale,
        820,
        themeColors.pink,
        beat > 1 ? 6 : 4,
      ),
    );
    api.focus.target('whole-task-deadline', () =>
      text(
        ctx,
        api,
        'whole-task deadline',
        axisX + DEADLINE * scale,
        325,
        26,
        themeColors.pink,
        'center',
      ),
    );
    [0, 2, 4, 6, 8].forEach((n) =>
      api.focus.target('retry-clock-readout-4', () =>
        text(ctx, api, String(n), axisX + n * scale, axisY, 26, themeColors.muted, 'center'),
      ),
    );
    api.focus.target('retry-clock-readout-5', () =>
      text(
        ctx,
        api,
        beat > 0
          ? 'Yellow = Retry-After floor · cyan = sampled jitter'
          : 'Full-jitter delay starts at zero',
        axisX,
        905,
        27,
        beat > 0 ? themeColors.yellow : themeColors.muted,
      ),
    );
  }
}
export default {
  id: 'retry-clock',
  draw: drawRetryClock,
  cues: [
    'sample-full-jitter',
    'spread-clients',
    'retry-after-floor',
    'bounded-offset',
    'combined-deadline',
    'whole-deadline',
    'stop-retry',
  ],
};
