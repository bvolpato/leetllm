import { film, text, rect, line, fadeIn, fadeOut, to } from 'vizmatic/stage';
export default film(
  { title: 'When one bucket holds every key', look: 'midnight', fps: 30 },
  (s) => {
    const label = (v: string, x: number, y: number, size = 48, color = 'ink') =>
      text(v, { size, color }).at(x, y);
    s.add(
      text('What if every key lands in bucket 0?', { size: 73, font: 'text-serif' }).at(0, -372),
    );
    const names = ['token-fixture', 'ci-clock', 'issuer-check', 'release-guide'];
    const markers = names.map((name, i) => label(name, -630 + i * 420, 20, 42));
    for (let i = 0; i < 4; i++)
      s.add(
        rect(360, 116, { radius: 14, fill: 'surface', stroke: 'blue', width: 4 }).at(
          -630 + i * 420,
          20,
        ),
        markers[i],
      );
    for (let i = 0; i < 3; i++)
      s.add(line([-440 + i * 420, 20], [-403 + i * 420, 20], { stroke: 'dim', width: 5 }));
    s.add(label('Bucket 0', -630, -140, 46, 'blue'));
    const request = label('Find missing-login-note', 0, 196, 55, 'yellow');
    s.wait(5);
    s.play(fadeIn(request), { duration: 0.5 });
    s.wait(1.6);
    const bar = rect(340, 8, { fill: 'yellow' }).at(-630, 94);
    s.play(fadeIn(bar), { duration: 0.3 });
    for (let i = 0; i < 4; i++) {
      if (i)
        s.play(
          to(bar, (m) => m.shift(420, 0)),
          { duration: 0.45 },
        );
      s.play(fadeIn(label('≠', -630 + i * 420, -69, 52, 'yellow')), { duration: 0.25 });
      s.wait(0.75);
    }
    s.wait(1.45);
    s.play(
      fadeOut([request, bar]),
      fadeIn(label('4 comparisons for 4 keys.   Worst case: Θ(n).', 0, 205, 55, 'teal')),
      { duration: 0.55 },
    );
    s.wait(5.25);
  },
);
