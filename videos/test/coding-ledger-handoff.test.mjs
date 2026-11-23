import test from 'node:test';
import assert from 'node:assert/strict';
import {
  freshConcurrentLedger,
  handoffPrediction,
  strictWorkflowReceipt,
  REQUIRED_WORKFLOW_CHECKS,
  sampleModel,
  draw,
} from '../animations/ai-coding-workflow-with-agents.mjs';
const phase = (value) => ({ phase: value, progress: value === 'after' ? 1 : 0 });

test('the fresh ledger and packet answers wait for their own spoken reveals', () => {
  const held = {
    'fresh-share': phase('before'),
    'fresh-new': phase('before'),
    'fresh-count': phase('before'),
    'fresh-packet-reveal': phase('before'),
  };
  assert.deepEqual(handoffPrediction(0, 0.999, held), {
    share: false,
    newEvent: false,
    count: false,
    packet: false,
  });
  const shared = handoffPrediction(0, 0.999, { ...held, 'fresh-share': phase('after') });
  assert.deepEqual(shared, { share: true, newEvent: false, count: false, packet: false });
  assert.equal(handoffPrediction(1, 0.999, held).packet, false);
  assert.equal(
    handoffPrediction(1, 0, { ...held, 'fresh-packet-reveal': phase('after') }).packet,
    true,
  );
  for (const id of ['fresh-share', 'fresh-new', 'fresh-count']) {
    assert.equal(
      handoffPrediction(0, 0.999, { ...held, [id]: { phase: 'during', progress: 0.999 } })[
        { 'fresh-share': 'share', 'fresh-new': 'newEvent', 'fresh-count': 'count' }[id]
      ],
      false,
    );
  }
  assert.equal(
    handoffPrediction(1, 0.999, { 'fresh-packet-reveal': { phase: 'during', progress: 0.999 } })
      .packet,
    false,
  );
});

test('the unknown new-event return stays neutral after the shared-key answer', () => {
  const labels = [],
    C = {
      ink: 'ink',
      blue: 'blue',
      yellow: 'yellow',
      green: 'green',
      muted: 'muted',
      panel: 'panel',
    };
  const api = {
    C,
    focus: { target: (_id, fn) => fn() },
    rect: () => ({}),
    arrow: () => {},
    text: (_ctx, text, x, y, _size, color) => labels.push({ text: String(text), x, y, color }),
  };
  draw(
    {},
    { id: 'fresh-handoff' },
    {
      beat: 0,
      beatP: 0.99,
      cues: {
        'fresh-share': phase('after'),
        'fresh-new': phase('before'),
        'fresh-count': phase('before'),
      },
    },
    api,
  );
  assert.equal(labels.filter((label) => label.text === '#1' && label.color === 'green').length, 3);
  assert(labels.some((label) => label.text === '?' && label.x === 1680 && label.color === 'muted'));
});
test('the atomic-key fixture retains one invoice per distinct event across delivery orders', () => {
  for (const events of [
    [43017, 43017, 43017, 88104],
    [88104, 43017, 43017, 43017],
    [43017, 88104, 43017, 43017],
  ]) {
    const result = freshConcurrentLedger(events);
    assert.equal(result.count, 2);
    for (let i = 0; i < events.length; i++)
      for (let j = 0; j < events.length; j++)
        assert.equal(result.returned[i] === result.returned[j], events[i] === events[j]);
    assert.equal(result.rows.length, result.count);
  }
});
test('current receipt admission rejects typed false, skipped behavior and stale source independently', () => {
  const good = {
    source: 'F',
    verifier: 'K',
    base: 'expected assertion failure',
    executed: [...REQUIRED_WORKFLOW_CHECKS],
    terminal: 'pass',
    exitCode: 0,
  };
  assert(strictWorkflowReceipt(good));
  for (const invalid of [
    { exitCode: false },
    { source: 'E' },
    { verifier: 'J' },
    { base: 'ImportError' },
    { terminal: 'neutral' },
    { executed: ['new event', 'stored count'] },
  ])
    assert(!strictWorkflowReceipt({ ...good, ...invalid }));
});
test('the unchanged replay begins with the actual failing store before the candidate clause', () => {
  const before = sampleModel('replay', {
    beat: 0,
    beatP: 0.99,
    cues: { 'coding-candidate-check': phase('before') },
  });
  assert.equal(before.store.count, 2);
  assert.notEqual(before.store.deliveries[0].invoice, before.store.deliveries[1].invoice);
  const candidate = sampleModel('replay', {
    beat: 0,
    beatP: 0,
    cues: { 'coding-candidate-check': phase('after') },
  });
  assert.equal(candidate.store.count, 1);
  assert.equal(candidate.store.deliveries[0].invoice, candidate.store.deliveries[1].invoice);
});
