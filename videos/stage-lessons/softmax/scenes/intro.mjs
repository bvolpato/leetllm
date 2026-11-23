import { boxOf, draw, fadeOut, group, line, linear, place, rect, row, shift } from 'vizmatic/stage';
import { PROBS, TARGET } from '../../../films/softmax/fixtures.mjs';
import { area, display, label, note } from '../../kit-narrated.mjs';
import { BOARD, MARK_COLOR, STATE, TARGET_COLOR, WORD_COLOR, board } from '../parts.mjs';
import { wordBudget } from '../word-budget.mjs';

export default function intro(s, c) {
  const [page, prediction, question] = area.rows([3, 2.5, 1.5], 'normal');
  const prefix = display('The dog', { size: 128 });
  const slot = rect(320, 124, { stroke: 'dim', fill: 'surface', width: 3, radius: 10 });
  place(row([prefix, slot], { gap: 'normal' }), page);
  const cover = rect(320, 124, { fill: WORD_COLOR[0], stroke: null, radius: 10 }).moveTo(slot);
  const guess = display('ran', { size: 100, color: 'bg' }).moveTo(slot);
  const tag = label('Model’s guess', { size: 38, color: WORD_COLOR[0] }).moveTo(slot).shift(0, -98);
  const card = group(cover, guess, tag).shift(360, 0);
  const next = display('slept', { size: 110 }).moveTo(slot);
  const pageQuestion = place(note(c.title, { size: 48 }), prediction, 'top left').shift(0, -20);
  const stripArea = prediction.inset('normal', 'wide');
  const strip = wordBudget(s, stripArea, () => PROBS, { labelFirstInside: true });
  for (const share of strip.shown) share.set(1);
  const [, stripTop] = strip.segmentTop(0);
  const favorite = line(
    [stripArea.left, stripTop + 8],
    [stripArea.left + stripArea.width * PROBS[0], stripTop + 8],
    { stroke: MARK_COLOR, width: 7 },
  );
  const [wordX, wordBottom] = boxOf(next).point('bottom');
  const selected = line([wordX, wordBottom + 28], strip.segmentTop(TARGET), {
    stroke: TARGET_COLOR,
    width: 3,
  });
  const prompt = place(
    label('Which slice belongs to the word on the page?', { size: 54 }),
    question,
  );
  const firstPicture = [prefix, slot, card, pageQuestion, strip.frame, strip.body];
  s.add(firstPicture);
  // Set the opening opacity on the timeline so the narrator starts on the complete picture.
  for (const node of firstPicture) node.opacity(1);
  s.play(shift(card, -360, 0), { duration: 0.85, ease: linear });
  s.play(draw(favorite), {
    duration: c.cue('intro-uncover').start - c.window.from - 0.85,
    ease: linear,
  });
  c.hide('intro-uncover', favorite, { lead: 0 });
  c.on('intro-uncover', () => {
    s.play(shift(card, 0, -16), { duration: 0.5 });
  });
  c.after('intro-observed', () => {
    s.play(shift(card, 0, -138), fadeOut(card), {
      duration: 0.45,
    });
  });
  c.show('intro-observed', next, { after: true, lead: -0.4 });
  c.hide('intro-uncover', slot);
  c.hide('intro-observed', pageQuestion);
  c.show('intro-question', prompt);
  c.hide('intro-target', prompt, { after: true });
  c.show('intro-target', draw(selected), { after: true });

  const b = board(s, STATE.intro);
  const continued = place(
    label('The dog slept', { size: 56, color: TARGET_COLOR }),
    BOARD.rows([1, 6, 2], 'normal')[0],
    'left',
  );
  const carried = [continued, ...b.standing(STATE.intro)];
  c.swap('intro-scores', [prefix, next, selected, strip.frame, strip.body], carried);
  c.keep(carried);
}
