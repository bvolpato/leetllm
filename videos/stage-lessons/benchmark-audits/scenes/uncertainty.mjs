import { axes, place, dot, dynamic, indicate, tex, curve } from 'vizmatic/stage';
import { heading, label, note } from '../../kit-narrated.mjs';
import { caseBoard, MAIN, FOOT } from '../parts.mjs';
export default function uncertainty(s, c) {
  const board = caseBoard();
  const [formula, region] = MAIN.rows([1, 4], 'wide');
  const equation = place(tex('P(\\mathrm{all\\ pass})=p^n', { size: 54 }), formula);
  const n = s.value(3),
    p = 0.8;
  const plot = place(
    axes({
      width: region.width - 100,
      height: region.height - 100,
      x: [0, 1],
      y: [0, 1],
      xStep: 0.2,
      yStep: 0.5,
      labelSize: 34,
      labels: false,
      grid: true,
      tips: false,
    }),
    region,
  );
  const graph = dynamic(() =>
    curve(
      Array.from({ length: 101 }, (_, i) => plot.world(i / 100, (i / 100) ** n.value)),
      { stroke: 'cyan', width: 5 },
    ),
  );
  const ticks = [0, 0.8, 1].map((v) => {
    const q = plot.world(v, 0);
    return note(String(v)).moveTo([q[0], q[1] + 50]);
  });
  const levels = [0.5, 1].map((v) => {
    const q = plot.world(0, v);
    return note(String(v)).moveTo([q[0] - 40, q[1]]);
  });
  const point = dynamic(() => dot(13, 'yellow').moveTo(plot.world(p, p ** n.value)));
  const three = place(label(`0.8³ = ${(p ** 3).toFixed(3)} > 1/2`, { color: 'yellow' }), FOOT);
  const thirty = place(label(`0.8³⁰ ≈ ${(p ** 30).toFixed(5)}`, { color: 'yellow' }), FOOT);
  const scope = place(
    note('Hypothetical fixed rate · independent cases · actual rate unknown'),
    FOOT,
  );
  s.add(heading('How often can a perfect sample happen?'), equation, plot, graph, ticks, levels);
  c.take(board.nodes);
  c.on('uncertainty-beat-1-focus-2', () =>
    s.play(indicate(equation, { scale: 1, color: 'yellow' })),
  );
  c.show('uncertainty-beat-1-focus-1', point);
  c.show('more-than-half', three, { after: true });
  c.on('uncertainty-beat-2-focus-1', () => s.play(n.to(30, { duration: 2.4 })));
  c.hide('uncertainty-beat-2-focus-1', three);
  c.show('thirty-probability', thirty, { after: true });
  c.swap('uncertainty-beat-3-focus-1', thirty, scope);
}
