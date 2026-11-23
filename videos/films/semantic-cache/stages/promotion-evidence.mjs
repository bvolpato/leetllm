import { reportDecision } from '../model.mjs';
import { cueProgress, wilsonLower } from '../arithmetic.mjs';

const now = 10000;
const base = {
  id: 'eval-public-policy',
  created: 6400,
  scopeCurrent: true,
  policyCurrent: true,
  lookups: 1000,
  proposals: 500,
  reviewed: 500,
  acceptable: 500,
  saving: 10,
  p95: 1030,
};
const reports = [
  base,
  { ...base, id: 'fewer-pairs', proposals: 300, reviewed: 300, acceptable: 300 },
  { ...base, id: 'older-report', created: 6399 },
];

export function drawPromotionEvidence(ctx, scene, state, api) {
  const { C, focus } = api;
  const txt = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  if (state.beat === 3) {
    const report = {
      ...base,
      created: now,
      lookups: 10000,
      proposals: 5714,
      reviewed: 5714,
      acceptable: 5714,
      saving: 22.056,
      p95: 1020,
    };
    const copies = [
      ['Complete report', report],
      ['Fewer acceptable pairs', { ...report, acceptable: 5600 }],
      ['Negative savings', { ...report, saving: -0.4 }],
      ['Superseded scope', { ...report, scopeCurrent: false }],
    ];
    const variants = cueProgress(state, 3, 'sc-report-hold', 0.3, 0.65);
    txt(
      'Held-out window    ·    10,000 lookup requests    ·    5,714 reviewed proposals',
      112,
      250,
      38,
    );
    for (const [i, head] of ['Report', 'Lower bound', 'Saving / day', 'Verdict'].entries()) {
      txt(head, [112, 745, 1135, 1490][i], 371, 31, C.muted);
    }
    focus.target('report-evidence', () => {
      for (const [i, [label, r]] of copies.entries()) {
        if (i > Math.ceil(3 * variants)) continue;
        const y = 472 + 114 * i;
        const d = reportDecision(r, now);
        const passes = d.decision.startsWith('promote');
        txt(label, 112, y, 38);
        txt(
          d.lower === null ? 'Out of scope' : (d.lower * 100).toFixed(2) + '%',
          745,
          y,
          39,
          i === 1 || i === 3 ? C.pink : C.ink,
        );
        txt(
          (r.saving < 0 ? '−$' : '$') + Math.abs(r.saving).toFixed(3),
          1135,
          y,
          39,
          i === 2 ? C.pink : C.ink,
        );
        txt(passes ? 'Qualifies' : 'Hold', 1490, y, 40, passes ? C.green : C.pink);
      }
    });
    txt('A qualifying report is evidence for a rollout decision.', 112, 980, 37, C.muted);
    return;
  }
  const checked = cueProgress(state, 2, 'sc-symbolic-promote', 0, 0.2) > 0;
  txt(
    'Public-policy scope matches    ·    Frozen retrieval policy    ·    1,000 lookups per report',
    112,
    233,
    32,
    C.muted,
  );
  const xs = [710, 1150, 1600];
  const titles = ['Report A', 'Report B', 'Report C'];
  const metrics = [
    'Acceptable / reviewed',
    'Wilson lower bound',
    state.beat === 0 ? 'Report completed at' : 'Age at 10,000 s',
    'Savings per day',
    'p95 latency',
  ];
  const ys = [431, 529, 627, 725, 823];
  for (const [i, m] of metrics.entries()) txt(m, 112, ys[i], 36, C.muted);
  focus.target('report-evidence', () => {
    for (const [i, r] of reports.entries()) {
      const x = xs[i];
      const lower = wilsonLower(r.acceptable, r.reviewed);
      const age = now - r.created;
      const current = reportDecision(r, now);
      const promote = current.decision.startsWith('promote');
      txt(titles[i], x, 322, 45, C.ink, 'center');
      api.line(ctx, x - 170, 350, x + 170, 350, C.panel, 4);
      txt(r.acceptable + ' / ' + r.reviewed, x, ys[0], 45, C.ink, 'center');
      txt(
        (100 * lower).toFixed(2) + '%',
        x,
        ys[1],
        45,
        checked && lower < 0.99 ? C.pink : C.ink,
        'center',
      );
      if (state.beat > 0) {
        txt('10,000 − ' + r.created.toLocaleString('en-US'), x, ys[2] - 39, 25, C.muted, 'center');
      }
      const seconds = state.beat === 0 ? r.created : age;
      txt(
        seconds.toLocaleString('en-US') + ' s',
        x,
        ys[2] + 10,
        45,
        checked && age > 3600 ? C.pink : C.ink,
        'center',
      );
      txt('$' + r.saving, x, ys[3], 42, C.ink, 'center');
      txt(r.p95.toLocaleString('en-US') + ' ms', x, ys[4], 42, C.ink, 'center');
      if (checked)
        txt(
          promote ? 'Qualifies' : 'Hold in shadow',
          x,
          955,
          41,
          promote ? C.green : C.pink,
          'center',
        );
    }
  });
  if (!checked) {
    focus.target('report-gates', () => {
      txt(
        'Lower bound ≥ 99%    ·    Age 0–3,600 s    ·    Savings ≥ $5/day    ·    p95 0–1,050 ms',
        960,
        964,
        36,
        C.yellow,
        'center',
      );
    });
  }
}
export default {
  id: 'promotion-evidence',
  draw: drawPromotionEvidence,
  cues: ['report-shape', 'sc-age-boundary', 'sc-symbolic-promote', 'sc-report-hold'],
};
