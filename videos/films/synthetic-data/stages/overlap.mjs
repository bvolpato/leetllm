import { ADMISSION_FIXTURES, PARAPHRASE } from '../fixtures.mjs';
import { screenTask } from '../model.mjs';

const copied = screenTask(ADMISSION_FIXTURES.find((row) => row.id === 'C5').text);
const paraphrase = screenTask(PARAPHRASE);

export function drawOverlap(ctx, scene, state, api) {
  const { C, focus } = api;
  const alternative = focus.progress('paraphrase-start', 0) > 0;
  const report = alternative ? paraphrase : copied;
  const match = copied.matches[0];
  const slide = focus.progress('align-windows', 0);
  const following = focus.progress('following-windows', 0) * (copied.matches.length - 1);
  const confirmed = !alternative && focus.progress('span-hit', 0) === 1;
  const wordWidth = 177;
  const left = 160;
  const start = alternative
    ? (report.tokens.length - 5) * focus.progress('paraphrase-scan', 0)
    : match.start * slide + following;
  const positions = (index) => left + index * wordWidth;
  function strip(tokens, y, indent, window, label, tint) {
    api.text(ctx, label, left, y - 75, 37, tint);
    for (const [i, token] of tokens.entries()) {
      const x = positions(indent + i);
      api.rect(ctx, x, y - 40, wordWidth - 9, 85, C.panel);
      api.text(ctx, token, x + (wordWidth - 9) / 2, y + 16, 37, C.ink, 'center');
    }
    if (window !== null) {
      const x = positions(indent + window);
      const right = x + 5 * wordWidth - 9;
      api.line(ctx, x, y + 72, right, y + 72, tint, 5);
      api.line(ctx, x, y + 53, x, y + 72, tint, 5);
      api.line(ctx, right, y + 53, right, y + 72, tint, 5);
    }
  }
  focus.target('reference-window', () =>
    strip(
      report.referenceTokens,
      424,
      match.start,
      alternative || slide === 0 ? null : match.referenceStart + following,
      'Reserved evaluation task',
      C.blue,
    ),
  );
  focus.target('candidate-window', () =>
    strip(
      report.tokens,
      685,
      0,
      start,
      alternative ? 'New candidate' : 'Generated task  C5',
      confirmed ? C.pink : C.yellow,
    ),
  );
  focus.target('screen-receipt', () => {
    let message = 'Move one word right. Which word will be at the right edge?';
    if (confirmed) {
      const current = Math.floor(following);
      message = 'Match ' + (current + 1) + '     “' + copied.matches[current].span + '”';
    }
    if (focus.progress('copy-outcome', 0) === 1)
      message = 'C5   ·   hold for copied evaluation wording';
    if (alternative) message = 'Same private index   ·   same five-word rule';
    if (focus.progress('no-shared-span', 0) === 1)
      message = report.matches.length + ' shared five-word spans   ·   inspect the paraphrase';
    if (alternative || confirmed || focus.progress('span-question', 0) > 0)
      api.text(ctx, message, 960, 955, 45, confirmed ? C.pink : C.yellow, 'center');
    else
      api.text(
        ctx,
        'Private index   ·   windows of five normalized words',
        960,
        955,
        36,
        C.muted,
        'center',
      );
  });
}
export default {
  id: 'overlap',
  draw: drawOverlap,
  cues: [
    'window-start',
    'window-slide',
    'span-question',
    'align-windows',
    'span-hit',
    'following-windows',
    'copy-outcome',
    'paraphrase-start',
    'paraphrase-scan',
    'no-shared-span',
  ],
};
