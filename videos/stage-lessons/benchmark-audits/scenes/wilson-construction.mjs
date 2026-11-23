import { axes, dot, dynamic, indicate, place, tex } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { wilsonInterval } from '../parts.mjs';
import { rateRuler } from '../rate-ruler.mjs';

export default function wilson(s, c) {
  const [top, main, foot] = area.rows([1, 4.8, 1], 'normal');
  const [graph, work] = main.columns([1.25, 1], 'loose');
  const [upper, middle, lower] = work.rows(3, 'wide');
  const title = heading('Which pass rates fit three passes?');
  const n = 3,
    z = 1.96;
  const bound = wilsonInterval(n, n, z).low;
  const premise = place(label('Observed   3 passes / 3 cases'), top);
  const wald = place(tex('\\hat p(1-\\hat p)=1(1-1)=0', { size: 60 }), graph);
  const name = place(label('Wald interval'), upper);
  const falseCertainty = place(mono('[1.00, 1.00]', { size: 64, color: 'yellow' }), middle);
  const distance = (p) => Math.sqrt((n * (1 - p)) / p);
  const plot = place(
    axes({
      x: [0.25, 1],
      y: [0, 3],
      width: graph.width - 160,
      height: graph.height - 125,
      xStep: 0.25,
      yStep: 1,
      grid: true,
      labelSize: 29,
      tips: false,
    }),
    graph,
  );
  plot.plot(distance, { stroke: 'cyan', width: 5 });
  plot.plot(() => z, { stroke: 'yellow', width: 3 });
  const proposed = s.value(0.8);
  const marker = dynamic(() =>
    dot(12, 'blue').moveTo(plot.world(proposed.value, distance(proposed.value))),
  );
  const quantity = place(
    note('Horizontal   proposed pass rate       Vertical   distance in standard errors'),
    foot,
  );
  const test = place(tex('\\frac{|\\hat p-p|}{\\sqrt{p(1-p)/n}} \\le 1.96', { size: 48 }), upper);
  const eighty = place(
    mono(`p = 0.80    distance = ${distance(0.8).toFixed(2)}`, { size: 38 }),
    middle,
  );
  const limit = place(note('Yellow line   1.96 standard errors', { color: 'yellow' }), lower);
  const crossing = place(mono(`p ≈ ${bound.toFixed(3)}    distance = 1.96`, { size: 38 }), middle);
  const accepted = place(
    label(`Accepted rates   ${bound.toFixed(3)} to 1`, { size: 38, color: 'cyan' }),
    lower,
  );
  const quadratic = place(tex('(1+z^2/n)p^2-(2\\hat p+z^2/n)p+\\hat p^2\\le0', { size: 42 }), foot);
  const shortcut = place(tex('p_{low}=\\frac{n}{n+z^2}=\\frac{3}{3+1.96^2}', { size: 49 }), upper);
  const general = place(
    tex(
      'D=1+z^2/n,\\quad p_{low}=\\frac{\\hat p+z^2/(2n)-z\\sqrt{\\hat p(1-\\hat p)/n+z^2/(4n^2)}}{D}',
      { size: 38 },
    ),
    foot,
  );
  const comparisonTitle = heading('Which lower endpoint clears the floor?');
  const compare = place(
    label('Two-sided 95% Wilson interval    ·    floor 0.95', { color: 'yellow' }),
    top,
  );
  const captions = place(
    note(
      'Whisker   interval        Dot   observed pass rate        Yellow tick   required lower endpoint',
    ),
    foot,
  );
  const intervals = [
    [3, 3],
    [49, 50],
    [990, 1000],
  ].map(([k, total], i) => {
    const [count, scale, value] = main.rows(3, 'wide')[i].columns([1, 3.5, 1], 'wide');
    const data = wilsonInterval(k, total, z);
    const ruler = rateRuler(scale, data, k / total, 0.95);
    const labelCount = place(mono(`${k}/${total}`, { size: 48 }), count);
    const result = place(
      mono(data.low.toFixed(3), { size: 48, color: data.low >= 0.95 ? 'green' : 'cyan' }),
      value,
    );
    return {
      setup: [labelCount, ruler.axis, ruler.floor, ruler.observed],
      floor: ruler.floor,
      answer: [ruler.interval, result],
    };
  });
  const sided = place(
    note('Two-sided 95%   z = 1.96       One-sided 95% lower bound   z ≈ 1.645'),
    foot,
  );
  s.add(title, premise, wald, name);
  c.show('wald-equals', falseCertainty, { after: true });
  c.swap('propose', [wald, name, falseCertainty], [plot, marker, quantity, test]);
  c.show('score-eighty', eighty, { after: true });
  c.show('score-limit', limit, { after: true });
  c.hide('slide-rate', eighty);
  c.on('slide-rate', () => s.play(proposed.to(0.6, { duration: 1.3 })));
  c.after('crossing', () => s.play(proposed.to(bound, { duration: 0.65 })));
  c.show('crossing', crossing, { after: true });
  c.swap('accepted', limit, accepted);
  c.swap('quadratic', quantity, quadratic);
  c.swap('all-pass-formula', test, shortcut);
  c.swap('general-root', quadratic, general);
  c.swapAll('compare-runs', [
    comparisonTitle,
    compare,
    captions,
    intervals.map((v) => v.setup),
    intervals[0].answer,
  ]);
  c.on('floor-ask', () =>
    s.play(
      indicate(
        intervals.map((v) => v.floor),
        { scale: 1, color: 'yellow' },
      ),
    ),
  );
  c.show('bound-fifty', intervals[1].answer, { after: true });
  c.show('bound-thousand', intervals[2].answer, { after: true });
  c.swap('interval-scope', captions, sided);
}
