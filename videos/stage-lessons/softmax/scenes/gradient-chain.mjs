// A symbolic route earns each signed logit gradient beside the fixed dog board.
import {
  column,
  dynamic,
  fade,
  grid,
  line,
  place,
  rect,
  row,
  tex,
  text,
  write,
} from 'vizmatic/stage';
import { completeModel } from '../../../films/softmax/model.mjs';
import { PROBS, TARGET } from '../../../films/softmax/fixtures.mjs';
import { mono, note } from '../../kit-narrated.mjs';
import { MARK_COLOR, SIDE, STATE, WORDS, WORD_COLOR, dogScene } from '../parts.mjs';

const signed = (value, digits) => `${value < 0 ? '−' : '+'}${Math.abs(value).toFixed(digits)}`;

export default function gradientChain(s, c) {
  const { b, stack, under, finish } = dogScene(s, c, STATE.loss, 4);
  const model = completeModel();
  const region = under(4);
  const [tableBand, routeBand] = region.rows([3, 1.4], 'normal');
  const entry = tex('J_{ij} = p_i\\,(\\delta_{ij} - p_j)', { size: 52 });
  const zero = note('Σ = 0');
  place(column([entry, zero], { gap: 'tight' }), region, 'top left');
  const [reference, chart, legendBand] = SIDE.rows([1, 3.5, 1], 'wide');
  const nudge = place(
    note('Change in probability from the original prediction'),
    reference,
    'left',
  );
  const [names, plot] = chart.columns([1, 3], 'normal');
  const lanes = plot.rows(3, 'normal');
  const zeroX = plot.cx;
  const axis = line([zeroX, chart.top], [zeroX, chart.bottom], { stroke: 'dim', width: 3 });
  const namesAt = WORDS.map((word, i) =>
    text(word, { size: 44, color: WORD_COLOR[i] }).at(names.cx, lanes[i].cy),
  );
  const zeroLabel = [
    text('lost', { size: 32, color: 'dim' }).at((plot.left + zeroX) / 2, legendBand.cy),
    text('0', { size: 32, font: 'mono' }).at(zeroX, legendBand.cy),
    text('gained', { size: 32, color: 'dim' }).at((zeroX + plot.right) / 2, legendBand.cy),
  ];
  const changes = dynamic(() =>
    b.shares().flatMap((p, i) => {
      const change = p - PROBS[i];
      const length = Math.abs(change) * plot.width * 8;
      if (length < 1) return [];
      return [
        rect(length, 48, { fill: WORD_COLOR[i], stroke: null }).at(
          zeroX + (Math.sign(change) * length) / 2,
          lanes[i].cy,
        ),
      ];
    }),
  );
  const gauge = [nudge, axis, namesAt, zeroLabel, changes];
  const formulas = stack.slice(0, 4).flat();

  const order = [1, 0, 2];
  const heads = [
    ['raised\nlogit', 'z_i'],
    ['probability\nderivative', '\\partial p_s / \\partial z_i'],
    ['loss slope', '\\partial L / \\partial p_s'],
    ['logit\ngradient', '\\partial L / \\partial z_i'],
  ].map(([name, formula]) => column([note(name), tex(formula, { size: 34 })], { gap: 'tight' }));
  const rows = order.map((i) => [
    mono(WORDS[i], { color: WORD_COLOR[i], size: 34 }),
    mono(signed(model.jacobian[1][i], i === 2 ? 4 : 3), { size: 34 }),
    mono(`× ${model.targetSlope.toFixed(2)}`, { size: 34 }),
    mono(signed(model.chain[i], 3), { size: 34, color: MARK_COLOR }),
  ]);
  place(
    grid([...heads, ...rows.flat()], { columns: 4, gap: ['normal', 'tight'], align: 'left' }),
    tableBand,
    'top left',
  );
  const targetFactor = tex('p_s(1-p_s)', { size: 44 });
  const targetSlope = tex('\\times \\frac{-1}{p_s}', { size: 44 });
  const competitorFactor = tex('-p_s p_r', { size: 44 });
  const competitorSlope = tex('\\times \\frac{-1}{p_s}', { size: 44 });
  const targetResult = tex('= p_s - 1', { size: 44, color: MARK_COLOR });
  const competitorResult = tex('= p_r', { size: 44, color: MARK_COLOR });
  const targetRoute = row([targetFactor, targetSlope, targetResult], { gap: 'normal' });
  const competitorRoute = row([competitorFactor, competitorSlope, competitorResult], {
    gap: 'normal',
  });
  const legend = note('s = slept · r = ran');
  place(column([legend, targetRoute], { gap: 'tight' }), routeBand, 'left');
  place(competitorRoute, routeBand, 'bottom left');

  c.swap('gradient-chain-0', formulas, gauge);
  c.on('jacobian-nudge', () => s.play(b.z[TARGET].to(1.4, { duration: 1.2 })));
  c.on('jacobian-formula', () => s.play(b.z[TARGET].to(1, { duration: 0.9 })));
  c.swap('jacobian-formula', gauge, [formulas, entry], { lead: -1.1 });
  c.show('jacobian-column', zero, { after: true });
  c.swap('gradient-chain-1', entry, [heads[0], heads[1], ...rows.map((cells) => cells[0])]);
  c.hide('gradient-chain-1', zero);
  c.show('jacobian-self', rows[0][1], { after: true });
  c.show('jacobian-ran', rows[1][1], { after: true });
  c.show('jacobian-ate', rows[2][1], { after: true });
  c.show('jacobian-loss-slope', [heads[2], ...rows.map((cells) => cells[2])], { after: true });
  c.show('gradient-chain-2', [heads[3], legend]);
  c.show('chain-target-route', [targetFactor, targetSlope]);
  c.on('chain-target-cancel', () =>
    s.play(
      ...[...targetFactor.part('p_s').slice(0, 2), ...targetSlope.part('p_s')].map((glyph) =>
        fade(glyph, 0.25),
      ),
      { duration: 0.7 },
    ),
  );
  c.show('chain-target', [rows[0][3], targetResult], { after: true });
  c.swap(
    'chain-competitor-route',
    [targetFactor, targetSlope, targetResult],
    [competitorFactor, competitorSlope],
    { lead: -1.2 },
  );
  c.on('chain-competitor-cancel', () =>
    s.play(
      ...[...competitorFactor.part('p_s'), ...competitorSlope.part('p_s')].map((glyph) =>
        fade(glyph, 0.25),
      ),
      { duration: 0.7 },
    ),
  );
  c.show('chain-competitor', [rows[1][3], rows[2][3], competitorResult], { after: true });
  c.hide('chain-normalized', [
    heads,
    rows,
    legend,
    competitorFactor,
    competitorSlope,
    competitorResult,
  ]);
  c.show('chain-normalized', [stack[4][0], write(stack[4][1])], { after: true });
  const direct = place(
    tex(
      '\\frac{\\partial}{\\partial z_i}\\ln\\!\\sum_j e^{z_j} = \\frac{e^{z_i}}{\\sum_j e^{z_j}} = p_i',
      { size: 46 },
    ),
    under(5),
    'left',
  );
  c.show('chain-logsumexp', direct, { after: true });
  finish(STATE['gradient-chain'], 5);
}
