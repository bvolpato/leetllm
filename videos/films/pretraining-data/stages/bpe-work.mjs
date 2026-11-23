import { BPE_RULES } from '../fixtures.mjs';
import { bpeReplay } from '../arithmetic.mjs';
import {
  drawText,
  note,
  pill,
  rectangle,
  tokenCells,
  withPretrainingMainFrame,
} from '../defaults.mjs';
export function paintPretrainingMainBpeWork(ctx, scene, state, api, C, c, b, p, cue, P, D, beg) {
  const words = ['rotate', 'keys', 'after', 'review'];
  if (b === 0) {
    drawText(
      ctx,
      api,
      C,
      'One piece per character, plus an end marker for each word',
      960,
      280,
      37,
      C.ink,
    );
    const groups = bpeReplay(words, []);
    let x = 180;
    groups.forEach((pieces, i) => {
      const pitch = 56;
      drawText(ctx, api, C, words[i], x + (pieces.length * pitch) / 2, 390, 35, C.ink);
      for (const piece of pieces) {
        const end = piece === '</w>';
        const color = end ? C.yellow : C.blue;
        rectangle(ctx, api, C, x, 433, pitch - 3, 78, C.panel, color);
        drawText(ctx, api, C, end ? 'end' : piece, x + (pitch - 3) / 2, 485, end ? 24 : 38, color);
        x += pitch;
      }
      x += 52;
    });
    if (D('initial')) pill(ctx, api, C, 'Corpus: 94 initial symbols', 960, 660, 900, C.blue);
    if (D('corpus')) pill(ctx, api, C, 'After 8 merges: 68 corpus symbols', 960, 795, 1100, C.cyan);
    if (D('sample'))
      drawText(
        ctx,
        api,
        C,
        'Four words: ' + groups.flat().length + ' starting pieces',
        960,
        930,
        37,
        C.yellow,
      );
  } else if (b === 1) {
    const n =
      Number(D('first')) +
      Math.floor(2 * P('rotate')) +
      Number(D('pair')) +
      Number(D('join')) +
      Math.floor(2 * P('finish')) +
      Number(D('last'));
    const pieces = bpeReplay(words, BPE_RULES.slice(0, n));
    const current = BPE_RULES[n - 1];
    drawText(
      ctx,
      api,
      C,
      'Rules applied   ' + n + ' / ' + BPE_RULES.length,
      165,
      287,
      38,
      C.ink,
      'left',
    );
    if (current) {
      const names = current.map((piece) => (piece === '</w>' ? 'end' : piece));
      const merged = current.join('').replace('</w>', '·end');
      drawText(ctx, api, C, names.join('  +  ') + '   →   ' + merged, 1240, 287, 44, C.yellow);
    }
    for (const [row, wordIndex] of [2, 0].entries()) {
      const y = 410 + row * 205;
      const color = row === 0 ? C.cyan : C.blue;
      drawText(ctx, api, C, words[wordIndex], 210, y + 74, 42, color, 'left');
      let x = 520;
      for (const piece of pieces[wordIndex]) {
        const label = piece.replace('</w>', '·end').replace(/^·/, '');
        const units = piece.replace('</w>', '|').length;
        const width = units * 158;
        rectangle(ctx, api, C, x, y, width - 8, 121, C.panel, color);
        drawText(ctx, api, C, label, x + (width - 8) / 2, y + 79, 42, color);
        x += width;
      }
    }
    drawText(
      ctx,
      api,
      C,
      'Each original character and each end marker occupies one column.',
      960,
      867,
      32,
      C.muted,
    );
    drawText(
      ctx,
      api,
      C,
      'Four-word sample: ' + pieces.flat().length + ' symbols',
      960,
      967,
      42,
      C.ink,
    );
  } else {
    drawText(ctx, api, C, 'Character toy versus UTF-8 bytes', 960, 300, 36, C.blue);
    pill(ctx, api, C, 'One emoji character', 500, 480, 650, C.blue);
    if (D('bytes')) tokenCells(ctx, api, C, ['F0', '9F', '98', '80'], 1000, 450, 160, C.cyan);
    if (D('revision')) {
      pill(ctx, api, C, 'Tokenizer v1 IDs', 500, 765, 650, C.muted);
      pill(ctx, api, C, 'Tokenizer v2: re-tokenize', 1420, 765, 700, C.yellow);
    }
    if (D('bytes')) {
      api.text(ctx, 'rotate·keys', 770, 635, 35, C.ink, 'right', 'mono');
      api.text(ctx, 'rotate··keys', 1150, 635, 35, C.ink, 'left', 'mono');
      note(ctx, api, C, 'Each dot marks a space. Both inputs split into the same two words.');
    }
  }
}
export function drawBpeWorkStage(ctx, scene, state, api) {
  withPretrainingMainFrame(ctx, scene, state, api, paintPretrainingMainBpeWork);
}
export default {
  id: 'bpe-work',
  draw: drawBpeWorkStage,
  cues: [
    'pt-bpe-work-initial',
    'pt-bpe-work-corpus',
    'pt-bpe-work-sample',
    'pt-bpe-work-first',
    'pt-bpe-work-rotate',
    'pt-bpe-work-pair',
    'pt-bpe-work-join',
    'pt-bpe-work-finish',
    'pt-bpe-work-last',
    'pt-bpe-work-bytes',
    'pt-bpe-work-revision',
  ],
};
