import * as vizmatic from 'vizmatic';
import { delay, duration, microphone, notes, onset, speaker } from '../echo-probe.mjs';
import { drawLine, drawText } from '../defaults.mjs';

const envelope = ({ samples, sampleRate }) =>
  vizmatic.pcmEnvelope?.(samples, { sampleRate, bins: 210 });
const outgoing = envelope(speaker);
const returning = envelope(microphone);
const domain = [0, duration];
const left = 360;
const width = 1220;
const xAt = (t) => left + (width * t) / duration;

export function drawEchoLoop(ctx, scene, state, api) {
  const { C } = api;
  const t = state.beat > 0 ? duration : Math.max(0, Math.min(duration, state.holdTime ?? 0));
  const lane = (name, env, y, color, showReference = false) => {
    drawText(ctx, api, name, 150, y + 10, 30, color);
    drawLine(ctx, api, left, y, left + width, y, C.muted, 2);
    if (!env || !api.teaching?.waveform) {
      const offset = showReference ? 0 : delay;
      for (const [start, length] of notes) {
        const from = start + offset;
        const until = from + length;
        const thickness = showReference ? 24 : 12;
        if (showReference) drawLine(ctx, api, xAt(from), y, xAt(until), y, C.muted, thickness);
        if (t > from)
          drawLine(ctx, api, xAt(from), y, xAt(Math.min(t, until)), y, color, thickness);
      }
      return;
    }
    if (showReference) {
      api.teaching.waveform({
        x: left,
        y: y - 92,
        width,
        height: 184,
        envelope: env,
        domain,
        color: C.muted,
      });
    }
    api.teaching.waveform({
      x: left,
      y: y - 92,
      width,
      height: 184,
      envelope: env,
      domain,
      color,
      cursorTime: t,
      reveal: true,
    });
  };
  api.focus.target('va-echo-loop-waveforms', () => lane('Speaker', outgoing, 405, C.yellow, true));
  api.focus.target('va-echo-loop-echo-path', () => {
    lane('Microphone', returning, 685, C.cyan);
    if (state.beat > 0) {
      const first = xAt(onset),
        second = xAt(onset + delay);
      drawLine(ctx, api, first, 540, second, 540, C.ink, 2);
      for (const x of [first, second]) drawLine(ctx, api, x, 530, x, 550, C.ink, 3);
      drawText(ctx, api, '0.30 s later', (first + second) / 2, 517, 30, C.ink, 'center');
    }
  });
  api.focus.target('va-echo-loop-aec', () => {
    if (state.beat >= 2)
      drawText(ctx, api, 'Try headphones. Listen at the microphone.', left, 865, 35, C.cyan);
  });
}
export default {
  id: 'echo-loop',
  draw: drawEchoLoop,
  cues: [
    'va-echo-loop-0-0',
    'va-echo-loop-0-1',
    'va-echo-loop-1-0',
    'va-echo-loop-1-1',
    'va-echo-loop-2-0',
  ],
};
