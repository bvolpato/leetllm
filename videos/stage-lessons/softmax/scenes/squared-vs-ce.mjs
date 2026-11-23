// The probabilities stay on the left while two losses propose different changes to the same score.
import {
  barChart,
  beside,
  column,
  dynamic,
  fade,
  fitted,
  grid,
  indicate,
  line,
  place,
  rect,
  row,
  tex,
} from 'vizmatic/stage';
import { completeModel } from '../../../films/softmax/model.mjs';
import { area, heading, label, mono, namedBox, note } from '../../kit-narrated.mjs';
import { MARK_COLOR, OTHER_COLOR, TARGET_COLOR, WORDS, WORD_COLOR } from '../parts.mjs';

const TARGET = 1;
/** The two losses of the scene. Yellow is cross-entropy, and cyan is squared error. */
const LOSS = { ce: MARK_COLOR, squared: OTHER_COLOR };

export default function squaredVsCe(s, c) {
  const model = completeModel();
  const p = model.certain;
  const gradient = { ce: p[TARGET] - 1, squared: model.squared[TARGET] };

  const [picture] = area.rows([7, 1], 'normal');
  const [left, right] = picture.columns([2, 5], 'loose');

  // The mistake: three bars that stay for the whole scene. Each value waits for its clause.
  const [premiseBand, plot] = left.rows([1, 4], 'tight');
  const bars = WORDS.map((word, i) => ({ label: word, value: p[i], color: WORD_COLOR[i] }));
  const chart = place(
    fitted(plot.inset('normal'), (width) =>
      barChart(bars, {
        width,
        height: plot.height * 0.6,
        max: 1,
        labelSize: 40,
        showValues: false,
      }),
    ),
    plot,
  );
  const premise = place(
    column(
      [row([label('scores'), mono('[8, 0, 0]')]), label('target: slept', { color: TARGET_COLOR })],
      {
        gap: 'tight',
        align: 'center',
      },
    ),
    premiseBand,
  );
  const values = p.map((value, i) =>
    beside(
      mono(value.toFixed(4), { color: WORD_COLOR[i], size: 34 }),
      chart,
      'under',
      'tight',
      chart.bar(i),
    ),
  );
  c.show('brier-logits', premise);
  c.show('brier-favorite', values[0], { after: true });
  c.show('brier-target', [values[1], values[2]], { after: true });

  // The two losses: a slope in probability, times the softmax factor, gives a gradient on the score.
  const route = (name, formula, slope, entry, color, value) => ({
    name: column([label(name, { color }), tex(formula, { size: 36, color })], { gap: 'tight' }),
    slope: tex(slope, { size: 48, color }),
    factor: tex(`\\times\\; ${entry}`, { size: 48 }),
    result: namedBox(value.toFixed(4), { width: 230, height: 96, color, font: 'mono' }),
  });
  // Cross-entropy has one term, on the target. Squared error sums over the three words.
  const ce = route(
    'cross-entropy',
    '-\\log p_{t}',
    '-\\tfrac{1}{p_{t}}',
    'p_{t}\\,(1 - p_{t})',
    LOSS.ce,
    gradient.ce,
  );
  const squared = route(
    'squared error',
    '\\tfrac12 \\sum_i (p_i - y_i)^2',
    '(p_i - y_i)',
    'p_i\\,(\\delta_{it} - p_{t})',
    LOSS.squared,
    gradient.squared,
  );
  const heads = ['loss', 'slope', 'softmax factor', 'sum of products'].map((words) => note(words));
  const cells = (loss) => [loss.name, loss.slope, loss.factor, loss.result];
  place(
    grid([...heads, ...cells(ce), ...cells(squared)], {
      columns: 4,
      gap: ['normal', 'loose'],
      align: 'left',
    }),
    right,
    'left',
  );
  const sentence = (context, word, color) =>
    column(
      [note(context), row([label('The dog', { size: 75 }), label(word, { size: 75, color })])],
      { align: 'left', gap: 'tight' },
    );
  const observed = sentence('On the page', 'slept', TARGET_COLOR);
  const favorite = sentence('Model’s first choice', 'ran', WORD_COLOR[0]);
  place(column([observed, favorite], { align: 'left', gap: 'loose' }), right);
  s.add(heading(c.title), chart, observed);
  c.show('brier-logits', favorite);
  c.swap('squared-vs-ce-0', [observed, favorite], [heads, ce.name]);
  c.show('brier-half-sum', squared.name);
  c.show('brier-jacobian', [ce.factor, squared.factor]);
  c.show('squared-vs-ce-1', ce.slope);
  // Cross-entropy cancels the factor: the p of the slope and the p of the factor go dim together.
  const cancelled = [...ce.slope.part('p_{t}'), ...ce.factor.part('p_{t}').slice(0, 2)];
  c.on('brier-cancel', () =>
    s.play(...cancelled.map((glyph) => fade(glyph, 0.25)), { duration: 0.8 }),
  );
  c.show('brier-ce-result', ce.result, { after: true });
  c.show('brier-squared-slope', squared.slope);
  c.show('brier-squared-result', squared.result, { after: true });
  // Squared error keeps the factor: it swells and turns yellow.
  c.on('brier-remain', () => s.play(indicate(squared.factor, { color: MARK_COLOR })));

  const [header, ceBand, sqBand] = right.inset('wide').rows([1, 1.3, 1.3], 'wide');
  const step = place(
    column(
      [label('Increase in the score for slept', { size: 56 }), note('Direct step of size 1')],
      {
        align: 'left',
        gap: 'tight',
      },
    ),
    header,
    'left',
  );
  c.swap('squared-vs-ce-2', [heads, ...cells(ce), ...cells(squared)], step);

  function showUpdate(cue, name, band, slope, color) {
    const [title, meter] = band.rows(2, 'tight');
    const rail = rect(meter.width, 24, { fill: 'surface', stroke: 'dim', width: 2 }).at(
      meter.cx,
      meter.cy,
    );
    const lossName = place(label(name, { color }), title, 'left');
    const amount = place(mono('+' + (-slope).toFixed(4), { color, size: 48 }), title, 'right');
    const zero = place(note('0'), meter, 'bottom left').shift(0, 16);
    const one = place(note('+1'), meter, 'bottom right').shift(0, 16);
    c.show('squared-vs-ce-2', [rail, lossName, zero, one], { lead: -0.45 });
    const fraction = s.value(0);
    const change = dynamic(() => {
      const width = -slope * fraction.value * meter.width;
      const end = meter.left + width;
      const tick = line([end, meter.cy - 19], [end, meter.cy + 19], { stroke: color, width: 4 });
      return width > 0
        ? [
            rect(width, 22, { fill: color, stroke: null }).at(meter.left + width / 2, meter.cy),
            tick,
          ]
        : [];
    });
    c.after(cue, () => {
      s.add(change);
      s.play(fraction.to(1, { duration: 0.45 }));
    });
    c.show(cue, amount, { after: true, lead: -0.45 });
    return amount;
  }
  showUpdate('brier-ce-step', 'Cross-entropy', ceBand, gradient.ce, LOSS.ce);
  const squaredStep = showUpdate(
    'brier-squared-step',
    'Squared error',
    sqBand,
    gradient.squared,
    LOSS.squared,
  );
  c.on('brier-inspect', () => s.play(indicate(squaredStep, { color: LOSS.squared })));
}
