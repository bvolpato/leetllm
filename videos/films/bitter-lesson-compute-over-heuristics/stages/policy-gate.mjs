import { sampleModel } from '../construction.mjs';
import { releaseGate } from '../model.mjs';
import { card, mechanismFocus, mechanismText, text, visualFocus } from '../defaults.mjs';
import assert from 'node:assert/strict';
function drawBranchOrder(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    extra = currentBeat === 3;
  if (!extra) return false;
  const { C: themeColors } = api;
  mechanismFocus(ctx, api, extra ? 'policy-gate-completion' : 'policy-gate-mechanism', () => {
    mechanismText(
      ctx,
      api,
      'Follow the actual branch order',
      960,
      275,
      40,
      themeColors.yellow,
      'center',
    );
    const rows = [
      ['latency / quality / access', 'return low-risk route', themeColors.blue],
      ['unknown route', 'human review', themeColors.pink],
      ['promote without report', 'request evidence', themeColors.yellow],
      ['promote with report', 'finite numeric 0..1, then score ≥ 0.95', themeColors.green],
    ];
    rows.forEach(([input, result, col], i) => {
      const y = 395 + i * 155;
      mechanismText(ctx, api, input, 260, y + 25, 31, col);
      api.arrow(ctx, 910, y + 10, 1050, y + 10, col, 4);
      mechanismText(ctx, api, result, 1170, y + 25, 28, col);
    });
    mechanismText(
      ctx,
      api,
      'Bool, string, NaN, infinity and out-of-range scores fail numeric validation',
      960,
      1040,
      29,
      themeColors.muted,
      'center',
    );
  });
  return true;
}
export function drawPolicyGate(ctx, scene, state, api) {
  if (drawBranchOrder(ctx, scene, state, api)) return;
  const { C: themeColors } = api;
  const modelState = sampleModel('policy-gate', state);
  {
    const source = card(ctx, api, 'Free-form request', 190, 390, 400, 95, themeColors.blue, 27);
    const model = visualFocus(ctx, api, 'policy-gate-object-learned-model-proposal-57', () =>
      card(ctx, api, 'Learned model · proposal', 690, 390, 500, 95, themeColors.cyan, 25),
    );
    const gate = visualFocus(ctx, api, 'policy-gate-object-independent-policy-gate-58', () =>
      card(ctx, api, 'Independent policy gate', 1290, 390, 440, 95, themeColors.yellow, 24),
    );
    visualFocus(ctx, api, 'policy-gate-artifact-checks', () => {
      card(ctx, api, 'C17 / r3 · bind artifact', 220, 520, 450, 65, themeColors.yellow, 23);
      card(ctx, api, 'principal · verify grant', 735, 520, 450, 65, themeColors.yellow, 23);
      card(ctx, api, 'report · score ≥0.95', 1250, 520, 450, 65, themeColors.yellow, 23);
    });
    api.connect(ctx, source, model, {
      color: themeColors.cyan,
      gap: 16,
    });
    api.connect(ctx, model, gate, {
      color: themeColors.yellow,
      gap: 16,
    });
    if (modelState.step > 0) {
      const failing = releaseGate(0),
        passing = releaseGate(1);
      visualFocus(ctx, api, 'policy-gate-object-0-91-report-present-human-review-59', () =>
        card(
          ctx,
          api,
          '0.91 · report present · human review',
          250,
          620,
          650,
          82,
          themeColors.pink,
          23,
        ),
      );
      card(
        ctx,
        api,
        '0.98 · report present · promotion eligible',
        980,
        620,
        690,
        82,
        themeColors.green,
        23,
      );
      if (
        modelState.step === 2 ||
        state.cues?.['policy-gate-beat-2-focus-1']?.phase === 'during' ||
        state.cues?.['policy-gate-beat-2-focus-1']?.phase === 'after'
      )
        visualFocus(ctx, api, 'policy-gate-object-0-98-report-missing-request-evidence-61', () =>
          card(
            ctx,
            api,
            '0.98 · report missing · request evidence',
            550,
            760,
            820,
            88,
            themeColors.yellow,
            24,
          ),
        );
      text(ctx, api, 'Threshold · 0.95', 960, 910, 28, themeColors.cyan, 'center');
      assert.equal(failing.decision, 'human review');
      assert.equal(passing.decision, 'eligible for promotion');
    } else
      card(
        ctx,
        api,
        'Action awaits a report and a measured score',
        460,
        660,
        1000,
        92,
        themeColors.yellow,
        26,
      );
    {
    }
  }
}
export default {
  id: 'policy-gate',
  draw: drawPolicyGate,
  cues: [
    'policy-gate-beat-1-focus-1',
    'policy-gate-beat-1-focus-2',
    'policy-gate-beat-2-focus-1',
    'policy-gate-beat-2-focus-2',
    'policy-gate-beat-3-focus-1',
    'policy-gate-core-completion',
  ],
};
