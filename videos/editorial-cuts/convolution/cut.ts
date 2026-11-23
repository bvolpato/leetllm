import { film, rect, text, fadeIn, to } from 'vizmatic/stage';

export default film({ title: 'Three windows on one edge', look: 'midnight' }, (s) => {
  const label = (value: string, x: number, y: number, size: number, color = '#f6f4ef') =>
    text(value, { size, color, font: 'text-serif' }).at(x, y);
  s.add(label('Which window contains no edge?', 0, -405, 78));
  const cell = (x: number, y: number, size: number, bright: boolean) =>
    rect(size - 3, size - 3, {
      fill: bright ? '#d9dce1' : '#232933',
      stroke: '#6f7681',
      width: 2,
    }).at(x, y);
  for (let r = 0; r < 5; r++)
    for (let c = 0; c < 5; c++) s.add(cell(-740 + 92 * c, -190 + 92 * r, 92, c >= 2));
  const probe = s.add(rect(276, 276, { stroke: '#fbd767', fill: null, width: 8 }).at(-648, -98));
  s.add(label('Input image', -556, 305, 48));
  for (let i = 0; i < 3; i++) {
    const x = 35 + i * 290;
    if (i) s.play(to(probe, (n) => n.shift(92, 0), { duration: 0.65 }));
    const patch = [label('Window ' + ['A', 'B', 'C'][i], x, 200, 46)];
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++)
        patch.push(cell(x + (c - 1) * 78, -35 + (r - 1) * 78, 78, i + c >= 2) as any);
    s.play(fadeIn(patch), { duration: 0.55 });
    s.wait(1.4);
  }
  s.wait(8.1833333333);
});
