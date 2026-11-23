import { assertEqual, place, table } from 'vizmatic/stage';
import { label, mono } from '../../kit-narrated.mjs';
import {
  freshPipelineState,
  pipelinePromotionFixture,
} from '../../../films/capstone-production-ml-pipeline/model.mjs';
import { BODY, VALIDATION_STATES, open, probeRelease } from '../parts.mjs';
import { probeSwitch } from '../probe-switch.mjs';

export default function freshStale(s, c) {
  const initial = pipelinePromotionFixture();
  const changed = freshPipelineState(1),
    restored = freshPipelineState(2),
    ready = freshPipelineState(3);
  const [bindings, callRoom, desk, followup] = BODY.rows([2.3, 0.85, 3, 0.65], 'normal');
  const bench = probeSwitch(s, desk, { release: initial.production, id: 'eval-2', delay: 8 });
  // Prefixes from immutable_fingerprint on the article's full eta-promotion-v1 record.
  const pythonDigests = { 250: '7b14c682', 300: 'a0c8a753' };
  const policy = (state) =>
    state.policy.latency + ' ms   ·   ' + pythonDigests[state.policy.latency];
  const ledger = place(
    table(
      [
        { key: 'field', label: 'Before promotion' },
        {
          key: 'requested',
          label: 'Stored with request',
          sample: '250 ms   ·   87654321',
          mono: true,
        },
        { key: 'live', label: 'Current value', sample: '300 ms   ·   87654321', mono: true },
        { key: 'check', label: 'Recheck', sample: 'superseded', marks: true },
      ],
      [
        {
          id: 'receipt',
          field: 'Canary receipt',
          requested: '3   READY',
          live: '3   READY',
          check: '·',
        },
        {
          id: 'policy',
          field: 'p95 limit / digest',
          requested: policy(initial),
          live: policy(initial),
          check: '·',
        },
      ],
      { width: bindings.width, size: 34, leading: 1.8, states: VALIDATION_STATES },
    ),
    bindings,
  );
  const call = (value, color) => place(mono(value, { size: 38, color }), callRoom);
  const attempt = call(
    'promote(candidate, receipt_id)   ·   can receipt 3 move v0 to v1?',
    'yellow',
  );
  const held = call('hold_promotion     ·     receipt and policy changed', 'red');
  const retry = call('Retry receipt 3   ·   which check still blocks promotion?', 'yellow');
  const still = call('hold_promotion     ·     receipt 4 is current', 'yellow');
  const evaluating = call('Reevaluate the full history     ·     day 0 + day 7', 'cyan');
  const approved = call('Receipt 5 is ready     ·     production still v0', 'pink');
  const commit = call('promote(candidate, receipt_id)     ·     receipt 5', 'yellow');
  const moved = call('promote     ·     receipt 5 recorded     ·     production v1', 'green');
  const proof = place(
    label('Live verification   ·   which revision answered the routed request?', {
      size: 35,
      color: 'cyan',
    }),
    followup,
  );
  open(s, c);
  s.add(bench.nodes);
  c.on('fresh-probe', bench.send);
  c.after('fresh-zero', () => bench.score('v0'));
  c.after('fresh-silent', () => bench.report('v0'));
  c.show('fresh-stored', ledger);
  c.on('fresh-latest', () =>
    s.play(ledger.setCell('receipt', 'live', '4   HOLD'), ledger.light('receipt')),
  );
  c.on('fresh-change', () =>
    s.play(ledger.setCell('policy', 'live', policy(changed)), ledger.light('policy')),
  );
  c.show('fresh-vote', attempt);
  c.swap('fresh-hold', attempt, held, { after: true, lead: 0 });
  c.after('fresh-hold', () =>
    s.play(
      ledger.setCell('receipt', 'check', { value: 'superseded', state: 'fail' }),
      ledger.setCell('policy', 'check', { value: 'mismatch', state: 'fail' }),
    ),
  );
  c.hide('fresh-restore', held);
  c.on('fresh-restore', () =>
    s.play(
      ledger.setCell('policy', 'live', policy(restored)),
      ledger.setCell('policy', 'check', { value: '·', state: 'pending' }),
      ledger.setCell('receipt', 'check', { value: '·', state: 'pending' }),
      ledger.light(null),
    ),
  );
  c.show('fresh-retry', retry);
  c.swap('fresh-still', retry, still, { after: true, lead: 0 });
  c.after('fresh-still', () =>
    s.play(
      ledger.setCell('policy', 'check', { value: 'matches', state: 'pass' }),
      ledger.setCell('receipt', 'check', { value: 'superseded', state: 'fail' }),
      ledger.light('receipt'),
    ),
  );
  c.swap('fresh-evaluate', still, evaluating);
  c.on('fresh-new', () =>
    s.play(
      ledger.setCell('receipt', 'live', '5   READY'),
      ledger.setCell('receipt', 'requested', '5   READY'),
      ledger.setCell('receipt', 'check', { value: 'current', state: 'pass' }),
    ),
  );
  c.swap('fresh-new', evaluating, approved);
  c.swap('fresh-call', approved, commit);
  c.on('fresh-switch', () => bench.select(ready.decision.production));
  c.swap('fresh-switch', commit, moved, { after: true });
  c.on('fresh-rescore', bench.send);
  c.after('fresh-score', () => bench.score(ready.decision.production));
  c.after('fresh-warning', () => bench.report(ready.decision.production));
  c.show('fresh-verify', proof);
  assertEqual(changed.decision.action, 'hold_promotion', 'changed policy and receipt');
  assertEqual(restored.decision.action, 'hold_promotion', 'restoring only policy');
  assertEqual(ready.decision.action, 'promote', 'current ready receipt');
  assertEqual(probeRelease(restored.decision.production, 8).warning, false, 'held replay');
  assertEqual(probeRelease(ready.decision.production, 8).warning, true, 'promoted replay');
}
