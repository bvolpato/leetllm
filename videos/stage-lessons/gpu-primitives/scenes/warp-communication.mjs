// Scene 03: Where does a lane get its neighbor's sum? 3D orbiting 8-lane XOR shuffle lattice + exited lane 7 trap.
import {
  COSMOS,
  INPUT,
  SHUFFLE,
  aura,
  bezier3d,
  box3d,
  cinematic3d,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  number,
  orbitScene,
  points3d,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

function buildWarpShuffleLattice3d(phaseVal, roundVal, exitedVal) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.06,
    distance: 18.8,
    unit: 90,
    focus: [0, 0, 0.35],
  }).at(430, -175);

  const laneCoords = Array.from({ length: 8 }, (_, i) => {
    const x = -2.8 + i * 0.8;
    const y = i % 2 === 0 ? -0.55 : 0.55;
    return [x, y, 0.0];
  });

  laneCoords.forEach(([x, y, z], i) => {
    const col = i === 0 ? COSMOS.cyan : i === 7 ? COSMOS.rose : COSMOS.blue;
    view.add(...box3d(x - 0.24, y - 0.24, z - 0.16, 0.48, 0.48, 0.32, '#111d36', col, 0.72));
  });

  // Butterfly XOR arcs for strides 1, 2, 4
  const strideArcs = [
    { stride: 1, col: COSMOS.gold, lift: 0.75 },
    { stride: 2, col: COSMOS.cyan, lift: 1.25 },
    { stride: 4, col: COSMOS.emerald, lift: 1.75 },
  ];
  const allArcs = [];
  strideArcs.forEach(({ stride, col, lift }) => {
    for (let i = 0; i < 8; i++) {
      const peer = i ^ stride;
      if (i < peer) {
        const arc = bezier3d(laneCoords[i], laneCoords[peer], lift, col, 2.4);
        allArcs.push({ stride, arc, col, i, peer });
        view.add(arc.node);
      }
    }
  });

  const photons = points3d(
    () => {
      const p = phaseVal.value;
      const rd = Math.round(roundVal.value);
      const activeStride = rd === 0 ? 1 : rd === 1 ? 2 : 4;
      const ex = exitedVal.value > 0.5;
      const pts = [];
      for (const item of allArcs) {
        if (item.stride === activeStride) {
          if (ex && item.peer === 7) continue;
          const t = (p * 0.8 + item.i * 0.11) % 1;
          pts.push(item.arc.evalAt(t));
        }
      }
      return pts.length ? pts : [laneCoords[0]];
    },
    {
      colorAt: (idx) => (idx % 2 === 0 ? COSMOS.gold : COSMOS.cyan),
      radius: 5.5,
      glow: 11,
      blend: 'screen',
      onTop: true,
    },
  );
  view.add(photons);
  return view;
}

