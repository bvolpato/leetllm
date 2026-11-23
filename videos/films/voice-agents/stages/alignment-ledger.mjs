import { chunks, interrupt, pendingText } from '../fixtures.mjs';
import { voiceReconcile } from '../arithmetic.mjs';
import { drawText } from '../defaults.mjs';
import { replyStrip, replyX, sceneCues } from '../reply-strip.mjs';

export function drawAlignmentLedger(ctx, scene, state, api) {
  const { C } = api;
  const cue = sceneCues(scene, state);
  const boundary = chunks[1].endMs;
  const early = boundary - 1;
  const compare = cue.at('align-replay');
  const validating = cue.at('align-zero');
  api.focus.target('align-strip', () => {
    drawText(
      ctx,
      api,
      'Reply 1  /  audio ends and exclusive character offsets',
      145,
      254,
      32,
      C.cyan,
    );
    replyStrip(ctx, api, chunks, { y: 278, offsets: true });
  });
  api.focus.target('align-detail', () => {
    if (!cue.at('align-open')) return;
    const duration = chunks.at(-1).endMs;
    const center = replyX(boundary, duration);
    const wideScale = replyX(1, duration) - replyX(0, duration);
    const scale = wideScale * (210 / wideScale) ** cue.p('align-zoom');
    const x = (ms) => center + (ms - boundary) * scale;
    drawText(ctx, api, 'End of “open”', x(boundary), 552, 34, C.yellow, 'center');
    api.line(ctx, x(boundary), 570, x(boundary), 640, C.yellow, 5);
    api.line(ctx, 145, 624, 1775, 624, C.muted, 3);
    const ticks =
      scale > 70
        ? [boundary - 3, boundary - 2, early, boundary, boundary + 1, boundary + 2, boundary + 3]
        : [0, ...chunks.map((piece) => piece.endMs)];
    for (const ms of ticks) {
      if (x(ms) < 142 || x(ms) > 1778) continue;
      const color = ms === boundary ? C.yellow : ms === early && compare ? C.green : C.muted;
      api.line(ctx, x(ms), 612, x(ms), 638, color, 3);
      drawText(ctx, api, String(ms), x(ms), 682, 31, color, 'center');
    }
    if (scale > 95) drawText(ctx, api, 'ms', 1775, 680, 30, C.muted, 'right');
    if (compare && scale > 25) {
      api.circle(ctx, x(early), 624, 10, C.green);
      api.circle(ctx, x(boundary), 624, 10, C.green);
    }
  });
  if (!validating)
    api.focus.target('align-slices', () => {
      if (!compare) return;
      [early, boundary].forEach((cursor, index) => {
        const x = index === 0 ? 145 : 1005;
        const ready = cue.at(index === 0 ? 'align-first' : 'align-second');
        const result = voiceReconcile(pendingText, chunks, cursor);
        const color = C.green;
        drawText(ctx, api, 'Receipt at ' + cursor + ' ms', x, 791, 35, color);
        api.line(ctx, x, 818, x + 715, 818, color, 3);
        drawText(ctx, api, ready ? '“' + result.retained + '”' : 'Keep “open”?', x, 901, 48);
        if (ready) drawText(ctx, api, `pending_text[:${result.endChar}]`, x, 965, 30, C.muted);
      });
    });
  if (validating)
    api.focus.target('align-validation', () => {
      if (!cue.at('align-scope')) {
        const empty = voiceReconcile(pendingText, chunks, 0);
        drawText(ctx, api, 'Receipt at 0 ms', 145, 798, 34, C.green);
        drawText(ctx, api, empty.retained || 'No assistant entry', 145, 878, 45);
        if (cue.at('align-type')) {
          drawText(ctx, api, 'Python character offset', 1005, 798, 34, C.yellow);
          drawText(ctx, api, '16.0  /  invalid slice index', 1005, 878, 42);
        }
      } else {
        drawText(ctx, api, 'Player acknowledged', 145, 798, 34, C.green);
        drawText(
          ctx,
          api,
          'Reply 1 through ' + interrupt.acknowledgedThrough + ' ms',
          145,
          878,
          42,
        );
        drawText(ctx, api, 'Human perception', 1005, 798, 34, C.muted);
        drawText(ctx, api, 'Unknown', 1005, 878, 42);
        if (cue.at('align-late'))
          drawText(ctx, api, 'A late reply 1 receipt cannot update reply 2.', 145, 976, 32, C.blue);
      }
    });
}

export default {
  id: 'alignment-ledger',
  draw: drawAlignmentLedger,
  cues: [
    'align-pairs',
    'align-open',
    'align-replay',
    'align-zoom',
    'align-compare',
    'align-first',
    'align-second',
    'align-zero',
    'align-type',
    'align-scope',
    'align-late',
  ],
};
