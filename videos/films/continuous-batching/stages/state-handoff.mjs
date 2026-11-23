import { handoffTiming } from '../model.mjs';
import { cueProgress, drawBatchingUpgradeTable } from '../defaults.mjs';

const durations = { prefillQueue: 20, prefill: 60, handoff: 40, decodeQueue: 15, nextDecode: 10 };
const h = handoffTiming(durations);
const payload = 0.25 * 2 ** 30;

export function drawStateHandoff(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  api.focus.target('state-handoff-mechanism', () => {
    if (beat === 0) {
      const sampled = cueProgress(state, 'handoff-sampled', 0.25, 0.33) > 0;
      const progress = cueProgress(state, 'state-handoff-b1', 0.33, 0.41);
      const consumed = cueProgress(state, 'handoff-consume', 0.43, 0.49) >= 1;
      api.text(ctx, 'Prefill worker', 465, 300, 46, C.blue, 'center');
      api.text(ctx, 'Decode worker', 1455, 300, 46, C.cyan, 'center');
      const ids = [101, 102, 103];
      const firstOutput = 201;
      for (let i = 0; i < ids.length; i++) {
        const source = 295 + 170 * i;
        const dest = source + 990;
        for (const [x, color, present] of [[source, C.blue, true], [dest, C.cyan, progress >= (i + 1) / ids.length]]) {
          api.rect(ctx, x - 64, 407, 128, 104, C.panel, color, 6);
          if (present) api.text(ctx, String(ids[i]), x, 475, 43, color, 'center');
          api.text(ctx, 'pos ' + i, x, 574, 28, C.muted, 'center');
        }
      }
      api.arrow(ctx, 765, 460, 1150, 460, C.yellow, 5);
      api.text(ctx, 'Prompt state', 960, 405, 31, C.yellow, 'center');
      if (sampled) {
        const token = (x, color) => {
          api.rect(ctx, x - 76, 695, 152, 100, C.panel, color, 6);
          api.text(ctx, String(firstOutput), x, 762, 50, color, 'center');
        };
        api.text(ctx, 'First sampled output', 465, 655, 36, C.yellow, 'center');
        token(465, C.yellow);
        if (progress > 0) token(api.lerp(465, 1455, api.ease(progress)), consumed ? C.green : C.yellow);
        if (progress >= 1) {
          api.text(ctx, 'Next input  ·  position ' + ids.length, 1455, 655, 36, C.yellow, 'center');
          if (consumed) api.text(ctx, 'Predict token two', 1455, 855, 36, C.green, 'center');
        }
      }
      api.text(ctx, 'Preserve the model computation, token positions and compatible state',
        960, 961, 33, C.muted, 'center');
    } else if (beat === 1) {
      const rates = [['50 GiB/s', 50 * 2 ** 30], ['10 Gbit/s', 10e9 / 8], ['25 Gbit/s', 25e9 / 8]];
      drawBatchingUpgradeTable(ctx, api, [
        ['Attention payload', 'Ideal bandwidth', 'Serialization time'],
        ...rates.map(([label, bytesPerSecond]) => ['0.25 GiB', label, (1000 * payload / bytesPerSecond).toFixed(1) + ' ms']),
      ], 180, 340, 1560, 125);
      api.text(ctx, 'Measure the transfer time still exposed after overlap', 960, 952, 38, C.yellow, 'center');
    } else {
      const x = ms => 365 + ms * 8.65;
      const first = beat === 3 || cueProgress(state, 'state-handoff-b3', 0.38, 0.41) > 0;
      const second = beat === 3 || cueProgress(state, 'handoff-second', 0.57, 0.66) > 0;
      const buffering = beat === 3 ? 1 : cueProgress(state, 'handoff-buffer', 0.73, 0.82);
      const delivery = api.lerp(h.first, h.ready, api.ease(buffering));
      const labels = ['Queue', 'Prefill', 'Handoff', 'Queue', 'Decode'];
      const colors = [C.blue, C.cyan, C.yellow, C.pink, C.green];
      api.text(ctx, 'Client sends at 0 ms', x(0), 259, 31, C.muted, 'center');
      api.text(ctx, 'Assume zero transit time for the request and token deliveries',
        x(h.second), 259, 28, C.muted, 'right');
      let elapsed = 0;
      Object.values(durations).forEach((duration, i) => {
        const mid = x(elapsed + duration / 2);
        api.rect(ctx, x(elapsed) + 2, 292, x(duration) - x(0) - 4, 105, C.panel, colors[i], 4);
        api.text(ctx, labels[i], mid, 333, i === 4 ? 21 : 26, colors[i], 'center');
        api.text(ctx, duration + ' ms', mid, 375, i === 4 ? 22 : 26, C.ink, 'center');
        elapsed += duration;
      });
      api.text(ctx, 'First token due by 90 ms', x(90), 472, 32, C.yellow, 'center');
      for (const [top, bottom] of [[491, 513], [561, 599], [757, 795]])
        api.line(ctx, x(90), top, x(90), bottom, C.yellow, 3);

      function deliveryRow(y, label, sent, visible) {
        api.text(ctx, label, 288, y + 12, 35, C.ink, 'right');
        api.line(ctx, x(0), y, x(h.second), y, C.muted, 2);
        if (!visible) return;
        api.line(ctx, x(sent), y, x(second ? h.second : sent), y, C.cyan, 5);
        api.circle(ctx, x(sent), y, 14, C.blue);
        if (second) api.circle(ctx, x(h.second), y, 14, C.green);
        if (sent === h.first || sent === h.ready)
          api.text(ctx, '1st  ·  ' + sent + ' ms', x(sent) - 12, y - 31, 29, C.blue, 'right');
        if (second) {
          api.text(ctx, '2nd  ·  ' + h.second + ' ms', x(h.second) + 15, y - 31, 29, C.green);
          if (sent === h.first || sent === h.ready)
            api.text(ctx, 'Gap ' + (h.second - sent) + ' ms', (x(sent) + x(h.second)) / 2, y + 55, 30, C.ink, 'center');
        }
      }
      deliveryRow(578, 'Send early', h.first, first);
      deliveryRow(774, 'Buffer first', delivery, buffering > 0);
      const verdict = beat === 3 && cueProgress(state, 'handoff-verdict', 0.63, 0.77) > 0;
      api.text(ctx, verdict ? 'Early misses the gap limit. Buffered misses the first-token limit.' :
        'Allowed time from token one to token two: 30 ms', 960, 958, 38, verdict ? C.yellow : C.muted, 'center');
    }
  });
}
export default {
  id: 'state-handoff',
  draw: drawStateHandoff,
  cues: ['handoff-sampled', 'state-handoff-b1', 'handoff-consume', 'state-handoff-b2', 'state-handoff-b3',
    'handoff-second', 'handoff-buffer', 'handoff-verdict'],
};
