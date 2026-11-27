// Scene 06: How many partials survive each pass? 3-pass shrinking grid, 3D SM residency deadlock, atomic funnel.
import {
  COSMOS,
  GRID_HIERARCHY,
  aura,
  box3d,
  cinematic3d,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  points3d,
  remainDuration,
  runPhase,
  siliconSlab3d,
  swapViews,
  txt,
} from '../parts.mjs';

function buildSmDeadlock3d(phaseVal) {
  const view = cinematic3d({
    theta: -0.78,
    phi: 1.02,
    distance: 15.8,
    unit: 112,
    focus: [0, 0, 0.3],
  }).at(390, 25);

  // GPU silicon SM plane (4 resident slots)
  view.add(...siliconSlab3d(2.8, 1.5, 0.85, 0.16, '#1c1222', COSMOS.rose, '#7c334c', 0.62));
  // Hardware work queue slab underneath (4 queued blocks)
  view.add(...siliconSlab3d(2.8, 1.5, -1.05, 0.14, '#10172b', COSMOS.dim, '#38466b', 0.55));

  for (let i = 0; i < 4; i++) {
    const x = -2.0 + i * 1.33;
    // Resident stalled blocks B0..B3 on SM slots
    view.add(...box3d(x - 0.42, -0.5, 0.88, 0.84, 1.0, 0.58, '#3b1428', COSMOS.rose, 0.82));
    // Queued blocks B4..B7 waiting for a free SM slot
    view.add(...box3d(x - 0.42, -0.5, -1.02, 0.84, 1.0, 0.46, '#141e38', COSMOS.muted, 0.72));
  }

  const pulsePts = points3d(
    () => {
      const p = phaseVal.value;
      const zPulse = 1.6 + 0.18 * Math.sin(p * 4.5);
      return [-2.0, -0.67, 0.67, 2.0].map((x) => [x, 0, zPulse]);
    },
    { color: COSMOS.rose, radius: 6.5, glow: 13, blend: 'screen', onTop: true },
  );
  view.add(pulsePts);
  return view;
}

