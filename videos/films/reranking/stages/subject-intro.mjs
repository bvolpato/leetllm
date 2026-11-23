import { ramp } from '../arithmetic.mjs';
import { labels } from '../fixtures.mjs';
import { libraryText, sundayQuestion } from '../library-shelf.mjs';

const cardWidth = 516;
const cardHeight = 184;
const firstX = 137;
const pitch = 569;
const rowY = 565;

function drawSlip(ctx, api, index, x, y, cited) {
  const { C } = api;
  const right = x + cardWidth;
  const fold = 28;
  api.path(
    ctx,
    [
      { x, y },
      { x: right - fold, y },
      { x: right, y: y + fold },
      { x: right, y: y + cardHeight },
      { x, y: y + cardHeight },
    ],
    { closed: true, fill: cited ? C.green : C.ink, width: 0 },
  );
  api.path(
    ctx,
    [
      { x: right - fold, y },
      { x: right - fold, y: y + fold },
      { x: right, y: y + fold },
    ],
    { closed: true, fill: C.muted, width: 0 },
  );
  api.text(ctx, labels[index], x + 33, y + 44, 31, C.panel);
  const words = libraryText[index].split(' ');
  const split = [3, 2, 1][index];
  api.text(ctx, words.slice(0, split).join(' '), x + 33, y + 109, 47, C.bg, 'left', 'serif');
  api.text(ctx, words.slice(split).join(' '), x + 33, y + 161, 47, C.bg, 'left', 'serif');
}

export function drawSubjectIntro(ctx, scene, state, api) {
  const { C, focus } = api;
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const move = focus.progress('choose-hours', 0);
  const answered = focus.progress('sunday-answer', 0) === 1;

  focus.target('cutoff', () => {
    api.text(ctx, 'The assistant reads these two', firstX, 331, 41, C.yellow);
    api.text(ctx, 'Outside the prompt', firstX + 2 * pitch, 331, 37, C.muted);
    const floor = rowY + cardHeight + 15;
    const left = firstX - 26;
    const right = firstX + pitch + cardWidth + 26;
    api.path(
      ctx,
      [
        { x: left, y: floor - 35 },
        { x: left + 22, y: floor },
        { x: right - 22, y: floor },
        { x: right, y: floor - 35 },
        { x: right, y: floor + 19 },
        { x: right - 22, y: floor + 40 },
        { x: left + 22, y: floor + 40 },
        { x: left, y: floor + 19 },
      ],
      { closed: true, fill: C.blue, width: 0 },
    );
    for (let slot = 0; slot < 2; slot++) {
      api.rect(
        ctx,
        firstX + slot * pitch - 13,
        rowY - 13,
        cardWidth + 26,
        cardHeight + 26,
        C.panel,
        C.blue,
        10,
      );
    }
  });
  focus.target('shelf', () => {
    api.text(ctx, sundayQuestion, firstX, 243, 59, C.ink);
    // The two moving slips clear the middle slip before crossing its column.
    const across = api.ease(ramp(move, 0.23, 0.77));
    const lift = api.ease(ramp(move, 0, 0.23)) - api.ease(ramp(move, 0.77, 1));
    labels.forEach((_, index) => {
      const settle = index < 2 ? api.ease(ramp(state.t + 0.34 - 0.14 * index, 0, 1.5)) : 1;
      const side = index === 0 ? 1 : index === 2 ? -1 : 0;
      const x = firstX + pitch * (index + 2 * side * across);
      const y = rowY - 132 * (1 - settle) + side * 200 * lift;
      drawSlip(ctx, api, index, x, y, answered && index === 2);
    });
  });
  focus.target('decision', () => {
    if (move === 0 && focus.visible('which-slip'))
      api.text(ctx, 'Can it answer from those two?', firstX, 969, 46, C.yellow);
  });
}

export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: ['first-two', 'which-slip', 'choose-hours', 'sunday-answer'],
};
