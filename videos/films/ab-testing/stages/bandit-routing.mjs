import { abClamp } from '../arithmetic.mjs';
import { AB_VISUAL_FIXTURES } from '../fixtures.mjs';
import { abCue, abStarted } from '../construction.mjs';
import { abExtendedScenes } from '../model.mjs';
import {
  drawExpansionBox,
  drawExpansionCell,
  drawExpansionNote,
  drawExpansionPath,
  drawExpansionPlot,
  withExpansionFocus,
  writeExpansionText,
} from '../defaults.mjs';
export function drawBanditRouting(ctx, scene, state, api) {
  const beat = state.beat ?? 0,
    progress = abClamp(state.beatP ?? 0),
    q = progress * progress * (3 - 2 * progress);
  if (!abExtendedScenes.has('bandit-routing')) return;
  const { C: themeColors, components: components } = api;
  withExpansionFocus(ctx, api, 'bandit-routing-mechanism', () => {
    if (beat === 0) {
      writeExpansionText(
        ctx,
        api,
        'Thompson sampling: draw possible rates, then choose the larger',
        960,
        280,
        34,
        themeColors.blue,
        'center',
      );
      const r = AB_VISUAL_FIXTURES.bandit.pullTrace[0],
        ready = abStarted(state, 'bandit-sample', progress > 0.55),
        chart = drawExpansionPlot(
          ctx,
          api,
          250,
          390,
          1390,
          340,
          [0, 1],
          [0, 2],
          [0, 0.25, 0.5, 0.75, 1],
          [0, 1, 2],
          'success probability',
          'Beta density',
        );
      const updated = abCue(state, 'bandit-sample', q) >= 1;
      drawExpansionPath(
        ctx,
        api,
        [chart.point(0, 1), chart.point(1, 1)],
        updated ? themeColors.pink : themeColors.cyan,
        4,
        chart.bounds,
      );
      if (updated)
        drawExpansionPath(
          ctx,
          api,
          Array.from(
            {
              length: 51,
            },
            (_, i) => chart.point(i / 50, 2 * (1 - i / 50)),
          ),
          themeColors.blue,
          5,
          chart.bounds,
        );
      writeExpansionText(
        ctx,
        api,
        updated ? 'After supplied failure: C Beta(1,2) · T Beta(1,1)' : 'Both start Beta(1,1)',
        960,
        335,
        30,
        themeColors.ink,
        'center',
      );
      if (ready) {
        for (const [value, color] of [
          [r.sampleControl, themeColors.blue],
          [r.sampleTreatment, themeColors.pink],
        ]) {
          const dot = chart.point(value, 1);
          api.circle(ctx, dot.x, dot.y, 14, color);
        }
        writeExpansionText(
          ctx,
          api,
          'Draws: control ' +
            r.sampleControl.toFixed(3) +
            ' · treatment ' +
            r.sampleTreatment.toFixed(3),
          960,
          880,
          33,
          themeColors.yellow,
          'center',
        );
      }
      if (abCue(state, 'bandit-sample', q) >= 1)
        writeExpansionText(
          ctx,
          api,
          'First actual toy pull chooses CONTROL · failure → Beta(1,2)',
          960,
          950,
          32,
          themeColors.blue,
          'center',
        );
      drawExpansionNote(
        ctx,
        api,
        'Samples were drawn before the update. This is the article’s first seeded toy pull, not a production incident outcome.',
      );
    } else if (beat === 1) {
      const data = AB_VISUAL_FIXTURES.bandit;
      writeExpansionText(
        ctx,
        api,
        'The actual seeded immediate-reward toy routes 2,000 pulls',
        960,
        280,
        34,
        themeColors.blue,
        'center',
      );
      drawExpansionBox(ctx, api, 210, 390, 1500, 110, themeColors.muted);
      if (abStarted(state, 'bandit-count', progress > 0.2)) {
        components.panel({
          x: 210,
          y: 390,
          width: (1500 * data.controlPulls) / 2000,
          height: 110,
          fill: themeColors.blue,
          stroke: themeColors.blue,
          radius: 0,
        });
        components.panel({
          x: 210 + (1500 * data.controlPulls) / 2000,
          y: 390,
          width: (1500 * data.treatmentPulls) / 2000,
          height: 110,
          fill: themeColors.pink,
          stroke: themeColors.pink,
          radius: 0,
        });
        writeExpansionText(ctx, api, '463 control', 390, 560, 32, themeColors.blue, 'center');
        writeExpansionText(
          ctx,
          api,
          '1,537 treatment · 76.8%',
          1280,
          560,
          32,
          themeColors.pink,
          'center',
        );
      }
      data.pullTrace.forEach((r, i) =>
        drawExpansionCell(
          ctx,
          api,
          i + 1 + ': ' + (r.chosen === 'control' ? 'C' : 'T') + ' / ' + r.reward,
          230 + (i % 6) * 255,
          665 + Math.floor(i / 6) * 105,
          210,
          75,
          r.chosen === 'control' ? themeColors.blue : themeColors.pink,
          27,
        ),
      );
      drawExpansionNote(
        ctx,
        api,
        'First 12 recorded choices/rewards are retained. Real incident routing must hold follow-ups and wait for mature outcomes.',
      );
    } else {
      writeExpansionText(
        ctx,
        api,
        'Adaptive reward collection needs policy-aware inference',
        960,
        280,
        35,
        themeColors.blue,
        'center',
      );
      drawExpansionCell(
        ctx,
        api,
        'New incident → one policy\nfollow-ups reuse its arm',
        200,
        400,
        700,
        160,
        themeColors.cyan,
        33,
      );
      drawExpansionCell(
        ctx,
        api,
        'Wait for outcome window\nthen update the reward state',
        1020,
        400,
        700,
        160,
        themeColors.yellow,
        32,
      );
      drawExpansionCell(
        ctx,
        api,
        'Retain assignment probabilities\ncontinued exploration',
        200,
        700,
        700,
        150,
        themeColors.blue,
        32,
      );
      drawExpansionCell(
        ctx,
        api,
        'Separate grounding + latency gates\nresolution reward is incomplete',
        1020,
        700,
        700,
        150,
        themeColors.pink,
        31,
      );
      drawExpansionNote(
        ctx,
        api,
        'Adaptive sample sizes and stopping alter the inference procedure. The allocation is not a measured fixed-routing recovery gain.',
      );
    }
  });
  return;
}
export default {
  id: 'bandit-routing',
  draw: drawBanditRouting,
  cues: [
    'bandit-routing-step-1',
    'bandit-sample',
    'bandit-routing-step-2',
    'bandit-count',
    'bandit-routing-step-3',
  ],
};
