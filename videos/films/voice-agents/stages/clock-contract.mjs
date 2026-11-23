import { commitToAudio, trace } from '../fixtures.mjs';
import { drawBracket, drawText } from '../defaults.mjs';
import { sceneCues } from '../reply-strip.mjs';

export function drawClockContract(ctx, scene, state, api) {
  const { C } = api;
  const cue = sceneCues(scene, state);
  const shift = cue.p('clock-shift');
  const commit = Math.round(trace.commit + (300 - trace.commit) * shift);
  const firstAudio = commit + commitToAudio;
  const x = (ms) => 175 + ms * 2.55;
  const play = cue.at('clock-play');
  const reveal = cue.at('clock-late');
  const times = play && (shift === 0 || reveal);
  const changed = shift > 0;
  api.focus.target('clock-trace', () => {
    drawText(ctx, api, 'Milliseconds after Alex finishes speaking', 145, 267, 32, C.blue);
    api.line(ctx, x(0), 455, x(635), 455, C.muted, 4);
    const event = (ms, y, label, color) => {
      api.line(ctx, x(ms), y + 14, x(ms), 455, color, 4);
      api.circle(ctx, x(ms), 455, 9, color);
      const align = ms === 0 ? 'left' : ms > 600 ? 'right' : 'center';
      drawText(ctx, api, label, x(ms), y, 34, color, align);
    };
    event(0, 344, 'Speech ends', C.blue);
    if (cue.at('clock-commit')) event(commit, 405, 'Turn accepted', C.cyan);
    if (play) event(firstAudio, 344, 'First sound plays', C.green);
  });
  api.focus.target('clock-limit', () => {
    if (!changed) return;
    api.line(ctx, x(500), 470, x(500), 516, C.yellow, 4);
    drawText(ctx, api, '500 ms target', x(500), 559, 32, C.yellow, 'center');
  });
  api.focus.target('clock-brackets', () => {
    if (!play) return;
    drawBracket(
      ctx,
      api,
      x(0),
      x(firstAudio),
      622,
      times ? firstAudio + ' ms from speech end' : 'Within 500 ms of speech end?',
      C.blue,
    );
    drawBracket(
      ctx,
      api,
      x(commit),
      x(firstAudio),
      743,
      cue.at('clock-subtract') ? commitToAudio + ' ms after commit' : 'Time after commit',
      C.cyan,
    );
    if (changed) drawText(ctx, api, 'Endpoint wait: ' + commit + ' ms', 145, 892, 35, C.ink);
    if (reveal)
      drawText(
        ctx,
        api,
        commit + ' + ' + commitToAudio + ' = ' + firstAudio + ' ms',
        1120,
        892,
        42,
        C.yellow,
      );
  });
  api.focus.target('clock-limits', () => {
    if (!cue.at('clock-ack')) return;
    drawText(ctx, api, 'First sound: “I’ll check that.”', 145, 983, 31, C.green);
    drawText(
      ctx,
      api,
      cue.at('clock-mute')
        ? 'Speech onset to mute: target p95 ≤ 100 ms'
        : 'Useful answer: incident status',
      1000,
      983,
      31,
      cue.at('clock-mute') ? C.pink : C.yellow,
    );
  });
}

export default {
  id: 'clock-contract',
  draw: drawClockContract,
  cues: [
    'clock-speech',
    'clock-commit',
    'clock-play',
    'clock-measure',
    'clock-subtract',
    'clock-shift',
    'clock-ask',
    'clock-late',
    'clock-ack',
    'clock-mute',
  ],
};