export default function gridReduction(s, c) {
  const phase = s.value(0);
  const showPasses = s.value(1);
  const pass1 = s.value(0);
  const pass2 = s.value(0);
  const pass3 = s.value(0);

  const showDeadlock = s.value(0);
  const deadlockStall = s.value(0);

  const showAtomics = s.value(0);
  const atomicContend = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa20', '#ff6b8b16');
  const deadlock3d = buildSmDeadlock3d(phase);

  // Beat 0: 3-pass shrinking pyramid
  const passesView = guardedDynamic(showPasses, (a) => {
    const q = [1, pass1.value, pass2.value, pass3.value];
    const xs = [-645, -215, 215, 645];
    const widths = [320, 290, 260, 240];
    const heights = [180, 146, 118, 102];
    const cols = [COSMOS.blue, COSMOS.cyan, COSMOS.gold, COSMOS.emerald];
    const subLabels = ['int32 inputs', 'int64 partials', 'int64 partials', 'int64 total'];

    const nodes = [
      heroTitle(['Multi-Pass', 'Grid Reduction'], {
        x: -855,
        y: -420,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.cyan,
        eyebrow: '256 THREADS × 2 LOADS = 512 INPUTS / BLOCK',
      }).opacity(a),
    ];

    GRID_HIERARCHY.forEach((count, i) => {
      const cx = xs[i];
      const vis = q[i];
      const col = cols[i];
      nodes.push(
        glassCell(cx, 30, widths[i], heights[i], vis > 0.5 ? col : COSMOS.dim, {
          fill: i === 3 && vis > 0.5 ? '#0d2824' : '#101a30',
          glow: vis > 0.5 ? 10 : 0,
          opacity: a,
        }),
        txt(
          vis > 0.5 ? count.toLocaleString('en-US') : '·',
          cx,
          16,
          i === 0 ? 40 : 46,
          vis > 0.5 ? col : COSMOS.dim,
          'mono',
        )
          .glow(vis > 0.5 ? 7 : 0, col)
          .opacity(a),
        txt(subLabels[i], cx, 66, 26, COSMOS.muted, 'mono').opacity(a),
      );

      if (i > 0 && vis > 0.04) {
        const x1 = xs[i - 1] + widths[i - 1] * 0.5 + 10;
        const x2 = cx - widths[i] * 0.5 - 10;
        nodes.push(
          glowingArc([x1, 30], [x2, 30], 0, {
            color: COSMOS.gold,
            width: 4,
            opacity: vis * a,
            core: false,
          }),
          txt('÷ 512', (x1 + x2) * 0.5, -24, 26, COSMOS.gold, 'mono').opacity(vis * a),
        );
      }
    });

    nodes.push(
      glassCell(0, 345, 1460, 88, COSMOS.cyan, { fill: '#0e1a2e', glow: 8, opacity: a }),
      txt(
        '3 same-stream kernel passes · int32 inputs widen to int64 partials',
        0,
        345,
        30,
        COSMOS.cyan,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  // Beat 1: Ordinary launch SM residency deadlock (paired with deadlock3d on right)
  const deadlockView = guardedDynamic(showDeadlock, (a) => {
    const st = deadlockStall.value;
    const nodes = [
      heroTitle(['Why Separate', 'Launches?'], {
        x: -855,
        y: -420,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.rose,
        eyebrow: '4 RESIDENT SM SLOTS · 8 LAUNCHED BLOCKS',
      }).opacity(a),

      txt('3D SM RESIDENCY vs HARDWARE QUEUE', 390, -395, 26, COSMOS.rose, 'mono')
        .glow(5, COSMOS.rose)
        .opacity(a),

      txt(
        'RESIDENT ON SM (STALLED AT BARRIER)',
        -855,
        -195,
        26,
        COSMOS.rose,
        'mono',
        'left',
      ).opacity(a),
      txt('WAITING IN QUEUE (CANNOT START)', -855, 65, 26, COSMOS.muted, 'mono', 'left').opacity(a),
    ];

    for (let i = 0; i < 4; i++) {
      const cx = -765 + i * 195;
      nodes.push(
        glassCell(cx, -100, 170, 108, COSMOS.rose, { fill: '#28101c', glow: 9, opacity: a }),
        txt(`Block ${i}`, cx, -120, 28, COSMOS.rose, 'mono').opacity(a),
        txt(st > 0.5 ? 'WAIT 8' : 'ACTIVE', cx, -74, 26, COSMOS.gold, 'mono').opacity(a),

        glassCell(cx, 155, 170, 108, COSMOS.dim, {
          fill: '#101524',
          dash: [7, 5],
          glow: 0,
          opacity: a,
        }),
        txt(`Block ${i + 4}`, cx, 135, 28, COSMOS.muted, 'mono').opacity(a),
        txt('QUEUED', cx, 181, 26, COSMOS.dim, 'mono').opacity(a),
      );
    }

    nodes.push(
      glassCell(-470, 355, 780, 118, COSMOS.rose, { fill: '#221019', glow: 9, opacity: a }),
      txt(
        st > 0.5
          ? 'CIRCULAR DEADLOCK: queued blocks never launch'
          : 'Grid barriers require a co-resident cooperative launch',
        -470,
        355,
        27,
        COSMOS.rose,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  // Beat 2: Atomic accumulation contention funnel
  const atomicsView = guardedDynamic(showAtomics, (a) => {
    const ct = atomicContend.value;
    const xs = [-630, -210, 210, 630];

    const nodes = [
      heroTitle(['Global Atomics:', 'Single-Address Funnel'], {
        x: -855,
        y: -420,
        size: 54,
        lineHeight: 64,
        accent: COSMOS.gold,
        eyebrow: 'CONTENTION · SIGNED vs UNSIGNED TYPES',
      }).opacity(a),
    ];

    xs.forEach((cx, i) => {
      nodes.push(
        glassCell(cx, -145, 240, 88, COSMOS.blue, { fill: '#101d38', glow: 6, opacity: a }),
        txt(`Block ${i} total`, cx, -145, 28, COSMOS.blue, 'mono').opacity(a),
        glowingArc([cx, -92], [0, 138], 55, {
          color: ct > 0.5 ? COSMOS.rose : COSMOS.gold,
          width: 4,
          opacity: 0.85 * a,
          core: false,
        }),
      );
    });

    nodes.push(
      glassCell(0, 200, 560, 118, ct > 0.5 ? COSMOS.rose : COSMOS.gold, {
        fill: ct > 0.5 ? '#2a111e' : '#241c10',
        glow: 12,
        opacity: a,
      }),
      txt('INITIALIZED GLOBAL OUTPUT', 0, 174, 26, COSMOS.muted, 'mono').opacity(a),
      txt(
        ct > 0.5 ? 'HOT ADDRESS · SERIALIZED UPDATES' : 'atomicAdd(&out, block_sum)',
        0,
        224,
        28,
        ct > 0.5 ? COSMOS.rose : COSMOS.gold,
        'mono',
      )
        .glow(6, ct > 0.5 ? COSMOS.rose : COSMOS.gold)
        .opacity(a),

      glassCell(0, 375, 1520, 82, COSMOS.cyan, { fill: '#0e1a2e', glow: 8, opacity: a }),
      txt(
        'Check 64-bit signed/unsigned support & overflow policy · measure full algorithms',
        0,
        375,
        28,
        COSMOS.cyan,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  s.add(bgAura, passesView, deadlockView, atomicsView);
  runPhase(s, c, phase, 14);

  c.on('grid-first-pass', () => s.play(pass1.to(1, { duration: 0.45 })));
  c.on('grid-second-pass', () => s.play(pass2.to(1, { duration: 0.45 })));
  c.on('grid-reduction-step-1', () => s.play(pass3.to(1, { duration: 0.45 })));

  c.show('grid-resident', deadlock3d, { lead: -0.22, fade: 0.22 });
  c.on('grid-resident', () => {
    swapViews(s, showPasses, showDeadlock, 0.16, 0.22);
    const dDur = Math.max(
      1.0,
      c.cue('grid-atomic-write').start - c.cue('grid-resident').start - 0.5,
    );
    s.play(deadlock3d.orbit({ theta: 0.16, phi: 0.9 }, { duration: dDur }));
  });
  c.on('grid-reduction-step-2', () => s.play(deadlockStall.to(1, { duration: 0.4 })));

  c.hide('grid-atomic-write', [deadlock3d], { fade: 0.18 });
  c.on('grid-atomic-write', () => {
    swapViews(s, showDeadlock, showAtomics, 0.16, 0.22);
  });
  c.on('grid-reduction-step-3', () =>
    s.play(atomicContend.to(1, { duration: remainDuration(c, 'grid-reduction-step-3', 0.45) })),
  );
}
