import { prefBound } from '../arithmetic.mjs';
import { alignmentTilt } from '../model.mjs';
import {
  caption,
  constructionEquation,
  constructionText,
  focusTarget,
  functionCurve,
  heading,
  table,
} from '../defaults.mjs';
export function drawOptimalPolicy(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = prefBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const cue = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared cue optimal-policy/' + id);
    return cue
      ? cue.phase === 'before'
        ? 0
        : cue.phase === 'after'
          ? 1
          : prefBound(cue.progress)
      : currentBeat < beat
        ? 0
        : currentBeat > beat
          ? 1
          : prefBound((progress - 0.12) / 0.76);
  };
  const resultComplete = (id, beat = currentBeat) => cueProgress(id, beat) >= 1 - 1e-8;
  const construction = () => {
    if (currentBeat < 2) {
      const tilt = alignmentTilt(),
        masses = currentBeat > 0 && resultComplete('pa-tilt-masses', 1),
        normalized = currentBeat > 0 && resultComplete('pa-tilt-normalize', 1);
      heading(ctx, api, 'Fixed prompt · β = 1 · reference support retained');
      table(
        ctx,
        api,
        ['answer', 'reference', 'reward', 'reference × exp(r/β)'],
        [
          ['A', '0.5', 'ln 3', masses ? '1.5' : '?'],
          ['B', '0.5', '0', masses ? '0.5' : '?'],
        ],
        170,
        410,
        1560,
        150,
      );
      if (masses) {
        constructionText(
          ctx,
          api,
          'Z = 1.5 + 0.5 = ' + tilt.partition.toFixed(1),
          960,
          805,
          37,
          themeColors.yellow,
          'center',
        );
        if (normalized) {
          focusTarget(ctx, api, 'pa-tilt-probabilities', () =>
            teaching.bars({
              x: 500,
              y: 840,
              width: 900,
              height: 90,
              values: tilt.probabilities,
              labels: ['A', 'B'],
              colors: [themeColors.green, themeColors.pink],
              max: 1,
              showValues: true,
              format: (x) => x.toFixed(2),
              progress: 1,
              fontSize: 29,
            }),
          );
        }
      }
      constructionEquation(
        ctx,
        api,
        String.raw`\pi^*(y|x)={\pi_{\rm ref}(y|x)\exp(r/\beta)\over Z(x)}`,
        960,
        340,
        38,
        themeColors.cyan,
      );
      caption(
        ctx,
        api,
        normalized
          ? 'Normalization produces a distribution, not a convergence guarantee.'
          : 'The proportional masses are not probabilities until divided by the same Z.',
      );
    } else {
      heading(ctx, api, 'Candidate objective reaches its maximum at the tilted distribution');
      const r = [Math.log(3), 0],
        fn = (a) => {
          const p = [a, 1 - a];
          return p.reduce((s, v, i) => s + v * r[i] - (v === 0 ? 0 : v * Math.log(v / 0.5)), 0);
        },
        plot = functionCurve(ctx, api, fn, [0.001, 0.999], [-0.7, 0.8], 270, 410, 1120, 410),
        q = 0.75;
      focusTarget(ctx, api, 'pa-tilt-optimum', () => {
        teaching.scatter({
          plot,
          points: [
            {
              x: q,
              y: fn(q),
              radius: 12,
              color: themeColors.green,
            },
          ],
        });
        constructionText(ctx, api, 'π*(A) = 0.75', 1450, 510, 32, themeColors.green);
        constructionText(ctx, api, 'β ln Z = ln 2', 1450, 650, 30, themeColors.yellow);
      });
      constructionEquation(
        ctx,
        api,
        String.raw`J(\pi)=-\beta D_{\rm KL}(\pi\Vert\pi^*)+\beta\ln Z`,
        960,
        920,
        39,
        themeColors.cyan,
      );
      caption(
        ctx,
        api,
        'Positive β, finite Z and policy support inside the reference are required.',
      );
    }
    return;
  };
  focusTarget(ctx, api, 'optimal-policy-construction', construction);
}
export default {
  id: 'optimal-policy',
  draw: drawOptimalPolicy,
  cues: [
    'optimal-policy-b0',
    'optimal-policy-b1',
    'pa-tilt-masses',
    'pa-tilt-normalize',
    'optimal-policy-b2',
  ],
};
