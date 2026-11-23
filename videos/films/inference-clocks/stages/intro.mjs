import { metrics } from '../arithmetic.mjs';
import { outputs, prompt, replyBTimes, tokenTimes } from '../fixtures.mjs';
import { bracket, passage, scaleTime, spoken, tokenMark } from '../trace.mjs';

const replies = [tokenTimes, replyBTimes];
const finish = tokenTimes.at(-1);
const freeze = replyBTimes[2];
const x = scaleTime(0, finish, 670, 1735);

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const second = replyBTimes[1];
  const clock =
    state.beat === 0
      ? second + (freeze - second) * passage(state, 0, 'head-start', 0.2, 0.36)
      : freeze + (finish - freeze) * passage(state, 1, 'run-both', 0, 0.16);
  const showFirst = passage(state, 1, 'first-waits', 0.42, 0.64);
  const showRhythm = passage(state, 1, 'compare-gaps', 0.74, 0.91);
  api.focus.target('reply-traces', () => {
    api.text(ctx, 'Complete “' + prompt.join(' ') + '…”', 98, 278, 43, C.ink);
    api.text(ctx, 'Server time', 1485, 274, 33, C.muted, 'right');
    api.text(ctx, Math.floor(clock) + ' ms', 1774, 284, 65, C.yellow, 'right');
    api.text(ctx, 'Arrival · 0 ms', x(0), 349, 30, C.muted, 'center');
    api.line(ctx, x(0), 375, x(0), 765, C.muted, 3);
    replies.forEach((times, r) => {
      const y = 453 + r * 284;
      const m = metrics(0, times);
      const count = times.filter((t) => t <= clock).length;
      const words = outputs.slice(0, count).join(' ').replace(' .', '.');
      api.text(ctx, r ? 'Reply B' : 'Reply A', 98, y - 76, 35, C.muted);
      api.rect(ctx, 98, y - 50, 472, 124, C.panel, undefined, 38);
      api.text(ctx, words || 'Waiting…', 133, y + 32, 61, words ? C.ink : C.muted);
      api.line(ctx, x(0), y, x(finish), y, C.muted, 3);
      api.line(ctx, x(0), y, x(clock), y, C.cyan, 4);
      if (clock < finish) api.line(ctx, x(clock), y - 19, x(clock), y + 19, C.yellow, 5);
      times.forEach((t, i) => {
        if (clock >= t) tokenMark(ctx, api, x(t), y, 'T' + (i + 1), t, C.cyan);
      });
      if (showFirst > 0) {
        const end = x(m.ttft * showFirst);
        bracket(ctx, api, x(0), end, y + 88, C.yellow, showFirst === 1 ? m.ttft + ' ms' : '');
      }
      if (showRhythm > 0) {
        m.gaps.forEach((gap, i) => {
          const label = spoken(state, 2, r ? 'b-gaps' : 'a-gaps', r ? 0.3 : 0.57);
          bracket(
            ctx,
            api,
            x(times[i]),
            x(times[i] + gap * showRhythm),
            y + 88,
            C.cyan,
            label ? String(gap) : '',
            29,
          );
        });
      }
    });
    const complete = spoken(state, 2, 'same-finish', 0.86);
    const caption =
      state.beat === 0
        ? 'Each dot is one token sent by the server.'
        : state.beat === 1
          ? showRhythm > 0
            ? 'Which reply has the longer gaps?'
            : showFirst > 0
              ? 'First wait  =  first output time − arrival time'
              : clock === finish
                ? 'Both periods leave at 428 ms.'
                : 'Each dot is one token sent by the server.'
          : complete
            ? 'Each reply produced 4 tokens in 428 ms'
            : 'First wait in yellow   ·   later gaps in blue   ·   milliseconds';
    api.text(ctx, caption, 960, 964, 43, C.ink, 'center');
  });
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'head-start',
    'run-both',
    'first-waits',
    'compare-gaps',
    'b-gaps',
    'a-gaps',
    'same-finish',
  ],
};
