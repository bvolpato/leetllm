import { film, text, to, fadeIn, fadeOut } from 'vizmatic/stage';

export default film(
  { title: 'Use the same eligible neighbors', look: 'midnight', fps: 30 },
  (s) => {
    const heading = text('Which neighbors still count?', { font: 'text-serif', size: 84 }).at(
      0,
      -372,
    );
    const caption = (v: string, x: number, y: number) => text(v, { size: 47 }).at(x, y);
    const rank = (id: string, x: number, y: number) =>
      text(id, { font: 'mono', size: 69, color: id === 'B' ? 'yellow' : 'teal' }).at(x, y);
    const first = -120,
      second = 130;
    const all = text('All six points eligible', { size: 44, color: 'dim' }).at(0, -212);
    const filtered = text('Example filter excludes B', { size: 48, color: 'yellow' }).at(0, -212);
    const b = rank('B', second, -45),
      c = rank('C', 405, -45);
    const one = text('Recall@2   1 / 2', { font: 'mono', size: 52, color: 'yellow' }).at(0, 288);
    const two = text('Recall@2   2 / 2', { font: 'mono', size: 52, color: 'teal' }).at(0, 288);
    s.add(
      heading,
      all,
      caption('Exact top two', -535, -45),
      caption('One probe', -535, 122),
      rank('A', first, -45),
      b,
      rank('A', first, 122),
      rank('C', second, 122),
      one,
    );
    s.wait(1.5);
    s.play(fadeOut(all), { duration: 0.2 });
    s.play(fadeIn(filtered), { duration: 0.2 });
    s.wait(0.4);
    s.wait(1.1);
    s.play(fadeOut([b, one]), fadeIn(c), { duration: 0.45 });
    s.play(
      to(c, (n) => n.shift(second - 405, 0)),
      { duration: 0.7 },
    );
    s.play(fadeIn(two), { duration: 0.45 });
    s.wait(11.375);
  },
);
