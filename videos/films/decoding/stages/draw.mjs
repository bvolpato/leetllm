import { WORDS } from '../fixtures.mjs';
import { DRAW_STREAM } from '../construction.mjs';
import { drawSnapshot } from '../model.mjs';
import { originalText } from '../defaults.mjs';
export function drawDraw(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    const frame = drawSnapshot(currentBeat, progress),
      colors = [themeColors.blue, themeColors.green, themeColors.pink];
    let left = 180;
    frame.probabilities.forEach((value, bin) => {
      const width = 1560 * value;
      originalText(
        ctx,
        api,
        `${WORDS[frame.ids[bin]]} · ${(value * 100).toFixed(1)}%`,
        left + width / 2,
        295,
        30,
        colors[bin],
        'center',
      );
      api.focus.target('sampling-interval', () => api.rect(ctx, left, 330, width, 90, colors[bin]));
      left += width;
    });
    [0, 0.5, 1].forEach((value) =>
      originalText(
        ctx,
        api,
        value.toFixed(1),
        180 + 1560 * value,
        300,
        23,
        themeColors.muted,
        'center',
      ),
    );
    if (frame.drawVisible) {
      const marker = 180 + 1560 * frame.current.uniform;
      api.focus.target('uniform-draw', () =>
        api.arrow(ctx, marker, 525, marker, 442, themeColors.yellow, 5),
      );
      originalText(
        ctx,
        api,
        `Draw ${frame.current.index} · u = ${frame.current.uniform.toFixed(3)}${frame.count ? ' → ' + frame.current.token : ' · locate its interval'}`,
        960,
        565,
        31,
        themeColors.yellow,
        'center',
      );
    } else
      originalText(
        ctx,
        api,
        'Unit interval · retained probabilities stay fixed',
        960,
        540,
        29,
        themeColors.muted,
        'center',
      );
    const receipts = DRAW_STREAM.slice(0, Math.min(8, frame.count));
    receipts.forEach((sample, index) =>
      api.focus.target('sampled-outcomes', () =>
        components.card({
          label: `#${sample.index} ${sample.token}`,
          x: 190 + index * 195,
          y: 600,
          width: 175,
          height: 62,
          fontSize: 23,
          padding: 8,
          fill: themeColors.panel,
          stroke: colors[sample.bin],
          textColor: colors[sample.bin],
        }),
      ),
    );
    if (currentBeat === 2) {
      DRAW_STREAM.slice(0, frame.replayCount).forEach((sample, index) =>
        api.focus.target('sampled-outcomes', () =>
          components.card({
            label: `#${sample.index} ${sample.token}`,
            x: 190 + index * 195,
            y: 670,
            width: 175,
            height: 45,
            fontSize: 22,
            padding: 6,
            fill: themeColors.panel,
            stroke: colors[sample.bin],
            textColor: colors[sample.bin],
          }),
        ),
      );
      originalText(
        ctx,
        api,
        'Replay seed 19 · same first eight outcomes · main total stays 100',
        960,
        235,
        25,
        themeColors.muted,
        'center',
      );
    } else
      originalText(
        ctx,
        api,
        frame.count > 8
          ? 'The first eight receipts remain visible as more draws accumulate'
          : 'Each receipt is one categorical outcome from the same retained distribution',
        960,
        710,
        25,
        themeColors.muted,
        'center',
      );
    const plot = teaching.axes({
      x: 230,
      y: 770,
      width: 1460,
      height: 170,
      xDomain: [0, 3],
      yDomain: [0, 1],
      xTicks: [],
      yTicks: [0, 0.5, 1],
      xLabel: '',
      yLabel: '',
      fontSize: 21,
    });
    frame.ids.forEach((id, bin) => {
      const center = 470 + bin * 490,
        height = frame.frequencies[bin] * 170,
        reference = plot.point(0, frame.probabilities[bin]).y;
      if (height)
        api.focus.target('empirical-frequencies', () =>
          api.rect(ctx, center - 100, 940 - height, 200, height, colors[bin], undefined, 7),
        );
      api.focus.target('probability-reference', () =>
        api.line(ctx, center - 125, reference, center + 125, reference, themeColors.yellow, 3),
      );
      originalText(
        ctx,
        api,
        frame.count ? `${frame.counts[bin]} / ${frame.count}` : 'No draws yet',
        center,
        980,
        27,
        colors[bin],
        'center',
      );
      originalText(ctx, api, WORDS[id], center, 1018, 26, colors[bin], 'center');
    });
    originalText(
      ctx,
      api,
      `${frame.count} draws · empirical frequency bars · yellow lines: fixed probabilities`,
      960,
      750,
      26,
      themeColors.ink,
      'center',
    );
    return;
  }
}
export default {
  id: 'draw',
  draw: drawDraw,
  cues: ['draw-b1-1', 'draw-b1-2', 'draw-b2-1', 'draw-b2-2', 'draw-b3-1'],
};
