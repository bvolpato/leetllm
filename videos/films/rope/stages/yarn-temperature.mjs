import { softmax } from '../arithmetic.mjs';
import { directedCue } from '../construction.mjs';
import { clearSegments } from '../defaults.mjs';
import { lessonFont } from '../../../lib/fonts.mjs';
export function drawYarnTemperature(ctx, scene, state, api) {
  return api.focus.target('yarn-temperature-construction', () =>
    paintYarnTemperature(ctx, scene, state, api),
  );
}
function paintYarnTemperature(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    labels = [],
    segments = [];
  const drawText = (value, x, y, size = 30, color = themeColors.ink, align = 'center') => {
    const text = String(value);
    ctx.save();
    ctx.font = lessonFont(size);
    const width = ctx.measureText(text).width;
    ctx.restore();
    labels.push({
      x: x - (align === 'center' ? width / 2 : align === 'right' ? width : 0) - 4,
      y: y - size - 4,
      width: width + 8,
      height: size + 8,
    });
    return api.text(ctx, text, x, y, size, color, align);
  };
  const cueProgress = (beat, sentence) =>
      directedCue(state, 'rp-yarn-temperature-' + beat + '-' + sentence, beat),
    resultComplete = (beat, sentence) => cueProgress(beat, sentence) === 1;
  const colors = [themeColors.cyan, themeColors.blue, themeColors.yellow, themeColors.pink],
    drawNote = (text) => drawText(text, 960, 1020, 27, themeColors.muted);
  const queueSegment = (x, y, u, v, color = themeColors.muted, width = 3) =>
    segments.push({
      a: {
        x,
        y,
      },
      z: {
        x: u,
        y: v,
      },
      color,
      width,
    });
  const drawClock = (x, y, r, angles, inks = colors, lengths = []) => {
    api.circle(ctx, x, y, r, 'transparent', '#33415a', 2);
    queueSegment(x - r, y, x + r, y, '#33415a', 2);
    queueSegment(x, y - r, x, y + r, '#33415a', 2);
    angles.forEach((a, i) => {
      const scale = lengths[i] ?? 1,
        at = {
          x: x + r * 0.86 * scale * Math.cos(a),
          y: y - r * 0.86 * scale * Math.sin(a),
        };
      queueSegment(x, y, at.x, at.y, inks[i] ?? themeColors.cyan, 5);
      api.circle(ctx, at.x, at.y, 6, inks[i] ?? themeColors.cyan);
    });
  };
  const formatVector = (values) =>
    '[' + values.map((v) => (Math.abs(v) < 1e-12 ? '0' : v.toFixed(4))).join(', ') + ']';
  {
    const { C, teaching: g } = api,
      b = state.beat ?? 0;
    {
      const amplitude = 1 + 0.1 * Math.log(4),
        amount = b === 0 ? cueProgress(0, 2) : 1,
        current = 1 + (amplitude - 1) * amount,
        factor = current ** 2,
        weights = softmax([factor, 0]);
      if (b < 2) {
        drawText('Supplied scale 4 · a = 1 + 0.1 ln(4)', 960, 265, 35, C.ink);
        drawClock(500, 540, 180, [0], [C.cyan], [current]);
        drawClock(1420, 540, 180, [0, Math.PI / 2], [C.yellow, C.pink], [current, current]);
        drawText('Query length ' + current.toFixed(4), 500, 795, 34, C.cyan);
        drawText('Key lengths ' + current.toFixed(4), 1420, 795, 34, C.yellow);
        if (b === 0 && resultComplete(0, 2))
          drawText('Logits [a², 0] = [' + factor.toFixed(4) + ', 0]', 960, 925, 37, C.green);
        if (b === 1) {
          drawText(
            resultComplete(1, 0)
              ? 'a² ≈ ' + factor.toFixed(4) + ' · temperature ≈ ' + (1 / factor).toFixed(4)
              : 'Keep amplitude and temperature separate',
            960,
            340,
            31,
            C.yellow,
          );
          if (resultComplete(1, 1))
            drawText(
              'Exponential masses [' +
                Math.exp(factor).toFixed(4) +
                ', 1] · sum ' +
                (Math.exp(factor) + 1).toFixed(4),
              960,
              880,
              30,
              C.ink,
            );
          if (resultComplete(1, 2))
            drawText('Normalized weights ' + formatVector(weights), 960, 960, 33, C.green);
        }
        drawNote('Scaling both vectors by a multiplies their dot product by a².');
      } else {
        const extra = resultComplete(2, 0),
          newWeights = softmax([amplitude ** 2, 0, 10]),
          entropy = (values) => -values.reduce((s, p) => s + (p ? p * Math.log(p) : 0), 0);
        drawText('Two keys share attention. Add a third with logit 10.', 960, 270, 34, C.yellow);
        g.bars({
          x: 180,
          y: 440,
          width: 650,
          height: 350,
          values: weights,
          labels: ['key 0', 'key 1'],
          colors: [C.cyan, C.yellow],
          max: 1,
          showValues: true,
          format: (v) => v.toFixed(4),
          fontSize: 28,
          gap: 150,
          progress: 1,
        });
        if (extra)
          g.bars({
            x: 1040,
            y: 440,
            width: 700,
            height: 350,
            values: newWeights,
            labels: ['key 0', 'key 1', 'new key'],
            colors: [C.cyan, C.yellow, C.pink],
            max: 1,
            showValues: true,
            format: (v) => v.toFixed(4),
            fontSize: 28,
            gap: 80,
            progress: 1,
          });
        drawText('H = ' + entropy(weights).toFixed(4) + ' nats', 500, 915, 34, C.cyan);
        if (extra)
          drawText('H = ' + entropy(newWeights).toFixed(4) + ' nats', 1400, 915, 34, C.pink);
        drawNote(
          extra
            ? 'Almost all the weight now goes to the new key.'
            : 'Attention weight before adding the key',
        );
      }
    }
  }
  for (const segment of segments)
    for (const points of clearSegments(segment.a, segment.z, labels))
      api.path(ctx, points, {
        color: segment.color,
        width: segment.width,
      });
}
export default {
  id: 'yarn-temperature',
  draw: drawYarnTemperature,
  cues: [
    'rp-yarn-temperature-0-0',
    'rp-yarn-temperature-0-1',
    'rp-yarn-temperature-0-2',
    'rp-yarn-temperature-0-3',
    'rp-yarn-temperature-1-0',
    'rp-yarn-temperature-1-1',
    'rp-yarn-temperature-1-2',
    'rp-yarn-temperature-1-3',
    'rp-yarn-temperature-2-0',
    'rp-yarn-temperature-2-1',
    'rp-yarn-temperature-2-2',
    'rp-yarn-temperature-2-3',
  ],
};
