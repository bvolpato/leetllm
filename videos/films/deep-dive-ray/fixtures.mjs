export const ids = [
  'intro',
  'dependencies',
  'references',
  'placement',
  'window',
  'restart',
  'retry',
  'synthesis',
];
export const texts = ['Birds sing', 'Rain falls', 'The sun shines'];
export const parallel = [
  {
    id: 'A',
    start: 0,
    end: 4,
    lane: 0,
  },
  {
    id: 'B',
    start: 0,
    end: 2,
    lane: 1,
  },
  {
    id: 'C',
    start: 2,
    end: 5,
    lane: 1,
  },
];
export const serial = [
  {
    id: 'A',
    start: 0,
    end: 4,
    lane: 0,
  },
  {
    id: 'B',
    start: 4,
    end: 6,
    lane: 0,
  },
  {
    id: 'C',
    start: 6,
    end: 9,
    lane: 0,
  },
];
