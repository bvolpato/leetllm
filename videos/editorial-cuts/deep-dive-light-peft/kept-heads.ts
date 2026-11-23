import { film, text, rect } from 'vizmatic/stage';

export default film({ title: 'Can these adapters share a base?', look: 'midnight', fps: 30 }, (s) => {
  const label = (value: string, x: number, y: number, size = 45, color = 'ink') =>
    text(value, { size, color }).at(x, y);
  s.add(text('Can these adapters share a base?', { size: 74, font: 'text-serif' }).at(0, -375));
  for (const [row, heads] of [['A', ['H0', 'H2', 'H3']], ['B', ['H0', 'H1', 'H3']]] as const) {
    const y = row === 'A' ? -115 : 70;
    s.add(label('Base ' + row, -590, y));
    heads.forEach((head, col) => {
      const x = -275 + col * 325;
      s.add(rect(230, 115, { fill: 'surface', stroke: 'blue', width: 3 }).at(x, y));
      s.add(label(head, x, y, 56));
    });
    s.add(label('width 3', 680, y, 39));
  }
  s.wait(5);
  for (const y of [-115, 70]) {
    s.add(rect(212, 97, { fill: null, stroke: 'yellow', width: 5 }).at(50, y));
  }
  s.add(label('Slot 2 refers to different original heads.', 0, 240, 49, 'yellow'));
  s.wait(5.5);
  s.add(label('Cache key: base revision + retained head IDs + adapter identity and shape', 0, 345, 37));
  s.wait(5.5);
});