export default function warpCommunication(s, c) {
  const phase = s.value(0);
  const round = s.value(0); // 0 -> stride 1, 1 -> stride 2, 2 -> stride 4
  const stepDone = s.value(0);
  const isReplay = s.value(0);
  const lane7Exited = s.value(0);
  const revealUndefined = s.value(0);

  const bgAura = aura(390, -45, 500, '#5ce1e622', '#ff6b8b14');
  const lattice3d = buildWarpShuffleLattice3d(phase, round, lane7Exited);

  const title = heroTitle(['Warp XOR', 'Register Shuffle'], {
    x: -855,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: '8-LANE TEACHING TILE · ZERO SHARED MEMORY',
  });

  const live = guardedDynamic(1, () => {
    const rd = Math.round(round.value);
    const done = stepDone.value;
    const rep = isReplay.value > 0.5;
    const ex = lane7Exited.value > 0.5;
    const undef = revealUndefined.value > 0.5;

    const receiver = rep ? 6 : 0;
    const peer = rep ? 7 : 2 ** rd;
    const vals = rep ? INPUT : SHUFFLE[rd];
    const stride = rep ? 1 : 2 ** rd;

    const x0 = -740;
    const stepX = 211;
    const laneY = 178;

    const nodes = [
      txt('3D XOR BUTTERFLY LATTICE', 430, -405, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      // Active mode indicator on left
      glassCell(-445, -135, 810, 128, ex ? COSMOS.rose : COSMOS.cyan, {
        fill: ex ? '#24101a' : '#0f1c30',
        glow: 9,
      }),
      txt(
        rep
          ? ex
            ? 'REPLAY · LANE 7 EXITED EARLY'
            : 'REPLAY · LANE 6 ↔ LANE 7 (STRIDE 1)'
          : `XOR STRIDE ${stride}  ·  LANE 0 ↔ LANE ${peer}`,
        -445,
        -166,
        26,
        ex ? COSMOS.rose : COSMOS.gold,
        'mono',
      ),
      txt(
        rep
          ? ex
            ? undef
              ? 'Lane 6 reads missing lane 7 → UNDEFINED'
              : 'Lane 6 calls shuffle: what result arrives?'
            : 'Lane 6 asks lane 7 for its 6 points'
          : `lane 0: ${number(vals[0])} + (${number(vals[peer])}) = ${done > 0.5 ? number(vals[0] + vals[peer]) : '?'}`,
        -445,
        -108,
        26,
        ex && undef ? COSMOS.rose : COSMOS.ink,
        'mono',
      ),
    ];

    // 8 lane register boxes across the lower canvas
    vals.forEach((v, i) => {
      const cx = x0 + i * stepX;
      const isRec = i === receiver;
      const isPeer = i === peer;
      const isDead = isPeer && ex;
      const col = isRec ? COSMOS.cyan : isDead ? COSMOS.rose : isPeer ? COSMOS.gold : COSMOS.blue;
      nodes.push(
        txt(`L${i}`, cx, laneY - 68, 26, col, 'mono'),
        glassCell(cx, laneY, 168, 86, col, {
          fill: isDead ? '#28101c' : isRec ? '#0d2336' : isPeer ? '#261e10' : '#10182b',
          dash: isDead ? [7, 5] : undefined,
          glow: isRec || isPeer ? 10 : 3,
        }),
        txt(isDead ? 'EXITED' : number(v), cx, laneY, isDead ? 28 : 38, col, 'mono').glow(
          isRec || isPeer ? 6 : 0,
          col,
        ),
      );
    });

    // Register-to-register arc below the strip
    const srcX = x0 + peer * stepX;
    const dstX = x0 + receiver * stepX;
    if (!ex) {
      nodes.push(
        glowingArc([srcX, laneY + 52], [dstX, laneY + 52], 96, {
          color: COSMOS.gold,
          width: 4.5,
          opacity: 0.92,
        }),
      );
    } else {
      nodes.push(
        glowingArc([srcX, laneY + 52], [dstX, laneY + 52], 82, {
          color: COSMOS.rose,
          width: 3.5,
          opacity: 0.55,
          core: false,
        }),
      );
    }

    // Bottom status / contract readout
    const verdictCol = ex ? (undef ? COSMOS.rose : COSMOS.gold) : COSMOS.emerald;
    const verdictText = ex
      ? undef
        ? 'UNDEFINED READ · Every named non-exited lane must reach the same shuffle mask'
        : 'Lane 7 exited before shuffle · What value does lane 6 receive?'
      : 'Direct register exchange (__shfl_xor_sync) · 0 shared-memory banks used';
    nodes.push(
      glassCell(0, 395, 1520, 82, verdictCol, {
        fill: ex && undef ? '#24101a' : '#101829',
        glow: 9,
      }),
      txt(verdictText, 0, 395, 28, verdictCol, 'sans').glow(4, verdictCol),
    );

    return group(...nodes);
  });

  s.add(bgAura, lattice3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, lattice3d, { theta: 0.18, phi: 0.92 });

  c.on('warp-neighbor', () => s.play(stepDone.to(1, { duration: 0.45 })));
  c.on('warp-next', () => {
    s.play(round.to(1, { duration: 0.35 }));
  });
  c.on('warp-last', () => {
    s.play(round.to(2, { duration: 0.35 }));
  });
  c.on('warp-replay', () => {
    s.play(isReplay.to(1, { duration: 0.35 }));
  });
  c.on('warp-exit', () => {
    s.play(lane7Exited.to(1, { duration: 0.35 }));
  });
  c.after('warp-undefined', () =>
    s.play(revealUndefined.to(1, { duration: remainDuration(c, 'warp-undefined', 0.45) })),
  );
}
