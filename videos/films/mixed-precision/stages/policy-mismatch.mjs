import { policyPrecisionFixture } from '../fixtures.mjs';
import { completed, operation } from '../construction.mjs';
import { text, valueBox, movingValue } from '../defaults.mjs';

export function drawPolicyMismatch(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const fixture = policyPrecisionFixture();
  api.focus.target('policy-mismatch-mechanism', () => {
    const recap = beat > 1;
    const ready = (id) => recap || (beat === 1 && completed(state, id));
    const amount = (id) => (recap ? 1 : beat === 1 ? operation(state, id) : 0);
    const cast = amount('policy-rounded-logits');
    text(
      ctx,
      api,
      'Same logits [1, 1.002]   ·   Same uniform draw 0.49975',
      960,
      280,
      34,
      C.yellow,
      'center',
    );
    valueBox(ctx, api, 'FP32 logits [1, 1.002]', 180, 350, 680, C.blue, 30);
    valueBox(
      ctx,
      api,
      ready('policy-rounded-logits') ? 'BF16 logits [1, 1]' : 'Round the logits to BF16',
      1060,
      350,
      680,
      ready('policy-rounded-logits') ? C.pink : C.muted,
      30,
    );
    api.arrow(ctx, 890, 395, 1030, 395, C.muted, 3);
    movingValue(ctx, api, [890, 395], [1030, 395], cast, C.pink);
    const x = (v) => 320 + ((v - 0.4994) / 0.0007) * 1320;
    const u = x(fixture.uniform);
    api.line(ctx, u, 495, u, 925, C.yellow, 3);
    text(ctx, api, 'same u', u, 475, 26, C.yellow, 'center');
    text(ctx, api, 'Magnified P(action 0): [0.4994, 0.5001]', 320, 500, 24, C.muted);
    const rows = [
      [
        'FP32',
        fixture.wideProbability,
        fixture.wideAction,
        'policy-wide-probability',
        'policy-wide-action',
        C.blue,
      ],
      [
        'BF16',
        fixture.roundedProbability,
        fixture.roundedAction,
        'policy-rounded-probability',
        'policy-rounded-action',
        C.pink,
      ],
    ];
    rows.forEach(([name, probability, action, probCue, actionCue, color], i) => {
      const y = 585 + i * 255;
      api.line(ctx, 320, y, 1640, y, C.muted, 3);
      for (const probabilityTick of [0.4994, 0.4996, 0.4998, 0.5, 0.5001]) {
        const tickX = x(probabilityTick);
        api.line(ctx, tickX, y - 6, tickX, y + 6, C.muted, 2);
        text(ctx, api, probabilityTick.toFixed(4), tickX, y + 60, 20, C.muted, 'center');
      }
      const build = amount(probCue);
      if (build > 0) {
        const threshold = x(0.4994 + (probability - 0.4994) * build);
        api.line(ctx, threshold, y - 34, threshold, y + 34, color, 5);
      }
      text(
        ctx,
        api,
        ready(probCue)
          ? `${name}: P(action 0) = ${probability.toFixed(6)}`
          : `${name}   P(action 0) = ?`,
        380,
        y + 105,
        28,
        ready(probCue) ? color : C.muted,
      );
      text(
        ctx,
        api,
        ready(actionCue) ? `select action ${action}` : 'Action ?',
        1480,
        y + 105,
        31,
        ready(actionCue) ? color : C.muted,
        'center',
      );
      const comparison = amount(actionCue);
      if (comparison > 0) {
        api.line(
          ctx,
          x(probability),
          y - 22,
          x(probability) + (u - x(probability)) * comparison,
          y - 22,
          color,
          3,
        );
        api.circle(ctx, u, y - 22, 8, C.yellow);
      }
    });
    text(
      ctx,
      api,
      ready('policy-rounded-action')
        ? 'The same draw lies on opposite sides of the two thresholds'
        : 'Below P(action 0), choose action 0. Otherwise choose action 1.',
      960,
      1040,
      28,
      C.muted,
      'center',
    );
  });
}
export default {
  id: 'policy-mismatch',
  draw: drawPolicyMismatch,
  cues: [
    'policy-mismatch-b1',
    'policy-mismatch-b2',
    'policy-wide-probability',
    'policy-wide-action',
    'policy-rounded-logits',
    'policy-rounded-probability',
    'policy-rounded-action',
    'policy-mismatch-b3',
  ],
};
