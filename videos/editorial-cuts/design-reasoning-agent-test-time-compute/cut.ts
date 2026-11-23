import { film, text, rect, line, dot, fadeIn, fadeOut, to } from 'vizmatic/stage';
export default film({ title: 'Should the canary advance?', look: 'midnight', fps: 30 }, (s) => {
  const label = (v: string, x: number, y: number, size = 48, color = 'ink') =>
    text(v, { size, color }).at(x, y);
  const title = text('Should the canary advance?', { font: 'text-serif', size: 75 }).at(0, -375);
  s.add(title);
  // One canary stays in view while its smoke and latency observations arrive.
  const bins = Array.from({ length: 10 }, (_, i) =>
    rect(112, 90, { fill: i === 0 ? 'blue' : 'surface', stroke: 'dim', width: 2 }).at(
      -585 + i * 130,
      -65,
    ),
  );
  s.add(...bins, label('Canary', -585, -174, 44, 'blue'), label('10% of traffic', -520, 60, 47));
  s.wait(3);
  s.play(fadeIn(label('Smoke test passed', -320, 204, 53, 'teal')), { duration: 0.5 });
  s.wait(1);
  s.play(fadeIn(label('Latency rose to 240 ms', 310, 204, 53, 'yellow')), { duration: 0.5 });
  s.wait(3);
  s.play(fadeIn(label('Continue     /     Hold     /     Roll back', 0, 335, 56)), {
    duration: 0.5,
  });
  s.wait(9.5);
});
