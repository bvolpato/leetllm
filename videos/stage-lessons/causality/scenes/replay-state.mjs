import { captions, frame, record, signal, vertex, wire } from '../parts.mjs';
import { replayReplacementFixture } from '../../../films/causality/model.mjs';

export default function replayState(s, c) {
  frame(
    s,
    'Replace a return and follow its consequences',
    'Deterministic replay from a snapshot',
    'State of the replay',
  );
  const before = replayReplacementFixture(),
    after = replayReplacementFixture(4),
    frozen = replayReplacementFixture(4, { freezeDownstream: true });
  const input = vertex('Tool return', 'a', 'cyan'),
    step = vertex('Double', 'cause'),
    threshold = vertex('Threshold', 'y', 'green');
  const first = wire(input, step),
    second = wire(step, threshold),
    old = vertex('Frozen value', 'below', 'red', { dash: true }),
    short = wire(old, threshold, 'red');
  const [r, d, y] = record(s, [
    ['Tool return', 'Snapshot', 'cyan'],
    ['Dependent value', 'Recompute'],
    ['Outcome', 'Threshold test', 'yellow'],
  ]);
  s.add(input, step, threshold, first, second);
  signal(s, c, 'recompute', [first, second]);
  r(c, 'two', String(before.returned), true);
  d(c, 'four', String(before.doubled), true);
  y(c, 'fail', before.success ? 'Success' : 'Failure', true);
  r(c, 'replace', String(after.returned), true);
  d(c, 'replace', 'Recomputing', true);
  y(c, 'replace', 'Pending', true);
  signal(s, c, 'replace', [first, second]);
  d(c, 'success', String(after.doubled), true);
  y(c, 'success', after.success ? 'Success' : 'Failure', true);
  c.show('freeze', [old, short]);
  d(c, 'freeze', String(frozen.doubled) + ' frozen', true);
  y(c, 'freeze', 'Invalid replay', true);
  c.hide('scope', [old, short]);
  d(c, 'scope', String(after.doubled));
  y(c, 'scope', 'Replay succeeds');
  captions(s, c, 'Start the replay before the tool result and keep the environment fixed.', [
    ['two', 'Double the return and test the result.'],
    [
      'fail',
      before.doubled + ' falls below the success threshold of ' + before.threshold + '.',
      true,
    ],
    ['success', after.doubled + ' clears ' + after.threshold + '.', true],
    ['freeze', 'Freezing the earlier downstream value suppresses the effect of the repair.', true],
    ['scope', 'This identifies a return-value effect inside the declared replay environment.'],
  ]);
}
