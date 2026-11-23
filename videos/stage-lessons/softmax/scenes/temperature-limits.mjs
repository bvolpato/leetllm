// Fixed class columns keep ties visible while the arithmetic changes.
import { column, decimal, place, tex, write } from 'vizmatic/stage';
import { positiveTemperature } from '../../../films/softmax/arithmetic.mjs';
import { LOGITS, UPDATED } from '../../../films/softmax/fixtures.mjs';
import { chip, heading, mono, note } from '../../kit-narrated.mjs';
import { BOARD, MARK_COLOR, SIDE, WORD_COLOR, pair, slider } from '../parts.mjs';

const DIAL = { min: 0.05, max: 100, log: true };

export default function temperatureLimits(s, c) {
  const z = LOGITS.map((value) => s.value(value));
  const temperature = s.value(1);
  const ateMasked = s.value(0);
  const [top, middle, bottom] = BOARD.rows([1, 7, 1], 'normal');
  const chart = pair(s, middle, {
    predict: () =>
      positiveTemperature(
        z.map((v, i) => (i === 2 && ateMasked.value ? -Infinity : v.value)),
        temperature.value,
      ),
    targetPredict: () => positiveTemperature(UPDATED, temperature.value),
  });
  chart.qOn.set(1);
  chart.read.set(1);
  const original = place(mono('The dog: scores [3, 1, 0]', { size: 40 }), top, 'left');
  const tied = place(mono('raise slept to match ran', { size: 40 }), top, 'left');
  const huge = place(mono('scores [1e308, 1e308, 1e308]', { size: 40 }), top, 'left');
  const twoAllowed = place(mono('scores [1e308, 1e308, −∞]', { size: 40 }), top, 'left');
  const masked = place(mono('scores [−∞, −∞, −∞]', { size: 40, color: 'red' }), top, 'left');
  const invalid = place(mono('0 + 0 + 0 = 0', { size: 44, color: 'red' }), bottom, 'left');
  const [dialBand, lower] = SIDE.rows([1, 3], 'wide');
  const dial = slider(dialBand.inset('normal', 'none'), () => temperature.value, DIAL);
  const reading = place(
    decimal(() => temperature.value, { digits: 2, size: 56, prefix: 'T = ', color: MARK_COLOR }),
    dialBand,
    'top',
  );
  const tiny = place(mono('T = 1e−308', { size: 48, color: MARK_COLOR }), dialBand, 'top');
  const title = heading(c.title);
  s.add(title, original, chart.all, dial.rail, dial.knob, reading);
  const turn =
    (value, duration = 2.2) =>
    () =>
      s.play(temperature.to(value, { duration }));
  const facts = [
    note('at fixed scores, temperature preserves the order'),
    chip('T = 0: a separate greedy branch'),
    chip('calibration: held-out outcomes'),
  ];
  place(column(facts, { gap: 'wide' }), lower, 'top left');
  c.show('temperature-limits-0', facts[0]);
  c.on('temperature-zero-limit', turn(DIAL.min));
  c.on('temperature-tied', () => {
    s.remove(original);
    s.add(tied);
    s.play(z[1].to(z[0].value, { duration: 1.2 }));
  });
  c.on('temperature-uniform', turn(DIAL.max, 3));
  c.show('temperature-greedy', facts[1]);
  c.show('temperature-calibration', facts[2]);
  c.on('temperature-calibration', turn(1));

  const arithmeticTitle = heading('Which operation comes first?');
  const perWord = (words) =>
    chart.slots.map((slot, i) => place(mono(words, { size: 68, color: WORD_COLOR[i] }), slot));
  const raw = perWord('1e308');
  const overflow = perWord('∞');
  const undefinedGaps = perWord('NaN');
  const zeros = perWord('0');
  const units = perWord('1');
  const wrong = [
    mono('z ÷ T', { size: 52 }),
    tex('10^{308} / 10^{-308} \\to \\infty', { size: 48, color: 'red' }),
    mono('∞ − ∞ → NaN', { size: 52, color: 'red' }),
  ];
  const stable = [
    mono('z − max(z)', { size: 52 }),
    mono('0 ÷ T = 0', { size: 50 }),
    mono('exp(0) = 1', { size: 48 }),
    mono('1 ÷ (1 + 1 + 1) = ⅓', { size: 43, color: MARK_COLOR }),
  ];
  for (const stack of [wrong, stable])
    place(column(stack, { gap: 'wide', align: 'left' }), lower, 'top left');
  c.on('temperature-huge-tie', () => {
    s.remove(title, tied, reading, dial.rail, dial.knob, ...facts);
    z.forEach((v) => v.set(1e308));
    temperature.set(1e-308);
    chart.qOn.set(0);
    chart.read.set(0);
    s.add(arithmeticTitle, huge, tiny, wrong[0], ...raw);
  });
  c.swap('temperature-overflow', raw, [overflow, wrong[1]], { after: true });
  c.swap('temperature-invalid-difference', overflow, [undefinedGaps, wrong[2]], { after: true });
  c.swap('temperature-retry', [wrong, undefinedGaps], raw);
  c.swap('temperature-limits-1', raw, [stable.slice(0, 2), zeros]);
  c.swap('temperature-unit-weights', zeros, [units, stable[2]], { after: true });
  c.hide('temperature-safe', units, { after: true });
  c.show('temperature-safe', stable[3], { after: true });
  c.after('temperature-safe', () => {
    chart.read.set(1);
    s.play(chart.qOn.to(1, { duration: 0.35 }));
  });
  const maskTitle = heading('Which words can still receive probability?');
  const twoWeights = place(mono('1 ÷ (1 + 1) = ½', { size: 50, color: MARK_COLOR }), lower, 'left');
  c.on('temperature-mask-one', () => {
    s.remove(arithmeticTitle, huge, ...stable);
    ateMasked.set(1);
    s.add(maskTitle, twoAllowed, twoWeights);
  });
  const noDistribution = place(
    mono('No valid distribution', { size: 40, color: 'red' }),
    lower,
    'left',
  );
  c.on('temperature-all-masked', () => {
    s.remove(twoAllowed, twoWeights);
    chart.qOn.set(0);
    chart.read.set(0);
    s.add(masked, invalid, noDistribution);
  });

  const legend = place(note('solid: student · dashed: teacher'), top, 'left');
  const distill = [
    note('teacher and student soften together'),
    tex('\\frac{\\partial L}{\\partial z} = \\frac{p_T - q_T}{T}', { size: 56 }),
    note('both soften: the difference shrinks too'),
    tex('\\times\\; T^2', { size: 64, color: MARK_COLOR }),
  ];
  place(column(distill, { gap: 'normal' }), lower, 'top left');
  c.on('temperature-limits-2', () => {
    s.remove(maskTitle, noDistribution, masked, invalid, tiny);
    z.forEach((v, i) => v.set(LOGITS[i]));
    ateMasked.set(0);
    temperature.set(1);
    chart.qOn.set(1);
    chart.pOn.set(1);
    chart.read.set(1);
    s.add(
      heading('How temperature softens teacher and student predictions'),
      legend,
      distill[0],
      dial.rail,
      dial.knob,
      reading,
    );
  });
  c.show('distill-gradient', write(distill[1]));
  c.on('distill-both', () => s.play(temperature.to(2, { duration: 2.2 })));
  c.show('distill-both', distill[2]);
  c.show('distill-scale', distill[3]);
}
