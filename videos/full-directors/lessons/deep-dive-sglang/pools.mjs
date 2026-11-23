import { poolReplay, requests } from './examples.mjs';
import { C, box, crescent, label, line, mid } from './paint.mjs';

// Both schedules use the same origin and the same two constructed work intervals.
export function drawPoolReplay(c, split, showHandoff = false) {
  const x = t => 208 + 23 * t;
  const { prefill, decode } = poolReplay(false);
  const block = ([start, end], y, name, fill) => {
    const width = x(end) - x(start);
    box(c, x(start), y, width - 1, 39, fill, null, 3);
    mid(c, name, x(start) + width / 2, y + 26, 18, C.ink, width - 8);
  };
  crescent(c, 51, 153, 10);
  label(c, requests[0].id + '  long prompt', 73, 160, 19, C.blue);
  label(c, 'R0  ready for its next token at 0 ms', 332, 160, 19, C.sea);
  label(c, 'Illustrative timing', 920, 160, 16, C.soft, { align: 'right' });
  for (const t of new Set([0, poolReplay(true).decode[1], prefill[1], decode[1]])) {
    line(c, x(t), 193, x(t), split ? 419 : 327, C.line, 1, [2, 4]);
    mid(c, t + ' ms', x(t), 190, 16, C.soft);
  }
  label(c, 'Shared worker', 40, 240, 21);
  block(prefill, 212, 'R42 prefill', C.sky);
  block(decode, 212, 'R0 decode', C.mint);
  line(c, x(0), 265, x(prefill[1]), 265, C.gold, 1.6);
  for (const t of prefill) line(c, x(t), 260, x(t), 270, C.gold, 1.6);
  mid(c, 'R0 waits ' + decode[0] + ' ms', (x(0) + x(prefill[1])) / 2, 288, 17, C.ink);
  if (!split) {
    return;
  }
  const replay = poolReplay(true);
  line(c, 40, 299, 920, 299);
  label(c, 'Prefill pool', 40, 339, 21);
  block(replay.prefill, 312, 'R42 prefill', C.sky);
  label(c, 'Decode pool', 40, 406, 21);
  block(replay.decode, 379, 'R0 decode', C.mint);
  if (showHandoff) {
    const end = x(replay.kvWaitFrom);
    line(c, end, 351, end, 397, C.gold, 2);
    line(c, end, 397, end + 31, 397, C.gold, 2);
    label(c, 'R42 waits for KV', end + 40, 404, 20, C.red);
  }
}
