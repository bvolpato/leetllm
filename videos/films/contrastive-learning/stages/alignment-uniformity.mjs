import { formatValue } from '../arithmetic.mjs';
import { drawNote, drawText } from '../defaults.mjs';
export function drawAlignmentUniformity(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0;
  api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (k) => state.cues?.['cl-alignment-uniformity-' + k],
    cueProgress = (k) => {
      const v = cue(k);
      return !v || v.phase === 'before' ? 0 : v.phase === 'after' ? 1 : v.progress;
    },
    resultComplete = (k) => cue(k)?.phase === 'after';
  api.focus.target('alignment-uniformity-mechanism', () => {
    const plot = teaching.axes({
        x: 300,
        y: 350,
        width: 600,
        height: 600,
        xDomain: [-1.2, 1.2],
        yDomain: [-1.2, 1.2],
        xTicks: [],
        yTicks: [],
        equalUnits: true,
        fontSize: 25,
      }),
      collapse = currentBeat === 0 ? cueProgress('collapse') : 1 - cueProgress('spread');
    teaching.curve({
      plot,
      points: Array.from(
        {
          length: 81,
        },
        (_, i) => ({
          x: Math.cos((i / 80) * Math.PI * 2),
          y: Math.sin((i / 80) * Math.PI * 2),
        }),
      ),
      color: themeColors.border,
      width: 2,
    });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 * (1 - collapse),
        xy = plot.point(Math.cos(a), Math.sin(a));
      api.circle(
        ctx,
        xy.x,
        xy.y,
        10,
        [themeColors.blue, themeColors.cyan, themeColors.green, themeColors.pink][i % 4],
      );
    }
    drawText(
      ctx,
      api,
      collapse === 1 ? 'All eight inputs coincide' : 'Population geometry and partner alignment',
      1330,
      360,
      31,
      themeColors.blue,
    );
    if ((currentBeat === 0 && resultComplete('loss')) || currentBeat > 0) {
      drawText(ctx, api, 'Collapsed reference', 1340, 465, 29, themeColors.muted);
      drawText(ctx, api, 'p = 1 / 8', 1340, 565, 43, themeColors.cyan);
      drawText(
        ctx,
        api,
        'loss = log 8 = ' + formatValue(Math.log(8)),
        1340,
        725,
        39,
        themeColors.yellow,
      );
    }
    drawNote(
      ctx,
      api,
      currentBeat
        ? 'Authored population illustration · asymptotic theory has its stated assumptions'
        : 'Positive-pair closeness alone can erase every useful distinction',
    );
  });
}
export default {
  id: 'alignment-uniformity',
  draw: drawAlignmentUniformity,
  cues: [
    'cl-alignment-uniformity-align',
    'cl-alignment-uniformity-collapse',
    'cl-alignment-uniformity-loss',
    'cl-alignment-uniformity-spread',
  ],
};
