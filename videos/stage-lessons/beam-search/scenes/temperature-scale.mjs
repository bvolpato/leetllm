import { dynamic, indicate, place } from 'vizmatic/stage';
import { heading, label, mono } from '../../kit-narrated.mjs';
import { stablePolicy } from '../../../films/beam-search/arithmetic.mjs';
import { LOGITS, rotationRow } from '../parts.mjs';

export default function temperatureScale(s, c) {
  const temperature = s.value(1),
    tied = s.value(0),
    limit = s.value(0);
  const model = () => stablePolicy(tied.value ? [2, 2, 0, -Infinity] : LOGITS, temperature.value);
  const board = rotationRow(s, { live: () => model().probabilities });
  const readout = dynamic(() =>
    place(
      mono(
        `${limit.value ? (limit.value === 1 ? 'T → 0⁺' : 'T → ∞') : `T = ${temperature.value.toFixed(2)}`}   H = ${model().entropy.toFixed(3)} nats`,
        { size: 34, color: 'yellow' },
      ),
      board.foot,
      'left',
    ),
  );
  const tieNote = place(
    label('Equal maxima split mass · masked quota stays out', { size: 34 }),
    board.top,
  );
  s.add(heading(c.title), [board.nodes, readout]);
  c.on('temperature-scale-build-0', () =>
    s.play(indicate(board.chart, { scale: 1, color: 'yellow' })),
  );
  c.after('temperature-low-result', () => s.play(temperature.to(0.5, { duration: 1.4 })));
  c.after('temperature-high-result', () => s.play(temperature.to(2, { duration: 0.35 })));
  c.on('temperature-scale-build-1', () => s.play(indicate(readout, { scale: 1, color: 'yellow' })));
  c.on('temperature-scale-build-2', () => {
    tied.set(1);
    limit.set(1);
    s.play(temperature.to(0.01, { duration: 1.4 }));
  });
  c.swap('temperature-scale-build-2', board.source.nodes.flat(), tieNote);
  c.after('temperature-high-limit', () => {
    limit.set(2);
    s.play(temperature.to(10000, { duration: 1.5 }));
  });
}
