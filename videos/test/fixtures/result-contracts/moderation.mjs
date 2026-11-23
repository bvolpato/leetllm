const has = (a, s) => a.labels.some((l) => l.text.includes(s));
export const contracts = [
  {
    scene: 'capacity-ledger',
    beat: 0,
    cue: 'capacity-daily',
    phrase: 'average about twenty-seven point eight per second',
    has: (a) => has(a, '≈ 27.8/s'),
  },
  {
    scene: 'capacity-ledger',
    beat: 1,
    cue: 'capacity-busy',
    phrase: 'twelve thousand simultaneously busy reviewers',
    reset: ['capacity-staff'],
    has: (a) => has(a, '12,000 busy'),
  },
  {
    scene: 'capacity-ledger',
    beat: 1,
    cue: 'capacity-staff',
    phrase: 'seventeen thousand one hundred forty-three staff',
    has: (a) => has(a, '= 17,143 concurrent staff'),
  },
  {
    scene: 'capacity-ledger',
    beat: 2,
    cue: 'capacity-batch',
    phrase:
      'A batch of thirty-two completed in eight milliseconds implies four thousand items per second arithmetically',
    has: (a) => has(a, '32 / 0.008 = 4,000 items/s'),
  },
  {
    scene: 'capacity-ledger',
    beat: 2,
    cue: 'capacity-flight',
    phrase: 'two hundred in flight in a stable system',
    has: (a) => has(a, '200 in flight'),
  },
  {
    scene: 'fusion-boundary',
    beat: 1,
    cue: 'fusion-low',
    phrase: 'Its weighted sum is point one zero two, below review',
    has: (a) => has(a, '0.102 → ALLOW'),
  },
  {
    scene: 'fusion-boundary',
    beat: 1,
    cue: 'fusion-high',
    phrase: 'totaling point six nine three five. That crosses review',
    has: (a) => has(a, '0.6935 → REVIEW'),
  },
  {
    scene: 'fusion-boundary',
    beat: 1,
    cue: 'fusion-edge-complete',
    phrase:
      'The point with both scores point six five lies exactly on the inclusive review boundary',
    has: (a) => has(a, '0.45×0.65 + 0.55×0.65 = 0.65'),
  },
  {
    scene: 'batch-work',
    beat: 0,
    cue: 'work-classifier',
    phrase: 'thirty-two divided by point zero zero eight is four thousand',
    reset: ['work-classifier-summary'],
    has: (a) => has(a, '4000 items/s'),
  },
  {
    scene: 'batch-work',
    beat: 0,
    cue: 'work-classifier-summary',
    phrase:
      'Throughput rises twelvefold while the batch service interval grows from three to eight milliseconds',
    has: (a) => has(a, '12× throughput'),
  },
  {
    scene: 'batch-work',
    beat: 1,
    cue: 'work-embed',
    phrase:
      'two hundred versus thirty-two hundred items per second, a sixteenfold throughput ratio',
    has: (a) => has(a, '3200 items/s'),
  },
  {
    scene: 'batch-work',
    beat: 2,
    cue: 'work-judge',
    phrase:
      'thirty-two completions in four hundred milliseconds imply about six point seven and eighty per second under their simplifying assumptions',
    reset: ['work-budget'],
    has: (a) => has(a, '80 items/s'),
  },
  {
    scene: 'batch-work',
    beat: 2,
    cue: 'work-budget',
    phrase:
      'Four hundred milliseconds cannot meet a two-hundred-millisecond synchronous decision budget',
    has: (a) => has(a, '400 ms > 200 ms budget'),
  },
  {
    scene: 'fresh-moderation',
    beat: 0,
    cue: 'fresh-moderation-result',
    phrase: 'totaling point six six one: keep the upload pending for review',
    has: (a) => has(a, ' = 0.661') || has(a, 'Keep pending for review'),
  },
  {
    scene: 'fresh-moderation',
    beat: 1,
    cue: 'fresh-moderation-old',
    phrase: 'That unseen old result is stale and cannot publish it',
    has: (a) => a.labels.some((l) => l.text === 'STALE'),
  },
];
