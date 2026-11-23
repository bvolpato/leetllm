import { systemExtensionFrame } from '../construction.mjs';
import { text } from '../defaults.mjs';

const words = ['The', ' train', ' leaves', ' tonight'];
const x = (ms) => 160 + ms * 3.08;

export function drawPhaseLatency(ctx, scene, state, api) {
  const { C, focus } = api;
  const {
    times,
    n: count,
    gaps,
    tpot,
    longGap,
    resultReady: mean,
  } = systemExtensionFrame(scene.id, state);
  const last = count === times.length;
  const y = 596;

  focus.target('phase-stream', () => {
    text(ctx, api, 'Client stream', 160, 291, 32, C.muted);
    text(
      ctx,
      api,
      count ? words.slice(0, count).join('') : 'Waiting for the first token…',
      160,
      381,
      62,
      count ? C.ink : C.muted,
    );
    api.line(ctx, x(0), y, x(500), y, C.muted, 3);
    api.line(ctx, x(0), y - 18, x(0), y + 19, C.ink, 4);
    text(ctx, api, 'Arrival · 0 ms', x(0), y + 71, 32, C.ink);
    if (state.beat === 0) {
      text(ctx, api, 'Queue wait   +   prompt processing   +   delivery', 160, 737, 43, C.cyan);
      text(ctx, api, 'The first-token clock starts at arrival.', 160, 897, 38, C.ink);
    }
    const labelX = [x(200) - 127, x(210), x(220) + 127, x(500)];
    const labelY = [y - 46, y - 117, y - 46, y - 46];
    times.slice(0, count).forEach((time, index) => {
      api.line(ctx, x(time), y - 13, labelX[index], labelY[index] + 11, C.blue, 2);
      api.circle(ctx, x(time), y, 9, C.cyan);
      text(ctx, api, time + ' ms', labelX[index], labelY[index], 30, C.ink, 'center');
    });
    if (longGap) {
      const start = x(times[2]),
        end = x(times[3]);
      api.line(ctx, start, y + 70, end, y + 70, C.yellow, 4);
      for (const edge of [start, end]) api.line(ctx, edge, y + 58, edge, y + 82, C.yellow, 4);
      text(
        ctx,
        api,
        'Token 3 to token 4   ·   ' + gaps[2] + ' ms',
        (start + end) / 2,
        y + 138,
        37,
        C.yellow,
        'center',
      );
    } else if (state.beat === 1) {
      text(
        ctx,
        api,
        last ? 'Which two tokens bound the longest wait?' : 'Time measured at the client',
        1760,
        785,
        37,
        C.ink,
        'right',
      );
    }
  });
  if (state.beat === 2)
    focus.target('phase-mean', () => {
      const span = times.at(-1) - times[0];
      text(ctx, api, 'Average gap after the first token', 160, 868, 30, C.muted);
      text(
        ctx,
        api,
        mean
          ? span + ' ms  ÷  ' + gaps.length + ' gaps  =  ' + tpot + ' ms'
          : longGap
            ? gaps.join(' ms    +    ') + ' ms'
            : 'First token to last token',
        160,
        947,
        55,
        C.ink,
      );
    });
}

export default {
  id: 'phase-latency',
  draw: drawPhaseLatency,
  cues: [
    'phase-before',
    'phase-arrival',
    'phase-first',
    'phase-short',
    'phase-last',
    'phase-stall',
    'phase-long',
    'phase-mean',
    'phase-slo',
  ],
};
