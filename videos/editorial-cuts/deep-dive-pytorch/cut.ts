import { film, text, type ColorInput } from 'vizmatic/stage';

export default film({ title: 'What moved in memory?', look: 'midnight', fps: 30 }, (s) => {
  const label = (value: string, x: number, y: number, size: number, color: ColorInput) =>
    s.add(text(value, { size, color }).at(x, y));
  label('What moved in memory?', 0, -378, 82, 'ink');
  const elements = [0, 1, 2, 3, 4, 5];
  elements.forEach((v) => label(String(v), -630 + v * 235, -90, 90, v === 3 ? 'yellow' : 'ink'));
  label('One allocation', 0, -245, 48, 'dim');
  label('Original traversal', -525, 155, 40, 'blue');
  label('0   1   2   3   4   5', 230, 155, 59, 'blue');
  s.wait(4.4);
  label('Transposed traversal', -525, 275, 40, 'teal');
  label('0   3   1   4   2   5', 230, 275, 59, 'teal');
  s.wait(12.95);
});
