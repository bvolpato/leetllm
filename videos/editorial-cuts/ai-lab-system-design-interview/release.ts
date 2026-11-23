import { film, text, rect, line } from 'vizmatic/stage';

export default film({ title: 'Can this candidate ship?', look: 'midnight', fps: 30 }, (s) => {
  const label = (value: string, x: number, y: number, size = 42, color = 'ink') =>
    text(value, { size, color }).at(x, y);
  const left = -635;
  const width = 1270;
  const checks = [
    { name: 'Retrieval recall', y: -130, value: 0.94, minimum: 0.92, color: 'teal' },
    { name: 'Citation faithfulness', y: 130, value: 0.93, minimum: 0.95, color: 'pink' },
  ];
  s.add(text('Can this candidate ship?', { font: 'text-serif', size: 72 }).at(0, -378));
  for (const check of checks) {
    s.add(label(check.name, -415, check.y - 70), rect(width, 42, { fill: 'surface', stroke: 'dim' }).at(0, check.y));
  }
  function reveal(check: typeof checks[number]) {
    const threshold = left + check.minimum * width;
    const filled = check.value * width;
    s.add(rect(filled, 42, { fill: check.color }).at(left + filled / 2, check.y),
      line([threshold, check.y - 34], [threshold, check.y + 34], { stroke: 'yellow', width: 5 }),
      label(check.value.toFixed(2) + '   /   minimum ' + check.minimum.toFixed(2), 360, check.y - 70, 39, check.color));
  }
  s.wait(3.3);
  reveal(checks[0]);
  s.wait(3.9);
  reveal(checks[1]);
  s.wait(4.6);
  s.add(label('0 permission leaks observed in this sample', 0, 255, 40));
  s.wait(2.7);
  s.add(label('Hold • citation faithfulness missed its minimum', 0, 345, 46, 'pink'));
  s.wait(4.5);
});
