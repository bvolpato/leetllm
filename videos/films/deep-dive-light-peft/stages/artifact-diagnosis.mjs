import { spokenProgress } from '../model.mjs';
import {
  chapterFooter,
  chapterPanel,
  chapterSubtitle,
  chapterText,
  focusScope,
} from '../defaults.mjs';
export function drawArtifactDiagnosis(ctx, scene, state, api) {
  const themeColors = {
      ...api.C,
      purple: '#b7a2f7',
    },
    beat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const q = (id, fallback = progress) => spokenProgress(state, id, fallback),
    done = (id) => q(id) >= 0.98;
  {
    if (beat === 0) {
      chapterSubtitle(ctx, api, themeColors, 'Find the first broken contract');
      focusScope(ctx, api, 'lp-diagnosis', () => {
        const index = done('lp-axis-error') ? 2 : done('lp-key-error') ? 1 : 0;
        const rows = [
          ['records', 'missing .npy → estimate path / producer'],
          ['placement', 'key mismatch → base / targets / reserved keys'],
          ['dimensions', 'product mismatch → selected axes / receiver'],
        ];
        rows.forEach(([k, v], i) => {
          chapterPanel(
            ctx,
            api,
            themeColors,
            k,
            170,
            365 + i * 190,
            350,
            110,
            i === index ? themeColors.pink : themeColors.muted,
            33,
          );
          chapterText(
            ctx,
            api,
            themeColors,
            v,
            650,
            435 + i * 190,
            31,
            i === index ? themeColors.pink : themeColors.muted,
          );
        });
      });
    } else if (beat === 1) {
      chapterSubtitle(
        ctx,
        api,
        themeColors,
        'Run the boundary before spending the long continuation',
      );
      focusScope(ctx, api, 'lp-probes', () => {
        [
          'baseline forward + backward',
          'estimate + inspect records',
          'surgical rebuild + load',
          'post-pruning batch',
        ].forEach((s, i) => {
          chapterPanel(
            ctx,
            api,
            themeColors,
            String(i + 1),
            250,
            350 + i * 140,
            90,
            85,
            themeColors.cyan,
            34,
          );
          chapterText(ctx, api, themeColors, s, 440, 405 + i * 140, 33, themeColors.cyan);
        });
      });
    } else {
      chapterSubtitle(
        ctx,
        api,
        themeColors,
        'Hash identity and trusted origin answer different questions',
      );
      focusScope(ctx, api, 'lp-trust', () => {
        chapterPanel(
          ctx,
          api,
          themeColors,
          'pickle / old Torch loader',
          250,
          390,
          1420,
          130,
          themeColors.pink,
          36,
        );
        chapterText(
          ctx,
          api,
          themeColors,
          'hash → identifies bytes',
          520,
          680,
          34,
          themeColors.cyan,
          'center',
        );
        chapterText(
          ctx,
          api,
          themeColors,
          'approved producer → trust boundary',
          1340,
          680,
          33,
          themeColors.yellow,
          'center',
        );
      });
    }
    chapterFooter(
      ctx,
      api,
      themeColors,
      'The standard-library examples test selected-index algebra, not a trained Transformer.',
    );
  }
}
export default {
  id: 'artifact-diagnosis',
  draw: drawArtifactDiagnosis,
  cues: [
    'lp-missing-file',
    'lp-key-error',
    'lp-axis-error',
    'lp-batch-probes',
    'lp-trusted-source',
  ],
};
