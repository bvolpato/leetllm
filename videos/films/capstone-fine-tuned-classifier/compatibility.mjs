import { clamp01 } from './arithmetic.mjs';
import { classifierCueProgress, sampleModel } from './construction.mjs';
import { card, text } from './defaults.mjs';
export function drawUnrecognizedScene(ctx, scene, state, api) {
  const ids = {
    'group-time-manifest': 'account-manifest',
    'baseline-contract': 'baseline-comparison',
    'stable-positive-score': 'stable-score',
    'embedding-backward': 'backpropagation',
    'tiny-training-run': 'tiny-training',
    'pretrained-encoder': 'pretrained-architecture',
    'training-inputs': 'training-admission',
    'checkpoint-export': 'checkpoint-export',
    'reload-contract': 'export-inventory',
    'selection-cost': 'selection-cost',
    'frozen-gate': 'frozen-gate',
    'receipt-schema': 'owned-receipt',
    'arithmetic-provenance': 'score-provenance',
    'actual-model-gate': 'model-comparison',
    'reliability-buckets': 'reliability',
    'invalid-comparison': 'finite-validation',
    'serving-policy': 'serving-contract',
    'pinned-handoff': 'handoff',
    'shadow-rollback': 'shadow-evidence',
    'fresh-intake': 'fresh-intake',
    fallback: 'fallback-cases',
    synthesis: 'model-contract',
  };
  if (scene.id in ids) {
    const { C, components: c, teaching: t } = api,
      b = state.beat ?? 0,
      raw = clamp01(state.beatP ?? 0),
      P = (id) => classifierCueProgress(state, id);
    api.focus.target(ids[scene.id], () => {});
    return;
  }
  {
    const { C, components: c, teaching: t } = api,
      s = sampleModel(state);
    const link = (a, b, color = C.cyan) =>
      t.transfer({
        source: {
          shape: a,
          opacity: 1,
        },
        target: {
          shape: b,
          opacity: 1,
        },
        color,
        progress: s.q,
        particle: {
          radius: 8,
          fill: C.yellow,
        },
      });
    const a = api.focus.target('model-contract', () =>
        card(ctx, api, 'Tokenizer + model + label guide', 170, 450, 670, C.blue),
      ),
      b = api.focus.target('route-contract', () =>
        card(ctx, api, 'Threshold + fallback + producer', 1070, 450, 670, C.green),
      );
    link(a, b);
    api.focus.target('authenticated-route', () =>
      text(
        ctx,
        api,
        'Bind the authenticated route to the current ticket and approved bundle',
        960,
        960,
        30,
        C.yellow,
        'center',
      ),
    );
  }
}
