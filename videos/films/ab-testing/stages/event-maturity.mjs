import { abClamp } from '../arithmetic.mjs';
import { abCue, abStarted } from '../construction.mjs';
import { abExtendedScenes, incidentOutcome } from '../model.mjs';
import {
  drawExpansionCell,
  drawExpansionLine,
  drawExpansionNote,
  withExpansionFocus,
  writeExpansionText,
} from '../defaults.mjs';
export function drawEventMaturity(ctx, scene, state, api) {
  const beat = state.beat ?? 0,
    progress = abClamp(state.beatP ?? 0),
    q = progress * progress * (3 - 2 * progress);
  if (!abExtendedScenes.has('event-maturity')) return;
  const { C: themeColors } = api;
  withExpansionFocus(ctx, api, 'event-maturity-mechanism', () => {
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
    if (beat === 0) {
      writeExpansionText(
        ctx,
        api,
        'Separate supplied event records · full follow-up observed',
        960,
        270,
        34,
        themeColors.blue,
        'center',
      );
      timeline('A', 430, 8, null, 20, abCue(state, 'maturity-eight', q) >= 1);
      timeline(
        'B',
        645,
        8,
        abStarted(state, 'maturity-ten', progress > 0.3) ? 10 : null,
        20,
        abCue(state, 'maturity-ten', q) >= 1,
      );
      timeline(
        'C',
        860,
        8,
        abStarted(state, 'maturity-eighteen', progress > 0.5) ? 18 : null,
        20,
        abCue(state, 'maturity-eighteen', q) >= 1,
      );
      if (abStarted(state, 'maturity-nine', progress > 0.7))
        drawExpansionNote(
          ctx,
          api,
          'At observed minute 9, that incident is PENDING even after a usable mark.',
        );
      else
        drawExpansionNote(
          ctx,
          api,
          'A new page exactly at the deadline counts; a later page belongs to a different outcome window.',
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
        'Each metric keeps its own observed unit and denominator',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      drawExpansionCell(
        ctx,
        api,
        'Resolution\nall enrolled mature incidents',
        200,
        400,
        700,
        150,
        themeColors.cyan,
        32,
      );
      drawExpansionCell(
        ctx,
        api,
        'Grounding\nanswers under the declared audit design',
        1020,
        400,
        700,
        150,
        themeColors.pink,
        31,
      );
      drawExpansionCell(
        ctx,
        api,
        'First-request p95\npredeclare timeout treatment',
        200,
        690,
        700,
        150,
        themeColors.yellow,
        32,
      );
      drawExpansionCell(
        ctx,
        api,
        'New pages\nexclude the original pre-enrollment page',
        1020,
        690,
        700,
        150,
        themeColors.blue,
        30,
      );
      drawExpansionNote(
        ctx,
        api,
        'A sampled audit failure count divided by every enrolled incident is the wrong audit rate.',
      );
    }
  });
  return;
}
export default {
  id: 'event-maturity',
  draw: drawEventMaturity,
  cues: [
    'event-maturity-step-1',
    'maturity-eight',
    'maturity-ten',
    'maturity-eighteen',
    'maturity-nine',
    'event-maturity-step-2',
    'event-maturity-step-3',
  ],
};
