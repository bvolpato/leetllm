import { clock } from '../arithmetic.mjs';
import { eligibleFeatureEvent, featureFrame } from '../model.mjs';

const job = 'J-204',
  cutoff = 540;
const records = [
  { job, event: 510, available: 511, revision: 1 },
  { job, event: 510, available: 545, revision: 2 },
  { job, event: 530, available: 555, revision: 1 },
  { job: 'J-peer', event: 525, available: 526, revision: 1 },
  { job, event: 560, available: 561, revision: 1 },
];
const winner = eligibleFeatureEvent(records, cutoff, job);

export function drawTemporalContract(ctx, scene, state, api) {
  const { C } = api,
    f = featureFrame(state);
  const t = (s, x, y, size, color = C.ink, align = 'center') =>
    api.text(ctx, s, x, y, size, color, align);
  api.focus.target('temporal-contract-operation', () => {
    if (f.b < 2) {
      t('Revision history   /   ' + job + ' at ' + clock(cutoff), 145, 257, 36, C.ink, 'left');
      const cols = [270, 585, 855, 1150, 1540];
      ['Job', 'Ping sent', 'Revision', 'Readable', 'At decision'].forEach((s, i) =>
        t(s, cols[i], 389, 34, C.muted),
      );
      const reveal = f.started('temporal-contract-1', 1);
      records.forEach((r, i) => {
        const y = 495 + i * 85;
        const verdict =
          r.job !== job
            ? 'Different job'
            : r.event > cutoff
              ? 'Future ping'
              : r.available > cutoff
                ? 'Arrived late'
                : r === winner
                  ? 'Use this revision'
                  : 'Eligible';
        const color = !reveal ? C.ink : r === winner ? C.green : C.muted;
        [r.job, clock(r.event), String(r.revision), clock(r.available)].forEach((s, j) =>
          t(s, cols[j], y, 38, color),
        );
        t(
          reveal ? verdict : '?',
          cols[4],
          y,
          34,
          !reveal ? C.muted : r === winner ? C.green : C.pink,
        );
      });
      t(
        reveal
          ? 'The 09:05 correction belongs to a later view of the same 08:30 ping.'
          : 'Which revision of the 08:30 ping belongs to this job at nine?',
        960,
        970,
        37,
        C.yellow,
      );
      return;
    }
    t('J-204', 152, 280, 43, C.ink, 'left');
    const x = (h) => 285 + h * 25;
    api.line(ctx, x(0), 565, x(53), 565, C.muted, 4);
    const finished = f.started('temporal-contract-2', 2);
    const markers = [
      [0, 'May 1   09:00', 'Decision', C.cyan],
      [24, 'May 2   09:00', 'Deadline', C.yellow],
    ];
    if (finished) markers.push([53, 'May 3   14:00', 'Finish', C.pink]);
    markers.forEach(([h, stamp, name, color]) => {
      api.circle(ctx, x(h), 565, 16, color);
      t(stamp, x(h), 484, 38, color);
      t(name, x(h), 679, 43, color);
    });
    if (finished) t('Finished after the deadline     →     training label 1', 960, 878, 49, C.pink);
  });
}

export default {
  id: 'temporal-contract',
  draw: drawTemporalContract,
  cues: ['temporal-contract-0', 'temporal-contract-1', 'temporal-contract-2'],
};
