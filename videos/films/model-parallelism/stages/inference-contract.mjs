import { sceneClock } from '../scene-clock.mjs';

const prefix = 'mp-inference-contract-';

export function drawInferenceContract(ctx, scene, state, api) {
  const clock = sceneClock(scene, state);
  const { C } = api;
  api.focus.target('mp-inference-contract-mechanism', () => {
    if (state.beat === 1) {
      const events = ['Prompt arrives', 'First token', 'Next token'];
      const xs = [310, 1100, 1590];
      api.text(ctx, 'One request', 205, 332, 49, C.ink);
      const progress = clock.progress(prefix + 'clocks') + clock.progress(prefix + 'next');
      for (const [index, x] of xs.entries()) {
        const y = 590;
        if (index > 0 && progress > index - 1) {
          const travel = Math.min(1, progress - index + 1);
          api.line(
            ctx,
            xs[index - 1],
            y,
            xs[index - 1] + (x - xs[index - 1]) * travel,
            y,
            C.cyan,
            8,
          );
        }
        if (progress < index) continue;
        api.circle(ctx, x, y, 14, C.cyan);
        api.text(ctx, events[index], x, y - 55, 41, C.ink, 'center');
        if (index > 0)
          api.text(
            ctx,
            index === 1 ? 'Time to first token' : 'One token gap',
            (x + xs[index - 1]) / 2,
            y + 95,
            37,
            C.cyan,
            'center',
          );
      }
      return;
    }
    const x = 380,
      width = 1250;
    const progress =
      0.34 * clock.progress(prefix + 'workers') +
      0.28 * clock.progress(prefix + 'wait') +
      0.38 * clock.progress(prefix + 'sum');
    const earlierFinish = 1 - 0.14 * clock.progress(prefix + 'faster');
    api.text(ctx, 'Two ranks working on the same batch', 205, 318, 45, C.ink);
    function span(y, start, end, label, color) {
      const visible = Math.min(progress, end) - start;
      if (visible <= 0) return;
      api.rect(ctx, x + start * width, y, visible * width, 98, color, undefined, 0);
      if (progress >= end)
        api.text(ctx, label, x + ((start + end) / 2) * width, y + 64, 38, C.bg, 'center');
    }
    for (const [rank, localEnd] of [0.34, 0.62].entries()) {
      const y = 425 + rank * 206;
      api.text(ctx, 'GPU ' + rank, x - 40, y + 64, 45, C.ink, 'right');
      span(y, 0, localEnd, 'Multiply', C.blue);
      if (rank === 0) span(y, localEnd, 0.62, 'Wait', C.yellow);
      if (state.beat === 2) {
        api.rect(ctx, x + 0.62 * width, y, 0.38 * width, 98, C.panel, C.muted, 0);
      }
      span(y, 0.62, earlierFinish, 'Collective', C.cyan);
    }
    const note =
      state.beat === 2 && clock.done(prefix + 'rounding')
        ? 'Rounding can change the sampled token'
        : progress === 1
          ? 'Both ranks receive the sum'
          : 'Each rank computes a partial result';
    api.text(ctx, note, 960, 916, 44, C.ink, 'center');
  });
}
export default {
  id: 'inference-contract',
  draw: drawInferenceContract,
  cues: [
    '0',
    'workers',
    'wait',
    'sum',
    '1',
    'clocks',
    'next',
    '2',
    'faster',
    'paths',
    'rounding',
  ].map((id) => prefix + id),
};
