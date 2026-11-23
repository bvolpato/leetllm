import { place } from 'vizmatic/stage';
import { heading, label } from '../../kit-narrated.mjs';
import { Q, TEST_PREDICTIONS, testIntervals } from '../parts.mjs';

export default function coverage(s, c) {
  const b = testIntervals(s);
  const width = place(
    label('Fixed width ' + 2 * Q.threshold + ' ms', { color: 'yellow' }),
    b.head,
    'left',
  );
  const edge = TEST_PREDICTIONS[3] + Q.threshold;
  s.add(heading(c.title), b.frame, b.drawing);
  c.on('radius', () => s.play(b.opening.to(1, { duration: 1.1 })));
  c.after('width', () => s.add(width));
  c.on('first-three', () => {
    for (let i = 1; i <= 3; i++) {
      b.observations.set(i);
      s.wait(0.45);
    }
  });
  c.after('fourth', () => b.observations.set(4));
  c.after('rate', () => b.tally.set(1));
  c.after('replay', () => {
    b.tally.set(0);
    b.pendingFourth.set(1);
    b.fourth.set(edge);
  });
  c.after('all', () => {
    b.pendingFourth.set(0);
    b.tally.set(1);
  });
}
