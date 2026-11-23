import { clamp, cueDone } from '../construction.mjs';
import { classificationSet } from '../model.mjs';
import { caption, equation, line, text } from '../defaults.mjs';
export function drawClassifierScore(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cues = state.cues;
  const done = (id, beat, at = 0.7) =>
    currentBeat > beat || (currentBeat === beat && cueDone(cues, id, progress >= at));
  const paint = () => {
    const probs = currentBeat === 2 ? [0.25, 0.25, 0.25, 0.25] : [0.98, 0.01, 0.005, 0.005],
      answer =
        currentBeat === 2 ? done('cf-softmax-empty', 2, 0.3) : done('cf-softmax-set', 1, 0.8),
      selected = classificationSet(probs, 'softmax', 0.4);
    text(ctx, api, 'calibration: true-label scores', 460, 310, 29, themeColors.muted, 'center');
    for (let i = 0; i < 9; i++) {
      const prob = 0.55 + 0.05 * i,
        yy = 360 + i * 53;
      text(ctx, api, `C${i + 1}`, 180, yy, 24, themeColors.muted);
      text(
        ctx,
        api,
        `1 − ${prob.toFixed(2)} = ${(1 - prob).toFixed(2)}`,
        370,
        yy,
        26,
        themeColors.cyan,
      );
    }
    const calibrated = done('cf-softmax-threshold', 1, 0.5);
    if (calibrated) text(ctx, api, 'separate q = 0.4', 440, 900, 31, themeColors.yellow, 'center');
    const pl = teaching.axes({
      x: 950,
      y: 410,
      width: 620,
      height: 390,
      xDomain: [-0.5, 3.5],
      yDomain: [0, 1],
      xTicks: [0, 1, 2, 3],
      yTicks: [0, 0.6, 1],
      xLabel: 'class label',
      yLabel: '',
      fontSize: 25,
    });
    const cutoff = pl.point(0, 0.6).y;
    if (calibrated) line(ctx, api, 950, cutoff, 1570, cutoff, themeColors.yellow, 3);
    probs.forEach((v, i) => {
      const pt = pl.point(i, v),
        z = pl.point(i, 0);
      line(
        ctx,
        api,
        pt.x,
        z.y,
        pt.x,
        pt.y,
        answer && selected.includes(i) ? themeColors.green : themeColors.cyan,
        35,
      );
      text(ctx, api, v, pt.x, pt.y - 18, 25, themeColors.cyan, 'center');
    });
    equation(
      ctx,
      api,
      calibrated ? String.raw`1-p_y\le0.4\iff p_y\ge0.6` : String.raw`s_y=1-p_y`,
      1280,
      310,
      38,
      themeColors.yellow,
    );
    text(ctx, api, 'probability', 1590, 395, 24, themeColors.muted, 'right');
    if (answer)
      text(
        ctx,
        api,
        'set = {' + selected.join(', ') + '}',
        1280,
        920,
        34,
        selected.length ? themeColors.green : themeColors.pink,
        'center',
      );
    caption(
      ctx,
      api,
      currentBeat === 2
        ? answer
          ? 'Uniform probabilities fail this individual-label cutoff.'
          : 'Compare each candidate probability with the calibrated cutoff.'
        : 'Calibrate the true-label score; then invert it for every candidate label.',
    );
  };
  if (api.focus) api.focus.target(`${'classifier-score'}-mechanism`, paint);
  else paint();
}
export default {
  id: 'classifier-score',
  draw: drawClassifierScore,
  cues: [
    'classifier-score-b1',
    'classifier-score-b2',
    'softmax-set',
    'cf-softmax-threshold',
    'cf-softmax-set',
    'classifier-score-b3',
    'cf-softmax-empty',
  ],
};
