import { fittedEtaFixture } from '../fixtures.mjs';
import { L, box, cue, foot, head, text } from '../defaults.mjs';
export function drawArtifactReplay(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api;
  const seen = (id) => cue(ctx, api, id) > 0;
  api.focus.target('artifact-replay-construction', () => {
    if (currentBeat === 0) {
      head(ctx, api, 'Replay S-133 with the training means, scales and weights');
      const f = fittedEtaFixture(),
        n = seen('reloaded-dot') ? 5 : Math.max(1, Math.ceil(progress * 5));
      for (let i = 0; i < n; i++) {
        const y = 380 + i * 110;
        text(
          ctx,
          api,
          ['scan age', 'backlog', 'tier', 'elapsed', 'promise remaining'][i],
          160,
          y + 39,
          28,
          themeColors.blue,
        );
        text(
          ctx,
          api,
          '(' + f.input[i].toFixed(3) + '−' + f.mean[i].toFixed(3) + ') /' + f.scale[i].toFixed(3),
          720,
          y + 39,
          28,
          themeColors.cyan,
        );
        text(ctx, api, '×' + f.weights[i].toFixed(3), 1510, y + 39, 29, themeColors.yellow);
        L(ctx, api, 140, y + 75, 1760, y + 75, themeColors.muted, 1);
      }
      foot(ctx, api, 'Feature order, scaler, coefficients, intercepts and policy travel together');
    } else if (currentBeat === 1) {
      head(ctx, api, 'Artifact validation before any reloaded score');
      [
        ['schema + feature order', 'expected ordered names'],
        ['vector shapes + finite types', 'five aligned numeric entries'],
        ['scales', 'finite strictly positive'],
        ['threshold', 'finite probability from 0 to 1'],
      ].forEach(([k, v], i) => {
        text(ctx, api, k, 170, 420 + i * 145, 30, themeColors.blue);
        box(ctx, api, v, 990, 370 + i * 145, 790, themeColors.cyan);
      });
      foot(ctx, api, 'Check artifact provenance and retain a dependency lock');
    } else if (currentBeat === 2) {
      head(ctx, api, 'Policy-envelope validation precedes freshness and threshold');
      [
        ['UTC snapshot / model / feature identity', 'match trusted envelope'],
        ['tier / finite nonnegative ages', 'pass their own limits'],
        [
          'risk field',
          seen('boolean-score')
            ? 'Boolean or nonfinite → invalid risk'
            : 'finite real probability required',
        ],
      ].forEach(([k, v], i) => {
        text(ctx, api, k, 150, 430 + i * 190, 29, themeColors.blue);
        box(ctx, api, v, 1000, 380 + i * 190, 790, i === 2 ? themeColors.pink : themeColors.cyan);
      });
      foot(ctx, api, 'Trace the feature contract, model fingerprint and threshold policy ID');
    } else {
      const removed = api.focus.cue('trace-remove')?.phase === 'after';
      const checked = api.focus.cue(removed ? 'trace-fail' : 'trace-pass')?.phase === 'after';
      const fields = [
        ['feature_contract_id', 'eta-features-v1'],
        ['expected_feature_contract_id', 'eta-features-v1'],
        ['model_id', 'frozen-score-fixture-v1'],
        ['expected_model_id', 'frozen-score-fixture-v1'],
        ['threshold_policy_id', removed ? null : 'eta-threshold-v1'],
      ];
      head(ctx, api, 'O-201    /    Noon response    /    Supplied risk 0.62');
      for (const [i, [key, value]] of fields.entries()) {
        const y = 390 + i * 82;
        api.text(ctx, key, 160, y, 32, themeColors.muted, 'left', 'mono');
        api.text(
          ctx,
          value ?? '(field missing)',
          950,
          y,
          34,
          value ? themeColors.blue : themeColors.pink,
          'left',
          'mono',
        );
      }
      L(ctx, api, 155, 764, 1765, 764, themeColors.muted, 2);
      api.text(
        ctx,
        'all(trace.get(key) for key in trace_keys)',
        160,
        855,
        35,
        themeColors.ink,
        'left',
        'mono',
      );
      const complete = fields.every(([, value]) => Boolean(value));
      const result = checked ? (complete ? 'True' : 'False') : '?';
      api.text(
        ctx,
        result,
        1590,
        856,
        48,
        checked ? (complete ? themeColors.green : themeColors.pink) : themeColors.yellow,
        'center',
        'mono',
      );
      foot(
        ctx,
        api,
        removed && !checked
          ? 'Does this trace still pass the version check?'
          : 'The check requires a nonempty value for each release identifier.',
      );
    }
  });
}
export default {
  id: 'artifact-replay',
  draw: drawArtifactReplay,
  cues: [
    'reloaded-dot',
    'artifact-validation',
    'boolean-score',
    'trace-pass',
    'trace-remove',
    'trace-fail',
  ],
};
