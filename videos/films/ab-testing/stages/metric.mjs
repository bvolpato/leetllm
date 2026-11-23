import { abClamp } from '../arithmetic.mjs';
import { abExtendedScenes, incidentOutcome } from '../model.mjs';
import {
  drawExpansionCell,
  drawExpansionLine,
  drawExpansionNote,
  withExpansionFocus,
  writeExpansionText,
} from '../defaults.mjs';
export function drawMetric(ctx, scene, state, api) {
  const beat = state.beat ?? 0,
    progress = abClamp(state.beatP ?? 0),
    q = progress * progress * (3 - 2 * progress);
  if (!abExtendedScenes.has('metric')) return;
  const { C: themeColors } = api;
  withExpansionFocus(ctx, api, 'metric-mechanism', () => {
    if (beat < 2) {
      withExpansionFocus(ctx, api, 'outcome-answer', () =>
        writeExpansionText(
          ctx,
          api,
          'Usable mark by 10 minutes',
          470,
          340,
          27,
          themeColors.cyan,
          'center',
        ),
      );
      withExpansionFocus(ctx, api, 'outcome-deadline', () =>
        writeExpansionText(
          ctx,
          api,
          'Full 10-minute window',
          960,
          340,
          27,
          themeColors.yellow,
          'center',
        ),
      );
      withExpansionFocus(ctx, api, 'outcome-page', () =>
        writeExpansionText(
          ctx,
          api,
          'No new page through 10',
          1500,
          340,
          27,
          themeColors.pink,
          'center',
        ),
      );
    }
    const timeline = (name, y, usable, page, observed, showResult = true) => {
      const x = (t) => 470 + (t / 20) * 1240,
        clock = x(observed);
      writeExpansionText(ctx, api, name, 205, y + 10, 29, themeColors.blue);
      drawExpansionLine(
        ctx,
        api,
        {
          x: x(0),
          y,
        },
        {
          x: x(20),
          y,
        },
        themeColors.muted,
        3,
      );
      drawExpansionLine(
        ctx,
        api,
        {
          x: x(10),
          y: y - 35,
        },
        {
          x: x(10),
          y: y + 35,
        },
        themeColors.yellow,
        4,
      );
      writeExpansionText(ctx, api, 'deadline 10', x(10), y - 55, 25, themeColors.yellow, 'center');
      if (usable !== null && usable <= observed) {
        api.circle(ctx, x(usable), y, 12, themeColors.cyan);
        writeExpansionText(
          ctx,
          api,
          'usable ' + usable,
          x(usable),
          y + 55,
          26,
          themeColors.cyan,
          'center',
        );
      }
      if (page !== null && page <= observed) {
        api.circle(ctx, x(page), y, 13, themeColors.pink);
        writeExpansionText(
          ctx,
          api,
          'page ' + page,
          x(page),
          y + 100,
          26,
          themeColors.pink,
          'center',
        );
      }
      if (observed < 20) {
        drawExpansionLine(
          ctx,
          api,
          {
            x: clock,
            y: y - 25,
          },
          {
            x: clock,
            y: y + 25,
          },
          themeColors.blue,
          3,
        );
        writeExpansionText(
          ctx,
          api,
          'observed ' + observed.toFixed(1),
          clock,
          y - 95,
          24,
          themeColors.blue,
          'center',
        );
      }
      if (showResult) {
        const verdict = incidentOutcome({
          observedMinutes: observed,
          usableAt: usable,
          newPageAt: page,
        });
        writeExpansionText(
          ctx,
          api,
          verdict.toUpperCase(),
          1750,
          y + 65,
          28,
          verdict === 'resolved'
            ? themeColors.cyan
            : verdict === 'pending'
              ? themeColors.yellow
              : themeColors.pink,
          'right',
        );
      }
    };
    if (beat < 2) {
      withExpansionFocus(ctx, api, 'outcome-denominator', () =>
        writeExpansionText(
          ctx,
          api,
          'Separate event fixtures · enrolled denominator is retained',
          960,
          280,
          35,
          themeColors.blue,
          'center',
        ),
      );
      const observed = beat === 0 ? Math.min(20, 20 * q) : 9;
      timeline(
        'A',
        490,
        8,
        beat === 1 ? 10 : null,
        beat === 1 ? 20 : observed,
        observed >= 10 || beat === 1,
      );
      timeline('B', 770, beat === 0 ? 12 : 8, null, observed, observed >= 10 || beat === 1);
      drawExpansionNote(
        ctx,
        api,
        beat === 0
          ? 'A usable mark after minute 10 cannot satisfy the locked deadline.'
          : 'A fully observed page-at-10 failure and a pending9-minute record have different evidence states.',
      );
    } else if (beat === 1) {
      writeExpansionText(
        ctx,
        api,
        'Assignment stays in the denominator after a rewrite timeout',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      const names = ['usable on time', 'rewrite timeout', 'missing telemetry'];
      names.forEach((v, i) =>
        drawExpansionCell(
          ctx,
          api,
          'TREATMENT\n' + v,
          200 + i * 560,
          410,
          500,
          150,
          i === 1 ? themeColors.pink : i === 2 ? themeColors.yellow : themeColors.cyan,
          32,
        ),
      );
      writeExpansionText(
        ctx,
        api,
        'Do not select only successful rewrite executions',
        960,
        730,
        36,
        themeColors.pink,
        'center',
      );
      writeExpansionText(
        ctx,
        api,
        'Unobserved outcome ≠ observed unresolved outcome',
        960,
        865,
        33,
        themeColors.yellow,
        'center',
      );
      drawExpansionNote(
        ctx,
        api,
        'Intention to treat preserves the assignment target; it does not reconstruct missing measurement.',
      );
    } else {
      writeExpansionText(
        ctx,
        api,
        'The usable-answer metric is a proxy for recovery',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      withExpansionFocus(ctx, api, 'outcome-answer', () =>
        drawExpansionCell(
          ctx,
          api,
          'Usable answer by minute 10\nNo new page',
          200,
          420,
          700,
          155,
          themeColors.cyan,
          33,
        ),
      );
      drawExpansionCell(
        ctx,
        api,
        'Service still unhealthy\nSeparate health evidence required',
        1020,
        420,
        700,
        155,
        themeColors.pink,
        32,
      );
      withExpansionFocus(ctx, api, 'resolution-rule', () =>
        writeExpansionText(
          ctx,
          api,
          'Metric success does not establish restored service health',
          960,
          745,
          36,
          themeColors.yellow,
          'center',
        ),
      );
      writeExpansionText(
        ctx,
        api,
        'An appropriate escalation can protect users and count as metric failure',
        960,
        865,
        31,
        themeColors.ink,
        'center',
      );
      drawExpansionNote(
        ctx,
        api,
        'Choose and validate the outcome for the product decision before interpreting a treatment effect.',
      );
    }
  });
  return;
}
export default {
  id: 'metric',
  draw: drawMetric,
  cues: [
    'metric-beat-1-focus-1',
    'metric-beat-1-focus-2',
    'metric-beat-1-focus-3',
    'metric-beat-2-focus-1',
    'metric-beat-3-focus-1',
    'metric-beat-3-focus-2',
  ],
};
