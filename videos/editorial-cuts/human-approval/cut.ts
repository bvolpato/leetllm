import { film, text, rect, fadeIn } from 'vizmatic/stage';

export default film({ title: 'What does approval authorize?', look: 'midnight' }, (s) => {
  const heading = text('What does approval authorize?', { font: 'text-serif', size: 94 }).at(
    0,
    -355,
  );
  const version = text('Reranker v17', { size: 70, color: 'blue' }).at(-550, -100);
  const current = text('Now: shadow', { size: 42, color: 'dim' }).at(-550, 15);
  s.add(heading, version, current);
  s.wait(2.7);
  const proposal = text('Proposed live traffic', { size: 50 }).at(350, -150);
  const segments = Array.from({ length: 20 }, (_, i) =>
    rect(32, 86, { fill: i < 5 ? 'teal' : 'surface', stroke: 'dim', width: 1, radius: 3 }).at(
      -25 + i * 40,
      -24,
    ),
  );
  const share = text('25%', { font: 'mono', size: 56, color: 'teal' }).at(54, 85);
  s.play(fadeIn([proposal, ...segments, share]), { duration: 0.45 });
  s.wait(3.75);
  const decision = text('Approve v17 at 25%', { font: 'mono', size: 54, color: 'teal' }).at(0, 252);
  s.play(fadeIn(decision), { duration: 0.35 });
  s.wait(8.75);
});
