import { film, text, rect, fadeIn } from 'vizmatic/stage';
export default film({ title: 'Which values meet?', look: 'midnight', fps: 30 }, (s) => {
  s.add(text('Which gradients belong together?', { font: 'text-serif', size: 78 }).at(0, -390));
  const grid = [
    [1, 2, 3, 4],
    [10, 20, 30, 40],
    [100, 200, 300, 400],
    [1000, 2000, 3000, 4000],
  ];
  grid.forEach((values, rank) => {
    const y = -190 + rank * 116;
    s.add(text('Rank ' + rank, { size: 45 }).at(-580, y));
    values.forEach((v, col) =>
      s.add(text(String(v), { size: 52, font: 'mono' }).at(-260 + col * 220, y)),
    );
  });
  s.wait(6);
  s.play(
    fadeIn(rect(204, 466, { fill: null, stroke: 'yellow', width: 6, radius: 15 }).at(180, -16)),
    { duration: 0.55 },
  );
  s.wait(2);
  s.play(
    fadeIn(text('Same position across four examples', { size: 48, color: 'yellow' }).at(0, 308)),
    { duration: 0.45 },
  );
  s.wait(8.627);
});
