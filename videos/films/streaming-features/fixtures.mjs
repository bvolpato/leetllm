export const heartbeats = [
  {
    id: 'H1',
    event: 60,
    available: 62,
  },
  {
    id: 'H2',
    event: 510,
    available: 660,
  },
  {
    id: 'H3',
    event: 720,
    available: 721,
  },
];
export const cutoff09 = 540;
export const hourlyRows = [
  {
    job: 'J-201',
    cutoff: 540,
  },
  {
    job: 'J-202',
    cutoff: 570,
  },
];
export const backlogUpdates = [
  {
    job: 'J-201',
    time: 530,
    value: 5,
  },
  {
    job: 'J-201',
    time: 555,
    value: 12,
  },
  {
    job: 'J-202',
    time: 560,
    value: 8,
  },
];
export const queueEvents = [
  {
    id: 'Q1',
    delta: 3,
  },
  {
    id: 'Q1',
    delta: 3,
  },
  {
    id: 'Q2',
    delta: -1,
  },
  {
    id: 'Q3',
    delta: -5,
  },
];
export const pairedRows = [
  {
    job: 'J-201',
    offline: 5,
    online: 18,
  },
  {
    job: 'J-202',
    offline: 18,
    online: 5,
  },
];
export const revisionRecords = Object.freeze([
  {
    id: 'H4',
    job: 'J-204',
    event: 630,
    available: 631,
    version: 1,
    phase: 'worker_scaled',
  },
  {
    id: 'H4-correction',
    job: 'J-204',
    event: 630,
    available: 634,
    version: 2,
    phase: 'worker_scaled_corrected',
  },
  {
    id: 'H4-v1-retry',
    job: 'J-204',
    event: 630,
    available: 636,
    version: 1,
    phase: 'worker_scaled',
  },
]);

export const afternoonHeartbeats = [
  { id: 'H7', event: 660, available: 662 },
  { id: 'H8', event: 830, ingested: 835, available: 843 },
];

// Distinct heartbeat identities make the two whole-window messages inspectable.
export const countWindow = {
  key: 'J-204/11:00/12:00',
  start: 660,
  end: 720,
  allowance: 30,
  watermark: 740,
  members: [
    { id: 'A', event: 672 },
    { id: 'B', event: 697 },
    { id: 'C', event: 710 },
  ],
  replayEvent: 665,
};

export const countPublications = [
  { revision: 1, time: 742, members: countWindow.members.slice(0, 2) },
  { revision: 2, time: 744, members: countWindow.members },
  { revision: 1, time: 745, members: countWindow.members.slice(0, 2) },
].map((message) => ({
  ...message,
  key: countWindow.key,
  count: message.members.length,
}));
