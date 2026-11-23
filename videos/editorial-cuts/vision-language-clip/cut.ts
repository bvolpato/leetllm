import {
  film,
  text,
  rect,
  line,
  circle,
  fadeIn,
  fadeOut,
  to,
  type ColorInput,
} from 'vizmatic/stage';
export default film({ title: 'Can a sentence find a photograph?', look: 'midnight' }, (s) => {
  const label = (value: string, x: number, y: number, size: number, color: ColorInput) =>
    text(value, { size, color }).at(x, y);
  const box = (x: number, y: number, w: number, h: number, color: ColorInput) =>
    rect(w, h, { radius: 18, fill: null, stroke: color, width: 4 }).at(x, y);
  s.add(label('Can a sentence find a photograph?', 0, -405, 74, 'ink'));

  s.add(box(-365, 0, 760, 430, 'dim'));
  for (let i = 0; i < 3; i++)
    s.add(line([-710, -145 + i * 90], [-20, -145 + i * 90], { stroke: 'dim', width: 3 }));
  const wheel = (x: number) => circle(76, { fill: null, stroke: 'ink', width: 9 }).at(x, 87);
  s.add(wheel(-565), wheel(-187));
  const frame = [
    [-565, 87],
    [-455, -45],
    [-365, 87],
    [-565, 87],
    [-305, -45],
    [-187, 87],
  ] as const;
  for (let i = 1; i < frame.length; i++)
    s.add(line([...frame[i - 1]], [...frame[i]], { stroke: 'red', width: 12 }));
  s.add(
    line([-455, -45], [-305, -45], { stroke: 'red', width: 12 }),
    line([-480, -62], [-437, -62], { stroke: 'ink', width: 10 }),
    line([-305, -45], [-332, -105], { stroke: 'ink', width: 9 }),
  );
  s.wait(3);
  s.play(
    fadeIn(label('“A red bicycle', 480, -50, 63, 'ink')),
    fadeIn(label('beside a brick wall”', 480, 45, 63, 'ink')),
    { duration: 0.4 },
  );
  s.wait(6);
  s.play(
    fadeIn(label('Pixels', -365, 282, 48, 'blue')),
    fadeIn(label('Words', 480, 282, 48, 'teal')),
    { duration: 0.4 },
  );
  s.wait(10.2);
});
