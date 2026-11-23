export const events = [
  {
    event: '01:00',
    available: '01:01',
  },
  {
    event: '08:30',
    available: '08:31',
  },
  {
    event: '08:50',
    available: '09:15',
  },
  {
    event: '12:00',
    available: '12:01',
  },
];
export const cutoff = '09:00';
export const waitTimes = [5, 12, 18, 24, 30, 42, 55, 12000];
export const targetRows = [
  {
    pool: 'a100-pool',
    missed: 0,
  },
  {
    pool: 'a100-pool',
    missed: 0,
  },
  {
    pool: 'a100-pool',
    missed: 1,
  },
  {
    pool: 'a100-pool',
    missed: 0,
  },
  {
    pool: 'h100-pool',
    missed: 1,
  },
  {
    pool: 'h100-pool',
    missed: 1,
  },
  {
    pool: 'h100-pool',
    missed: 1,
  },
  {
    pool: 'l4-pool',
    missed: 1,
  },
];
export const featureWeights = [0, 0, 0, 0.01, 0.02, 0.01, 0, 0];
export const featureNames = [
  'pool A100',
  'pool H100',
  'pool other',
  'queued min',
  'heartbeat h',
  'backlog',
  'missing bit',
  'priority',
];
export const freshFeatureEvents = [
  {
    job: 'J-new',
    event: 550,
    available: 551,
    revision: 1,
  },
  {
    job: 'J-new',
    event: 590,
    available: 605,
    revision: 1,
  },
  {
    job: 'J-new',
    event: 610,
    available: 611,
    revision: 1,
  },
];
