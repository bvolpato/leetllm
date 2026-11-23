import { fadeIn, film, rect, text } from 'vizmatic/stage';

export default film({ title: 'Which requests count?', look: 'midnight' }, (s) => {
  const label = (value: string, x: number, y: number, size: number, color = 'ink') =>
    text(value, { size, color }).at(x, y);
  s.add(text('What disappeared from the denominator?', { font: 'text-serif', size: 76 }).at(0, -360));
  s.add(label('Candidate A  ·  1,000 offers in 100 seconds', 0, -215, 46));
  const groups = [
    { width: 660, center: -270, color: 'teal', label: '550 met both limits' },
    { width: 60, center: 90, color: 'purple', label: '50 late' },
    { width: 480, center: 360, color: 'gridStrong', label: '400 without a completion' },
  ];
  for (const group of groups) {
    s.add(rect(group.width, 90, { fill: group.color, stroke: null }).at(group.center, -55));
  }
  s.add(label(groups[0].label, -300, 30, 38), label(groups[1].label, 90, -132, 32), label(groups[2].label, 420, 30, 35));
  s.wait(3.4);
  s.play(fadeIn(label('550 / 600 completed  ×  10 offers/s  =  9.17/s', 0, 150, 47, 'purple')), { duration: 0.35 });
  s.wait(2.9);
  s.play(fadeIn(label('550 / 1,000 offered  ×  10 offers/s  =  5.5/s', 0, 260, 48, 'teal')), { duration: 0.35 });
  s.wait(10);
});
