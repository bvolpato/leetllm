import { playoutSchedule } from '../arithmetic.mjs';
import { drawText } from '../defaults.mjs';
import { sceneCues } from '../reply-strip.mjs';

export function drawTransportAndBuffer(ctx, scene, state, api) {
  const { C } = api;
  const cue = sceneCues(scene, state);
  const short = 30;
  const long = 60;
  const buffer = Math.round(short + (long - short) * cue.p('transport-expand-buffer'));
  const reference = playoutSchedule(short);
  const schedule = playoutSchedule(buffer);
  const third = schedule[2];
  const reveal = cue.at('transport-absorb-p3');
  const changed = cue.at('transport-expand-buffer');
  const x = (ms) => 560 + ms * 8.7;
  const y = (i) => 410 + i * 110;
  api.focus.target('packet-arrivals', () => {
    drawText(ctx, api, 'Packet  /  timestamp', 145, 285, 33, C.muted);
    drawText(ctx, api, 'Arrival at the phone', 580, 285, 33, C.cyan);
    schedule.forEach((packet, i) => {
      const row = y(i);
      drawText(
        ctx,
        api,
        'P' + packet.id + '  /  ' + packet.timestamp + ' ms',
        145,
        row + 12,
        38,
        packet.id === 3 ? C.ink : C.muted,
      );
      api.line(ctx, x(0), row, x(124), row, C.panel, 5);
      api.circle(ctx, x(packet.arrival), row, 11, C.cyan);
      drawText(ctx, api, packet.arrival + ' ms', x(packet.arrival), row + 48, 28, C.cyan, 'center');
    });
  });
  api.focus.target('packet-deadlines', () => {
    drawText(ctx, api, 'Playback deadline  /  buffer ' + buffer + ' ms', 1090, 285, 33, C.yellow);
    schedule.forEach((packet, i) => {
      const row = y(i);
      if (changed)
        api.line(
          ctx,
          x(reference[i].deadline),
          row - 13,
          x(reference[i].deadline),
          row + 13,
          C.muted,
          3,
        );
      api.line(ctx, x(packet.deadline), row - 20, x(packet.deadline), row + 16, C.yellow, 6);
      drawText(
        ctx,
        api,
        packet.deadline + ' ms',
        x(packet.deadline),
        row - 33,
        28,
        C.yellow,
        'center',
      );
    });
  });
  api.focus.target('packet-three', () => {
    let text = 'P3’s deadline  =  ' + third.timestamp + ' ms  +  ' + buffer + ' ms';
    if (cue.at('transport-short')) text += '  =  ' + third.deadline + ' ms';
    drawText(ctx, api, text, 145, 885, 39);
    const decision = reveal
      ? 'Play P3  /  ' + (third.deadline - third.arrival) + ' ms to spare'
      : changed
        ? 'P3 arrives before or after its deadline?'
        : 'P3 arrives late  /  conceal this slot';
    if (cue.at('transport-short'))
      drawText(ctx, api, decision, 145, 972, 43, reveal ? C.green : changed ? C.ink : C.pink);
  });
}

export default {
  id: 'transport-and-buffer',
  draw: drawTransportAndBuffer,
  cues: [
    'transport-arrival-jitter',
    'transport-short',
    'transport-expand-buffer',
    'transport-ask',
    'transport-absorb-p3',
    'transport-shift-all',
    'transport-receiver-buffering',
  ],
};
