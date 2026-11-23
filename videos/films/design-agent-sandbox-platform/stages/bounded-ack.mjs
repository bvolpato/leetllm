import { clamp, motion, sandboxAck } from '../arithmetic.mjs';
import { drawFooter, drawRectangle, drawText } from '../defaults.mjs';
export function drawBoundedAck(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index) => {
      const q = state.cues?.['sp-bounded-ack-' + name];
      if (state.cues && !q) throw Error('Missing current scene cue sp-bounded-ack-' + name);
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
  api.focus.target('sp-bounded-ack-mechanism', () => {
    const bytes =
        currentBeat === 0
          ? 'OK 1073741824\n'
          : currentBeat === 1
            ? 'OK 1073741824\nPAYLOAD'
            : 'OK 1073741824',
      q = currentBeat === 0 ? cueProgress('read', 0) : 1,
      count = currentBeat === 0 ? Math.ceil(q * 14) : currentBeat === 1 ? 14 : 13,
      visible = bytes.slice(0, count),
      elapsed = Math.max(0, count - 1) * 0.08,
      remaining = 2 - elapsed;
    drawText(ctx, api, 'One monotonic deadline: t₀ + 2 seconds', 180, 300, 34, themeColors.yellow);
    drawRectangle(ctx, api, 180, 345, 1520, 70, themeColors.muted);
    drawRectangle(
      ctx,
      api,
      180,
      345,
      (1520 * remaining) / 2,
      70,
      themeColors.yellow,
      themeColors.yellow,
    );
    drawText(
      ctx,
      api,
      'Supplied fake arrival: ' +
        elapsed.toFixed(2) +
        ' s; remaining ' +
        remaining.toFixed(2) +
        ' s',
      190,
      470,
      29,
      themeColors.yellow,
    );
    [...bytes].forEach((v, i) => {
      const x = 180 + i * 71,
        col = i < count ? themeColors.cyan : themeColors.muted;
      drawRectangle(ctx, api, x, 560, 61, 85, col);
      drawText(
        ctx,
        api,
        v === '\n' ? 'LF' : v === ' ' ? 'SP' : v,
        x + 30,
        615,
        23,
        col,
        'center',
        'mono',
      );
    });
    const result = sandboxAck(visible);
    if (currentBeat === 0) {
      drawText(
        ctx,
        api,
        result.status === 'valid'
          ? 'Complete line; port range still checked'
          : 'Waiting for newline under the same deadline',
        180,
        780,
        31,
        result.status === 'valid' ? themeColors.green : themeColors.yellow,
      );
      drawText(
        ctx,
        api,
        '64-byte cap; EOF / exhausted time / overflow → stop',
        180,
        900,
        30,
        themeColors.pink,
      );
    } else if (currentBeat === 1) {
      const parsed = resultComplete('parse', 1),
        left = resultComplete('payload', 1);
      drawText(
        ctx,
        api,
        parsed ? 'Port 1073741824 ∈ [2³⁰,2³¹)' : 'Full-line pattern and range validation pending',
        180,
        780,
        31,
        parsed ? themeColors.green : themeColors.yellow,
      );
      drawText(
        ctx,
        api,
        left
          ? 'PAYLOAD remains unread after the delimiter'
          : 'No application command before ACK acceptance',
        180,
        900,
        31,
        left ? themeColors.blue : themeColors.yellow,
      );
    } else {
      drawText(ctx, api, 'Fake input: EOF before newline → reject', 180, 780, 32, themeColors.pink);
      drawText(ctx, api, 'No live VMM socket is opened', 180, 900, 29, themeColors.muted);
    }
    drawFooter(
      ctx,
      api,
      'A recognizable OK prefix does not complete the full-line protocol. Each read gets the remaining deadline.',
    );
  });
}
export default {
  id: 'bounded-ack',
  draw: drawBoundedAck,
  cues: [
    'sp-bounded-ack-0',
    'sp-bounded-ack-read',
    'sp-bounded-ack-1',
    'sp-bounded-ack-parse',
    'sp-bounded-ack-payload',
    'sp-bounded-ack-2',
  ],
};
