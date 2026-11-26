// Scene 21: Timing the full GPU operation. Harness event brackets, 12 useful bytes/elem, revised build at 512 -> 513 boundary.
import {
  COSMOS,
  GRID_N,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  swapViews,
  txt,
} from '../parts.mjs';

const USEFUL_BYTES_SCAN = 12 * GRID_N; // 50,331,648

export default function benchmarkEvidence(s, c) {
  const phase = s.value(0);

  const showHarness = s.value(1);
  const showEvents = s.value(0);

  const showBytes = s.value(0);
  const showDramNote = s.value(0);

  const showBuild = s.value(0);
  const showTile513 = s.value(0);

  const bgAura = aura(0, 15, 620, '#5ce1e61e', '#ffd16616');

  // Beat 0: Benchmark harness composition (Allocate -> 5 warmups -> 30 timed invocations)
  const harnessView = guardedDynamic(showHarness, (a) => {
    const p = phase.value;
    const ev = showEvents.value;
    const u = (p * 0.9) % 1;

    const nodes = [
      heroTitle(['Timing the Full', 'GPU Operation'], {
        x: -855,
        y: -420,
        size: 54,
        lineHeight: 64,
        accent: COSMOS.cyan,
        eyebrow: `${GRID_N.toLocaleString('en-US')} INPUTS · FULL END-TO-END INVOCATIONS`,
      }).opacity(a),

      // Stage 1: Allocate & upload (outside timer)
      glassCell(-570, -70, 440, 128, COSMOS.dim, {
        fill: '#101524',
        dash: [7, 5],
        glow: 0,
        opacity: a,
      }),
      txt('1. ALLOCATE & UPLOAD', -570, -94, 26, COSMOS.muted, 'mono').opacity(a),
      txt('Excluded from CUDA events', -570, -44, 26, COSMOS.dim, 'sans').opacity(a),

      // Stage 2: 5 warmups (outside timer)
      glassCell(-40, -70, 400, 128, COSMOS.blue, { fill: '#101d38', glow: 6, opacity: a }),
      txt('2. 5 WARMUPS', -40, -94, 28, COSMOS.blue, 'mono').opacity(a),
      txt('Stabilize clocks & caches', -40, -44, 26, COSMOS.muted, 'sans').opacity(a),

      // Stage 3: 30 full invocations (TIMED!)
      glassCell(515, -70, 520, 128, COSMOS.cyan, { fill: '#0e2436', glow: 12, opacity: a }),
      txt('3. 30 FULL INVOCATIONS', 515, -94, 28, COSMOS.cyan, 'mono')
        .glow(6, COSMOS.cyan)
        .opacity(a),
      txt('Bracketed by CUDA events', 515, -44, 26, COSMOS.ink, 'sans').opacity(a),

      glowingArc([-335, -70], [-255, -70], 0, {
        color: COSMOS.blue,
        width: 3.5,
        opacity: a,
        core: false,
      }),
      glowingArc([175, -70], [240, -70], 0, {
        color: COSMOS.cyan,
        width: 4,
        opacity: a,
        core: false,
      }),
    ];

    // CUDA event timing bracket under Stage 3
    if (ev > 0.02) {
      const bx1 = 265;
      const bx2 = 765;
      const by = 45;
      nodes.push(
        line([bx1, by - 16], [bx1, by + 16], { stroke: COSMOS.gold, width: 4 }).opacity(ev * a),
        line([bx2, by - 16], [bx2, by + 16], { stroke: COSMOS.gold, width: 4 }).opacity(ev * a),
        line([bx1, by], [bx1 + (bx2 - bx1) * ev, by], { stroke: COSMOS.gold, width: 6 })
          .glow(10, COSMOS.gold)
          .opacity(ev * a),
        glowDot(bx1 + u * (bx2 - bx1), by, { radius: 7, color: COSMOS.gold, opacity: ev * a }),
        txt('cudaEventElapsedTime()', 515, 96, 28, COSMOS.gold, 'mono').opacity(ev * a),
      );
    }

    nodes.push(
      glassCell(-415, 225, 760, 120, COSMOS.blue, { fill: '#101b32', glow: 6, opacity: a }),
      txt('REDUCTION TIMING INCLUDES', -415, 198, 26, COSMOS.blue, 'mono').opacity(a),
      txt('All passes + final D2D scalar copy', -415, 248, 28, COSMOS.ink, 'sans').opacity(a),

      glassCell(415, 225, 760, 120, COSMOS.cyan, { fill: '#0e2032', glow: 6, opacity: a }),
      txt('SCAN TIMING INCLUDES', 415, 198, 26, COSMOS.cyan, 'mono').opacity(a),
      txt('Recursive block-total calls + offset passes', 415, 248, 28, COSMOS.ink, 'sans').opacity(
        a,
      ),

      txt(
        'CUDA lab runs int32→int64 reduction & scan; argmax & softmax run in CPU model',
        0,
        388,
        27,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  // Beat 1: Logical useful bytes (4 B read + 8 B write = 12 B/elem) vs DRAM traffic
  const bytesView = guardedDynamic(showBytes, (a) => {
    const drm = showDramNote.value;
    const nodes = [
      heroTitle(['Logical Byte Rate', 'vs Physical DRAM'], {
        x: -855,
        y: -420,
        size: 54,
        lineHeight: 64,
        accent: COSMOS.gold,
        eyebrow: 'SCAN: 4 B READ + 8 B WRITE = 12 USEFUL BYTES / ELEMENT',
      }).opacity(a),

      txt('READ int32 (4 B)', -845, -135, 28, COSMOS.blue, 'mono', 'left').opacity(a),
      txt('WRITE int64 (8 B)', -845, 55, 28, COSMOS.cyan, 'mono', 'left').opacity(a),
    ];

    for (let j = 0; j < 4; j++) {
      const cx = -470 + j * 108;
      nodes.push(
        rect(86, 86, { fill: '#13284d', stroke: COSMOS.blue, width: 2.5, radius: 8 })
          .at(cx, -135)
          .glow(7, COSMOS.blue)
          .opacity(a),
        txt(`R${j}`, cx, -135, 28, COSMOS.blue, 'mono').opacity(a),
      );
    }
    for (let j = 0; j < 8; j++) {
      const cx = -470 + j * 108;
      nodes.push(
        rect(86, 86, { fill: '#0f2c3c', stroke: COSMOS.cyan, width: 2.5, radius: 8 })
          .at(cx, 55)
          .glow(7, COSMOS.cyan)
          .opacity(a),
        txt(`W${j}`, cx, 55, 28, COSMOS.cyan, 'mono').opacity(a),
      );
    }

    nodes.push(
      txt('Reduction useful = 4N', 845, -135, 27, COSMOS.blue, 'mono', 'right').opacity(a),
      txt('Scan useful = 12N', 845, 55, 27, COSMOS.cyan, 'mono', 'right').opacity(a),

      glassCell(0, 225, 1340, 96, COSMOS.gold, { fill: '#1e1910', glow: 10, opacity: a }),
      txt(
        `12 × ${GRID_N.toLocaleString('en-US')} = ${USEFUL_BYTES_SCAN.toLocaleString('en-US')} useful bytes`,
        0,
        225,
        36,
        COSMOS.gold,
        'mono',
      )
        .glow(6, COSMOS.gold)
        .opacity(a),

      glassCell(0, 368, 1560, 82, drm > 0.5 ? COSMOS.rose : COSMOS.cyan, {
        fill: '#101829',
        glow: 8,
        opacity: a,
      }),
      txt(
        'Warm buffers change DRAM hits while useful bytes stay fixed · record source, GPU, compiler & cache policy',
        0,
        368,
        26,
        drm > 0.5 ? COSMOS.rose : COSMOS.cyan,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  // Beat 2: Older build vs Revised build at 512 -> 513 tile boundary
  const buildView = guardedDynamic(showBuild, (a) => {
    const t513 = showTile513.value > 0.5;
    const count = t513 ? 513 : 512;

    const nodes = [
      heroTitle(['Bind Evidence to', 'Exact Source Build'], {
        x: -855,
        y: -420,
        size: 54,
        lineHeight: 64,
        accent: COSMOS.gold,
        eyebrow: 'TEST TILE, WARP & RECURSION BOUNDARIES FIRST',
      }).opacity(a),

      // Older build row (clearly separated)
      glassCell(-430, -145, 580, 108, COSMOS.dim, {
        fill: '#101524',
        dash: [7, 5],
        glow: 0,
        opacity: a,
      }),
      txt('OLDER BUILD', -430, -145, 34, COSMOS.muted, 'mono').opacity(a),

      glowingArc([-125, -145], [85, -145], 0, {
        color: COSMOS.dim,
        width: 3.5,
        opacity: a,
        core: false,
      }),

      glassCell(430, -145, 660, 108, COSMOS.dim, {
        fill: '#101524',
        dash: [7, 5],
        glow: 0,
        opacity: a,
      }),
      txt('Historical saved GPU timings', 430, -145, 30, COSMOS.muted, 'sans').opacity(a),

      // Revised build row tested at 512 vs 513 inputs
      glassCell(-510, 130, 480, 174, COSMOS.gold, { fill: '#221a10', glow: 10, opacity: a }),
      txt('REVISED BUILD', -510, 82, 26, COSMOS.gold, 'mono').opacity(a),
      txt(`${count} inputs`, -510, 152, 54, COSMOS.ink, 'mono').glow(6, COSMOS.gold).opacity(a),

      glassCell(110, 130, 420, 174, COSMOS.cyan, { fill: '#0e2234', glow: 9, opacity: a }),
      txt('TILE 0', 110, 82, 28, COSMOS.cyan, 'mono').opacity(a),
      txt('512 inputs', 110, 152, 42, COSMOS.ink, 'mono').opacity(a),
    ];

    if (t513) {
      nodes.push(
        glassCell(585, 130, 400, 174, COSMOS.emerald, { fill: '#0d2824', glow: 11, opacity: a }),
        txt('TILE 1 (EDGE!)', 585, 82, 28, COSMOS.emerald, 'mono')
          .glow(6, COSMOS.emerald)
          .opacity(a),
        txt('1 single value', 585, 152, 40, COSMOS.emerald, 'mono').opacity(a),
      );
    }

    nodes.push(
      glassCell(0, 368, 1540, 82, COSMOS.emerald, { fill: '#0c2422', glow: 8, opacity: a }),
      txt(
        'Verify reference + compute-sanitizer at warp, tile (512→513) & recursion edges, then time target GPU',
        0,
        368,
        27,
        COSMOS.emerald,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  s.add(bgAura, harnessView, bytesView, buildView);
  runPhase(s, c, phase, 14);

  c.on('benchmark-evidence-step-1', () => s.play(showHarness.to(1, { duration: 0.3 })));
  c.on('benchmark-event', () => s.play(showEvents.to(1, { duration: 0.6 })));

  c.on('benchmark-useful', () => swapViews(s, showHarness, showBytes, 0.16, 0.22));
  c.on('benchmark-evidence-step-2', () => s.play(showDramNote.to(1, { duration: 0.45 })));

  c.on('benchmark-evidence-step-3', () => swapViews(s, showBytes, showBuild, 0.16, 0.22));
  c.on('benchmark-current', () =>
    s.play(showTile513.to(1, { duration: remainDuration(c, 'benchmark-current', 0.45) })),
  );
}
