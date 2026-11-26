// Scene 7: finite-table: Learned 4096-row table stops at 4095 vs sinusoidal formula at 4096.
import { dynamic, group, line, rect } from 'vizmatic/stage';
import {
  CLOCK_FREQUENCIES,
  COSMOS,
  ROLE,
  absoluteRow,
  aura,
  bindStepCues,
  glowDot,
  glowingCurve,
  heroTitle,
  txt,
  wavePath,
} from '../parts.mjs';

const ALL_CUES = [
  'rp-finite-table-0-0',
  'rp-finite-table-0-1',
  'rp-finite-table-0-2',
  'rp-finite-table-0-3',
  'rp-finite-table-1-0',
  'rp-finite-table-1-1',
  'rp-finite-table-1-2',
  'rp-finite-table-1-3',
];

const ROW_4096 = absoluteRow(4096, CLOCK_FREQUENCIES);

export default function finiteTable(s, c) {
  const step = s.value(0);
  const stageAura = aura(240, 20, 680, '#5ce1e61e', '#ff6b8b16');

  const title = heroTitle(['A learned table has', 'a real last row'], {
    x: -860,
    y: -435,
    size: 56,
    lineHeight: 64,
    accent: ROLE.danger,
    eyebrow: 'FINITE LOOKUP VS CLOSED-FORM WAVE',
  });

  const live = dynamic(() => {
    const st = step.value;
    const hitLimit = Math.max(0, Math.min(1, st - 1.0));
    const evalSin = Math.max(0, Math.min(1, st - 3.2));
    const nodes = [];

    // Left: Learned table tower 0 .. 4095 + crimson rejection at 4096
    const lx = -540;
    nodes.push(txt('Learned table (4,096 rows)', lx, -210, 28, COSMOS.blue, 'mono'));
    const rows = [
      { idx: '0', y: -130, ok: true },
      { idx: '1', y: -52, ok: true },
      { idx: '···', y: 26, ok: true },
      { idx: '4095', y: 104, ok: true },
      { idx: '4096', y: 206, ok: false },
    ];
    rows.forEach((r) => {
      const col = r.ok ? COSMOS.blue : ROLE.danger;
      const op = r.ok ? 0.92 : 0.3 + 0.7 * hitLimit;
      nodes.push(
        rect(480, 58, {
          fill: r.ok ? '#111930' : '#2f1120',
          stroke: col,
          width: r.ok ? 2 : 3.2,
          dash: r.ok ? undefined : [8, 6],
          radius: 10,
        })
          .at(lx, r.y)
          .opacity(op)
          .glow(!r.ok && hitLimit > 0.3 ? 10 : 0, ROLE.danger),
        txt(
          r.ok ? `row[${r.idx}]   ✓` : 'row[4096]   MISSING',
          lx,
          r.y,
          28,
          r.ok ? COSMOS.ink : ROLE.danger,
          'mono',
        ).opacity(op),
      );
    });

    // Crimson boundary bar between 4095 and 4096
    nodes.push(
      line([lx - 265, 155], [lx + 265, 155], { stroke: ROLE.danger, width: 3.4 })
        .opacity(0.4 + 0.6 * hitLimit)
        .glow(8, ROLE.danger),
    );

    // Right: Unbounded glowing sinusoidal wave + exact row[4096] in [-1, 1]
    const rx0 = 20;
    const rx1 = 850;
    const wy = -60;
    const wavePts = wavePath(rx0, rx1, wy, 92, (t) => Math.sin(t * 16 + st * 0.25), 140);
    const cutX = rx0 + (rx1 - rx0) * 0.68;
    const p4096X = rx0 + (rx1 - rx0) * 0.82;
    const p4096Y = wy - 92 * Math.sin(4096);

    nodes.push(
      txt('Sinusoidal formula (evaluates any index)', 435, -255, 28, ROLE.query, 'mono'),
      line([rx0, wy - 92], [rx1, wy - 92], { stroke: '#2c3c63', width: 1.5, dash: [6, 8] }),
      line([rx0, wy], [rx1, wy], { stroke: '#354773', width: 1.8 }),
      line([rx0, wy + 92], [rx1, wy + 92], { stroke: '#2c3c63', width: 1.5, dash: [6, 8] }),
      txt('+1', rx0 - 30, wy - 92, 26, COSMOS.dim, 'mono'),
      txt('-1', rx0 - 30, wy + 92, 26, COSMOS.dim, 'mono'),
      line([cutX, wy - 125], [cutX, wy + 125], { stroke: COSMOS.gold, width: 2.4, dash: [6, 6] }),
      txt('4095', cutX, wy - 148, 26, COSMOS.gold, 'mono'),
      glowingCurve(wavePts, ROLE.query, {
        width: 4.2,
        glow: 10,
        gradientColors: [COSMOS.cyan, COSMOS.blue, COSMOS.emerald],
      }),
      glowDot(p4096X, p4096Y, { radius: 8.5, color: ROLE.score, glow: 14 }).opacity(
        0.35 + 0.65 * evalSin,
      ),
      txt('4096', p4096X, wy - 148, 26, ROLE.score, 'mono').opacity(0.35 + 0.65 * evalSin),
    );

    // Exact evaluated coordinates at pos = 4096
    const valY = 180;
    nodes.push(
      txt('p(4096) coordinates in [−1, +1]:', 435, valY - 48, 26, COSMOS.muted, 'mono').opacity(
        0.45 + 0.55 * evalSin,
      ),
    );
    ROW_4096.slice(0, 4).forEach((v, i) => {
      const cx = 115 + i * 212;
      nodes.push(
        rect(190, 58, { fill: '#10202e', stroke: ROLE.score, width: 2.2, radius: 10 })
          .at(cx, valY + 18)
          .opacity(0.45 + 0.55 * evalSin),
        txt(v.toFixed(3), cx, valY + 18, 28, ROLE.score, 'mono').opacity(0.45 + 0.55 * evalSin),
      );
    });

    // Bottom takeaway
    nodes.push(
      txt(
        'Evaluating a formula is step 1: test real task accuracy at length 4096',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(stageAura, title, live);
  bindStepCues(s, c, step, ALL_CUES, 0.55);
}
