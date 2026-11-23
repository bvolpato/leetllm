import { sampleModel } from '../construction.mjs';
import { drawText } from '../defaults.mjs';
export function drawLatency(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('latency', state),
    currentBeat = modelState.beat;
  if (state.cues?.['first-token']) {
    modelState.time =
      currentBeat === 0
        ? 240 * api.focus.progress('first-token', 0)
        : 240 + 215 * api.focus.progress('remaining-tokens', 0);
    modelState.arrivals = Array.from(
      {
        length: 30,
      },
      (_, i) => 240 + (i * 215) / 29,
    ).filter((t) => t <= modelState.time + 1e-9);
    const last = modelState.arrivals.at(-1);
    modelState.post =
      modelState.arrivals.length > 1
        ? {
            tokens: modelState.arrivals.length - 1,
            ms: last - 240,
          }
        : null;
    modelState.tps = modelState.post ? modelState.post.tokens / (modelState.post.ms / 1000) : null;
  }
  {
    api.focus.target('request-clock', () =>
      teaching.timeline({
        x: 170,
        y: 330,
        width: 1570,
        height: 240,
        domain: [0, 500],
        time: modelState.time,
        lanes: [
          {
            id: 'wait',
            label: 'First output',
          },
          {
            id: 'stream',
            label: 'Remaining output',
          },
        ],
        intervals: [
          {
            id: 'wait',
            lane: 'wait',
            start: 0,
            end: 240,
            color: themeColors.blue,
          },
          {
            id: 'stream',
            lane: 'stream',
            start: 240,
            end: 455,
            color: themeColors.cyan,
          },
        ],
        ticks: [0, 100, 200, 300, 400, 500],
        labelWidth: 340,
        fontSize: 28,
        color: themeColors.muted,
        trackColor: themeColors.panel,
      }),
    );
    const labels = Array.from(
      {
        length: 30,
      },
      (_, i) => (i < modelState.arrivals.length ? '•' : ''),
    );
    api.focus.target('visible-token-arrivals', () =>
      teaching.grid({
        x: 210,
        y: 670,
        width: 1500,
        height: 70,
        rows: 1,
        columns: 30,
        labels: [labels],
        fill: themeColors.panel,
        stroke: themeColors.blue,
        textColor: themeColors.cyan,
        fontSize: 34,
      }),
    );
    api.focus.target('arrival-count', () =>
      drawText(
        ctx,
        api,
        `Clock ${modelState.time.toFixed(0)} ms · visible tokens ${modelState.arrivals.length} / 30`,
        960,
        825,
        37,
        themeColors.yellow,
        'center',
      ),
    );
    api.focus.target('observed-throughput', () =>
      drawText(
        ctx,
        api,
        modelState.post
          ? `Observed post-first interval: ${modelState.post.tokens} tokens / ${modelState.post.ms.toFixed(1)} ms = ${modelState.tps.toFixed(1)} tokens/s`
          : 'Post-first-token throughput pending',
        960,
        950,
        32,
        themeColors.cyan,
        'center',
      ),
    );
  }
}
export default {
  id: 'latency',
  draw: drawLatency,
  cues: ['dispatch-clock', 'first-token', 'remaining-tokens', 'derive-throughput'],
};
