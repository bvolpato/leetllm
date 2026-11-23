import { film, text, arrow, type ColorInput } from 'vizmatic/stage';

export default film({ title: 'What reaches the model first?', look: 'midnight', fps: 30 }, (s) => {
  const label = (value: string, x: number, y: number, size: number, color: ColorInput) =>
    s.add(text(value, { size, color }).at(x, y));
  label('What reaches the model first?', 0, -378, 82, 'ink');
  label('Saved weights', -515, -170, 54, 'ink');
  label('W7', -515, -45, 100, 'blue');
  label('Chat template', 260, -170, 54, 'ink');
  label('user message', 160, -45, 63, 'ink');
  s.wait(6.2);
  label('assistant marker', 445, 112, 52, 'yellow');
  s.add(arrow([240, 170], [240, 265], { stroke: 'teal', width: 5 }));
  label('Input token sequence', 240, 330, 54, 'teal');
  s.wait(12.075);
});
