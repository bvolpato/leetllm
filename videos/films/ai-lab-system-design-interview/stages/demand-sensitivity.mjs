import { systemExtensionFrame } from '../construction.mjs';
import { bar, chapterCard, chapterText, footer, header, line } from '../defaults.mjs';
export function drawDemandSensitivity(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = systemExtensionFrame('demand-sensitivity', state),
    currentBeat = modelState.beat,
    progress = modelState.op;
  return api.focus.target('sd-demand-sensitivity-mechanism', () => {
    header(ctx, api, '4,000 requests/min · 1,200 input tokens · supplied mix');
    chapterCard(
      ctx,
      api,
      'Average answer: ' + modelState.output + ' tokens',
      180,
      390,
      720,
      themeColors.cyan,
    );
    chapterCard(ctx, api, 'Assumed fleet: 125,000 tokens/s', 1020, 390, 720, themeColors.blue);
    const rate = modelState.traffic.tokensPerSecond,
      max = 150000;
    bar(
      ctx,
      api,
      rate,
      max,
      300,
      600,
      1320,
      themeColors.cyan,
      'Current mix demand: ' + Math.round(rate).toLocaleString() + ' tokens/s',
    );
    const x = 300 + (1320 * 125000) / max;
    line(ctx, api, x, 565, x, 710, themeColors.yellow, 5);
    chapterText(ctx, api, 'assumed capacity', x, 755, 26, themeColors.yellow, 'center');
    if (modelState.resultReady || (currentBeat === 0 && modelState.done))
      chapterText(
        ctx,
        api,
        'Spare: ' +
          modelState.traffic.headroom.toLocaleString() +
          ' tokens/s · ' +
          Math.round(100 * modelState.traffic.headroomFraction) +
          '% of capacity',
        960,
        865,
        37,
        modelState.traffic.headroom < 0 ? themeColors.pink : themeColors.green,
        'center',
      );
    footer(
      ctx,
      api,
      currentBeat === 2
        ? 'Benchmark both mixes on the same fleet'
        : 'Spare capacity = assumed fleet capacity − demand',
    );
  });
}
export default {
  id: 'demand-sensitivity',
  draw: drawDemandSensitivity,
  cues: [
    'sd-demand-sensitivity-0-operation',
    'sd-demand-sensitivity-0-result',
    'sd-demand-sensitivity-1-operation',
    'sd-demand-sensitivity-1-result',
    'sd-demand-sensitivity-2-operation',
    'sd-demand-sensitivity-2-result',
  ],
};
