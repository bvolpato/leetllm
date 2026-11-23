import { film, text, rect, fadeIn } from 'vizmatic/stage';
export default film({ title: 'The square grows in two directions', look: 'midnight' }, (s) => {
  const title = text('What happens when token count doubles?', { font: 'text-serif', size: 80 }).at(
    0,
    -380,
  );
  const label = (v: string, y: number) => text(v, { font: 'mono', size: 50 }).at(360, y);
  const cells = (size: number) =>
    Array.from({ length: size * size }, (_, i) => {
      const x = i % size,
        y = Math.floor(i / size);
      return {
        x,
        y,
        shape: rect(60, 60, { radius: 6, fill: x < 3 && y < 3 ? 'blue' : 'teal' }).at(
          -730 + x * 68,
          -190 + y * 68,
        ),
      };
    });
  const grid = cells(6);
  const old = grid.filter((c) => c.x < 3 && c.y < 3).map((c) => c.shape);
  const added = grid.filter((c) => c.x >= 3 || c.y >= 3).map((c) => c.shape);
  const query = text('query × key', { size: 40 }).at(-560, -267);
  const small = label('3 × 3 = 9 scores', -45);
  s.add(title, query, ...old, small);
  s.wait(4.4);
  const six = label('6 × 6 = 36 scores', 70);
  s.play(fadeIn(added), fadeIn(six), { duration: 2 });
  s.wait(2.6);
  const comparison = text('Twice the tokens. Four times the storage.', {
    size: 48,
    color: 'teal',
  }).at(0, 290);
  s.play(fadeIn(comparison), { duration: 0.5 });
  s.wait(6.575);
});
