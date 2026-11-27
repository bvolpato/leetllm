// Scene 5: reserve - Empty space that belongs to somebody
// Act 1: Orbiting 3D Fragmented Contiguous Slabs where 2 requests reserve the entire pool and lock out a 3rd.
// Act 2: Three kinds of waste (internal 3,796/4,096, reservation idle, external holes 12+14+10=36 < 20 fit)
//        and 60-80% unused historical waste bar.
import { delay, gridPlane3d, group, line, par, rect } from 'vizmatic/stage';
import {
  COSMOS,
  HOLES,
  NEEDED,
  RESERVED,
  ROLE,
  TRAPPED,
  USED,
  addBox3D,
  addWireBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  fadeInNodes,
  fmt,
  glowBar,
  guardedDynamic,
  hideNodes,
  txt,
} from '../parts.mjs';

export default function reserve(s, c) {
  const act1Vis = s.value(1);
  const act2Vis = s.value(0);

  // Act 1 state
  const copyVis = s.value(0);
  const needTwoVis = s.value(0);
  const thirdVis = s.value(0);
  const blankPulse = s.value(0);

  // Act 2 state
  const internalStep = s.value(0); // 0..4 (reserves -> stops -> trapped -> internal)
  const resWasteStep = s.value(0); // 0..2 (idle -> res-waste)
  const extStep = s.value(0); // 0..4 (holes -> add-up -> no-hole -> external)
  const sixtyStep = s.value(0); // 0..3 (how-bad -> sixty -> historical)

  // ── Act 1: Orbiting 3D Fragmented Contiguous Slabs ──────────────────────────
  const act1Header = cinemaHeader(
    'CONTIGUOUS RESERVATION',
    'Empty space that',
    'belongs to somebody',
    {
      x: -860,
      y: -415,
      accent: ROLE.waste,
      size: 54,
    },
  );

  const fragAura = aura(245, 25, 600, '#ff6b8b28', '#1d4ed814');

  const fragView = cinematic3d({
    theta: -0.9,
    phi: 1.05,
    distance: 15.2,
    unit: 102,
    focus: [0, 0, 0.35],
  }).at(245, -24);

  fragView.add(
    gridPlane3d({
      x: [-4.4, 4.4],
      y: [-2.8, 2.8],
      z: 0,
      step: 1.1,
      color: '#2b3655',
      width: 1.2,
      opacity: 0.52,
    }),
  );

  // Two massive contiguous reservations filling the entire 8-block pool (2 used + 6 empty each)
  const slabAUsed = addBox3D(fragView, -3.7, -1.75, 0.05, 1.85, 1.25, 0.82, ROLE.reqA, ROLE.reqA, {
    faceOpacity: 0.84,
    edgeWidth: 2.3,
    edgeGlow: 7,
  });
  const slabAEmpty = addBox3D(
    fragView,
    -1.78,
    -1.75,
    0.05,
    5.48,
    1.25,
    0.82,
    '#1d0d1a',
    ROLE.waste,
    {
      faceOpacity: 0.32,
      edgeWidth: 1.8,
      edgeGlow: 5,
    },
  );
  const slabBUsed = addBox3D(fragView, -3.7, 0.45, 0.05, 1.85, 1.25, 0.82, ROLE.reqB, ROLE.reqB, {
    faceOpacity: 0.84,
    edgeWidth: 2.3,
    edgeGlow: 7,
  });
  const slabBEmpty = addBox3D(
    fragView,
    -1.78,
    0.45,
    0.05,
    5.48,
    1.25,
    0.82,
    '#1d0d1a',
    ROLE.waste,
    {
      faceOpacity: 0.32,
      edgeWidth: 1.8,
      edgeGlow: 5,
    },
  );

  // Blocked 3rd request hovering outside the pool in crimson wireframe cage
  const req3Blocked = hideNodes([
    ...addBox3D(fragView, -3.7, 2.45, 0.35, 1.85, 0.95, 0.72, ROLE.reqC, ROLE.reqC, {
      faceOpacity: 0.82,
      edgeWidth: 2.2,
      edgeGlow: 8,
    }),
    ...addWireBox3D(fragView, -3.85, 2.35, 0.25, 2.15, 1.15, 0.92, ROLE.waste, {
      width: 2.6,
      opacity: 0.9,
      glow: 9,
    }),
  ]);

  const act1Dyn = guardedDynamic(act1Vis, (a) => {
    const nodes = [
      txt('TWO CONTIGUOUS RESERVATIONS FILL POOL', 245, -420, 26, COSMOS.muted, 'mono').opacity(a),
      txt(
        'Active: 2 blocks each  ·  Locked empty: 6 each',
        245,
        458,
        26,
        ROLE.waste,
        'mono',
      ).opacity(a),
    ];

    if (copyVis.value > 0.05) {
      nodes.push(
        txt(
          'Growing a continuous buffer later',
          -855,
          -125,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a * copyVis.value),
        txt(
          'means reallocating + copying all KV',
          -855,
          -78,
          28,
          ROLE.link,
          'sans',
          'left',
        ).opacity(a * copyVis.value),
      );
    }
    if (needTwoVis.value > 0.05) {
      nodes.push(
        txt('Req A: 2 used / 8 reserved', -855, 18, 28, ROLE.reqA, 'mono', 'left').opacity(
          a * needTwoVis.value,
        ),
        txt('Req B: 2 used / 8 reserved', -855, 72, 28, ROLE.reqB, 'mono', 'left').opacity(
          a * needTwoVis.value,
        ),
      );
    }
    if (thirdVis.value > 0.05) {
      nodes.push(
        txt('REQ C ARRIVES -> BLOCKED', -855, 184, 34, ROLE.waste, 'mono', 'left')
          .glow(8, ROLE.waste)
          .opacity(a * thirdVis.value),
        txt(
          blankPulse.value > 0.2
            ? 'Every blank block already belongs to A or B'
            : 'Pool looks mostly empty, yet 0 free slabs',
          -855,
          244,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(a * thirdVis.value),
      );
    }
    return group(...nodes);
  });

  // ── Act 2: Three Kinds of Waste + 60-80% Historical Measure ─────────────────
  const act2Header = cinemaHeader('THREE KINDS OF WASTE', 'Why reserved VRAM', 'sits idle', {
    x: -860,
    y: -415,
    accent: ROLE.waste,
    size: 54,
  });

  const act2Aura = aura(180, 10, 620, '#ff6b8b1e', '#fb923c14');

  const act2Dyn = guardedDynamic(act2Vis, (a) => {
    const iSt = internalStep.value;
    const rSt = resWasteStep.value;
    const eSt = extStep.value;
    const sSt = sixtyStep.value;
    const nodes = [];

    const barX = -210;
    const barW = 1040;

    // 1. Internal fragmentation (300 / 4,096 -> 3,796 trapped)
    const iAlpha = a * Math.min(1, Math.max(0.25, iSt));
    nodes.push(
      txt(
        '1. INTERNAL FRAGMENTATION',
        -855,
        -162,
        26,
        iSt >= 3.5 ? ROLE.waste : ROLE.focus,
        'mono',
        'left',
      )
        .glow(iSt >= 3.5 ? 6 : 0, ROLE.waste)
        .opacity(iAlpha),
      glowBar(barX, -158, barW, 44, iSt >= 1.5 ? USED / RESERVED : 0.02, {
        fill: ROLE.reqA,
        bg: '#24101c',
        border: ROLE.waste,
        glow: 8,
        opacity: iAlpha,
      }),
      txt(
        iSt >= 2.5
          ? `${fmt(USED)} used  ·  ${fmt(TRAPPED)} trapped unused of ${fmt(RESERVED)}`
          : `Reserved ${fmt(RESERVED)} slots up front`,
        barX + barW * 0.5,
        -102,
        26,
        iSt >= 2.5 ? ROLE.waste : COSMOS.muted,
        'mono',
      ).opacity(iAlpha),
    );

    // 2. Reservation waste (skeleton visible from start of Act 2, lights up on `idle`)
    const rA = a * (rSt > 0.05 ? Math.min(1, rSt) : 0.48);
    const growW = rSt > 0.05 ? 0.22 : 0.08;
    nodes.push(
      txt(
        '2. RESERVATION WASTE',
        -855,
        8,
        26,
        rSt >= 1.5 ? ROLE.link : COSMOS.muted,
        'mono',
        'left',
      )
        .glow(rSt >= 1.5 ? 6 : 0, ROLE.link)
        .opacity(rA),
      glowBar(barX, 12, barW, 44, growW, {
        fill: ROLE.reqB,
        bg: '#241812',
        border: ROLE.link,
        glow: rSt > 0.05 ? 7 : 0,
        opacity: rA,
      }),
      txt(
        'Future slots sit locked & idle from step 1',
        barX + barW * 0.5,
        68,
        26,
        rSt > 0.05 ? ROLE.link : COSMOS.muted,
        'sans',
      ).opacity(rA),
    );

    // 3. External fragmentation (skeleton visible from start of Act 2, lights up on `holes`)
    const eA = a * (eSt > 0.05 ? Math.min(1, eSt) : 0.45);
    nodes.push(
      txt(
        '3. EXTERNAL FRAGMENTATION',
        -855,
        178,
        26,
        eSt >= 3.5 ? ROLE.waste : COSMOS.muted,
        'mono',
        'left',
      )
        .glow(eSt >= 3.5 ? 6 : 0, ROLE.waste)
        .opacity(eA),
    );
    const segs = [
      { w: 150, live: true, label: 'Live' },
      { w: 145, live: false, label: `${HOLES[0]}` },
      { w: 205, live: true, label: 'Live' },
      { w: 170, live: false, label: `${HOLES[1]}` },
      { w: 225, live: true, label: 'Live' },
      { w: 120, live: false, label: `${HOLES[2]}` },
    ];
    let curX = barX;
    for (const seg of segs) {
      const cx = curX + seg.w * 0.5;
      nodes.push(
        rect(seg.w - 6, 46, {
          fill: seg.live ? '#172947' : '#26111e',
          stroke: seg.live ? ROLE.prefill : ROLE.waste,
          width: 2.0,
          radius: 7,
          ...(seg.live ? {} : { dash: [5, 5] }),
        })
          .at(cx, 182)
          .opacity(eA),
        txt(seg.label, cx, 182, 26, seg.live ? COSMOS.muted : ROLE.waste, 'mono').opacity(eA),
      );
      curX += seg.w;
    }
    if (eSt >= 1.5) {
      const sumHoles = HOLES.reduce((x, y) => x + y, 0);
      nodes.push(
        txt(
          eSt >= 2.5
            ? `Holes total ${sumHoles}, yet no single hole fits ${NEEDED}`
            : `Holes: ${HOLES.join(' + ')} = ${sumHoles} free slots`,
          barX + barW * 0.5,
          238,
          26,
          eSt >= 2.5 ? ROLE.waste : ROLE.focus,
          'mono',
        ).opacity(eA),
      );
    }

    // Historical 60-80% waste callout cleanly at bottom
    if (sSt > 0.05) {
      const sA = a * Math.min(1, sSt);
      nodes.push(
        line([-855, 294], [855, 294], { stroke: '#283454', width: 1.8 }).opacity(sA),
        txt(
          sSt >= 1.5 ? '60–80% UNUSED' : 'HOW MUCH RESERVED MEMORY WENT UNUSED?',
          -855,
          354,
          sSt >= 1.5 ? 44 : 28,
          sSt >= 1.5 ? ROLE.waste : ROLE.focus,
          'mono',
          'left',
        )
          .glow(8, sSt >= 1.5 ? ROLE.waste : ROLE.focus)
          .opacity(sA),
        txt(
          sSt >= 2.5
            ? 'Measure your pool: live KV bytes vs reserved bytes'
            : sSt >= 1.5
              ? 'Reported in vLLM 2023 study of contiguous systems'
              : '',
          sSt >= 1.5 ? -365 : -855,
          356,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(sA),
      );
    }

    return group(...nodes);
  });

  // Initial picture (Act 1)
  s.add(fragAura, fragView, act1Header, act1Dyn, act2Dyn);

  // Orbit 3D fragmented slabs through Act 1
  const kindsT = c.cue('kinds').start;
  c.at(0.1, () => {
    const dur = Math.max(1.5, kindsT - c.start - 0.45);
    s.play(fragView.orbit({ theta: -0.35, phi: 0.94 }, { duration: dur }));
  });

  // Act 1 cues
  c.on('reserve-max', () => {
    s.play(act1Vis.to(1, { duration: 0.15 }));
  });
  c.on('copy', () => {
    s.play(copyVis.to(1, { duration: clampDur(c, c.cue('copy').start, 0.35) }));
  });
  c.on('need-two', () => {
    s.play(needTwoVis.to(1, { duration: clampDur(c, c.cue('need-two').start, 0.35) }));
  });
  c.on('third', () => {
    const t = c.cue('third').start;
    s.play(thirdVis.to(1, { duration: clampDur(c, t, 0.35) }));
    fadeInNodes(s, c, t, req3Blocked, 0.4);
  });
  c.on('blank', () => {
    s.play(blankPulse.to(1, { duration: clampDur(c, c.cue('blank').start, 0.3) }));
  });

  // Swap to Act 2 at "three kinds"
  c.swap('kinds', [fragAura, fragView, act1Header], [act2Aura, act2Header]);
  c.on('kinds', () => {
    const t = c.cue('kinds').start;
    s.play(
      par(
        act1Vis.to(0, { duration: 0.16 }),
        delay(act2Vis.to(1, { duration: clampDur(c, t + 0.22, 0.28) }), 0.22),
      ),
    );
  });

  c.on('reserves', () => {
    s.play(internalStep.to(1, { duration: clampDur(c, c.cue('reserves').start, 0.3) }));
  });
  c.on('stops', () => {
    s.play(internalStep.to(2, { duration: clampDur(c, c.cue('stops').start, 0.35) }));
  });
  c.after('trapped', () => {
    s.play(internalStep.to(3, { duration: clampDur(c, c.cue('trapped').end, 0.3) }));
  });
  c.on('internal', () => {
    s.play(internalStep.to(4, { duration: clampDur(c, c.cue('internal').start, 0.25) }));
  });

  c.on('idle', () => {
    s.play(resWasteStep.to(1, { duration: clampDur(c, c.cue('idle').start, 0.35) }));
  });
  c.on('res-waste', () => {
    s.play(resWasteStep.to(2, { duration: clampDur(c, c.cue('res-waste').start, 0.25) }));
  });

  c.on('holes', () => {
    s.play(extStep.to(1, { duration: clampDur(c, c.cue('holes').start, 0.35) }));
  });
  c.on('add-up', () => {
    s.play(extStep.to(2, { duration: clampDur(c, c.cue('add-up').start, 0.3) }));
  });
  c.on('no-hole', () => {
    s.play(extStep.to(3, { duration: clampDur(c, c.cue('no-hole').start, 0.3) }));
  });
  c.on('external', () => {
    s.play(extStep.to(4, { duration: clampDur(c, c.cue('external').start, 0.25) }));
  });

  c.on('how-bad', () => {
    s.play(sixtyStep.to(1, { duration: clampDur(c, c.cue('how-bad').start, 0.3) }));
  });
  c.after('sixty', () => {
    s.play(sixtyStep.to(2, { duration: clampDur(c, c.cue('sixty').end, 0.35) }));
  });
  c.on('historical', () => {
    s.play(sixtyStep.to(3, { duration: clampDur(c, c.cue('historical').start, 0.3) }));
  });
}
