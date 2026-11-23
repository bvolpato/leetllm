import { fadeIn, film, line, text, to } from 'vizmatic/stage';

export default film({ title: 'Can the mean remember the order?', look: 'midnight' }, (s) => {
  const title = text('Can the mean remember the order?', { size: 80, font: 'text-serif' }).at(
    0,
    -452,
  );
  s.add(title);
  const tokens = ['reset', 'my', 'password'];
  const colors = ['blue', 'purple', 'teal'] as const;
  const x = [-535, 0, 535];
  const states = ['(1, 0, ½)', '(0, 1, ½)', '(½, ½, ½)'];
  const words = tokens.map((word, i) => [
    text(word, { size: 60, color: colors[i] }).at(x[i], -154),
    text(states[i], { size: 39, font: 'mono', color: colors[i] }).at(x[i], -92),
  ]);
  s.add(...words.flat(), line([-790, 106], [790, 106], { stroke: 'gridStrong', width: 3 }));
  const mean = text('Mean   (½, ½, ½)', { size: 65, font: 'mono' }).at(0, 280);
  s.add(mean);
  s.wait(0.8);
  // Separate the outer words vertically before they exchange places.
  s.play(
    ...words[0].map((n) => to(n, (m) => m.shift(0, -158))),
    ...words[2].map((n) => to(n, (m) => m.shift(0, 158))),
    { duration: 0.6 },
  );
  s.play(
    ...words[0].map((n) => to(n, (m) => m.shift(1070, 0))),
    ...words[2].map((n) => to(n, (m) => m.shift(-1070, 0))),
    { duration: 1.6 },
  );
  s.play(
    ...words[0].map((n) => to(n, (m) => m.shift(0, 158))),
    ...words[2].map((n) => to(n, (m) => m.shift(0, -158))),
    { duration: 0.6 },
  );
  const sum = text('Sum   (1½, 1½, 1½)   ÷ 3', { size: 48, font: 'mono', color: 'dim' }).at(0, 182);
  s.play(fadeIn(sum), { duration: 0.55 });
  s.wait(16.85);
});
