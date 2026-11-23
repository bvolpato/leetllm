import { afterCue, cueMotion, sampleModel } from '../construction.mjs';
import { packedAverage, sum } from '../arithmetic.mjs';
import { packedValues } from '../fixtures.mjs';

export function drawPacked(ctx, scene, state, api) {
  const { C, focus } = api;
  const s = sampleModel(scene.id, state);
  const label = (v, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, v, x, y, size, color, align);
  const wrong = s.cut === 4;
  const x = (i) => 304 + i * 321;
  label('Packed token address', 145, 286, 32, C.muted);
  s.membership.forEach(({ word, owner }, i) => {
    const cx = x(i);
    const color = owner === 'A' ? C.blue : C.pink;
    label(i, cx, 365, 33, C.muted, 'center');
    api.rect(ctx, cx - 143, 398, 286, 236, C.panel, color, 6);
    label(word, cx, 486, 48, color, 'center');
    label('V = ' + packedValues[i], cx, 581, 45, C.ink, 'center');
  });
  const proposed = afterCue(state, 1, 'packed-shift') && !afterCue(state, 2, 'packed-admit');
  const cutPosition =
    3 + cueMotion(state, 2, 'packed-admit') - cueMotion(state, 2, 'packed-restore');
  focus.target('packed-boundary', () => {
    const edge = x(cutPosition) - 160.5;
    api.line(ctx, edge, 643, edge, 693, C.yellow, 6);
    api.line(ctx, x(0) - 142, 670, edge, 670, C.blue, 4);
    api.line(ctx, edge + 8, 670, x(4) + 142, 670, C.pink, 4);
    label(
      proposed ? 'Proposed offsets  [0, 4, 5]' : 'Offsets  [' + s.offsets.join(', ') + ']',
      1750,
      286,
      38,
      C.yellow,
      'right',
    );
  });
  const shown = wrong
    ? afterCue(state, 2, 'packed-wrong-mean')
    : afterCue(state, 2, 'packed-restore')
      ? afterCue(state, 2, 'packed-restored-mean')
      : afterCue(state, 0, 'packed-sum');
  focus.target('packed-mean', () => {
    const kept = packedValues.slice(0, s.cut);
    const answer = wrong ? packedAverage(s.cut) : sum(kept) + '/' + kept.length;
    label(proposed ? 'First example before the change' : 'First example', 149, 774, 34, C.blue);
    label(
      '(' + kept.join(' + ') + ')  ÷  ' + kept.length + '  =  ' + (shown ? answer : '?'),
      151,
      895,
      63,
      wrong ? C.yellow : C.ink,
    );
  });
  if (s.b === 1) label('Which word would join? What would the average be?', 151, 993, 33, C.muted);
}

export default {
  id: 'packed',
  draw: drawPacked,
  cues: [
    'packed-sum',
    'packed-shift',
    'packed-admit',
    'packed-wrong-mean',
    'packed-restore',
    'packed-restored-mean',
  ],
};
