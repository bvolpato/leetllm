import { lessonFont } from '../../lib/fonts.mjs';
import { sourceDigest } from './arithmetic.mjs';

export function drawExceptionSpan(ctx, api, text, revision, end) {
  const { C } = api;
  const starts = [0, text.indexOf(' within ') + 1, text.indexOf(' only ') + 1];
  const size = 39;
  const left = 290;
  api.focus.target('original-exception', () => {
    api.text(ctx, `Original   /   exception@${revision}`, 160, 271, 39, C.ink);
    api.text(
      ctx,
      `Document SHA-256   ${sourceDigest(text).slice(0, 12)}…`,
      1760,
      266,
      28,
      C.muted,
      'right',
    );
    ctx.save();
    ctx.font = lessonFont(size, 'mono');
    for (const [i, start] of starts.entries()) {
      const stop = starts[i + 1] === undefined ? text.length : starts[i + 1] - 1;
      const y = 380 + i * 88;
      const line = text.slice(start, stop);
      const count = Math.min(line.length, Math.max(0, end - start));
      const selected = line.slice(0, count);
      const width = ctx.measureText(selected).width;
      api.text(ctx, String(start), 211, y, 29, C.muted, 'right', 'mono');
      if (count) {
        api.rect(ctx, left - 5, y - 49, width + 10, 67, '#18343d', undefined, 3);
        api.text(ctx, selected, left, y, size, C.ink, 'left', 'mono');
      }
      if (count < line.length)
        api.text(ctx, line.slice(count), left + width, y, size, C.muted, 'left', 'mono');
      if (end >= start && end <= stop) {
        const x = left + width;
        api.path(
          ctx,
          [
            { x, y: y + 17 },
            { x: x - 8, y: y + 31 },
            { x: x + 8, y: y + 31 },
          ],
          { fill: C.yellow, closed: true, width: 0 },
        );
      }
    }
    ctx.restore();
    api.text(ctx, `Selected   [0,${end})`, left, 664, 35, C.cyan, 'left', 'mono');
    api.text(ctx, `${text.length} characters in this revision`, 1755, 660, 30, C.muted, 'right');
  });
}
