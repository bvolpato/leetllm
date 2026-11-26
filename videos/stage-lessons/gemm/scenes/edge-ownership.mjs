// Scene 07: A thread crosses the right edge: skipping T(1,1) drops 3 -> corrupts neighbor to 4; keeping copy restores 7!
import {
  COSMOS,
  RIGHT_BUG,
  RIGHT_SAFE,
  ROLE,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function edgeOwnership(s, c) {
  const phase = s.value(0);
  const askPulse = s.value(0);
  // mode: 0=question, 1=skip(middle=0), 2=bad-sum(4), 3=keep(middle=+3), 4=fixed-sum(7)
  const mode = s.value(0);
  const showBarriers = s.value(0);

  const bgAura = aura(0, 20, 620, '#ff6b8b1c', '#6ee7b716');
  const title = heroTitle(['A Thread Crosses', 'the Right Edge'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.warn,
    eyebrow: 'EDGE OWNERSHIP · 2 × 1 OUTPUT',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const m = Math.round(mode.value);
    const sb = showBarriers.value;
    const isBug = m === 1 || m === 2;
    const isFixed = m >= 3;
    const trace = isBug ? RIGHT_BUG : RIGHT_SAFE;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8 + askPulse.value * 1.5);

    const nodes = [];

    // Left: 2x2 Thread Block ownership grid
    nodes.push(txt('2 × 2 THREAD BLOCK', -560, -195, 26, COSMOS.cyan, 'mono'));
    const threads = [
      { ty: 0, tx: 0, loadA: 'A[0,0]=1', out: 'C[0,0]', active: true },
      { ty: 0, tx: 1, loadA: 'A[0,1]=2', out: 'masked', active: false },
      { ty: 1, tx: 0, loadA: 'A[1,0]=-1', out: 'C[1,0]', active: true },
      { ty: 1, tx: 1, loadA: 'A[1,1]=3', out: 'masked', active: false, hero: true },
    ];
    for (const t of threads) {
      const cx = -705 + t.tx * 284;
      const cy = -90 + t.ty * 155;
      const stroke = t.hero
        ? isBug
          ? ROLE.bad
          : isFixed
            ? ROLE.good
            : COSMOS.gold
        : t.active
          ? ROLE.c
          : COSMOS.dim;
      nodes.push(
        glassCell(cx, cy, 264, 126, stroke, {
          fill: t.hero ? (isBug ? '#2e101c' : isFixed ? '#0e2824' : '#262011') : '#0f182d',
          dash: !t.active && !t.hero ? [8, 6] : undefined,
          glow: t.hero ? 11 * pulse : 4,
        }),
        txt(`T(${t.ty},${t.tx}) · ${t.out}`, cx, cy - 30, 26, stroke, 'mono'),
        txt(
          t.hero && isBug ? 'SKIPPED (0)' : `loads ${t.loadA}`,
          cx,
          cy + 20,
          26,
          t.hero && isBug ? ROLE.bad : COSMOS.ink,
          'mono',
        ),
      );
    }

    // Right: Bottom-left thread's 3-step dot trace
    nodes.push(txt('T(1,0) SHARED-TILE TRACE FOR C[1,0]', 360, -195, 26, COSMOS.gold, 'mono'));
    const stepXs = [95, 360, 625];
    for (let k = 0; k < 3; k++) {
      const sx = stepXs[k];
      const st = trace.steps[k];
      const isMiddle = k === 1;
      const stroke = isMiddle ? (isBug ? ROLE.bad : isFixed ? ROLE.good : COSMOS.gold) : ROLE.c;
      const label = m === 0 && isMiddle ? '? × 1' : `${st.a} × ${st.b}`;
      const prodStr =
        m === 0 && isMiddle ? '?' : st.product >= 0 ? `+${st.product}` : String(st.product);
      nodes.push(
        txt(`k = ${k}`, sx, -135, 26, COSMOS.muted, 'mono'),
        glassCell(sx, -55, 210, 118, stroke, {
          fill: isMiddle && isBug ? '#2e101c' : isMiddle && isFixed ? '#0e2824' : '#0f1c30',
          glow: isMiddle ? 10 : 4,
        }),
        txt(label, sx, -78, 28, COSMOS.muted, 'mono'),
        txt(prodStr, sx, -30, 38, stroke, 'mono').glow(6, stroke),
      );
    }

    // Arc from T(1,1) right edge to middle step k=1 bottom edge
    nodes.push(
      glowingArc([-286, 65], [360, 14], 24, {
        color: isBug ? ROLE.bad : isFixed ? ROLE.good : COSMOS.gold,
        width: 3.4,
        opacity: 0.85,
      }),
    );
    if (isFixed) {
      const u = (p * 0.7) % 1;
      nodes.push(
        glowDot(-286 + u * 646, 65 - u * 51 + Math.sin(u * Math.PI) * 14, {
          radius: 6.5,
          color: ROLE.good,
        }),
      );
    }

    // Stored C[1,0] output (withheld until bad-sum / fixed-sum cues!)
    const outLabel =
      m === 0
        ? 'Can T(1,1) exit early?'
        : m === 1
          ? 'computing...'
          : m === 2
            ? `STORED ${RIGHT_BUG.sum} (CORRUPTED!)`
            : m === 3
              ? 'replaying with 3...'
              : `STORED ${RIGHT_SAFE.sum} (EXACT!)`;
    const outCol =
      m === 2 ? ROLE.bad : m === 4 ? ROLE.good : m === 1 || m === 3 ? COSMOS.amber : COSMOS.gold;
    nodes.push(
      glassCell(360, 165, 520, 106, outCol, { fill: '#0e182a', glow: 10 }),
      txt(outLabel, 360, 165, 34, outCol, 'mono').glow(6, outCol),
    );

    if (sb > 0.02) {
      nodes.push(
        txt(
          'LOAD (guard in) → __syncthreads() → COMPUTE → __syncthreads() → STORE (guard out)',
          0,
          388,
          28,
          ROLE.c,
          'mono',
        )
          .glow(5, ROLE.c)
          .opacity(sb),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('edge-question', () =>
    s.play(askPulse.to(1, { duration: remainDuration(c, 'edge-question', 0.45) })),
  );
  c.on('skip-thread', () =>
    s.play(mode.to(1, { duration: remainDuration(c, 'skip-thread', 0.4) })),
  );
  c.after('bad-sum', () => s.play(mode.to(2, { duration: remainDuration(c, 'bad-sum', 0.4) })));
  c.on('keep-copy', () => s.play(mode.to(3, { duration: remainDuration(c, 'keep-copy', 0.45) })));
  c.after('fixed-sum', () =>
    s.play(mode.to(4, { duration: remainDuration(c, 'fixed-sum', 0.45) })),
  );
  c.onBeat(3, () => s.play(showBarriers.to(1, { duration: 0.5 })));
}
