// Scene 22: Keep each reported aggregation and report edition attached (R1-Zero AIME24: 15.6 -> 71.0 vs 77.9 vs cons@64 86.7)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function r1ZeroAndMetrics(s, c) {
  const phase = s.value(0);
  const sSingle = s.value(0);
  const sAvg = s.value(0);
  const sCons = s.value(0);
  const sEd = s.value(0);

  const bgAura = aura(0, 20, 640, '#14365c26', '#2e1d5414');
  const title = heroTitle(['Attach Aggregation &', 'Report Edition to Every Metric'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'DEEPSEEK-R1-ZERO · AIME 2024 REPORTED METRICS',
  });

  const live = guardedDynamic(s.value(1), () => {
    const ss = Math.max(0.65, sSingle.value);
    const sa = sAvg.value;
    const sc = sCons.value;
    const se = sEd.value;

    const baseY = 230;
    const maxH = 380; // 100% -> 380px
    const bars = [
      { label: 'Start', val: 15.6, note: 'V3-Base', col: COSMOS.muted, x: -680, op: ss },
      { label: 'Jan 25 avg@16', val: 71.0, note: 'single-ans', col: COSMOS.cyan, x: -340, op: ss },
      {
        label: 'Expanded ed.',
        val: 77.9,
        note: 'updated curve',
        col: COSMOS.emerald,
        x: 0,
        op: Math.max(0.65, se),
      },
      {
        label: 'cons@64',
        val: 86.7,
        note: '64-vote',
        col: COSMOS.gold,
        x: 340,
        op: Math.max(0.65, sc),
      },
    ];

    const nodes = [
      txt(
        'AIME 2024 SCORE (%) BY EDITION & AGGREGATION',
        -830,
        -195,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      line([-840, baseY], [540, baseY], { stroke: COSMOS.rule, width: 2.2 }),
    ];

    bars.forEach((b) => {
      const h = (b.val / 100) * maxH;
      nodes.push(
        rect(170, h, { fill: '#122238', stroke: b.col, width: 2.8, radius: 8 })
          .at(b.x, baseY - h * 0.5)
          .glow(b.op > 0.7 ? 8 : 3, b.col)
          .opacity(b.op),
        txt(`${b.val.toFixed(1)}%`, b.x, baseY - h - 28, 32, b.col, 'mono').opacity(b.op),
        txt(b.label, b.x, baseY + 36, 26, b.col, 'mono').opacity(b.op),
        txt(b.note, b.x, baseY + 72, 26, COSMOS.muted, 'sans').opacity(b.op),
      );
    });

    nodes.push(
      glowingTrail(
        [
          [-590, baseY - (15.6 / 100) * maxH],
          [-430, baseY - (71.0 / 100) * maxH],
        ],
        { color: COSMOS.cyan, width: 4, opacity: ss },
      ),
      glassCell(710, -25, 340, 360, COSMOS.gold, { fill: '#171a2d', glow: 6 }),
      txt('DO NOT MIX', 710, -155, 28, COSMOS.gold, 'mono'),
      txt('avg@16:', 710, -96, 26, COSMOS.cyan, 'mono'),
      txt('mean of 16 runs', 710, -62, 26, COSMOS.muted, 'sans'),
      txt('cons@64:', 710, 0, 26, COSMOS.gold, 'mono'),
      txt('majority vote', 710, 34, 26, COSMOS.muted, 'sans'),
      txt('pass@k:', 710, 92, 26, COSMOS.emerald, 'mono'),
      txt('>=1 hit in k', 710, 126, 26, COSMOS.muted, 'sans'),
      glowDot(-820, 355, { radius: 6, color: COSMOS.gold }),
      txt(
        sa > 0.3
          ? 'R1-Zero started RL straight from V3-Base (mixed languages) · always cite edition, rule & k'
          : 'Different sample budgets and voting rules answer fundamentally different questions',
        -790,
        357,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('vr-r1-zero-and-metrics-b0', () => s.play(phase.to(1.5, { duration: 0.4 })));
  c.on('vr-base-r1-zero-and-metrics', () => s.play(sSingle.to(0.6, { duration: 0.35 })));
  c.on('vr-r1-zero-and-metrics-b1', () => s.play(sSingle.to(0.85, { duration: 0.35 })));
  c.on('vr-single-r1-zero-and-metrics', () => s.play(sSingle.to(1, { duration: 0.45 })));
  c.on('vr-average-r1-zero-and-metrics', () => s.play(sAvg.to(1, { duration: 0.45 })));
  c.on('vr-consensus-r1-zero-and-metrics', () => s.play(sCons.to(1, { duration: 0.45 })));
  c.on('vr-r1-zero-and-metrics-b2', () => s.play(sEd.to(0.6, { duration: 0.35 })));
  c.on('vr-edition-r1-zero-and-metrics', () =>
    s.play(sEd.to(1, { duration: remainDuration(c, 'vr-edition-r1-zero-and-metrics', 0.45) })),
  );
}
