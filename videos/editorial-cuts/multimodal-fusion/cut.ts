import { film, text, rect, line, dot, fadeIn, fadeOut, to } from 'vizmatic/stage';
export default film(
  { title: 'What does one visual coordinate contribute?', look: 'midnight', fps: 30 },
  (s) => {
    const label = (v: string, x: number, y: number, size = 48, color = 'ink') =>
      text(v, { size, color }).at(x, y);
    const title = text('What does one visual coordinate contribute?', {
      font: 'text-serif',
      size: 75,
    }).at(0, -375);
    s.add(title);
    // Each weight scales its own value before the three contributions join into one coordinate.
    const weights = [0.384, 0.317, 0.299],
      values = [0.1, 0.8, 0.1],
      colors = ['blue', 'teal', 'purple'];
    for (let i = 0; i < 3; i++)
      s.add(
        label('Slot ' + (i + 1), -615, -175 + i * 125, 45, colors[i]),
        label(weights[i].toFixed(3), -330, -175 + i * 125, 53),
      );
    s.add(label('Attention weight', -330, -268, 36, 'dim'));
    s.wait(4.6);
    for (let i = 0; i < 3; i++) {
      const y = -175 + i * 125,
        product = weights[i] * values[i],
        w = 1520 * product;
      s.play(
        fadeIn(label('×  ' + values[i].toFixed(1), -75, y, 51)),
        fadeIn(rect(w, 42, { fill: colors[i] }).at(80 + w / 2, y)),
        fadeIn(label(product.toFixed(3), 650, y, 48, colors[i])),
        { duration: 0.65 },
      );
    }
    s.wait(1.6);
    s.play(fadeIn(label('First coordinate  ≈  0.322', 0, 245, 70, 'yellow')), { duration: 0.5 });
    s.wait(6.52);
  },
);
