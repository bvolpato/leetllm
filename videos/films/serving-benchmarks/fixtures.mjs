export const scheduledMs = Array.from(
  {
    length: 6,
  },
  (_, index) => Math.round((index * 1000) / 3),
);
export const rate = 3;
export const averageResidenceMs = 900;
export const timedArrivalsMs = Array.from(
  {
    length: 15,
  },
  (_, index) => Math.round(((index - 3) * 1000) / rate),
);
export const tokenTimes = [240, 280, 320, 440, 480];
export const comparisonTokenTimes = [300, 380, 460, 580, 620];
export const tokenTerminalMs = 500;
export const gaps = tokenTimes.slice(1).map((time, index) => time - tokenTimes[index]);
export const rates = [
  {
    rps: 0.5,
    attainment: 1.0,
    maxLag: 8,
    backlog: 'flat',
  },
  {
    rps: 1.0,
    attainment: 1.0,
    maxLag: 9,
    backlog: 'flat',
  },
  {
    rps: 1.5,
    attainment: 0.95,
    maxLag: 11,
    backlog: 'flat',
  },
  {
    rps: 2.0,
    attainment: 0.8,
    maxLag: 12,
    backlog: 'growing',
  },
  {
    rps: 2.5,
    attainment: 0.58,
    maxLag: 16,
    backlog: 'growing',
  },
];
export const SERVING_COHORT = Object.freeze(
  [
    {
      id: 'r01',
      scheduled: 0,
      sent: 0,
      terminal: 500,
      tokens: [240, 280, 320, 440, 480],
      status: 'success',
      quality: true,
      prompt: 320,
      cap: 96,
      priority: 'interactive',
      prefix: 'runbook A',
    },
    {
      id: 'r02',
      scheduled: 120,
      sent: 125,
      terminal: 310,
      tokens: [295],
      status: 'success',
      quality: true,
      prompt: 336,
      cap: 96,
      priority: 'interactive',
      prefix: 'runbook A',
    },
    {
      id: 'r03',
      scheduled: 700,
      sent: 705,
      terminal: 1220,
      tokens: [1045, 1085, 1125, 1165, 1205],
      status: 'success',
      quality: true,
      prompt: 4096,
      cap: 256,
      priority: 'interactive',
      prefix: 'none',
    },
    {
      id: 'r04',
      scheduled: 760,
      sent: 765,
      terminal: 1310,
      tokens: [1050, 1111, 1172, 1233, 1294],
      status: 'success',
      quality: true,
      prompt: 280,
      cap: 64,
      priority: 'interactive',
      prefix: 'none',
    },
    {
      id: 'r05',
      scheduled: 800,
      sent: 805,
      terminal: 1180,
      tokens: [1005, 1045, 1085, 1125, 1165],
      status: 'success',
      quality: false,
      prompt: 2048,
      cap: 512,
      priority: 'background',
      prefix: 'policy B',
    },
    {
      id: 'r06',
      scheduled: 1900,
      sent: 1905,
      terminal: 2500,
      tokens: [2200],
      status: 'timeout',
      quality: false,
      prompt: 480,
      cap: 128,
      priority: 'interactive',
      prefix: 'runbook A',
    },
  ].map((r) =>
    Object.freeze({
      ...r,
      tokens: Object.freeze(r.tokens),
    }),
  ),
);
