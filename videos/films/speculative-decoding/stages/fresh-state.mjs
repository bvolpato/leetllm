import { freshStateFrame } from '../model.mjs';
import { movement } from '../construction.mjs';
import { wordOdds } from '../word-odds.mjs';

export function drawFreshState(ctx, scene, state, api) {
  const { C } = api;
  const f = freshStateFrame(state);
  const text = (value, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, value, x, y, size, color, align);
  const [softly, today] = [f.words[f.candidate - 1], f.words[f.suffix - 1]];
  const correctedWord = f.words[f.correction - 1];
  const showCache = state.beat >= 2;
  const upper = f.rejected ? C.muted : C.cyan;
  api.focus.target('fresh-sentence', () => {
    text('Committed prefix', 155, 291, 30, C.green);
    text('The bird sang', 155, 372, 61);
    api.line(ctx, 578, 351, 670, 351, C.green, 4);
    api.line(ctx, 670, 351, 770, 282, upper, 4);
    api.line(ctx, 670, 351, 770, 425, f.corrected ? C.green : C.muted, 4);
    text('Draft', 837, 216, 31, upper);
    text(softly, 837, 303, 55, upper);
    api.arrow(ctx, 1095, 284, 1320, 284, upper, 4);
    text(today, 1385, 303, 55, upper);
    if (f.rejected) {
      text('discarded path', 1385, 364, 30, C.pink);
    }
    const word = f.corrected ? correctedWord : '?';
    text(word, 837, 444, 58, f.corrected ? C.green : C.yellow);
    api.line(ctx, 828, 464, 1102, 464, f.corrected ? C.green : C.yellow, 3);
    text(f.corrected ? 'Newly committed' : 'Next word to emit', 1170, 446, 32, C.ink);
  });
  if (!showCache) {
    api.focus.target('fresh-laws', () => {
      wordOdds(ctx, api, {
        words: f.words, p: f.p, q: f.q, y: 613, selected: f.corrected ? f.correction - 1 : f.candidate - 1,
      });
      const drawVisible = state.beat > 0 || movement(state, 0, 'sd-fresh-draw', 0.42, 0.67) > 0;
      if (drawVisible) {
        const callout = f.rejected
          ? 'softly     0.25 ÷ 0.35 = 5/7     ·     draw ' + f.uniform.toFixed(2)
          : 'softly     acceptance draw ' + f.uniform.toFixed(2);
        text(callout, 960, 906, 40, C.yellow, 'center');
      }
    });
    if (f.corrected) text('Can the cache entry for the upper “today” serve the lower one?',
      960, 999, 35, C.ink, 'center');
    return;
  }

  // The same fork now carries states. The upper and lower occurrences of token 3
  // keep their separate incoming edges, including after the verifier rolls back.
  const x0 = 385, x1 = 921, x2 = 1485;
  const y0 = 725, yDraft = 630, yReader = 825;
  api.focus.target('fresh-root', () => {
    text('History through sang', x0, y0 - 58, 31, C.muted, 'center');
    text(String(f.root), x0, y0 + 36, 66, C.blue, 'center');
  });
  api.focus.target('fresh-draft-path', () => {
    const color = f.rolledBack ? C.muted : C.cyan;
    api.line(ctx, x0 + 64, y0, x1 - 81, yDraft, color, 4);
    api.line(ctx, x1 + 76, yDraft, x2 - 103, yDraft, color, 4);
    text('Read softly (2)', x1, yDraft - 57, 34, color, 'center');
    text('Read today (3)', x2, yDraft - 57, 34, color, 'center');
    text(f.provisionalFirst || f.provisional ? String(f.first) : '?', x1, yDraft + 29, 62, color, 'center');
    text(f.provisional ? String(f.last) : '?', x2, yDraft + 29, 62, color, 'center');
    if (f.rolledBack) text('rejected history', x2, yDraft + 95, 30, C.pink, 'center');
  });
  api.focus.target('fresh-reader-path', () => {
    const processing = movement(state, 2, 'sd-fresh-process', 0.69, 0.90);
    const start = x0 + 64, end = x1 - 80;
    api.line(ctx, start, y0 + 20, end, yReader, C.muted, 3);
    if (processing > 0)
      api.line(ctx, start, y0 + 20, start + (end - start) * processing,
        y0 + 20 + (yReader - y0 - 20) * processing, C.green, 6);
    text('Read today (3)', x1, yReader - 61, 34, f.processed ? C.green : C.ink, 'center');
    text(f.processed ? String(f.repaired) : '?', x1, yReader + 30, 62, f.processed ? C.green : C.yellow, 'center');
    if (f.pending) text('Committed · cache pending', x1 + 120, yReader + 18, 34, C.yellow);
    text('Current reusable state: ' + f.cache, 148, 993, 34, C.blue);
    if (f.processed)
      text('Process ' + f.correction + ' on ' + f.root + ': ' + f.root + ' × 10 + ' +
        f.correction + ' = ' + f.repaired, 1765, 993, 36, C.green, 'right');
  });
}
export default {
  id: 'fresh-state', draw: drawFreshState,
  cues: ['sd-fresh-inputs', 'sd-fresh-draw', 'sd-fresh-question', 'sd-fresh-reject',
    'sd-fresh-correction', 'sd-fresh-reuse', 'sd-fresh-82', 'sd-fresh-provisional',
    'sd-fresh-rollback', 'sd-fresh-pending', 'sd-fresh-process', 'sd-fresh-next'],
};
