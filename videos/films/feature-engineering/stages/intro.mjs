import { featureFrame } from '../model.mjs';

const jobs = [
  { backlog: 18, escalation: true, missed: true },
  { backlog: 3, escalation: false, missed: false },
  { backlog: 9, escalation: true, missed: true },
  { backlog: 22, escalation: false, missed: false },
];
const limit = 10;
const backlogHits = jobs.filter((job) => job.backlog > limit === job.missed).length;
const flagHits = jobs.filter((job) => job.escalation === job.missed).length;

function drawJobTicket(ctx, state, api, f) {
  const { C } = api;
  const time = state.t ?? 0;
  const rewind = f.progress('intro-rewind', 1);
  const scoring = rewind === 1;
  const label = (s, x, y, size, ink = C.bg, align = 'left') =>
    api.text(ctx, s, x, y, size, ink, align);

  // The stamp descends, leaves its impression and lifts clear of the ticket.
  const strike = api.phase(time, -0.18, 0.65);
  const lift = api.phase(time, 0.76, 1.35);
  const faceY = 513 + 118 * strike - 152 * lift;
  api.rect(ctx, 175, 430, 1570, 392, C.ink, undefined, 20);
  api.circle(ctx, 175, 626, 25, C.bg);
  api.circle(ctx, 1745, 626, 25, C.bg);
  for (let y = 442; y < 811; y += 32) api.rect(ctx, 965, y, 4, 16, C.muted, undefined, 0);

  api.focus.target('intro-queue', () => {
    label('Training job  J-204', 248, 515, 48);
    label('May 1  ·  09:00 UTC', 248, 584, 38);
    api.line(ctx, 248, 620, 881, 620, C.muted, 2);
    label('18', 240, 764, 132);
    label('jobs waiting', 438, 752, 61);
  });
  api.focus.target('intro-outcomes', () => {
    const center = 1355;
    if (!scoring) {
      const dieY = faceY - rewind * 80;
      api.rect(ctx, center - 44, dieY - 152, 88, 100, C.muted, undefined, 18);
      api.rect(ctx, center - 111, dieY - 194, 222, 73, C.pink, undefined, 33);
      api.rect(ctx, center - 205, dieY - 75, 410, 58, C.panel, C.pink, 11);
      api.rect(ctx, center - 215, dieY - 17, 430, 17, C.pink, undefined, 3);
    }
    if (strike >= 1 && !scoring) {
      const inset = rewind * 36;
      const y = 631 - rewind * 126;
      const ink = C.panel;
      ctx.save();
      ctx.globalAlpha *= 1 - rewind;
      api.rect(ctx, center - 226 + inset, y, 452 - 2 * inset, 86, C.ink, ink, 6);
      label('ESCALATED', center, y + 63, 57 - 8 * rewind, ink, 'center');
      ctx.restore();
    } else if (scoring) {
      label('No stamp yet', center, 673, 56, C.bg, 'center');
    }
    label(
      scoring ? 'May 1  ·  09:00 UTC' : 'After the May 2 deadline',
      center,
      776,
      37,
      C.bg,
      'center',
    );
  });
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const f = featureFrame(state);
  if (f.b === 0 && state.t < 0.35) ctx.globalAlpha = 1;
  if (!f.started('intro-backlogs', 1)) {
    drawJobTicket(ctx, state, api, f);
    return;
  }
  const t = (s, x, y, size, color = C.ink, align = 'center') =>
    api.text(ctx, s, x, y, size, color, align);
  const predicted = f.completed('intro-predict', 2);
  const outcomes = f.completed('intro-finish', 2);
  const checking = f.completed('intro-count', 2);
  const copied = f.completed('intro-copy', 2);

  t('Four earlier jobs', 138, 252, 39, C.ink, 'left');
  api.focus.target('intro-queue', () => {
    t('Job', 174, 352, 32);
    t('Queue at scoring', 550, 352, 36);
    t('Predict a miss?', 1000, 352, 36);
    const start = 332,
      unit = 17;
    const threshold = start + unit * limit;
    api.line(ctx, threshold, 405, threshold, 832, C.yellow, 3);
    t(String(limit), threshold, 887, 38, C.yellow);
    jobs.forEach((job, i) => {
      const y = 453 + i * 112;
      const flag = job.backlog > limit;
      t(String(i + 1), 174, y + 15, 46);
      api.rect(ctx, start, y - 8, job.backlog * unit, 16, C.cyan, undefined, 6);
      t(String(job.backlog), 785, y + 16, 48, C.cyan);
      t(predicted ? (flag ? 'Yes' : 'No') : '?', 1000, y + 16, 43, predicted ? C.ink : C.muted);
      if (checking) {
        const hit = flag === job.missed;
        t(hit ? '✓' : '×', 1115, y + 13, 39, hit ? C.green : C.pink);
      }
    });
    if (checking) t(backlogHits + ' / ' + jobs.length + ' correct', 986, 953, 42, C.cyan);
  });
  api.focus.target('intro-outcomes', () => {
    t('After the deadline', 1492, 267, 34, C.yellow);
    api.line(ctx, 1215, 291, 1775, 291, C.muted, 2);
    t('Missed?', 1333, 352, 36);
    t('Escalated?', 1645, 352, 36);
    jobs.forEach((job, i) => {
      const y = 468 + 112 * i;
      t(outcomes ? (job.missed ? 'Yes' : 'No') : '·', 1333, y, 41, outcomes ? C.ink : C.muted);
      t(copied ? (job.escalation ? 'Yes' : 'No') : '·', 1645, y, 41, copied ? C.ink : C.muted);
    });
    if (copied) t(flagHits + ' / ' + jobs.length + ' correct', 1645, 953, 42, C.yellow);
  });
  if (!predicted) t('Which queues exceed ten jobs?', 963, 953, 42, C.yellow);
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'intro-flags',
    'intro-reading',
    'intro-rewind',
    'intro-backlogs',
    'intro-predict',
    'intro-finish',
    'intro-count',
    'intro-copy',
  ],
};
