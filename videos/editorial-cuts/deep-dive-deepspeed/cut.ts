import { film, rect, text, fadeIn, line } from 'vizmatic/stage';
export default film({ title: 'Inside the optimizer ledger', look: 'midnight', fps: 30 }, (s) => {
  s.add(text('What lives beside the weights?', { size: 82, font: 'text-serif' }).at(0, -370));
  const entries = [
    ['Weights', 3, 'blue'],
    ['Gradients', 3, 'teal'],
    ['FP32 copy', 6, 'purple'],
    ['Moment 1', 6, 'purple'],
    ['Moment 2', 6, 'purple'],
  ] as const;
  let left = -810;
  for (const [name, gb, color] of entries) {
    const width = gb * 67.5,
      x = left + width / 2;
    const part = [
      rect(width - 4, 168, { fill: 'surface', stroke: color, width: 4 }).at(x, -30),
      text(name, { size: 38, color }).at(x, -60),
      text(gb + ' GB', { size: 46, font: 'mono' }).at(x, 8),
    ];
    if (left < -406) s.add(...part);
    else s.play(fadeIn(part), { duration: 0.9 });
    left += width;
  }
  s.wait(1);
  const limit = -810 + 16 * 67.5;
  s.play(
    fadeIn([
      line([limit, -175], [limit, -118], { stroke: 'yellow', width: 5 }),
      text('16 GB device', { size: 39, color: 'yellow' }).at(limit, -210),
    ]),
    { duration: 0.6 },
  );
  s.wait(2);
  s.play(
    fadeIn(text('24 GB persistent state for 1.5 billion parameters', { size: 54 }).at(0, 203)),
    { duration: 0.55 },
  );
  s.wait(11.15);
});
