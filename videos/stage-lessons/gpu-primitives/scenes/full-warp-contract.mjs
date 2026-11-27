// Scene 04: Does lane twenty have a value to send? 3D 32-lane hardware warp matrix + 8-warp block barrier.
import {
  COSMOS,
  aura,
  bezier3d,
  box3d,
  cinematic3d,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  points3d,
  remainDuration,
  runPhase,
  siliconSlab3d,
  swapViews,
  txt,
} from '../parts.mjs';

function buildWarp32Matrix3d(phaseVal, modeVal) {
  const view = cinematic3d({
    theta: -0.76,
    phi: 1.0,
    distance: 16.5,
    unit: 108,
    focus: [0, 0, 0.35],
  }).at(390, 20);

  // 4 rows x 8 cols = 32 physical hardware lanes
  const coords = [];
  for (let i = 0; i < 32; i++) {
    const colIdx = i % 8;
    const rowIdx = Math.floor(i / 8);
    const x = -2.8 + colIdx * 0.8;
    const y = -1.5 + rowIdx * 1.0;
    coords.push([x, y, 0.1]);
    const isActiveData = i < 20;
    const edge =
      i === 4
        ? COSMOS.gold
        : i === 20
          ? COSMOS.rose
          : i === 24
            ? COSMOS.violet
            : isActiveData
              ? COSMOS.blue
              : COSMOS.cyan;
    view.add(
      ...box3d(
        x - 0.25,
        y - 0.28,
        -0.1,
        0.5,
        0.56,
        isActiveData ? 0.42 : 0.22,
        isActiveData ? '#132548' : '#102430',
        edge,
        0.74,
      ),
    );
  }

  // Down-shuffle beam: lane 20 -> lane 4 (offset 16)
  const arc20to4 = bezier3d(coords[20], coords[4], 1.6, COSMOS.gold, 3.2);
  // Out-of-range bounce: lane 24 -> self (past 31)
  const arc24out = bezier3d(
    coords[24],
    [coords[24][0], coords[24][1] + 1.8, 0.9],
    0.9,
    COSMOS.violet,
    2.8,
  );
  view.add(arc20to4.node, arc24out.node);

  const photons = points3d(
    () => {
      const p = phaseVal.value;
      const m = modeVal.value;
      const t = (p * 0.75) % 1;
      if (m >= 2.5) return [arc24out.evalAt(t), coords[24]];
      return [arc20to4.evalAt(t), coords[4], coords[20]];
    },
    {
      colorAt: (idx) => (idx === 0 ? COSMOS.gold : idx === 1 ? COSMOS.cyan : COSMOS.rose),
      radius: 6,
      glow: 12,
      blend: 'screen',
      onTop: true,
    },
  );
  view.add(photons);
  return view;
}

