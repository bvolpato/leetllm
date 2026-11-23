const has = (a, s) => a.labels.some((l) => l.text.includes(s));
export const contracts = [
  {
    scene: 'spill-workload',
    beat: 0,
    cue: 'spill-total',
    phrase: 'one hundred sixty bytes per thread',
    has: (a) => has(a, '=160'),
  },
  {
    scene: 'request-clock',
    beat: 1,
    cue: 'cold-total',
    phrase: 'seventy-eight milliseconds',
    reset: ['native-omit'],
    has: (a) => has(a, '= 78ms'),
  },
  {
    scene: 'request-clock',
    beat: 1,
    cue: 'native-omit',
    phrase:
      'A compatible native path can omit the sixty-millisecond PTX code-generation phase and still pay lazy loading',
    has: (a) => has(a, 'Native total 18ms'),
  },
  {
    scene: 'first-failing-boundary',
    beat: 2,
    cue: 'fresh-seven',
    phrase: 'Seven blocks create eight hundred ninety-six lane positions',
    reset: ['fresh-tail-complete', 'fresh-illegal', 'fresh-repair'],
    has: (a) => has(a, '7 × 128 = 896 positions'),
  },
  {
    scene: 'first-failing-boundary',
    beat: 2,
    cue: 'fresh-tail-complete',
    phrase:
      'only the final block’s first lane is valid and its remaining one hundred twenty-seven are masked',
    reset: ['fresh-illegal', 'fresh-repair'],
    has: (a) => has(a, 'remaining 120 lanes also masked'),
  },
  {
    scene: 'first-failing-boundary',
    beat: 2,
    cue: 'fresh-illegal',
    phrase: 'next lane incorrectly enters the store',
    reset: ['fresh-repair'],
    has: (a) => has(a, '<= admits index 769 illegally'),
  },
  {
    scene: 'first-failing-boundary',
    beat: 2,
    cue: 'fresh-repair',
    phrase: 'Repair only that comparison',
    has: (a) => has(a, '< repaired: 1 valid + 127 masked in last block'),
  },
];
