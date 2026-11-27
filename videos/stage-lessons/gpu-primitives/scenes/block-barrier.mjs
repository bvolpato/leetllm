// Scene 05: When can the reader add the partials? Shared-memory block barrier vs cross-block global stream handoff.
import {
  COSMOS,
  REDUCTION,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  txt,
} from '../parts.mjs';

const PARTIALS = REDUCTION.at(-2); // [7, 4]
const TOTAL = REDUCTION.at(-1)[0]; // 11

export default function blockBarrier(s, c) {
  const write0 = s.value(0);
  const askWait = s.value(0);
  const write1 = s.value(0);
  const barrierDone = s.value(0);
  const readerPull = s.value(0);
  const showTotal = s.value(0);
  const gridMode = s.value(0);
  const gridCombine = s.value(0);

  const bgAura = aura(0, 20, 580, '#5ce1e620', '#a78bfa18');

  const live = guardedDynamic(1, () => {
    const w0 = write0.value;
    const w1 = write1.value;
    const bar = barrierDone.value;
    const rd = readerPull.value;
    const tot = showTotal.value;
    const grd = gridMode.value > 0.5;
    const gcb = gridCombine.value;
    const yRows = [-95, 130];
    const xProd = -620;
    const xMem = -55;
    const xBar = 245;
    const xRead = 610;

    const effectiveW0 = grd ? 1 : w0;
    const effectiveW1 = grd ? 1 : w1;
    const effectiveReady = grd ? gcb > 0.5 : bar > 0.5;
    const effectiveRead = grd ? gcb : rd;
    const effectiveTotal = grd ? gcb > 0.5 : tot > 0.5;

    const nodes = [
      heroTitle(grd ? ['Cross-Block', 'Stream Handoff'] : ['Shared-Memory', 'Block Barrier'], {
        x: -855,
        y: -420,
        size: 54,
        lineHeight: 64,
        accent: grd ? COSMOS.cyan : COSMOS.violet,
        eyebrow: grd ? 'GLOBAL MEMORY · SAME-STREAM LAUNCH' : 'INTRA-BLOCK SYNC · __syncthreads()',
      }),

      // Column headers
      txt(grd ? 'BLOCK TOTALS' : 'WARP LEADERS', xProd, -220, 26, COSMOS.blue, 'mono'),
      txt(grd ? 'GLOBAL MEMORY' : 'SHARED MEMORY', xMem, -220, 26, COSMOS.cyan, 'mono'),
      txt(grd ? 'LATER KERNEL' : 'READER WARP', xRead, -220, 26, COSMOS.emerald, 'mono'),
    ];

    PARTIALS.forEach((val, i) => {
      const y = yRows[i];
      const written = i === 0 ? effectiveW0 : effectiveW1;
      const slotReady = written >= 0.95;

      // Producer box
      nodes.push(
        glassCell(xProd, y, 310, 114, COSMOS.blue, { fill: '#101d38', glow: 7 }),
        txt(`${grd ? 'Block' : 'Leader'} ${i}`, xProd, y - 24, 26, COSMOS.muted, 'mono'),
        txt(String(val), xProd, y + 22, 42, COSMOS.blue, 'mono').glow(6, COSMOS.blue),
      );

      // Write conduit producer -> memory slot
      nodes.push(
        glowingArc([xProd + 168, y], [xMem - 168, y], 0, {
          color: slotReady ? COSMOS.cyan : COSMOS.gold,
          width: 4,
          opacity: 0.25 + 0.7 * written,
          core: false,
        }),
      );
      if (written > 0.04 && written < 0.98) {
        const px = xProd + 168 + written * (xMem - 168 - (xProd + 168));
        nodes.push(glowDot(px, y, { radius: 8, color: COSMOS.gold }));
      }

      // Memory slot box
      nodes.push(
        glassCell(xMem, y, 300, 114, slotReady ? COSMOS.cyan : COSMOS.dim, {
          fill: slotReady ? '#0e2234' : '#0f1422',
          dash: slotReady ? undefined : [7, 5],
          glow: slotReady ? 9 : 0,
        }),
        txt(`slot ${i}`, xMem, y - 24, 26, COSMOS.muted, 'mono'),
        txt(
          slotReady ? String(val) : 'empty',
          xMem,
          y + 22,
          slotReady ? 42 : 30,
          slotReady ? COSMOS.cyan : COSMOS.dim,
          'mono',
        ),
      );

      // Read conduit memory -> reader (only once barrier / launch releases!)
      if (effectiveRead > 0.04) {
        nodes.push(
          glowingArc([xMem + 166, y], [xRead - 168, 18], i === 0 ? -18 : 18, {
            color: COSMOS.emerald,
            width: 4,
            opacity: 0.9 * effectiveRead,
            core: false,
          }),
        );
      }
    });

    // Vertical barrier wall between memory and reader
    const wallCol = grd ? COSMOS.cyan : effectiveReady ? COSMOS.emerald : COSMOS.violet;
    nodes.push(
      line([xBar, -175], [xBar, 225], {
        stroke: wallCol,
        width: effectiveReady ? 3 : 6,
        dash: effectiveReady ? [10, 8] : undefined,
      }).glow(10, wallCol),
      txt(
        grd ? 'STREAM BOUNDARY' : effectiveReady ? 'BARRIER RELEASED' : '__syncthreads()',
        xBar,
        268,
        26,
        wallCol,
        'mono',
      ).glow(5, wallCol),
    );

    // Reader / combiner box
    nodes.push(
      glassCell(xRead, 18, 300, 174, effectiveTotal ? COSMOS.emerald : COSMOS.dim, {
        fill: effectiveTotal ? '#0d2624' : '#101524',
        glow: effectiveTotal ? 12 : 3,
      }),
      txt(grd ? 'GRID TOTAL' : 'COMBINED SUM', xRead, -30, 26, COSMOS.muted, 'mono'),
      txt(
        effectiveTotal ? String(TOTAL) : '?',
        xRead,
        36,
        74,
        effectiveTotal ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ).glow(10, effectiveTotal ? COSMOS.emerald : COSMOS.gold),
    );

    // Bottom teaching banner (prediction-safe!)
    const bannerCol = effectiveTotal ? COSMOS.emerald : effectiveReady ? COSMOS.cyan : COSMOS.gold;
    const bannerMsg = grd
      ? effectiveTotal
        ? 'Same stream orders blocks before combine'
        : 'Each block owns separate shared memory · publish block totals to global memory'
      : effectiveTotal
        ? '7 + 4 = 11   ·   Place __syncthreads() outside leader-only branches'
        : effectiveReady
          ? 'All threads arrived at barrier · both shared slots now visible to reader'
          : askWait.value > 0.5
            ? 'Slot 1 still unwritten in register · Can the reader use both slots yet?'
            : 'Leader 0 publishes 7 into shared slot 0';

    nodes.push(
      glassCell(0, 392, 1540, 82, bannerCol, { fill: '#101829', glow: 8 }),
      txt(bannerMsg, 0, 392, 28, bannerCol, 'sans'),
    );

    return group(...nodes);
  });

  s.add(bgAura, live);

  c.on('handoff-seven', () => s.play(write0.to(1, { duration: 0.65 })));
  c.on('handoff-wait', () => s.play(askWait.to(1, { duration: 0.35 })));
  c.on('handoff-four', () => s.play(write1.to(1, { duration: 0.55 })));
  c.after('handoff-arrive', () => s.play(barrierDone.to(1, { duration: 0.4 })));
  c.on('handoff-read', () => s.play(readerPull.to(1, { duration: 0.5 })));
  c.after('handoff-total', () => s.play(showTotal.to(1, { duration: 0.4 })));
  c.on('handoff-grid', () => s.play(gridMode.to(1, { duration: 0.4 })));
  c.after('handoff-combine', () =>
    s.play(gridCombine.to(1, { duration: remainDuration(c, 'handoff-combine', 0.45) })),
  );
}
