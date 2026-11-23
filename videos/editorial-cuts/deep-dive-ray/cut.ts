import { film, text, arrow, type ColorInput } from 'vizmatic/stage';

export default film(
  { title: 'Which sentences can run together?', look: 'midnight', fps: 30 },
  (s) => {
    const label = (value: string, x: number, y: number, size: number, color: ColorInput) =>
      s.add(text(value, { size, color }).at(x, y));
    label('Which sentences can run together?', 0, -378, 82, 'ink');
    const sentences = ['Birds sing', 'Rain falls', 'The sun shines'];
    sentences.forEach((sentence, i) => label(sentence, -490, -165 + i * 155, 58, 'ink'));
    s.wait(4);
    sentences.forEach((_, i) =>
      s.add(arrow([-160, -165 + i * 155], [120, -165 + i * 155], { stroke: 'blue', width: 5 })),
    );
    sentences.forEach((_, i) => label('count', 240, -165 + i * 155, 48, 'blue'));
    s.wait(4);
    sentences.forEach((_, i) =>
      s.add(arrow([360, -165 + i * 155], [565, 0], { stroke: 'dim', width: 4 })),
    );
    label('combine', 720, 0, 45, 'teal');
    s.wait(8.7);
  },
);
