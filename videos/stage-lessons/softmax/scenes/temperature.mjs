// Scene `temperature`: temperature reshapes the shares, and learning moves the scores.
//
// The picture: a dial turns, and the bars sharpen and flatten while no word moves on the ruler.
// Then the learned scores come back, and a word passes another: only learning changes the order.
import { column, decimal, fade, place, row, tex } from 'vizmatic/stage';
import { LOGITS, UPDATED } from '../../../films/softmax/fixtures.mjs';
import { label, mono, note } from '../../kit-narrated.mjs';
import { MARK_COLOR, READ, STATE, WORDS, dogScene, slider } from '../parts.mjs';

/** The dial shows temperature on a scale of ratios, from a quarter to four. */
const DIAL = { min: 0.25, max: 4 };

export default function temperature(s, c) {
  const { b, stack, under, finish } = dogScene(s, c, STATE.update, 6);
  const [upper, lower] = under(6).rows([3, 2], 'tight');

  // The dial: a knob on a line, with the temperature and the divided lead of ran.
  const { rail, knob } = slider(upper.inset('wide', 'none'), () => b.temperature.value, {
    ...DIAL,
    log: true,
  });
  const ends = [
    place(note('sharper'), upper, 'bottom left'),
    place(note('flatter'), upper, 'bottom right'),
  ];
  const reading = place(
    decimal(() => b.temperature.value, { digits: 2, size: 56, prefix: 'T = ', color: MARK_COLOR }),
    upper,
    'top',
  );
  const lead = [
    label('lead of ran'),
    decimal(() => 2 / b.temperature.value, { digits: 1, size: 40, prefix: '2 ÷ T = ' }),
  ];
  place(row(lead, { gap: 'normal' }), lower, 'top');
  s.add(rail, knob, ends, reading);

  // The original scores come back first. Then the dial turns: lower, higher, and lower again.
  // Two words cross on the ruler while the scores change, so the numbers of the bars wait for the end.
  const slide = (cue, to, duration) => {
    c.on(cue, () => {
      WORDS.forEach((_, i) => b.read[i].set(READ.none));
      b.namesOn.set(0);
      b.tagsOn.set(0);
      s.play(...b.z.map((value, i) => value.to(to[i], { duration })));
      b.namesOn.set(1);
      b.tagsOn.set(1);
    });
    c.on(cue, () => WORDS.forEach((_, i) => b.read[i].set(READ.share)), duration + 0.1);
  };
  const tempered = tex('w_i = \\exp(z_i/T)', { size: 44, color: MARK_COLOR })
    .moveTo(stack[1][1])
    .alignTo(stack[1][1], 'left');
  const rawGradient = tex('\\frac{\\partial L}{\\partial z_i} = \\frac{p_i - y_i}{T}', { size: 44 })
    .moveTo(stack[4][1])
    .alignTo(stack[4][1], 'left');
  const historical = [stack[0], stack[2], stack[3]].flat();
  const training = [stack[1][1], stack[4][1], stack[5]];
  c.swap('temperature-original', training, [tempered, rawGradient]);
  c.on('temperature-original', () =>
    s.play(...historical.map((n) => fade(n, 0.3)), { duration: 0.3 }),
  );
  slide('temperature-original', LOGITS, 1.2);
  const turn = (value) => () => s.play(b.temperature.to(value, { duration: 1.6 }));
  c.on('temperature-distribution-b1-1', turn(0.5));
  c.on('temperature-higher-b1-2', turn(2));
  c.show('temperature-order', lead);
  c.on('temperature-distribution-b2-1', turn(0.35));

  // Back to one. Now the learned scores: slept passes ran on the ruler.
  c.on('temperature-restore', turn(1));
  c.hide('temperature-learned', lead);
  slide('temperature-learned', UPDATED, 2);
  const order = place(
    column(
      [label('temperature: the same order'), label('learning: a new order', { color: MARK_COLOR })],
      { gap: 'none' },
    ),
    lower,
    'top',
  );
  c.show('temperature-changed', order);
  c.swap('temperature-changed', [tempered, rawGradient], training);
  c.on('temperature-changed', () =>
    s.play(...historical.map((n) => fade(n, 1)), { duration: 0.3 }),
  );
  finish(STATE.temperature, 6);
}
