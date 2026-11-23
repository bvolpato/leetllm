export const sceneIds = [
  'opening',
  'pretraining',
  'compute-budget',
  'post-training',
  'evaluation',
  'compression',
  'serving',
  'diagnose',
];
export const corpus = [
  {
    word: 'key',
    frequency: 4,
  },
  {
    word: 'stale',
    frequency: 3,
  },
  {
    word: 'rotation',
    frequency: 2,
  },
];
export const policyCases = [
  {
    key: 'K10234',
    age: 42,
    stale: true,
    decision: 'eligible',
    policy: 'P-7',
    action: false,
  },
  {
    key: 'K10235',
    age: 15,
    stale: true,
    decision: 'not eligible',
    policy: 'P-7',
    action: false,
  },
  {
    key: 'K10236',
    age: 50,
    stale: true,
    decision: 'eligible',
    policy: 'P-7',
    action: true,
  },
  {
    key: 'K10237',
    age: 10,
    stale: true,
    decision: 'eligible',
    policy: 'P-7',
    action: false,
  },
  {
    key: 'K10238',
    age: 45,
    stale: true,
    decision: 'eligible',
    policy: 'P-9',
    action: false,
  },
];
