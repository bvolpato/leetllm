import { clamp, motion } from '../arithmetic.mjs';
import { drawFooter, drawLine, drawRectangle, drawText } from '../defaults.mjs';
export function drawEndpointClock(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index) => {
      const q = state.cues?.['sp-endpoint-clock-' + name];
      if (state.cues && !q) throw Error('Missing current scene cue sp-endpoint-clock-' + name);
      return q
        ? {
            q: q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress,
            done: q.phase === 'after',
          }
        : {
            q: currentBeat < index ? 0 : currentBeat > index ? 1 : motion(progress),
            done: currentBeat > index || (currentBeat === index && progress > 0.8),
          };
    },
    cueProgress = (n, i) => cue(n, i).q,
    resultComplete = (n, i) => cue(n, i).done;
  api.focus.target('sp-endpoint-clock-mechanism', () => {
    const q = currentBeat === 1 ? cueProgress('user', 1) : currentBeat > 1 ? 1 : 0,
      times = [0, 3, 7, 16, 17],
      labels = ['acceptance', 'placement', 'loading', 'readiness', 'first user instruction'];
    drawText(
      ctx,
      api,
      'Design requirement: p99 ≤ 15 ms, acceptance → user entry',
      180,
      290,
      32,
      themeColors.yellow,
    );
    drawLine(ctx, api, 200, 520, 1700, 520);
    const scale = 80;
    times.forEach((v, i) => {
      const x = 200 + v * scale;
      if (currentBeat === 0 && i > 0) return;
      const reached = currentBeat > 1 || (currentBeat === 1 && v <= 17 * q);
      drawLine(ctx, api, x, 490, x, 550, i === 4 ? themeColors.green : themeColors.muted);
      drawText(ctx, api, v + 'ms', x, 600, 28, themeColors.ink, 'center');
      const top = i % 2 ? 365 : 700;
      drawText(
        ctx,
        api,
        labels[i],
        Math.max(200, Math.min(1600, x)),
        top,
        27,
        i === 4 ? themeColors.green : themeColors.blue,
        i === 0 ? 'left' : 'center',
      );
      if (i && reached)
        drawRectangle(
          ctx,
          api,
          200 + times[i - 1] * scale,
          475,
          (v - times[i - 1]) * scale,
          45,
          i === 4 ? themeColors.green : themeColors.blue,
        );
    });
    if (currentBeat > 0 && resultComplete('miss', 1))
      drawText(
        ctx,
        api,
        '17 − 0 = 17 ms → misses target; load-only 7 ms has wrong endpoint',
        180,
        880,
        31,
        themeColors.pink,
      );
    if (currentBeat === 2)
      drawText(
        ctx,
        api,
        'Retain versions / image / residency / starts / actual instrumentation',
        180,
        960,
        28,
        themeColors.yellow,
      );
    else
      drawFooter(
        ctx,
        api,
        'One invented request cannot estimate p99. Cold and rejected/time-out populations need their own evidence.',
      );
  });
}
export default {
  id: 'endpoint-clock',
  draw: drawEndpointClock,
  cues: [
    'sp-endpoint-clock-0',
    'sp-endpoint-clock-target',
    'sp-endpoint-clock-1',
    'sp-endpoint-clock-user',
    'sp-endpoint-clock-miss',
    'sp-endpoint-clock-2',
  ],
};
