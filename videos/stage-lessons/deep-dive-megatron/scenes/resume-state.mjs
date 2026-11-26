// Scene 22: What moves the weight on the next step? (w0=2.0, g=1.0, beta=0.5, lr=0.1; saved v=0.4 -> v1=1.2 -> w1=1.88 vs reset v=0 -> v1=1.0 -> w1=1.90).
import {
  COSMOS,
  RESUME_FULL,
  RESUME_RESET,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function resumeState(s, c) {
  const phase = s.value(0);
  // step: 0=copy A saved v=0.4 (HOLD!), 1=copy B reset v=0 (HOLD!), 2=copy A -> 1.88, 3=copy B -> 1.90
  const step = s.value(0);

  const bgAura = aura(0, 15, 620, '#34d3991c', '#fb718518');
  const title = heroTitle(['What Moves the Weight', 'on the Next Step?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.dp,
    eyebrow: 'OPTIMIZER MOMENTUM · SAME WEIGHT, DIFFERENT STEP',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const nodes = [];

    const xOf = (w) => -580 + ((w - 1.84) / (2.02 - 1.84)) * 1160;

    // Two cards showing initial state & update rule
    nodes.push(
      glassCell(-420, -145, 740, 165, ROLE.good, { fill: '#0e2524', glow: 8 }),
      txt('COPY A: RESTORED VELOCITY', -420, -186, 26, ROLE.good, 'mono'),
      txt('w0 = 2.00   |   g = 1.0   |   v0 = 0.4', -420, -135, 26, COSMOS.ink, 'mono'),
      txt(
        st >= 2
          ? `v1 = 0.5(0.4) + 1 = 1.2  ->  w1 = ${RESUME_FULL.nextWeight.toFixed(2)}`
          : 'v1 = 0.5(0.4) + 1 = ?   ->   w1 = ?',
        -420,
        -86,
        26,
        st >= 2 ? ROLE.good : COSMOS.gold,
        'mono',
      ),

      glassCell(420, -145, 740, 165, ROLE.bad, { fill: '#2c1220', glow: 8 }),
      txt('COPY B: WEIGHTS ONLY (v0 = 0)', 420, -186, 26, ROLE.bad, 'mono'),
      txt('w0 = 2.00   |   g = 1.0   |   v0 = 0.0', 420, -135, 26, COSMOS.ink, 'mono'),
      txt(
        st >= 3
          ? `v1 = 0.5(0.0) + 1 = 1.0  ->  w1 = ${RESUME_RESET.nextWeight.toFixed(2)}`
          : 'v1 = 0.5(0.0) + 1 = ?   ->   w1 = ?',
        420,
        -86,
        26,
        st >= 3 ? ROLE.bad : COSMOS.gold,
        'mono',
      ),
    );

    // Common weight scale ruler from 1.85 to 2.00
    const rulerY = 85;
    nodes.push(line([-620, rulerY], [620, rulerY], { color: '#475569', width: 3 }));
    [1.85, 1.88, 1.9, 1.95, 2.0].forEach((tick) => {
      const tx = xOf(tick);
      nodes.push(
        line([tx, rulerY - 14], [tx, rulerY + 14], { color: '#64748b', width: 2.5 }),
        txt(tick.toFixed(2), tx, rulerY + 42, 26, COSMOS.muted, 'mono'),
      );
    });

    // Live markers on the scale
    const posA = st >= 2 ? xOf(RESUME_FULL.nextWeight) : xOf(2.0);
    const posB = st >= 3 ? xOf(RESUME_RESET.nextWeight) : xOf(2.0);

    nodes.push(
      glowDot(posA, rulerY - 46, { radius: 12, color: ROLE.good }),
      txt(st >= 2 ? 'A: 1.88 (-0.12)' : 'A: 2.00', posA, rulerY - 86, 26, ROLE.good, 'mono'),
      glowDot(posB, rulerY + 86, { radius: 12, color: ROLE.bad }),
      txt(st >= 3 ? 'B: 1.90 (-0.10)' : 'B: 2.00', posB, rulerY + 128, 26, ROLE.bad, 'mono'),
    );

    if (st >= 2) {
      nodes.push(
        line([xOf(2.0), rulerY - 46], [posA, rulerY - 46], { color: ROLE.good, width: 4 }),
      );
    }
    if (st >= 3) {
      nodes.push(line([xOf(2.0), rulerY + 86], [posB, rulerY + 86], { color: ROLE.bad, width: 4 }));
    }

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-740 + u * 1480, 290, { radius: 6, color: ROLE.dp }),
      txt(
        st <= 1
          ? 'Predict: Both start at 2.00 with identical forward outputs. Which copy steps farther?'
          : 'True training restart also requires iteration count, LR scheduler, RNG state, and data cursor',
        0,
        355,
        26,
        st <= 1 ? COSMOS.gold : COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['resume-old-motion', 0],
    ['resume-zero-motion', 1],
    ['resume-full-step', 2, true],
    ['resume-reset-step', 3, true],
  ]);
}
