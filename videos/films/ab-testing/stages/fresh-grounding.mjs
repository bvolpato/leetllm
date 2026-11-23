import { abClamp } from '../arithmetic.mjs';
import { abCue } from '../construction.mjs';
import { abExtendedScenes, freshGroundingReveal, groundingPacket } from '../model.mjs';
import {
  drawExpansionCell,
  drawExpansionLine,
  drawExpansionNote,
  drawExpansionPath,
  drawExpansionPlot,
  withExpansionFocus,
  writeExpansionText,
} from '../defaults.mjs';
export function drawFreshGrounding(ctx, scene, state, api) {
  const beat = state.beat ?? 0,
    progress2 = abClamp(state.beatP ?? 0),
    q = progress2 * progress2 * (3 - 2 * progress2);
  if (!abExtendedScenes.has('fresh-grounding')) return;
  const { C: themeColors } = api;
  withExpansionFocus(ctx, api, 'fresh-grounding-mechanism', () => {
    const fresh = true,
      packet = groundingPacket(18),
      reveal = freshGroundingReveal(state);
    if (beat === 0) {
      writeExpansionText(
        ctx,
        api,
        'Separate supplied counterfactual · retain the original hold',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      drawExpansionCell(
        ctx,
        api,
        'Original packet\nControl 22 · treatment 23 failures\nHOLD retained',
        200,
        390,
        700,
        195,
        themeColors.pink,
        32,
      );
      drawExpansionCell(
        ctx,
        api,
        'New counterfactual\nControl 22 · treatment 18 failures\nWhat is the fixed gate?',
        1020,
        390,
        700,
        195,
        themeColors.yellow,
        32,
      );
      drawExpansionCell(
        ctx,
        api,
        'Same 2,000 mature incidents / arm\nSame 760 / 840 resolution successes',
        310,
        730,
        1300,
        145,
        themeColors.cyan,
        32,
      );
      drawExpansionNote(
        ctx,
        api,
        'This is a distinct supplied packet, not permission to add data after an inconclusive final look.',
      );
    } else {
      writeExpansionText(
        ctx,
        api,
        'Apply the unchanged grounding budget to the new packet',
        960,
        280,
        34,
        themeColors.blue,
        'center',
      );
      const chart = drawExpansionPlot(
        ctx,
        api,
        260,
        440,
        1390,
        300,
        [-1, 1],
        [-0.5, 0.5],
        [-1, -0.5, 0, 0.5, 1],
        [],
        'grounding-failure increase · percentage points',
        '',
      );
      const budget = chart.point(0.5, 0).x;
      withExpansionFocus(ctx, api, 'grounding-budget', () => {
        drawExpansionLine(
          ctx,
          api,
          {
            x: budget,
            y: chart.bounds.y,
          },
          {
            x: budget,
            y: chart.bounds.y + chart.bounds.height,
          },
          themeColors.yellow,
          5,
        );
        writeExpansionText(
          ctx,
          api,
          'Budget +0.50 pp',
          budget,
          350,
          28,
          themeColors.yellow,
          'center',
        );
      });
      if (reveal.delta) {
        const center = chart.point(100 * packet.delta, 0);
        api.circle(ctx, center.x, center.y, 13, themeColors.pink);
        writeExpansionText(
          ctx,
          api,
          'Point ' + (100 * packet.delta).toFixed(2) + ' pp',
          960,
          875,
          33,
          themeColors.pink,
          'center',
        );
      }
      if (reveal.upper) {
        const progress = beat > 1 ? 1 : abCue(state, 'fresh-grounding-upper', q),
          margin = 1.96 * packet.se * progress;
        drawExpansionPath(
          ctx,
          api,
          [
            chart.point(100 * (packet.delta - margin), 0),
            chart.point(100 * (packet.delta + margin), 0),
          ],
          themeColors.pink,
          9,
          chart.bounds,
        );
        if (progress >= 1)
          writeExpansionText(
            ctx,
            api,
            'Two-sided 95% approximate interval: [' +
              (100 * packet.low).toFixed(2) +
              ', ' +
              (100 * packet.upper).toFixed(2) +
              '] pp',
            960,
            935,
            31,
            themeColors.pink,
            'center',
          );
      }
      if (reveal.pass)
        writeExpansionText(
          ctx,
          api,
          'CLEARS COMPACT TEACHING GATE',
          960,
          990,
          34,
          themeColors.cyan,
          'center',
        );
      else if (!reveal.upper) {
        withExpansionFocus(ctx, api, 'guardrail-lift', () =>
          writeExpansionText(
            ctx,
            api,
            'Resolution +4.0 pp',
            400,
            1015,
            25,
            themeColors.muted,
            'center',
          ),
        );
        withExpansionFocus(ctx, api, 'guardrail-latency', () =>
          writeExpansionText(
            ctx,
            api,
            'p95 +80ms ≤ 150',
            960,
            1015,
            25,
            themeColors.muted,
            'center',
          ),
        );
        withExpansionFocus(ctx, api, 'guardrail-pages', () =>
          writeExpansionText(
            ctx,
            api,
            'Human pages −0.20 pp',
            1530,
            1015,
            25,
            themeColors.muted,
            'center',
          ),
        );
      } else if (!reveal.pass)
        drawExpansionNote(
          ctx,
          api,
          'Construct 1.96 × the unpooled standard error before applying the fixed upper-bound rule.',
        );
      if (beat === 2) {
        writeExpansionText(
          ctx,
          api,
          'Original 23-failure packet remains held',
          960,
          400,
          28,
          themeColors.pink,
          'center',
        );
      }
    }
  });
  return;
}
export default {
  id: 'fresh-grounding',
  draw: drawFreshGrounding,
  cues: [
    'fresh-grounding-step-1',
    'fresh-grounding-step-2',
    'fresh-grounding-delta',
    'fresh-grounding-upper',
    'fresh-grounding-pass',
    'fresh-grounding-step-3',
  ],
};