export default function fullWarpContract(s, c) {
  const phase = s.value(0);
  const showWarp32 = s.value(1);
  const mode = s.value(0); // 0=overview, 1=lane4<-20 live 0, 2=lane20 exit, 3=lane24 upper bound
  const showBarrier = s.value(0);
  const leadersWritten = s.value(0);

  const bgAura = aura(390, 20, 560, '#60a5fa22', '#a78bfa16');
  const warp3d = buildWarp32Matrix3d(phase, mode);

  // Beat 0-1: 32-lane warp overview + down-shuffle contracts
  const part1 = guardedDynamic(showWarp32, (a) => {
    const m = mode.value;
    const isLive = m >= 0.5 && m < 1.5;
    const isExit = m >= 1.5 && m < 2.5;
    const isUpper = m >= 2.5;

    const nodes = [
      heroTitle(['32-Lane Hardware', 'Down-Shuffle'], {
        x: -855,
        y: -420,
        size: 54,
        lineHeight: 64,
        accent: isExit ? COSMOS.rose : isUpper ? COSMOS.violet : COSMOS.cyan,
        eyebrow: 'CUDA WARP · OFFSETS 16 → 8 → 4 → 2 → 1',
      }).opacity(a),

      txt('3D 4×8 WARP REGISTER MATRIX', 390, -395, 26, COSMOS.cyan, 'mono')
        .glow(5, COSMOS.cyan)
        .opacity(a),

      // Compact 4x8 2D lane map on left side for crisp reading
      txt(
        'LANES 0..19 = 1   ·   LANES 20..31 = LIVE 0',
        -855,
        -210,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(a),
    ];

    for (let i = 0; i < 32; i++) {
      const colIdx = i % 8;
      const rowIdx = Math.floor(i / 8);
      const cx = -805 + colIdx * 96;
      const cy = -135 + rowIdx * 92;
      const activeSrc = (isLive || isExit) && i === 20;
      const activeDst = (isLive || isExit) && i === 4;
      const activeUp = isUpper && i === 24;
      const dead = isExit && i === 20;
      const stroke = activeUp
        ? COSMOS.violet
        : activeDst
          ? COSMOS.gold
          : activeSrc
            ? dead
              ? COSMOS.rose
              : COSMOS.cyan
            : i < 20
              ? COSMOS.blue
              : COSMOS.dim;
      nodes.push(
        glassCell(cx, cy, 80, 68, stroke, {
          fill: dead ? '#2a101d' : activeDst ? '#261e10' : i < 20 ? '#101d38' : '#0e1526',
          dash: dead ? [5, 4] : undefined,
          glow: activeSrc || activeDst || activeUp ? 9 : 2,
          opacity: a,
        }),
        txt(dead ? '×' : i < 20 ? '1' : '0', cx, cy, 30, stroke, 'mono').opacity(a),
      );
    }

    // Status panel below 4x8 map
    const statusCol = isExit ? COSMOS.rose : isUpper ? COSMOS.violet : COSMOS.gold;
    const statusLine1 = isUpper
      ? 'UPPER BOUND: lane 24 + 16 = 40 (≥ 32)'
      : isExit
        ? 'LANE 20 EXITED: source register missing'
        : isLive
          ? 'OFFSET 16: lane 4 reads live lane 20'
          : 'SIGNED INT64 PARTIALS · LANE 0 GETS TOTAL';
    const statusLine2 = isUpper
      ? 'Returns caller value · guard skips out-of-range add'
      : isExit
        ? 'Down-shuffle read becomes UNDEFINED'
        : isLive
          ? 'Live tail lane 20 safely supplies identity 0'
          : 'All 32 named lanes execute every shuffle step';

    nodes.push(
      glassCell(-468, 315, 780, 146, statusCol, {
        fill: isExit ? '#24101a' : '#10182b',
        glow: 9,
        opacity: a,
      }),
      txt(statusLine1, -468, 282, 27, statusCol, 'mono').opacity(a),
      txt(statusLine2, -468, 344, 26, COSMOS.ink, 'sans').opacity(a),
    );

    return group(...nodes);
  });

  // Beat 2: 8 Warp Leaders -> Shared Memory -> __syncthreads() -> Warp 0
  const part2 = guardedDynamic(showBarrier, (a) => {
    const lw = leadersWritten.value;

    const nodes = [
      heroTitle(['Block Handoff:', '8 Warp Leaders'], {
        x: -855,
        y: -420,
        size: 54,
        lineHeight: 64,
        accent: COSMOS.violet,
        eyebrow: '256 THREADS = 8 WARPS · SHARED MEMORY',
      }).opacity(a),

      txt(
        'KEEP SHUFFLE & __syncthreads() OUTSIDE BRANCHES',
        855,
        -395,
        26,
        COSMOS.gold,
        'mono',
        'right',
      ).opacity(a),
    ];

    for (let i = 0; i < 8; i++) {
      const cx = -735 + i * 210;
      const done = lw > i / 8;
      nodes.push(
        glassCell(cx, -165, 174, 78, COSMOS.blue, { fill: '#101d38', glow: 6, opacity: a }),
        txt(`Warp ${i}`, cx, -165, 28, COSMOS.blue, 'mono').opacity(a),

        glassCell(cx, 35, 174, 78, done ? COSMOS.gold : COSMOS.dim, {
          fill: done ? '#241c10' : '#0f1422',
          glow: done ? 9 : 2,
          opacity: a,
        }),
        txt(done ? `T${i}` : '·', cx, 35, 32, done ? COSMOS.gold : COSMOS.dim, 'mono').opacity(a),
      );
      if (done) {
        nodes.push(
          glowingArc([cx, -118], [cx, -12], 0, {
            color: COSMOS.gold,
            width: 3.4,
            opacity: 0.9 * a,
            core: false,
          }),
        );
      }
    }

    // Glowing violet block barrier beam
    nodes.push(
      line([-840, 165], [840, 165], { stroke: COSMOS.violet, width: 6 })
        .glow(12, COSMOS.violet)
        .opacity(a),
      txt('__syncthreads()  ·  WHOLE-BLOCK BARRIER', 0, 212, 28, COSMOS.violet, 'mono')
        .glow(7, COSMOS.violet)
        .opacity(a),

      // Warp 0 final reduction panel
      glassCell(0, 345, 1420, 108, COSMOS.emerald, {
        fill: '#0c2424',
        glow: 10,
        opacity: a,
      }),
      txt(
        'Warp 0 loads T0..T7 + pads lanes 8..31 with 0  →  final warp_sum()',
        0,
        345,
        30,
        COSMOS.emerald,
        'mono',
      )
        .glow(5, COSMOS.emerald)
        .opacity(a),
    );

    return group(...nodes);
  });

  // 3D helper silicon base slab inside warp3d
  warp3d.add(...siliconSlab3d(3.5, 2.2, -0.18, 0.16, '#0f172c', COSMOS.blue, '#4c6ca8', 0.52));

  s.add(bgAura, warp3d, part1, part2);
  runPhase(s, c, phase, 14);
  orbitScene(
    s,
    c,
    warp3d,
    { theta: 0.18, phi: 0.88 },
    {
      startOffset: 0.1,
      endMargin: Math.max(0.55, c.end - c.cue('full-warp-contract-step-3').start + 0.35),
    },
  );

  c.on('full-warp-contract-step-1', () => s.play(mode.to(0.2, { duration: 0.35 })));
  c.on('full-warp-contract-step-2', () => s.play(mode.to(1, { duration: 0.45 })));
  c.on('warp32-exit', () => s.play(mode.to(2, { duration: 0.4 })));
  c.on('warp32-upper', () => s.play(mode.to(3, { duration: 0.4 })));

  c.on('full-warp-contract-step-3', () => {
    swapViews(s, showWarp32, showBarrier, 0.16, 0.22);
  });
  c.hide('full-warp-contract-step-3', [warp3d], { fade: 0.18 });
  c.on('warp32-leaders', () =>
    s.play(leadersWritten.to(1, { duration: remainDuration(c, 'warp32-leaders', 0.9) })),
  );
}
