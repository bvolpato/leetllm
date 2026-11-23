import { weeklyQueue } from '../fixtures.mjs';
import { afterCue, cue, decisionFrame, event } from '../construction.mjs';
import { wilson } from '../model.mjs';
import { axes, caption, focusTarget, interval, text } from '../defaults.mjs';
export function drawReport(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    const f = decisionFrame(state);
    const capRead = f.choiceKnown || (currentBeat === 1 && afterCue(state, 'read-cap', 0.01, 0.18));
    if (currentBeat === 2) {
      const formatCount = (n) => n.toLocaleString('en-US');
      text(ctx, api, 'Schedule set · regular shift', 960, 285, 33, themeColors.green, 'center');
      focusTarget(ctx, api, 'week-outcome', () =>
        text(
          ctx,
          api,
          f.outcomeKnown
            ? formatCount(f.outcome) +
                ' specialist cases / ' +
                formatCount(weeklyQueue.size) +
                ' messages = ' +
                ((100 * f.outcome) / weeklyQueue.size).toFixed(0) +
                '%'
            : 'Full toy week · outcome covered',
          960,
          400,
          40,
          f.outcomeKnown ? themeColors.yellow : themeColors.muted,
          'center',
        ),
      );
      focusTarget(ctx, api, 'capacity-payoff', () => {
        const x = 280,
          y = 565,
          scale = 1350 / 25000;
        api.rect(
          ctx,
          280,
          565,
          weeklyQueue.capacity * scale,
          120,
          themeColors.panel,
          themeColors.green,
          3,
          5,
        );
        if (f.outcomeKnown)
          api.rect(ctx, x, y + 16, f.outcome * scale * f.filled, 88, themeColors.yellow);
        text(
          ctx,
          api,
          'regular capacity · ' + formatCount(weeklyQueue.capacity) + ' specialist cases',
          960,
          770,
          32,
          themeColors.green,
          'center',
        );
        if (f.capacity > 0) {
          const start = x + f.outcome * scale;
          const end = x + weeklyQueue.capacity * scale;
          api.line(ctx, start, y + 126, start, y + 147, themeColors.green, 3);
          const tip = api.lerp(start, end, f.capacity);
          api.line(ctx, start, y + 147, tip, y + 147, themeColors.green, 3);
          if (f.capacity >= 1) api.line(ctx, end, y + 147, end, y + 126, themeColors.green, 3);
          if (f.capacity >= 1)
            text(
              ctx,
              api,
              formatCount(weeklyQueue.capacity - f.outcome) +
                ' cases of spare capacity in this toy week',
              (start + end) / 2,
              850,
              32,
              themeColors.green,
              'center',
            );
        }
      });
      focusTarget(ctx, api, 'next-lesson', () =>
        caption(
          ctx,
          api,
          cue(state, 'handoff', 0.77, 0.9) > 0
            ? 'Next · Distributions and Sampling'
            : 'This week’s census',
        ),
      );
      return;
    }
    text(
      ctx,
      api,
      'One decision at 400 reviews · regular shift if the upper end is below 20%',
      960,
      235,
      28,
      themeColors.ink,
      'center',
    );
    const plot = axes(
      ctx,
      api,
      250,
      380,
      1000,
      260,
      [0.05, 0.3],
      [0, 2],
      [0.1, 0.16, 0.2, 0.25, 0.3],
      [],
      'specialist rate',
      '',
    );
    interval(ctx, api, plot, wilson(16, 100), 1.5, themeColors.muted, 1, 0.16);
    const threshold = plot.point(0.2, 0);
    api.line(ctx, threshold.x, 330, threshold.x, 650, themeColors.pink, 4);
    text(ctx, api, '20% threshold', threshold.x + 15, 305, 30, themeColors.pink);
    text(
      ctx,
      api,
      'first 100 labels',
      1250,
      plot.point(0.3, 1.5).y + 10,
      27,
      themeColors.muted,
      'right',
    );
    focusTarget(ctx, api, 'planned-audit', () => {
      for (let stack = 0; stack < 4; stack++) {
        const x = 410 + stack * 280;
        const complete = Math.min(100, Math.max(0, f.reviewed - 100 * stack));
        api.rect(ctx, x, 724, 260, 19, themeColors.panel, themeColors.muted, 2, 3);
        if (complete > 0) api.rect(ctx, x, 724, 2.6 * complete, 19, themeColors.blue);
      }
      text(
        ctx,
        api,
        f.reviewed + ' / 400 planned IDs reviewed',
        960,
        789,
        31,
        themeColors.blue,
        'center',
      );
    });
    focusTarget(ctx, api, 'final-interval', () => {
      if (f.auditKnown) interval(ctx, api, plot, f.interval, 0.5, themeColors.green, 1, 0.16);
      text(
        ctx,
        api,
        capRead
          ? '64/400 · 95% Wilson ' +
              (100 * f.interval.low).toFixed(2) +
              '% – ' +
              (100 * f.interval.high).toFixed(2) +
              '%'
          : f.auditKnown
            ? '64/400 · sample estimate 16%'
            : '400-label result covered',
        960,
        851,
        34,
        f.auditKnown ? themeColors.green : themeColors.muted,
        'center',
      );
    });
    if (f.auditKnown)
      focusTarget(ctx, api, 'upper-zoom', () => {
        const zoom = event(state, 0, 'inspect-cap', 0.76, 0.84);
        if (zoom === 0) return;
        const width = api.lerp(0.21, 0.007, zoom);
        const left = 0.2 - (5 * width) / 7;
        const close = axes(ctx, api, 1410, 520, 350, 130, [left, left + width], [0, 1], [], []);
        const start = close.point(Math.max(left, f.interval.low), 0.5);
        const cap = close.point(f.interval.high, 0.5);
        const limit = close.point(0.2, 0);
        api.line(ctx, start.x, start.y, cap.x, cap.y, themeColors.green, 7);
        api.line(ctx, cap.x, cap.y - 13, cap.x, cap.y + 13, themeColors.green, 3);
        api.line(ctx, limit.x, 520, limit.x, 650, themeColors.pink, 4);
        text(ctx, api, 'Upper-edge zoom', 1585, 345, 30, themeColors.ink, 'center');
        text(ctx, api, 'Staffing line 20.00%', limit.x, 482, 28, themeColors.pink, 'center');
        if (capRead)
          text(
            ctx,
            api,
            'Upper end ' + (f.interval.high * 100).toFixed(2) + '%',
            1585,
            413,
            31,
            themeColors.green,
            'center',
          );
      });
    focusTarget(ctx, api, 'staffing-choice', () =>
      text(
        ctx,
        api,
        f.choice ?? 'Staffing choice pending',
        960,
        921,
        36,
        f.choiceKnown ? themeColors.green : themeColors.muted,
        'center',
      ),
    );
    caption(ctx, api, 'Weekly census sealed · random IDs · independently reviewed labels');
  }
}
export default {
  id: 'report',
  draw: drawReport,
  cues: [
    'planned-audit',
    'final-interval',
    'inspect-cap',
    'read-cap',
    'staffing-choice',
    'week-outcome',
    'fill-capacity',
    'capacity-payoff',
    'handoff',
  ],
};
