import { box, cue, foot, head, textLabel } from '../defaults.mjs';
export function drawFeatureAudit(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    { C: themeColors } = api;
  const seen = (id) => cue(ctx, api, id) > 0,
    done = (id) => cue(ctx, api, id) === 1;
  api.focus.target('feature-audit-construction', () => {
    if (currentBeat === 0) {
      head(ctx, api, 'Candidate label: credential-related behavior');
      const rows = [
        'benign credentials / calm',
        'harmful credentials / calm',
        'benign credentials / urgent',
        'harmful credentials / urgent',
      ];
      rows
        .slice(0, seen('audit-counterexamples') ? 4 : 2)
        .forEach((s, i) =>
          box(ctx, api, s, 280, 370 + i * 135, 1360, i % 2 ? themeColors.pink : themeColors.blue),
        );
      foot(
        ctx,
        api,
        'Vary urgency separately; add translations, low activations and non-activating controls',
      );
    } else if (currentBeat === 1) {
      head(ctx, api, 'Readable explanations generate hypotheses');
      if (!seen('audit-nla')) {
        [
          ['trained model', 'aggregate explanation / reconstruction'],
          ['randomized or initialization model', 'matched null-model comparison'],
        ].forEach(([a, z], i) => {
          box(ctx, api, a, 150, 420 + i * 230, 750, i ? themeColors.pink : themeColors.blue);
          textLabel(ctx, api, z, 1050, 480 + i * 230, 28, themeColors.yellow);
        });
      } else {
        const a = box(ctx, api, 'activation', 140, 500, 440, themeColors.blue),
          text = box(ctx, api, 'verbalized text', 740, 500, 440, themeColors.yellow),
          z = box(ctx, api, 'activation', 1340, 500, 440, themeColors.cyan);
        api.connect(ctx, a, text, {
          color: themeColors.yellow,
          gap: 20,
        });
        api.connect(ctx, text, z, {
          color: themeColors.cyan,
          gap: 20,
        });
        textLabel(
          ctx,
          api,
          'Natural language autoencoder',
          960,
          380,
          35,
          themeColors.yellow,
          'center',
        );
        textLabel(
          ctx,
          api,
          'Can infer or confabulate; not a verified reasoning transcript',
          960,
          820,
          31,
          themeColors.pink,
          'center',
        );
      }
      foot(
        ctx,
        api,
        'Null-model results motivate targeted causal tests; they do not make every feature meaningless',
      );
    } else {
      const preserve = done('fresh-error-preserving'),
        discard = done('fresh-reconstruction-only');
      head(ctx, api, 'Fresh input x=[2,0.04] · reconstruction[2,0] · feature[2,0]');
      box(ctx, api, 'original score: 50 ×0.04 =2', 180, 375, 1560, themeColors.blue);
      box(
        ctx,
        api,
        preserve
          ? 'error-preserving edit: [0,0.04] → score2'
          : 'Predict: remove the feature, keep the residual',
        180,
        575,
        1560,
        preserve ? themeColors.green : themeColors.yellow,
      );
      if (discard)
        box(ctx, api, 'reconstruction-only edit: [0,0] → score0', 180, 775, 1560, themeColors.pink);
      foot(
        ctx,
        api,
        'Replicate the specified prediction with held-out prompts, controls and acceptable collateral effects',
      );
    }
  });
}
export default {
  id: 'feature-audit',
  draw: drawFeatureAudit,
  cues: [
    'feature-audit-b0',
    'audit-counterexamples',
    'feature-audit-b1',
    'audit-null-models',
    'audit-nla',
    'feature-audit-b2',
    'fresh-error-preserving',
    'fresh-reconstruction-only',
  ],
};
