import { film, text, rect, line, fadeIn, fadeOut } from 'vizmatic/stage';

export default film(
  { title: 'Can the old reviews authorize this configuration?', look: 'midnight' },
  (s) => {
    const label = (value: string, x: number, y: number, size: number, color = 'ink') =>
      text(value, { size, color, font: 'mono' }).at(x, y);
    s.add(
      text('Can the old reviews authorize this configuration?', {
        size: 70,
        font: 'text-serif',
      }).at(0, -381),
    );
    s.add(
      label('Reviewed configuration', -430, -202, 43),
      label('Proposed configuration', 430, -202, 43),
    );
    s.add(line([0, -225], [0, 145], { width: 2, stroke: 'grid' }));
    for (const x of [-430, 430]) {
      s.add(label('Candidate C17', x, -103, 54));
    }
    const oldPolicy = label('Policy G7', 430, 2, 60, 'teal');
    const oldHash = label('692adfa72bab', 430, 112, 54, 'teal');
    s.add(
      label('Policy G7', -430, 2, 60, 'teal'),
      label('692adfa72bab', -430, 112, 54, 'teal'),
      oldPolicy,
      oldHash,
    );
    s.wait(1.2);
    s.play(fadeOut(oldPolicy), fadeOut(oldHash), { duration: 0.2 });
    s.play(fadeIn(label('Policy G8', 430, 2, 60, 'yellow')), { duration: 0.3 });
    s.wait(1.7);
    s.wait(0.2);
    s.play(fadeIn(label('39ad7156a03f', 430, 112, 54, 'yellow')), { duration: 0.3 });
    s.wait(1.1);
    s.play(
      fadeIn(rect(1370, 117, { radius: 14, stroke: 'yellow', fill: 'surface' }).at(0, 277)),
      fadeIn(label('The eight reviews still refer to G7.', 0, 277, 50)),
      { duration: 0.4 },
    );
    s.wait(13);
  },
);
