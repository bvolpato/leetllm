export const SCENES = [
  'opening',
  'argument',
  'path',
  'tradeoff',
  'paired-evidence',
  'time-budget',
  'measurement-limits',
  'next-experiment',
];
export const TALK_BUDGET = Object.freeze([
  {
    id: 'context',
    label: 'problem + constraints',
    value: 2,
  },
  {
    id: 'path',
    label: 'request path',
    value: 4,
  },
  {
    id: 'decision',
    label: 'hard decision',
    value: 3,
  },
  {
    id: 'evidence',
    label: 'evidence',
    value: 3,
  },
  {
    id: 'limits',
    label: 'limits',
    value: 1,
  },
  {
    id: 'questions',
    label: 'questions + slack',
    value: 2,
  },
]);
export const PAIR_FIXTURE = Array.from(
  {
    length: 200,
  },
  (_, i) => {
    const index = (i * 73) % 200;
    return {
      id: `query-${String(index + 1).padStart(3, '0')}`,
      baseline: index < 148,
      candidate: index < 140 || (index >= 148 && index < 170),
    };
  },
);
export const PAGINATION_BEAT_SECONDS = 20.6;
export const REPEATED_CURSOR_PAGES = Object.freeze([
  Object.freeze({
    page: 1,
    requestedCursor: null,
    nextCursor: 'C-17',
  }),
  Object.freeze({
    page: 2,
    requestedCursor: 'C-17',
    nextCursor: 'C-17',
  }),
]);
