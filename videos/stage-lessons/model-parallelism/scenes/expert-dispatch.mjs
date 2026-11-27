// Scene 23: Send weighted assignments to expert owners and back (MoE Expert Parallelism). 6 tokens -> 12 routes -> Device 0 (E0,E1): 8, Device 1 (E2,E3): 4 (skew 8/6 = 1.33x) -> T3=4 splits E0 (w=0.75->3) & E2 (w=0.25->3) -> combine = 6!
import {
  COSMOS,
  MOE,
  ROLE,
  aura,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainAfterDuration,
  remainDuration,
  swapViews,
  txt,
} from '../parts.mjs';

export default function expertDispatch(s, c) {
  const showDispatch = s.value(1);
  const showToken = s.value(0);

  const p0 = s.value(0);
  const pOwn = s.value(0);
  const pB1 = s.value(0);
  const pDisp = s.value(0);
  const pLoads = s.value(0);
  const pSkew = s.value(0);
  const pPrem = s.value(0);
  const pExp = s.value(0);
  const pComb = s.value(0);

  const bgAura = aura(0, 20, 620, '#a78bfa1e', '#5ce1e618');
  const title = heroTitle(['Send Weighted Assignments', 'to Expert Owners and Back'], {
    x: -855,
    y: -415,
    size: 50,
    lineHeight: 60,
    accent: ROLE.expert,
    eyebrow: 'EXPERT PARALLELISM · ALL-TO-ALL DISPATCH & COMBINE',
  });

  const dispatchView = guardedDynamic(showDispatch, (a) => {
    const arrived = Math.floor(pDisp.value * MOE.assignments.length + 0.01);
    const ld = pLoads.value > 0.5;
    const sk = pSkew.value > 0.5;

    const nodes = [
      txt(
        pB1.value > 0.3
          ? '6 TOKENS × 2 WEIGHTED ROUTES = 12 ASSIGNMENTS'
          : 'EXPERT PARALLELISM · DIFFERENT EXPERTS ON DIFFERENT GPUS',
        0,
        -215,
        26,
        COSMOS.gold,
        'mono',
      ).opacity(a),
    ];

    // 6 token tiles along top row
    for (let tok = 0; tok < 6; tok++) {
      const tx = -675 + tok * 270;
      const hi = tok === 3;
      nodes.push(
        rect(220, 64, {
          fill: hi ? '#261f0e' : '#102240',
          stroke: hi ? COSMOS.gold : ROLE.gpu0,
          width: 2.2,
          radius: 8,
        })
          .at(tx, -142)
          .glow(6, hi ? COSMOS.gold : ROLE.gpu0)
          .opacity(a),
        txt(`T${tok} = ${tok + 1}`, tx, -142, 28, hi ? COSMOS.gold : COSMOS.ink, 'mono').opacity(a),
      );
    }

    // Glowing dispatch arcs
    if (pDisp.value > 0.05) {
      nodes.push(
        glowingArc([-405, -108], [-440, -34], 12, { color: ROLE.gpu0, width: 3.0, opacity: a }),
        glowingArc([135, -108], [440, -34], 12, { color: ROLE.gpu1, width: 3.0, opacity: a }),
      );
    }

    // 2 expert-owning devices
    [0, 1].forEach((owner) => {
      const cx = owner === 0 ? -440 : 440;
      const col = owner === 0 ? ROLE.gpu0 : ROLE.gpu1;
      const fill = owner === 0 ? '#10213d' : '#0e2b38';
      const rows = MOE.assignments.filter((item) => item.owner === owner);

      nodes.push(
        glassCell(cx, 100, 770, 260, col, { fill, glow: 8, opacity: a }),
        txt(
          `DEVICE ${owner}  ·  E${owner * 2}, E${owner * 2 + 1}`,
          cx - 355,
          -2,
          28,
          col,
          'mono',
          'left',
        ).opacity(a),
      );

      rows.forEach((item, idx) => {
        const globalIdx = MOE.assignments.indexOf(item);
        if (globalIdx >= arrived) return;
        const ax = cx - 270 + (idx % 4) * 180;
        const ay = 64 + Math.floor(idx / 4) * 76;
        nodes.push(
          rect(162, 58, { fill: '#0b1426', stroke: col, width: 2.0, radius: 8 })
            .at(ax, ay)
            .opacity(a),
          txt(`T${item.token}->E${item.expert}`, ax, ay, 26, COSMOS.ink, 'mono').opacity(a),
        );
      });

      if (ld) {
        nodes.push(
          txt(
            `${MOE.loads[owner]} assignments`,
            cx + 355,
            -2,
            28,
            owner === 0 ? ROLE.warn : ROLE.good,
            'mono',
            'right',
          ).opacity(a),
        );
      }
    });

    const foot = sk
      ? `Peak / avg = 8 / 6 = ${MOE.skew.toFixed(2)}×`
      : ld
        ? '8 assignments hit Device 0 vs 4 on Device 1 (even = 6)'
        : 'Router scores experts per token and dispatches to owning GPUs';

    nodes.push(
      glassCell(0, 320, 1460, 80, sk ? ROLE.warn : ROLE.expert, {
        fill: '#10182b',
        glow: 8,
        opacity: a,
      }),
      txt(foot, 0, 320, 28, sk ? ROLE.warn : COSMOS.ink, 'mono').opacity(a),
    );
    return group(...nodes);
  });

  const tokenView = guardedDynamic(showToken, (a) => {
    const pr = pPrem.value > 0.3;
    const ex = pExp.value > 0.5;
    const cb = pComb.value > 0.5;
    const t3 = MOE.assignments.filter((item) => item.token === 3); // E0 (w=0.75, raw=4, wtd=3), E2 (w=0.25, raw=12, wtd=3)

    const nodes = [
      txt(
        'TRACE TOKEN T3 · INPUT = 4 · ALL-TO-ALL DISPATCH & COMBINE',
        0,
        -210,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),
      glassCell(0, -122, 620, 76, COSMOS.gold, { fill: '#221c0e', glow: 9, opacity: a }),
      txt('Token T3  ·  input = 4', 0, -122, 32, COSMOS.gold, 'mono').opacity(a),
      glowingArc([-140, -82], [-430, -16], -14, { color: ROLE.gpu0, width: 3.2, opacity: a }),
      glowingArc([140, -82], [430, -16], -14, { color: ROLE.gpu1, width: 3.2, opacity: a }),
    ];

    t3.forEach((item, i) => {
      const cx = i === 0 ? -430 : 430;
      const col = i === 0 ? ROLE.gpu0 : ROLE.gpu1;
      nodes.push(
        glassCell(cx, 78, 680, 184, col, {
          fill: i === 0 ? '#10213d' : '#0e2b38',
          glow: 8,
          opacity: a,
        }),
        txt(
          `EXPERT E${item.expert} (Device ${item.owner})  ·  gate = ${item.gate}`,
          cx,
          24,
          26,
          col,
          'mono',
        ).opacity(a),
        txt(
          pr ? `raw = ${item.expert + 1} × 4 = ${item.raw}` : 'Computing expert output...',
          cx,
          78,
          30,
          COSMOS.ink,
          'mono',
        ).opacity(a),
        txt(
          ex ? `weighted = ${item.raw} × ${item.gate} = ${item.weighted}` : 'weighted = ?',
          cx,
          132,
          30,
          ex ? COSMOS.gold : COSMOS.muted,
          'mono',
        ).opacity(a),
      );
    });

    nodes.push(
      glowingArc([-430, 174], [-180, 244], 16, { color: ROLE.gpu0, width: 3.2, opacity: a }),
      glowingArc([430, 174], [180, 244], 16, { color: ROLE.gpu1, width: 3.2, opacity: a }),
      glassCell(0, 286, 1140, 86, cb ? ROLE.good : COSMOS.dim, {
        fill: cb ? '#0d2924' : '#0e172a',
        glow: cb ? 10 : 3,
        opacity: a,
      }),
      txt(
        cb
          ? `Combine at T3:  3 + 3 = ${MOE.outputs[3]}  (logical All-to-All)`
          : 'Combining weighted returns at T3...',
        0,
        286,
        32,
        cb ? ROLE.good : COSMOS.muted,
        'mono',
      ).opacity(a),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, dispatchView, tokenView);

  c.on('mp-expert-dispatch-0', () =>
    s.play(p0.to(1, { duration: remainDuration(c, 'mp-expert-dispatch-0', 0.35) })),
  );
  c.on('mp-expert-dispatch-owners', () =>
    s.play(pOwn.to(1, { duration: remainDuration(c, 'mp-expert-dispatch-owners', 0.4) })),
  );
  c.on('mp-expert-dispatch-1', () =>
    s.play(pB1.to(1, { duration: remainDuration(c, 'mp-expert-dispatch-1', 0.35) })),
  );
  c.on('mp-expert-dispatch-dispatch', () =>
    s.play(pDisp.to(1, { duration: remainDuration(c, 'mp-expert-dispatch-dispatch', 0.95) })),
  );
  c.after('mp-expert-dispatch-loads', () =>
    s.play(pLoads.to(1, { duration: remainAfterDuration(c, 'mp-expert-dispatch-loads', 0.4) })),
  );
  c.on('mp-expert-dispatch-skew', () =>
    s.play(pSkew.to(1, { duration: remainDuration(c, 'mp-expert-dispatch-skew', 0.4) })),
  );
  c.on('mp-expert-dispatch-2', () => {
    const d = Math.min(0.16, remainDuration(c, 'mp-expert-dispatch-2', 0.16));
    swapViews(s, showDispatch, showToken, d, d);
  });
  c.on('mp-expert-dispatch-premises', () =>
    s.play(pPrem.to(1, { duration: remainDuration(c, 'mp-expert-dispatch-premises', 0.4) })),
  );
  c.after('mp-expert-dispatch-expert', () =>
    s.play(pExp.to(1, { duration: remainAfterDuration(c, 'mp-expert-dispatch-expert', 0.4) })),
  );
  c.after('mp-expert-dispatch-combine', () =>
    s.play(pComb.to(1, { duration: remainAfterDuration(c, 'mp-expert-dispatch-combine', 0.4) })),
  );
}
