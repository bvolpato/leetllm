import { event } from '../arithmetic.mjs';
import { WORDS } from '../fixtures.mjs';
import { INPUT } from '../model.mjs';
import { withTransformerLegacyFrame } from '../defaults.mjs';

const wordSize = 100;
const letterWidth = wordSize * 0.6;
const words = WORDS.map((word, i) => {
  const precedingLetters = WORDS.slice(0, i).reduce((n, word) => n + word.length + 1, 0);
  const x = 206 + precedingLetters * letterWidth;
  return { word, x, center: x + (word.length * letterWidth) / 2 };
});
const cursorX = 206 + (WORDS.join(' ').length + 1) * letterWidth;
const featureSpacing = 82;
const halfRow = 2 * featureSpacing;

export function paintIntro(ctx, scene, state, api, C, b, P, f) {
  const selected = event(state, 1, 'select-query', 0.03, 0.16) === 1;
  const last = words.length - 1;
  const color = (i) => (selected && i === last ? C.yellow : C.blue);

  api.focus.target('prefix', () => {
    words.forEach(({ word, x }, i) => {
      api.text(
        ctx,
        word,
        x,
        415,
        wordSize,
        selected && i === last ? C.yellow : C.ink,
        'left',
        'mono',
      );
    });
    const pulse = (1 + Math.cos(2 * Math.PI * (state.t ?? 0))) / 2;
    ctx.save();
    ctx.globalAlpha *= 0.55 + 0.45 * pulse;
    api.rect(ctx, cursorX, 322, 9, 102, C.cyan, undefined, 2);
    ctx.restore();
  });

  api.focus.target('input-rows', () => {
    words.forEach(({ center }, i) => {
      api.line(ctx, center, 454, center, 502, color(i), 3);
      api.text(ctx, 'position ' + i, center, 559, 31, color(i), 'center');
      const rowLeft = center - halfRow;
      INPUT[i].forEach((value, j) => {
        const x = rowLeft + (j + 0.5) * featureSpacing;
        const height = value * 104;
        if (height > 0) api.rect(ctx, x - 17, 718 - height, 34, height, color(i), undefined, 3);
        api.text(ctx, String(Number(f(value, 2))), x, 773, 32, C.ink, 'center', 'mono');
      });
      api.line(ctx, rowLeft, 718, center + halfRow, 718, C.muted, 2);
    });
  });

  if (selected) {
    const span = event(state, 1, 'carry-row', 0.35, 0.7);
    const right = words[last].center + halfRow;
    const left = words[last].center - halfRow + (words[0].center - words[last].center) * span;
    api.focus.target('history-span', () => {
      api.line(ctx, left, 829, right, 829, C.cyan, 4);
      api.line(ctx, left, 811, left, 829, C.cyan, 4);
      api.line(ctx, right, 811, right, 829, C.cyan, 4);
      if (span === 1)
        api.text(
          ctx,
          '“the” can read all three positions',
          (right + left) / 2,
          888,
          34,
          C.cyan,
          'center',
        );
    });
  }
  if (b >= 2) {
    const lookup = event(state, 2, 'lookup-start', 0.35, 0.7);
    api.focus.target('opening-id', () =>
      api.text(
        ctx,
        lookup === 1 ? '“the”   →   vocabulary ID 2' : 'One block   ·   one head',
        960,
        984,
        35,
        lookup === 1 ? C.yellow : C.muted,
        'center',
      ),
    );
  }
}

export function drawIntroStage(ctx, scene, state, api) {
  withTransformerLegacyFrame(ctx, scene, state, api, paintIntro);
}
export default {
  id: 'intro',
  draw: drawIntroStage,
  cues: ['enter-prefix', 'enter-rows', 'select-query', 'carry-row', 'lookup-start'],
};
