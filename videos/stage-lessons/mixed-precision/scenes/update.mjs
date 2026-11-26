// Scene 06: Six writes to the same weight.
// Synchronized glowingTrail trajectories for direct FP16 (stalled), FP32 master, and refreshed FP16 compute copy.
import {
  COSMOS,
  FP16_BELOW,
  FP16_MID_DOWN,
  ONE,
  WEIGHT_HIST,
  aura,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function update(s, c) {
  const phase = s.value(0);
  const stepVal = s.value(0); // 0 -> 2 -> 3 -> 6

  const bgAura = aura(120, 0, 660, '#5ce1e622', '#ffd16614');

  const title = heroTitle(['Six Writes', 'to One Weight'], {
    x: -855,
    y: -445,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'ACCUMULATING SMALL UPDATES (-0.0001 / STEP)',
  });

  // Coordinate frame for trajectory plot: steps 0..6 across [-420, 780], weight 1.0 -> 0.99935 across [-175, 225]
  const xStep = (i) => -420 + i * 200;
  const yWeight = (w) => -175 + ((ONE - w) / (ONE - 0.99932)) * 390;

  const yOne = yWeight(ONE);
  const yMid = yWeight(FP16_MID_DOWN);
  const yBelow = yWeight(FP16_BELOW);

  const live = guardedDynamic(1, () => {
    const sv = stepVal.value;
    const step = Math.min(6, Math.max(0, Math.floor(sv + 1e-6)));
    const frac = Math.max(0, Math.min(1, sv - step));
    const ph = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(ph * 3.6);
    const cur = WEIGHT_HIST[step];

    const nodes = [
      // Legend along top-right
      glowDot(10, -340, { radius: 7, color: COSMOS.blue, glow: 10 }),
      txt('Direct FP16', 35, -340, 26, COSMOS.blue, 'mono', 'left'),
      glowDot(275, -340, { radius: 7, color: COSMOS.cyan, glow: 10 }),
      txt('FP32 weight', 300, -340, 26, COSMOS.cyan, 'mono', 'left'),
      glowDot(540, -340, { radius: 7, color: COSMOS.gold, glow: 10 }),
      txt('FP16 copy', 565, -340, 26, COSMOS.gold, 'mono', 'left'),

      // Horizontal precision reference lines
      line([xStep(0), yOne], [xStep(6), yOne], { stroke: '#35486e', width: 2.5 }),
      line([xStep(0), yMid], [xStep(6), yMid], {
        stroke: COSMOS.rose,
        width: 3,
        dash: [10, 7],
      }).glow(6 * pulse, COSMOS.rose),
      line([xStep(0), yBelow], [xStep(6), yBelow], { stroke: '#35486e', width: 2.5 }),

      // Left axis labels
      txt('1.000000', xStep(0) - 32, yOne, 26, COSMOS.ink, 'mono', 'right'),
      txt('FP16 midpoint', xStep(0) - 32, yMid - 14, 26, COSMOS.rose, 'mono', 'right'),
      txt(FP16_MID_DOWN.toFixed(6), xStep(0) - 32, yMid + 18, 26, COSMOS.rose, 'mono', 'right'),
      txt(FP16_BELOW.toFixed(6), xStep(0) - 32, yBelow, 26, COSMOS.ink, 'mono', 'right'),
    ];

    // Step x-axis ticks 0..6
    for (let i = 0; i <= 6; i++) {
      const tx = xStep(i);
      nodes.push(
        line([tx, 232], [tx, 248], {
          stroke: i <= step ? COSMOS.ink : COSMOS.dim,
          width: 2.5,
        }),
        txt(String(i), tx, 278, 28, i === step ? COSMOS.gold : COSMOS.muted, 'mono'),
      );
    }
    nodes.push(txt('OPTIMIZER STEP', xStep(3), 322, 26, COSMOS.muted, 'mono'));

    // Build smooth polylines up to current continuous step sv
    const masterPts = [];
    const copyPts = [];
    const directPts = [];
    for (let i = 0; i <= step; i++) {
      const row = WEIGHT_HIST[i];
      masterPts.push([xStep(i), yWeight(row.master)]);
      directPts.push([xStep(i), yWeight(row.direct)]);
      if (i > 0) {
        const prev = WEIGHT_HIST[i - 1];
        copyPts.push([xStep(i), yWeight(prev.copy)]);
        if (row.copy !== prev.copy) {
          copyPts.push([xStep(i), yWeight(row.copy)]);
        }
      } else {
        copyPts.push([xStep(0), yWeight(row.copy)]);
      }
    }
    if (frac > 0.01 && step < 6) {
      const a = WEIGHT_HIST[step];
      const b = WEIGHT_HIST[step + 1];
      const ix = xStep(step + frac);
      masterPts.push([ix, yWeight(a.master + (b.master - a.master) * frac)]);
      directPts.push([ix, yWeight(a.direct)]);
      copyPts.push([ix, yWeight(a.copy)]);
    }

    if (directPts.length >= 2) {
      nodes.push(glowingTrail(directPts, { color: COSMOS.blue, width: 4, glow: 7, core: false }));
    }
    if (copyPts.length >= 2) {
      nodes.push(glowingTrail(copyPts, { color: COSMOS.gold, width: 5, glow: 10 }));
    }
    if (masterPts.length >= 2) {
      nodes.push(glowingTrail(masterPts, { color: COSMOS.cyan, width: 5, glow: 10 }));
    }

    // Step marker beads
    for (let i = 0; i <= step; i++) {
      const row = WEIGHT_HIST[i];
      nodes.push(
        glowDot(xStep(i), yWeight(row.copy), { radius: 8, color: COSMOS.gold, glow: 11 }),
        glowDot(xStep(i), yWeight(row.master), { radius: 6, color: COSMOS.cyan, glow: 10 }),
      );
    }

    // Highlight crossing point at step 3 once reached!
    if (step >= 3) {
      nodes.push(
        txt('Crossed midpoint at step 3!', xStep(3), -250, 28, COSMOS.emerald, 'sans').glow(
          6,
          COSMOS.emerald,
        ),
      );
    } else if (step === 2) {
      nodes.push(
        txt(
          'Step 2: has FP32 crossed the midpoint yet?',
          xStep(3),
          -250,
          28,
          COSMOS.gold,
          'sans',
        ).glow(5, COSMOS.gold),
      );
    }

    // Bottom live floating telemetry readouts
    const cols = [-620, 0, 620];
    const readouts = [
      ['DIRECT FP16', cur.direct === 1 ? '1.0 (stalled)' : cur.direct.toFixed(6), COSMOS.blue],
      ['FP32 MASTER', cur.master.toFixed(6), COSMOS.cyan],
      ['REFRESHED FP16 COPY', cur.copy === 1 ? '1.0' : cur.copy.toFixed(6), COSMOS.gold],
    ];
    readouts.forEach(([label, value, color], idx) => {
      nodes.push(
        txt(label, cols[idx], 382, 26, COSMOS.muted, 'mono'),
        txt(value, cols[idx], 438, 38, color, 'mono').glow(7, color),
      );
    });

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('two-updates', () => s.play(stepVal.to(2, { duration: 1.4 })));
  c.on('third-update', () =>
    s.play(stepVal.to(3, { duration: remainDuration(c, 'third-update', 0.8) })),
  );
  c.on('six-updates', () =>
    s.play(stepVal.to(6, { duration: remainDuration(c, 'six-updates', 1.6) })),
  );
}
