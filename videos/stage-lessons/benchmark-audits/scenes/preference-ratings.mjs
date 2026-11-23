import { axes, place, dynamic, dot, indicate, rect, tex } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { caseBoard, MAIN, FOOT, preferenceProbability } from '../parts.mjs';
export default function preference(s, c) {
  const board = caseBoard();
  const [formula, plotRegion] = MAIN.rows([1, 4], 'wide');
  const equation = place(tex('q_{AB}=\\frac{1}{1+10^{(R_B-R_A)/400}}', { size: 44 }), formula);
  const plot = place(
    axes({
      width: plotRegion.width - 100,
      height: plotRegion.height - 100,
      x: [-400, 800],
      y: [0, 1],
      xStep: 400,
      yStep: 0.5,
      labelSize: 34,
      labels: false,
      grid: true,
      tips: false,
    }),
    plotRegion,
  );
  plot.plot((x) => preferenceProbability(x), { stroke: 'blue', width: 5 });
  const ticks = [-400, 0, 400, 800].map((v) => {
    const p = plot.world(v, 0);
    return note(String(v)).moveTo([p[0], p[1] + 50]);
  });
  const levels = [0.5, 1].map((v) => {
    const p = plot.world(-400, v);
    return note(String(v)).moveTo([p[0] - 40, p[1]]);
  });
  const gap = s.value(0);
  const marker = dynamic(() =>
    dot(13, 'yellow').moveTo(plot.world(gap.value, preferenceProbability(gap.value))),
  );
  const equal = place(label('Equal ratings → 1/2', { color: 'yellow' }), FOOT);
  const advantage = place(label('A +400 → 10/11 ≈ 91%', { color: 'yellow' }), FOOT);
  const headingCurve = heading('How does a rating gap change preference?');
  const [cards, readout, foot] = area.rows([3.4, 1.5, 1], 'wide');
  const outcomes = ['A wins', 'A wins', 'Tie', 'Both bad'];
  const credits = outcomes.map((v) => (v === 'A wins' ? 1 : 0.5));
  const votes = cards.columns(outcomes.length, 'wide').map((slot, i) => {
    const [ballot, outcome, points] = slot.inset('normal').rows([1, 1.5, 1.5], 'tight');
    return {
      ballot: [
        place(
          rect(slot.width, slot.height, { fill: 'surface', stroke: 'grid', width: 3, radius: 12 }),
          slot,
        ),
        place(note('Vote ' + (i + 1)), ballot),
        place(label(outcomes[i], { size: 56 }), outcome),
      ],
      credit: place(mono('+' + credits[i], { size: 56, color: 'cyan' }), points),
    };
  });
  const wins = outcomes.filter((v) => v === 'A wins').length;
  const points = credits.reduce((sum, credit) => sum + credit, 0);
  const [left, right] = readout.columns(2, 'loose');
  const tally = (name, value, slot) => {
    const [top, bottom] = slot.rows(2, 'tight');
    return [
      place(label(name), top),
      place(
        mono(`${value}/${votes.length} = ${(100 * value) / votes.length}%`, {
          size: 58,
          color: 'yellow',
        }),
        bottom,
      ),
    ];
  };
  const variants = place(note('Who voted? On which prompts? Which variants were published?'), foot);
  s.add(headingCurve, equation, plot, ticks, levels);
  c.take(board.nodes);
  c.on('preference-ratings-phase-0', () =>
    s.play(indicate(equation, { scale: 1, color: 'yellow' })),
  );
  c.on('ba-preference-ratings-logistic', () =>
    s.play(indicate(plot, { scale: 1, color: 'yellow' })),
  );
  c.on('ba-preference-ratings-exponent', () =>
    s.play(indicate(equation.part('400'), { scale: 1, color: 'yellow' })),
  );
  c.on('preference-ratings-phase-1', () => s.play(indicate(plot, { scale: 1, color: 'yellow' })));
  c.show('rating-equal', [marker, equal], { after: true });
  c.on('ba-preference-ratings-equal', () =>
    s.play(indicate(equation, { scale: 1, color: 'yellow' })),
  );
  c.after('ba-preference-ratings-advantage', () => s.play(gap.to(400, { duration: 1.2 })));
  c.hide('ba-preference-ratings-advantage', equal, { after: true });
  c.show('rating-gap', advantage, { after: true });
  c.swapAll('four-votes', [heading('How much credit does A get?'), votes.map((v) => v.ballot)]);
  c.show(
    'win-credit',
    votes.slice(0, wins).map((v) => v.credit),
    { after: true },
  );
  c.show(
    'ties-half',
    votes.slice(wins).map((v) => v.credit),
    { after: true },
  );
  c.show('strict-share', tally('Outright wins', wins, left), { after: true });
  c.show('vote-share', tally('Mean vote credit', points, right), { after: true });
  c.show('ba-preference-ratings-variants', variants);
}
