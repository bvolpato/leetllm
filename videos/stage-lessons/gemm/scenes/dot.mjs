// Scene 02: Build the bottom-left answer: k=0,1,2 aligned dot products -> 7, 24 FLOPs.
import {
  A,
  B,
  COSMOS,
  FULL_C,
  ROLE,
  aura,
  glassCell,
  glowDot,
  glowTex,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function dot(s, c) {
  const phase = s.value(0);
  const step = s.value(0); // 1: -2, 2: +3 -> 1, 3: +6 -> 7
  const showFlops = s.value(0);

  const bgAura = aura(120, 40, 620, '#5ce1e620', '#60a5fa18');
  const title = heroTitle(['Build the Bottom-Left', 'Answer'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.c,
    eyebrow: 'DOT PRODUCT · ROW 1 × COL 0',
  });

  const formula = glowTex('C_{1,0} = \\sum_{k=0}^{2} A_{1,k}\\,B_{k,0}', {
    x: 420,
    y: -365,
    size: 40,
    color: COSMOS.gold,
  });

  const terms = [0, 1, 2].map((k) => ({
    k,
    a: A[1][k],
    b: B[k][0],
    prod: A[1][k] * B[k][0],
  }));
  const runningSums = [terms[0].prod, terms[0].prod + terms[1].prod, FULL_C[1][0]];

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const st = step.value;
    const fl = showFlops.value;
    const activeK = st < 0.5 ? -1 : st < 1.5 ? 0 : st < 2.5 ? 1 : 2;
    const nodes = [];

    // Matrix A (2x3) left
    nodes.push(txt('A (2 × 3)', -680, -165, 28, ROLE.a, 'mono'));
    for (let r = 0; r < 2; r++) {
      for (let k = 0; k < 3; k++) {
        const cx = -790 + k * 110;
        const cy = -92 + r * 100;
        const isRow = r === 1;
        const isNow = isRow && k === activeK;
        nodes.push(
          glassCell(cx, cy, 94, 82, isNow ? COSMOS.gold : isRow ? ROLE.a : COSMOS.dim, {
            fill: isNow ? '#292212' : isRow ? '#10203b' : '#0c1120',
            glow: isNow ? 11 : isRow ? 5 : 0,
          }),
          txt(
            String(A[r][k]),
            cx,
            cy,
            36,
            isNow ? COSMOS.gold : isRow ? COSMOS.ink : COSMOS.dim,
            'mono',
          ),
        );
      }
    }

    // Matrix B (3x2) middle-left
    nodes.push(txt('B (3 × 2)', -335, -215, 28, ROLE.b, 'mono'));
    for (let k = 0; k < 3; k++) {
      for (let col = 0; col < 2; col++) {
        const cx = -390 + col * 110;
        const cy = -142 + k * 100;
        const isCol = col === 0;
        const isNow = isCol && k === activeK;
        nodes.push(
          glassCell(cx, cy, 94, 82, isNow ? COSMOS.gold : isCol ? ROLE.b : COSMOS.dim, {
            fill: isNow ? '#292212' : isCol ? '#291224' : '#0c1120',
            glow: isNow ? 11 : isCol ? 5 : 0,
          }),
          txt(
            String(B[k][col]),
            cx,
            cy,
            36,
            isNow ? COSMOS.gold : isCol ? COSMOS.ink : COSMOS.dim,
            'mono',
          ),
        );
      }
    }

    // Matrix C (2x2) right-top
    nodes.push(txt('C (2 × 2)', 650, -165, 28, ROLE.c, 'mono'));
    for (let r = 0; r < 2; r++) {
      for (let col = 0; col < 2; col++) {
        const cx = 595 + col * 110;
        const cy = -92 + r * 100;
        const isTarget = r === 1 && col === 0;
        const valStr = isTarget
          ? st >= 2.5
            ? String(FULL_C[1][0])
            : st >= 0.5
              ? String(runningSums[Math.min(2, Math.floor(st - 0.5))])
              : '0'
          : '·';
        nodes.push(
          glassCell(cx, cy, 94, 82, isTarget ? (st >= 2.5 ? ROLE.good : COSMOS.gold) : ROLE.c, {
            fill: isTarget ? '#0e2833' : '#0c1322',
            glow: isTarget ? 10 : 3,
          }),
          txt(
            valStr,
            cx,
            cy,
            38,
            isTarget ? (st >= 2.5 ? ROLE.good : COSMOS.gold) : COSMOS.dim,
            'mono',
          ),
        );
      }
    }

    // Aligned k=0,1,2 product lanes in center
    const laneXs = [-60, 175, 410];
    for (let k = 0; k < 3; k++) {
      const lx = laneXs[k];
      const vis = st >= k + 0.5 ? 1 : 0.22;
      const done = st >= k + 0.5;
      const t = terms[k];
      nodes.push(
        txt(`k = ${k}`, lx, -145, 26, done ? COSMOS.gold : COSMOS.dim, 'mono').opacity(vis),
        glassCell(lx, -55, 188, 92, done ? ROLE.c : COSMOS.rule, {
          fill: done ? '#112236' : '#0b101d',
          glow: done ? 8 : 0,
          opacity: vis,
        }),
        txt(`${t.a} × ${t.b}`, lx, -74, 28, COSMOS.muted, 'mono').opacity(vis),
        txt(
          done ? (t.prod >= 0 ? `+${t.prod}` : String(t.prod)) : '?',
          lx,
          -34,
          34,
          done ? (t.prod >= 0 ? ROLE.good : ROLE.b) : COSMOS.dim,
          'mono',
        ).opacity(vis),
      );
      if (done) {
        const u = (p * 0.7 + k * 0.27) % 1;
        nodes.push(
          glowingArc([lx, -6], [175, 118], 20, { color: ROLE.c, width: 3.0, opacity: 0.75 }),
          glowDot(lx + (175 - lx) * u, -6 + 124 * u, { radius: 5, color: COSMOS.gold }),
        );
      }
    }

    // Running sum readout
    const curSum =
      st < 0.5 ? 0 : st < 1.5 ? runningSums[0] : st < 2.5 ? runningSums[1] : runningSums[2];
    const sumCol = st >= 2.5 ? ROLE.good : COSMOS.gold;
    nodes.push(
      txt('RUNNING SUM C[1, 0]', 175, 152, 26, COSMOS.muted, 'mono'),
      glassCell(175, 232, 340, 102, sumCol, { fill: '#0e212e', glow: 11 }),
      txt(String(curSum), 175, 232, 54, sumCol, 'mono').glow(8, sumCol),
    );

    if (fl > 0.02) {
      nodes.push(
        txt(
          '4 outputs × 3 multiply-adds × 2 FLOPs = 24 FLOPs total',
          0,
          388,
          32,
          COSMOS.gold,
          'mono',
        )
          .glow(6, COSMOS.gold)
          .opacity(fl),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, formula, live);
  runPhase(s, c, phase, 14);

  c.on('minus-two', () => s.play(step.to(1, { duration: remainDuration(c, 'minus-two', 0.45) })));
  c.on('plus-three', () => s.play(step.to(2, { duration: remainDuration(c, 'plus-three', 0.45) })));
  c.after('plus-six', () => s.play(step.to(3, { duration: remainDuration(c, 'plus-six', 0.45) })));
  c.onBeat(3, () => s.play(showFlops.to(1, { duration: 0.5 })));
}
