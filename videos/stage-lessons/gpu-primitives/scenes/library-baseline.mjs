// Scene 20: What would fusion save? CUB Device vs Block collectives, temp-storage lifecycle, fused compaction register win.
import {
  ARTICLE_INPUT,
  COSMOS,
  KEEP_ADDR,
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
  signed,
  swapViews,
  txt,
} from '../parts.mjs';

const PLAY_2 = signed(ARTICLE_INPUT[2]); // "+4"
const SLOT_2 = KEEP_ADDR[2]; // 1

export default function libraryBaseline(s, c) {
  const phase = s.value(0);

  const showScope = s.value(1);
  const highlightBlock = s.value(0);
  const showWiden = s.value(0);

  const showStorage = s.value(0);
  const scratchAlive = s.value(0);
  const showReuse = s.value(0);

  const showFusion = s.value(0);
  const showFusedPath = s.value(0);
  const showMatchNote = s.value(0);

  const bgAura = aura(0, 15, 620, '#60a5fa20', '#5ce1e618');

  // Beat 0: Device vs Block CUB collectives + int32 -> int64 widening
  const scopeView = guardedDynamic(showScope, (a) => {
    const p = phase.value;
    const blk = highlightBlock.value;
    const wid = showWiden.value;
    const u = (p * 0.85) % 1;

    const nodes = [
      heroTitle(['Start With CUB:', 'Device vs Block'], {
        x: -855,
        y: -420,
        size: 54,
        lineHeight: 64,
        accent: COSMOS.cyan,
        eyebrow: 'BASELINE LIBRARY · EXPLICIT WIDENING',
      }).opacity(a),

      // Top row: DeviceReduce/DeviceScan vs BlockReduce/BlockScan
      glassCell(-430, -110, 720, 168, COSMOS.blue, { fill: '#101d38', glow: 8, opacity: a }),
      txt('cub::DeviceReduce / DeviceScan', -430, -140, 34, COSMOS.blue, 'mono').opacity(a),
      txt('Standalone whole-array primitive baseline', -430, -76, 27, COSMOS.ink, 'sans').opacity(
        a,
      ),

      glassCell(430, -110, 720, 168, blk > 0.5 ? COSMOS.cyan : COSMOS.dim, {
        fill: blk > 0.5 ? '#0e2234' : '#101728',
        glow: blk > 0.5 ? 11 : 4,
        opacity: a,
      }),
      txt('cub::BlockReduce / BlockScan', 430, -140, 34, COSMOS.cyan, 'mono').opacity(a),
      txt(
        'Tile cooperation inside a fused custom kernel',
        430,
        -76,
        27,
        COSMOS.ink,
        'sans',
      ).opacity(a),

      // Bottom row: int32 -> int64 explicit widening
      glassCell(-535, 185, 450, 118, COSMOS.blue, { fill: '#101d38', glow: 7, opacity: a }),
      txt('int32 loaded input', -535, 185, 32, COSMOS.blue, 'mono').opacity(a),

      glowingArc([-295, 185], [105, 185], 0, {
        color: COSMOS.gold,
        width: 4.5,
        opacity: a,
        core: false,
      }),
      txt('widen BEFORE add', -95, 134, 26, COSMOS.gold, 'mono').opacity(a),
      glowDot(-295 + u * 400, 185, { radius: 7, color: COSMOS.gold, opacity: a }),

      glassCell(480, 185, 700, 118, wid > 0.5 ? COSMOS.emerald : COSMOS.gold, {
        fill: wid > 0.5 ? '#0d2624' : '#241c10',
        glow: wid > 0.5 ? 11 : 7,
        opacity: a,
      }),
      txt(
        wid > 0.5 ? 'int64 first add (no 32-bit overflow)' : '64-bit accumulator',
        480,
        185,
        27,
        wid > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ).opacity(a),

      txt(
        'Match output types, element order & numerical policy before timing any custom kernel',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    ];

    return group(...nodes);
  });

  // Beat 1: Explicit temp-storage lifecycle timeline
  const storageView = guardedDynamic(showStorage, (a) => {
    const alv = scratchAlive.value;
    const reu = showReuse.value;
    const steps = ['1. Query bytes', '2. Allocate', '3. Launch async', '4. Stream sync'];
    const xs = [-630, -210, 210, 630];

    const nodes = [
      heroTitle(['Temporary Scratch', 'Storage Lifetime'], {
        x: -855,
        y: -420,
        size: 54,
        lineHeight: 64,
        accent: COSMOS.cyan,
        eyebrow: 'EXPLICIT SCRATCH · THRUST TRANSFORM ITERATOR (CCCL 3)',
      }).opacity(a),
    ];

    steps.forEach((lbl, i) => {
      const done = i === 3 && alv > 0.5;
      const col = done ? COSMOS.emerald : COSMOS.blue;
      nodes.push(
        glassCell(xs[i], -125, 340, 102, col, {
          fill: done ? '#0d2624' : '#101d38',
          glow: 8,
          opacity: a,
        }),
        txt(lbl, xs[i], -125, 30, col, 'mono').opacity(a),
      );
      if (i > 0) {
        nodes.push(
          glowingArc([xs[i - 1] + 180, -125], [xs[i] - 180, -125], 0, {
            color: COSMOS.cyan,
            width: 3.6,
            opacity: a,
            core: false,
          }),
        );
      }
    });

    // Lifetime residency span bar from Allocate -> Stream complete
    const spanStart = xs[1] - 110;
    const spanMaxW = xs[3] + 150 - spanStart;
    const curW = spanMaxW * (0.45 + 0.55 * alv);
    nodes.push(
      line([xs[0] - 140, 45], [xs[3] + 160, 45], { stroke: '#2c3b60', width: 3 }).opacity(a),
      rect(curW, 74, { fill: '#0f2c3c', stroke: COSMOS.cyan, width: 3, radius: 10 })
        .at(spanStart + curW * 0.5, 118)
        .glow(10, COSMOS.cyan)
        .opacity(a),
      txt(
        'SCRATCH BUFFER MUST STAY ALIVE UNTIL STREAM FINISHES',
        spanStart + spanMaxW * 0.5,
        204,
        26,
        COSMOS.cyan,
        'mono',
      ).opacity(a),

      glassCell(0, 345, 1540, 92, reu > 0.5 ? COSMOS.gold : COSMOS.cyan, {
        fill: '#101829',
        glow: 9,
        opacity: a,
      }),
      txt(
        'Reuse scratch outside measured repetitions · widen int32 via thrust::make_transform_iterator',
        0,
        345,
        27,
        reu > 0.5 ? COSMOS.gold : COSMOS.cyan,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  // Beat 2: Kernel fusion savings (HBM roundtrip vs register)
  const fusionView = guardedDynamic(showFusion, (a) => {
    const p = phase.value;
    const fus = showFusedPath.value;
    const mtc = showMatchNote.value;
    const u = (p * 0.9) % 1;

    const nodes = [
      heroTitle(['What Kernel', 'Fusion Saves'], {
        x: -855,
        y: -420,
        size: 54,
        lineHeight: 64,
        accent: COSMOS.emerald,
        eyebrow: 'PACKING POSITIVE PLAYS · ELIMINATE HBM ROUNDTRIP',
      }).opacity(a),
    ];

    const drawPipeline = (y, label, midSub, col, alphaRow) => {
      nodes.push(
        txt(label, -845, y, 30, col, 'mono', 'left').opacity(alphaRow),
        glassCell(-360, y, 270, 94, col, { fill: '#101c34', glow: 7, opacity: alphaRow }),
        txt('Scan flags', -360, y, 30, col, 'mono').opacity(alphaRow),

        glowingArc([-215, y], [-105, y], 0, {
          color: col,
          width: 4,
          opacity: alphaRow,
          core: false,
        }),
        glowDot(-215 + u * 110, y, { radius: 6.5, color: col, opacity: alphaRow }),

        glassCell(75, y, 360, 94, col, { fill: '#142038', glow: 9, opacity: alphaRow }),
        txt(`Dest: slot ${SLOT_2}`, 75, y, 30, col, 'mono').opacity(alphaRow),
        txt(midSub, 75, y + 76, 26, col, 'sans').opacity(alphaRow),

        glowingArc([255, y], [365, y], 0, { color: col, width: 4, opacity: alphaRow, core: false }),
        glowDot(255 + u * 110, y, { radius: 6.5, color: col, opacity: alphaRow }),

        glassCell(580, y, 410, 94, col, { fill: '#0e242a', glow: 9, opacity: alphaRow }),
        txt(`out[${SLOT_2}] = ${PLAY_2}`, 580, y, 34, col, 'mono').opacity(alphaRow),
      );
    };

    drawPipeline(-125, 'CUB SCAN + PACK', 'Write slot 1 to HBM, then reread it', COSMOS.rose, a);
    if (fus > 0.02) {
      drawPipeline(
        135,
        'FUSED KERNEL',
        'Keep slot 1 in lane register → saves 1 HBM write + 1 read',
        COSMOS.emerald,
        fus * a,
      );
    }

    nodes.push(
      glassCell(0, 368, 1560, 82, mtc > 0.5 ? COSMOS.gold : COSMOS.cyan, {
        fill: '#101829',
        glow: 8,
        opacity: a,
      }),
      txt(
        'Time fused kernel against CUB scan + same packing step · match types, outputs & determinism',
        0,
        368,
        27,
        mtc > 0.5 ? COSMOS.gold : COSMOS.cyan,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  s.add(bgAura, scopeView, storageView, fusionView);
  runPhase(s, c, phase, 14);

  c.on('library-block', () => s.play(highlightBlock.to(1, { duration: 0.4 })));
  c.on('library-baseline-step-1', () => s.play(showWiden.to(1, { duration: 0.45 })));

  c.on('library-finish', () => {
    swapViews(s, showScope, showStorage, 0.16, 0.22);
    s.play(scratchAlive.to(1, { duration: 0.65 }));
  });
  c.on('library-baseline-step-2', () => s.play(showReuse.to(1, { duration: 0.4 })));

  c.on('library-fused', () => {
    swapViews(s, showStorage, showFusion, 0.16, 0.22);
    s.play(showFusedPath.to(1, { duration: 0.55 }));
  });
  c.on('library-baseline-step-3', () =>
    s.play(showMatchNote.to(1, { duration: remainDuration(c, 'library-baseline-step-3', 0.45) })),
  );
}
