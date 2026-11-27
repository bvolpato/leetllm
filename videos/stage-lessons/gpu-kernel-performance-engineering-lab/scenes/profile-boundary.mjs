// Scene 08: Ask whether the profile measures this kernel
// Beat 0: Launch selector (--launch-skip 6, --launch-count 1 -> launch 7) + replay warning.
// Beat 1: 3D Nsight Compute Speed-of-Light / Roofline manifold + LaunchStats/MemoryWorkloadAnalysis/Occupancy lenses + 4/32 prediction.
// Beat 2: Actual ERR_NVGPUCTRPERM permission block with 4 empty counter gauges.
import {
  COSMOS,
  ROLE,
  aura,
  buildRooflineSol3d,
  delay,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  par,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function profileBoundary(s, c) {
  const phase = s.value(0);
  const showLaunch = s.value(1);
  const showLenses = s.value(0);
  const showPerm = s.value(0);

  const targetGlow = s.value(0);
  const skipShow = s.value(0);
  const selectShow = s.value(0);
  const replayShow = s.value(0);

  const launchLens = s.value(0);
  const memLens = s.value(0);
  const occLens = s.value(0);
  const predShow = s.value(0);
  const wrongShow = s.value(0);

  const errShow = s.value(0);
  const noneShow = s.value(0);
  const unestShow = s.value(0);

  const bgAura = aura(430, 20, 560, '#5ce1e61e', '#ff6b8b16');
  const { view: sol3d } = buildRooflineSol3d(phase, { x: 445, y: 20, unit: 96 });

  const title = heroTitle(['Does the Profile Measure', 'This Exact Kernel?'], {
    x: -855,
    y: -415,
    size: 50,
    lineHeight: 60,
    accent: ROLE.output,
    eyebrow: 'NSIGHT COMPUTE · LAUNCH SELECTION',
  });

  // Beat 0: Launch stream selector (1 check + 5 warmups skipped -> launch 7 captured)
  const launchView = guardedDynamic(showLaunch, (a) => {
    const tg = targetGlow.value;
    const sk = skipShow.value;
    const sl = selectShow.value;
    const rp = replayShow.value;

    const nodes = [
      glassCell(0, -170, 1460, 96, tg > 0.3 ? ROLE.input : COSMOS.rule, {
        fill: '#0f1c36',
        glow: tg > 0.3 ? 8 : 3,
        opacity: a,
      }),
      txt(
        'transpose_naive · N = 4096 · block 32 × 8 · matching source',
        0,
        -170,
        32,
        ROLE.input,
        'mono',
      ).opacity(a),
    ];

    for (let i = 0; i < 9; i++) {
      const cx = -720 + i * 180;
      const isSkip = i < 6;
      const isPicked = i === 6;
      const col = isPicked
        ? sl > 0.3
          ? ROLE.good
          : ROLE.output
        : isSkip
          ? sk > 0.3
            ? ROLE.warn
            : COSMOS.rule
          : COSMOS.rule;
      nodes.push(
        glassCell(cx, 20, 148, 140, col, {
          fill: isPicked && sl > 0.3 ? '#0e2c26' : '#0d1528',
          glow: isPicked && sl > 0.3 ? 11 : 2,
          dash: isSkip && sk > 0.3 ? [6, 5] : undefined,
          opacity: a,
        }),
        txt(
          i === 0 ? 'check' : i < 6 ? 'warm' : 'timed',
          cx,
          -12,
          26,
          isSkip ? COSMOS.muted : ROLE.output,
          'mono',
        ).opacity(a),
        txt(`#${i + 1}`, cx, 42, 32, isPicked ? ROLE.good : COSMOS.ink, 'mono').opacity(a),
      );
    }

    nodes.push(
      txt(
        sk > 0.3 ? '--launch-skip 6 (1 check + 5 warmups)' : 'Skip preflight + warmups',
        -270,
        155,
        28,
        ROLE.warn,
        'mono',
      ).opacity(a),
      txt(
        sl > 0.3 ? '--launch-count 1 → capture launch #7' : 'Select one measured launch',
        450,
        155,
        28,
        ROLE.good,
        'mono',
      ).opacity(a),
      txt(
        rp > 0.3
          ? 'Full metric sets replay passes and distort latency · keep unprofiled timing separate'
          : 'Changing warmup count requires changing --launch-skip',
        0,
        310,
        28,
        rp > 0.3 ? ROLE.bad : COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Beat 1: Nsight Compute report lenses + 3D Speed-of-Light Roofline manifold
  const lensesView = guardedDynamic(showLenses, (a) => {
    const ll = launchLens.value;
    const ml = memLens.value;
    const ol = occLens.value;
    const pr = predShow.value;
    const wr = wrongShow.value;

    const items = [
      {
        name: 'LaunchStats',
        sub: 'grid, 32×8 block, resources',
        lit: ll,
        col: ROLE.input,
        y: -140,
      },
      {
        name: 'MemoryWorkload + SOL',
        sub: 'sectors, cache, DRAM ceilings',
        lit: ml,
        col: ROLE.output,
        y: -10,
      },
      { name: 'Occupancy', sub: 'resident warps & limiters', lit: ol, col: ROLE.good, y: 120 },
    ];

    const nodes = [
      txt('3D SPEED-OF-LIGHT / ROOFLINE MANIFOLD', 445, -405, 26, COSMOS.cyan, 'mono')
        .glow(5, COSMOS.cyan)
        .opacity(a),
      txt(
        'Memory-bandwidth ramp meets compute ceiling',
        445,
        420,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    ];

    items.forEach((it) => {
      nodes.push(
        glassCell(-480, it.y, 740, 102, it.lit > 0.3 ? it.col : COSMOS.rule, {
          fill: it.lit > 0.3 ? '#0e1d36' : '#0b101d',
          glow: it.lit > 0.3 ? 9 : 2,
          opacity: a,
        }),
        txt(it.name, -820, it.y - 18, 30, it.col, 'mono', 'left').opacity(a),
        txt(it.sub, -820, it.y + 24, 26, COSMOS.muted, 'sans', 'left').opacity(a),
      );
    });

    nodes.push(
      txt(
        pr > 0.3
          ? 'Prediction: 4 load sectors · 32 store sectors / warp'
          : 'Predict access counters before editing code',
        -480,
        246,
        28,
        ROLE.gold,
        'mono',
      )
        .glow(6, ROLE.gold)
        .opacity(a),
      txt(
        wr > 0.3
          ? 'Verify source, kernel, shape, and launch match'
          : 'Bind every counter back to the exact launch',
        -480,
        332,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Beat 2: Actual permission failure (ERR_NVGPUCTRPERM) + 4 empty counter slots
  const permView = guardedDynamic(showPerm, (a) => {
    const er = errShow.value;
    const nn = noneShow.value;
    const un = unestShow.value;

    const nodes = [
      glassCell(0, -120, 1460, 180, er > 0.3 ? ROLE.bad : COSMOS.rule, {
        fill: '#2e101d',
        glow: er > 0.3 ? 12 : 4,
        opacity: a,
      }),
      txt(
        er > 0.3 ? 'ERR_NVGPUCTRPERM' : 'COUNTER COLLECTION ATTEMPTED',
        0,
        -152,
        46,
        ROLE.bad,
        'mono',
      )
        .glow(8, ROLE.bad)
        .opacity(a),
      txt(
        er > 0.3
          ? 'Account can run CUDA kernels, but lacks GPU performance-counter permission'
          : 'Awaiting Nsight Compute output',
        0,
        -76,
        28,
        COSMOS.ink,
        'sans',
      ).opacity(a),
    ];

    const fields = ['Load sectors', 'Store sectors', 'Physical bytes', 'Achieved occ.'];
    fields.forEach((lbl, i) => {
      const cx = -570 + i * 380;
      nodes.push(
        glassCell(cx, 110, 340, 140, nn > 0.3 ? ROLE.warn : COSMOS.rule, {
          fill: '#0e1526',
          dash: [8, 6],
          glow: 3,
          opacity: a,
        }),
        txt(lbl, cx, 76, 26, COSMOS.muted, 'mono').opacity(a),
        txt(nn > 0.3 ? 'empty' : '...', cx, 134, 34, ROLE.warn, 'mono').opacity(a),
      );
    });

    nodes.push(
      txt(
        un > 0.3
          ? 'With counter access, trace extra store sectors'
          : 'Address model holds · bottleneck awaits counters',
        0,
        320,
        30,
        ROLE.gold,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, launchView, lensesView, permView);
  runPhase(s, c, phase, 16);

  const beat1Start = c.beats[1].start;
  const beat2Start = c.beats[2].start;
  orbitScene(
    s,
    c,
    sol3d,
    { theta: -0.2, phi: 0.9 },
    {
      startOffset: Math.max(0.1, beat1Start - c.start + 0.25),
      endMargin: Math.max(0.55, c.end - beat2Start + 0.35),
    },
  );

  c.on('gpu-profile-boundary-target', () =>
    s.play(targetGlow.to(1, { duration: remainDuration(c, 'gpu-profile-boundary-target', 0.45) })),
  );
  c.on('gpu-profile-boundary-skip', () =>
    s.play(skipShow.to(1, { duration: remainDuration(c, 'gpu-profile-boundary-skip', 0.45) })),
  );
  c.on('gpu-profile-boundary-select', () =>
    s.play(selectShow.to(1, { duration: remainDuration(c, 'gpu-profile-boundary-select', 0.45) })),
  );
  c.on('gpu-profile-boundary-replay', () =>
    s.play(replayShow.to(1, { duration: remainDuration(c, 'gpu-profile-boundary-replay', 0.45) })),
  );

  c.onBeat(1, () => {
    s.play(
      par(showLaunch.to(0, { duration: 0.18 }), delay(showLenses.to(1, { duration: 0.24 }), 0.22)),
    );
  });
  c.show(1, [sol3d], { fade: 0.24, lead: -0.22 });
  c.on('gpu-profile-boundary-launch', () =>
    s.play(launchLens.to(1, { duration: remainDuration(c, 'gpu-profile-boundary-launch', 0.4) })),
  );
  c.on('gpu-profile-boundary-memory', () =>
    s.play(memLens.to(1, { duration: remainDuration(c, 'gpu-profile-boundary-memory', 0.4) })),
  );
  c.on('gpu-profile-boundary-occupancy', () =>
    s.play(occLens.to(1, { duration: remainDuration(c, 'gpu-profile-boundary-occupancy', 0.4) })),
  );
  c.after('gpu-profile-boundary-predictions', () =>
    s.play(
      predShow.to(1, { duration: remainAfterDuration(c, 'gpu-profile-boundary-predictions', 0.4) }),
    ),
  );
  c.on('gpu-profile-boundary-wrong', () =>
    s.play(wrongShow.to(1, { duration: remainDuration(c, 'gpu-profile-boundary-wrong', 0.4) })),
  );

  c.onBeat(2, () => {
    s.play(
      par(showLenses.to(0, { duration: 0.18 }), delay(showPerm.to(1, { duration: 0.24 }), 0.22)),
    );
  });
  c.hide(2, [sol3d], { fade: 0.18 });
  c.on('gpu-profile-boundary-error', () =>
    s.play(errShow.to(1, { duration: remainDuration(c, 'gpu-profile-boundary-error', 0.4) })),
  );
  c.on('gpu-profile-boundary-none', () =>
    s.play(noneShow.to(1, { duration: remainDuration(c, 'gpu-profile-boundary-none', 0.4) })),
  );
  c.on('gpu-profile-boundary-unestablished', () =>
    s.play(
      unestShow.to(1, { duration: remainDuration(c, 'gpu-profile-boundary-unestablished', 0.45) }),
    ),
  );
}
