import { abClamp } from '../arithmetic.mjs';
import { abCue, abStarted } from '../construction.mjs';
import { abExtendedScenes, groundingPacket } from '../model.mjs';
import {
  drawExpansionLine,
  drawExpansionNote,
  drawExpansionPath,
  drawExpansionPlot,
  withExpansionFocus,
  writeExpansionText,
} from '../defaults.mjs';
export function drawGuardrails(ctx, scene, state, api) {
  const beat = state.beat ?? 0,
    progress2 = abClamp(state.beatP ?? 0),
    q = progress2 * progress2 * (3 - 2 * progress2);
  if (!abExtendedScenes.has('guardrails')) return;
  const { C: themeColors } = api;
  withExpansionFocus(ctx, api, 'guardrail-grounding', () => {
    const fresh = false,
      packet = groundingPacket(23),
      reveal = {
        delta: beat > 0 || abStarted(state, 'guardrails-beat-1-focus-4', progress2 > 0.7),
        upper:
          beat > 1 || (beat === 1 && abStarted(state, 'guardrails-bound-value', progress2 > 0.7)),
        pass: beat >= 2,
      };
    {
      writeExpansionText(
        ctx,
        api,
        'Grounding uncertainty can hold a favorable primary result',
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
        const progress = beat > 1 ? 1 : abCue(state, 'guardrails-bound-value', q),
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
          'HOLD AND INVESTIGATE',
          960,
          990,
          34,
          themeColors.yellow,
          'center',
        );
      else if (!reveal.upper) {
        if (abStarted(state, 'guardrails-beat-1-focus-1', progress2 > 0.1))
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
        if (abStarted(state, 'guardrails-beat-1-focus-2', progress2 > 0.3))
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
        if (abStarted(state, 'guardrails-beat-1-focus-3', progress2 > 0.6))
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
    }
  });
  return;
}
export default {
  id: 'guardrails',
  draw: drawGuardrails,
  cues: [
    'guardrails-beat-1-focus-1',
    'guardrails-beat-1-focus-2',
    'guardrails-beat-1-focus-3',
    'guardrails-beat-1-focus-4',
    'guardrails-upper',
    'guardrails-beat-2-focus-2',
    'guardrails-bound-value',
    'guardrails-beat-3-focus-1',
  ],
};
