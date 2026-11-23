import { alternateServerTimes, tokenTimes } from '../fixtures.mjs';
import { clientEvents } from '../delivery-trace.mjs';
import { passage, scaleTime, spoken } from '../trace.mjs';

const receipt = clientEvents.at(-1).time;
const previous = clientEvents.at(-2).time;
const x = scaleTime(tokenTimes[1], receipt, 390, 1660);

export function drawSynthesis(ctx, scene, state, api) {
  const { C } = api;
  api.focus.target('diagnosis', () => {
    api.text(ctx, 'Both clients', 100, 335, 43, C.ink);
    api.line(ctx, x(previous), 320, x(receipt), 320, C.pink, 6);
    api.circle(ctx, x(previous), 320, 10, C.pink);
    api.circle(ctx, x(receipt), 320, 10, C.pink);
    api.text(ctx, 'T2 at ' + previous + ' ms', x(previous), 276, 36, C.pink, 'center');
    api.text(ctx, 'T3 + T4 at ' + receipt + ' ms', x(receipt), 276, 36, C.pink, 'center');
    api.text(
      ctx,
      receipt - previous + ' ms between receipts',
      (x(previous) + x(receipt)) / 2,
      385,
      39,
      C.pink,
      'center',
    );

    [tokenTimes, alternateServerTimes].forEach((times, i) => {
      const y = 540 + i * 215;
      const start = times[1];
      const sent = times[2];
      const p = passage(state, i + 1, i === 0 ? 'fast-source' : 'swap-source', 0.1, 0.32);
      api.text(ctx, i === 0 ? 'First run' : 'Second run', 100, y + 43, 42, C.ink);
      api.rect(ctx, x(start), y, x(receipt) - x(start), 62, C.panel, undefined, 4);
      if (state.beat > 0) api.text(ctx, 'T2 sent · ' + start, x(start), y - 25, 31, C.muted);
      if (p === 0) return;
      const split = x(sent);
      const before = split - x(start);
      const after = x(receipt) - split;
      api.rect(ctx, x(start), y, before * p, 62, C.cyan, undefined, 3);
      api.rect(ctx, x(receipt) - after * p, y, after * p, 62, C.yellow, undefined, 3);
      if (p < 1) return;
      api.text(ctx, 'T3 sent · ' + sent, split, y - 25, 32, C.ink, 'center');
      api.text(
        ctx,
        sent - start + ' ms between tokens',
        x(start) + before / 2,
        y + 43,
        31,
        C.bg,
        'center',
      );
      api.text(
        ctx,
        receipt - sent + ' ms in delivery',
        split + after / 2,
        y + 43,
        31,
        C.bg,
        'center',
      );
    });
    let caption = 'When did the server send token three?';
    if (state.beat === 1 && spoken(state, 1, 'downstream', 0.78))
      caption = 'First run: compare the proxy flush with the client read.';
    if (state.beat >= 2) caption = 'Which worker’s schedule would you open first?';
    if (spoken(state, 3, 'upstream', 0.42))
      caption = 'Second run: inspect the 83 ms between server emissions.';
    api.text(ctx, caption, 960, 965, 41, C.ink, 'center');
  });
}

export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: ['client-evidence', 'ask-source', 'fast-source', 'downstream', 'swap-source', 'upstream'],
};
