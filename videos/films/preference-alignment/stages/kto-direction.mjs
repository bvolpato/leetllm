import { prefBound, prefLerp, sigmoid } from '../arithmetic.mjs';
import {
  caption,
  constructionEquation,
  constructionText,
  focusTarget,
  functionCurve,
  heading,
} from '../defaults.mjs';
export function drawKtoDirection(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = prefBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const cue = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared cue kto-direction/' + id);
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
  const construction = () => {
    heading(ctx, api, 'Same single response · detached z = 0.2 · β = 0.5 · unit weights');
    const r = currentBeat < 2 ? 1 : prefLerp(1, 2, cueProgress('pa-kto-move', 2)),
      good = (x) => 1 - sigmoid(0.5 * (x - 0.2)),
      bad = (x) => 1 - sigmoid(0.5 * (0.2 - x)),
      plot = functionCurve(ctx, api, good, [-1, 3], [0, 1], 260, 430, 1090, 410, themeColors.green);
    teaching.curve({
      plot,
      points: Array.from(
        {
          length: 121,
        },
        (_, i) => {
          const x = -1 + i / 30;
          return {
            x,
            y: bad(x),
          };
        },
      ),
      color: themeColors.pink,
      width: 5,
      progress: 1,
    });
    constructionText(ctx, api, 'desirable label', 1410, 435, 30, themeColors.green);
    constructionText(ctx, api, 'undesirable label', 1410, 550, 30, themeColors.pink);
    if (currentBeat > 0) {
      teaching.scatter({
        plot,
        points: [
          {
            x: r,
            y: good(r),
            color: themeColors.green,
            radius: 12,
          },
          {
            x: r,
            y: bad(r),
            color: themeColors.pink,
            radius: 12,
          },
        ],
      });
      constructionText(ctx, api, 'r = ' + r.toFixed(3), 1410, 675, 33, themeColors.yellow);
      constructionText(ctx, api, 'Lgood = ' + good(r).toFixed(3), 1410, 780, 31, themeColors.green);
      constructionText(ctx, api, 'Lbad = ' + bad(r).toFixed(3), 1410, 885, 31, themeColors.pink);
    }
    constructionEquation(
      ctx,
      api,
      String.raw`L_+=1-\sigma(\beta(r-z))\quad L_-=1-\sigma(\beta(z-r))`,
      960,
      345,
      35,
      themeColors.cyan,
    );
    caption(
      ctx,
      api,
      'A click’s semantics, reference-point estimator, class weights and sample selection still need review.',
    );
    return;
  };
  focusTarget(ctx, api, 'kto-direction-construction', construction);
}
export default {
  id: 'kto-direction',
  draw: drawKtoDirection,
  cues: ['kto-direction-b0', 'kto-direction-b1', 'kto-direction-b2', 'pa-kto-move'],
};
