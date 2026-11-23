import { clock } from '../arithmetic.mjs';
import { allowedTargetMean, featureFrame } from '../model.mjs';

const jobs = [
  { scored: 360, available: 480, label: 0 },
  { scored: 420, available: 600, label: 1 },
];
const x = (minute) => 342 + (minute - 360) * 5.45;
const outcomeRadius = 24;

export function drawMaturedEncoding(ctx, scene, state, api) {
  const { C } = api;
  const f = featureFrame(state);
  const t = (s, xx, y, size, color = C.ink, align = 'center') =>
    api.text(ctx, s, xx, y, size, color, align);
  const cutoff =
    420 +
    Math.round(120 * f.progress('feature-label-nine', 1)) +
    Math.round(60 * f.progress('mature-advance', 2));
  const frozen = f.started('mature-save', 2);
  api.focus.target('mature-history', () => {
    t('One runner pool   /   two unrelated jobs', 135, 239, 35, C.ink, 'left');
    for (const [i, job] of jobs.entries()) {
      const y = 415 + 120 * i;
      t('Job ' + (i + 1), 140, y + 11, 36, C.ink, 'left');
      const outcomeX = x(job.available);
      api.line(ctx, x(job.scored), y, outcomeX - outcomeRadius, y, C.muted, 4);
      if (i === 0 && f.b === 0) {
        const travel = f.progress('mature-first', 0);
        const tip = api.lerp(x(job.scored), outcomeX - outcomeRadius, travel);
        api.line(ctx, x(job.scored), y, tip, y, C.cyan, 5);
        if (travel > 0 && travel < 1) api.circle(ctx, tip, y, 9, C.cyan);
      }
      api.circle(ctx, x(job.scored), y, 10, C.cyan);
      const ready = job.available <= cutoff;
      api.circle(ctx, outcomeX, y, outcomeRadius, C.panel, ready ? C.green : C.muted, 3);
      t(ready ? String(job.label) : '?', outcomeX, y + 10, 28, ready ? C.green : C.muted);
      t(clock(job.scored) + ' scored', x(job.scored), y - 38, 28, C.cyan);
      t(clock(job.available) + ' outcome', outcomeX, y - 38, 28, ready ? C.green : C.muted);
    }
    api.line(ctx, x(360), 608, x(605), 608, C.muted, 2);
    for (const minute of [360, 420, 480, 540, 600]) {
      api.line(ctx, x(minute), 608, x(minute), 626, C.muted, 2);
      t(clock(minute), x(minute), 663, 27, C.muted);
    }
    const pin = (minute, color) => {
      for (const [a, z] of [
        [300, 335],
        [449, 473],
        [568, 608],
      ])
        api.line(ctx, x(minute), a, x(minute), z, color, 4);
    };
    if (frozen) pin(540, C.blue);
    pin(cutoff, C.yellow);
    t(clock(cutoff) + ' cutoff', x(cutoff), 283, 32, C.yellow);
  });
  api.focus.target('mature-count', () => {
    const labels = jobs.filter((j) => j.scored < cutoff && j.available <= cutoff);
    const mean = allowedTargetMean(jobs, cutoff);
    if (frozen) {
      t('Saved at 09:00', 440, 754, 34, C.blue);
      t('0 misses / 1 job = ' + allowedTargetMean(jobs, 540), 440, 840, 42, C.blue);
    }
    const cx = frozen ? 1330 : 960;
    t('Updating at ' + clock(cutoff), cx, 754, 34, C.yellow);
    let tally = 'Any outcomes by ' + clock(cutoff) + '?';
    if (!labels.length && f.completed('feature-label-seven', 0)) tally = 'No readable outcomes';
    if (labels.length) {
      const misses = labels.reduce((sum, job) => sum + job.label, 0);
      const count = f.completed('mature-denominator', 2) ? String(labels.length) : '?';
      tally =
        misses +
        (misses === 1 ? ' miss / ' : ' misses / ') +
        count +
        (count === '1' ? ' job' : ' jobs');
      if (f.completed('mature-rate', 2)) {
        const rateReady = labels.length === 1 || f.completed('feature-label-ten', 2);
        tally += ' = ' + (rateReady ? mean : '?');
      }
    }
    t(tally, cx, 840, 45, C.ink);
    if (f.b === 1) t('How many jobs can we count at 09:00?', 960, 947, 36, C.yellow);
  });
  if (f.b === 3)
    api.focus.target('mature-coverage', () => {
      t('Forward split', 182, 965, 31, C.muted, 'left');
      t('Row 1   held out 0 times', 710, 965, 34, C.pink);
      t('Rows 2 and 3   held out once', 1390, 965, 34, C.cyan);
    });
}

export default {
  id: 'matured-encoding',
  draw: drawMaturedEncoding,
  cues: [
    'mature-first',
    'feature-label-seven',
    'feature-label-nine',
    'mature-denominator',
    'mature-rate',
    'mature-save',
    'mature-advance',
    'feature-label-ten',
    'feature-splitter-requirement',
  ],
};
