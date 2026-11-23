import { SKEW_COUNTS } from '../fixtures.mjs';
import { trainingSkewSnapshot } from '../construction.mjs';
import { circle, link, math, node, packet, path, rect, text } from '../defaults.mjs';
export function drawTrainingSkew(ctx, scene, state, api) {
  const themeColors = api.C;
  const beat = state.beat ?? 0;
  const bp = api.clamp(state.beatP ?? 0, 0, 1);
  const colors = [themeColors.blue, themeColors.pink, themeColors.yellow, themeColors.green];
  const fade = api.components.fade;
  {
    const data = trainingSkewSnapshot(beat, bp);
    if (state.cues) {
      data.assigned = SKEW_COUNTS.map((n) =>
        Math.min(n, Math.ceil(n * api.focus.progress('assignment-skew', 0))),
      );
      const fraction = api.focus.progress('collect-gradients', 0);
      data.contributions = SKEW_COUNTS.map((n, i) =>
        Math.min(data.assigned[i], Math.ceil(n * fraction)),
      );
      data.collected = data.contributions.reduce((a, b) => a + b, 0);
      data.update = state.cues['update-experts']?.phase === 'after';
      data.possibleFeedback = state.cues['feedback-loop']?.phase === 'after';
      data.stage = data.possibleFeedback ? 2 : data.update ? 1 : 0;
    }
    api.focus.target('training-skew-20-tokens-top-1-assignments', () =>
      text(ctx, api, '20 TOKENS · TOP-1 ASSIGNMENTS', 960, 270, 30, themeColors.muted, 'center'),
    );
    const expertNodes = [];
    for (let expert = 0; expert < 4; expert += 1) {
      const x = 330 + expert * 420;
      const box = api.focus.target('training-skew-box', () =>
        node(
          ctx,
          api,
          {
            x: x - 150,
            y: 320,
            width: 300,
            height: 250,
          },
          '',
          colors[expert],
        ),
      );
      expertNodes.push(box);
      api.focus.target('training-skew-readout', () =>
        text(ctx, api, 'E' + (expert + 1), x, 365, 34, colors[expert], 'center'),
      );
      for (let j = 0; j < data.assigned[expert]; j += 1) {
        const col = j % 4,
          row = Math.floor(j / 4);
        api.focus.target('training-assigned-rows', () =>
          circle(
            ctx,
            api,
            x - 90 + col * 60,
            410 + row * 46,
            16,
            colors[expert],
            themeColors.bg,
            2,
          ),
        );
      }
      api.focus.target('training-assigned-rows', () =>
        text(ctx, api, data.assigned[expert] + ' / 20 rows', x, 548, 25, colors[expert], 'center'),
      );
      api.focus.target('training-contributions', () =>
        text(
          ctx,
          api,
          data.contributions[expert] +
            (data.contributions[expert] === 1
              ? ' gradient term collected'
              : ' gradient terms collected'),
          x,
          665,
          23,
          data.contributions[expert] ? themeColors.ink : themeColors.muted,
          'center',
        ),
      );
      for (let j = 0; j < SKEW_COUNTS[expert]; j++)
        api.focus.target('training-contributions', () =>
          rect(
            ctx,
            api,
            x - 138 + j * 23,
            608,
            18,
            20,
            j < data.contributions[expert] ? colors[expert] : themeColors.panel,
            colors[expert],
            2,
          ),
        );
      if (beat >= 1) api.arrow(ctx, x, 582, x, 600, colors[expert], 3);
    }
    api.focus.target('training-skew-readout-4', () =>
      math(
        ctx,
        api,
        String.raw`g_e=\frac{1}{20}\sum_{t:\,r(t)=e}\nabla_{\theta_e}\ell_t`,
        565,
        745,
        37,
        themeColors.ink,
        'center',
      ),
    );
    api.focus.target('training-skew-readout-5', () =>
      math(
        ctx,
        api,
        String.raw`\theta_e\leftarrow\theta_e-\eta g_e`,
        1410,
        745,
        39,
        data.update ? themeColors.yellow : themeColors.muted,
        'center',
      ),
    );
    api.focus.target('training-skew-full-batch-gradient-rule', () =>
      text(ctx, api, 'Full-batch gradient rule', 565, 790, 25, themeColors.muted, 'center'),
    );
    api.focus.target('training-skew-schematic-parameter-update', () =>
      text(ctx, api, 'Schematic parameter update', 1410, 790, 25, themeColors.muted, 'center'),
    );
    const stages = [
      api.focus.target('gradient-reduction', () =>
        node(
          ctx,
          api,
          {
            x: 160,
            y: 835,
            width: 430,
            height: 85,
          },
          'Sum task gradients',
          data.stage === 0 ? themeColors.yellow : themeColors.cyan,
          35,
        ),
      ),
      api.focus.target('expert-update', () =>
        node(
          ctx,
          api,
          {
            x: 745,
            y: 835,
            width: 430,
            height: 85,
          },
          'Update experts',
          data.update ? themeColors.yellow : themeColors.muted,
          35,
        ),
      ),
      api.focus.target('future-router', () =>
        node(
          ctx,
          api,
          {
            x: 1330,
            y: 835,
            width: 430,
            height: 85,
          },
          'Future routing',
          data.possibleFeedback ? themeColors.pink : themeColors.muted,
          35,
        ),
      ),
    ];
    const first = link(
      ctx,
      api,
      stages[0],
      stages[1],
      data.update ? themeColors.yellow : themeColors.muted,
      3,
    );
    const second = link(
      ctx,
      api,
      stages[1],
      stages[2],
      data.possibleFeedback ? themeColors.pink : themeColors.muted,
      3,
    );
    if (beat === 1 && bp > 0.165 && bp < 0.27)
      packet(ctx, api, [first.from, first.to], api.phase(bp, 0.165, 0.27), themeColors.yellow, 8);
    if (beat === 1 && bp > 0.59 && bp < 0.73)
      packet(ctx, api, [second.from, second.to], api.phase(bp, 0.59, 0.73), themeColors.pink, 8);
    if (data.possibleFeedback) {
      const feedback = [
        {
          x: 1545,
          y: 827,
        },
        {
          x: 1545,
          y: 813,
        },
        {
          x: 1805,
          y: 813,
        },
        {
          x: 1805,
          y: 300,
        },
        {
          x: 330,
          y: 300,
        },
        {
          x: 330,
          y: 310,
        },
      ];
      path(ctx, api, feedback, themeColors.pink, 2);
      api.arrow(ctx, 330, 293, 330, 312, themeColors.pink, 3);
      if (beat === 1 && bp < 0.94)
        packet(ctx, api, feedback, api.phase(bp, 0.65, 0.94), themeColors.pink, 6);
    }
    api.focus.target('training-skew-readout-6', () =>
      text(
        ctx,
        api,
        data.possibleFeedback
          ? 'Possible feedback: better task performance can attract future assignments.'
          : 'Collected terms: ' +
              data.collected +
              ' / 20 · task gradients use the actual assigned rows.',
        960,
        970,
        28,
        data.possibleFeedback ? themeColors.pink : themeColors.ink,
        'center',
      ),
    );
    api.focus.target('training-skew-readout-7', () =>
      text(
        ctx,
        api,
        beat < 2
          ? 'SCHEMATIC CAUSAL STAGES · future routing depends on learning and data'
          : 'Observe later batches: executed assignments + expert functions + held-out quality',
        960,
        1020,
        25,
        themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'training-skew',
  draw: drawTrainingSkew,
  cues: [
    'assignment-skew',
    'unequal-gradients',
    'collect-gradients',
    'update-experts',
    'feedback-loop',
    'later-batches',
    'expert-quality',
  ],
};
