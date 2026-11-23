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
export default film({ title: 'What survives the next job?', look: 'midnight' }, (s) => {
  const label = (value: string, x: number, y: number, size: number, color: ColorInput) =>
    text(value, { size, color }).at(x, y);
  const box = (x: number, y: number, w: number, h: number, color: ColorInput) =>
    rect(w, h, { radius: 18, fill: null, stroke: color, width: 4 }).at(x, y);
  s.add(label('What survives the next job?', 0, -405, 74, 'ink'));

  const boundary = box(0, 0, 1220, 480, 'teal');
  const script = label('analysis.py', -250, -15, 64, 'blue'),
    file = label('input.csv', 260, -15, 64, 'teal');
  s.add(boundary, label('Job A', -455, -165, 55, 'teal'), script, file);
  s.wait(5);
  const budget = label('Process limit    ·    File scope    ·    Time limit', 0, 130, 42, 'yellow');
  s.play(fadeIn(budget), { duration: 0.4 });
  s.wait(8.5);
  s.play(fadeOut([script, file, budget]), { duration: 0.6 });
  s.play(fadeIn(label('Temporary files cleared', 0, 0, 58, 'teal')), { duration: 0.5 });
  s.wait(5);
});
