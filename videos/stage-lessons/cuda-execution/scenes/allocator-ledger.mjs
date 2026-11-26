// Scene 17: Which memory can the allocator give back? 11 GiB block ledger, empty_cache() release, and idle GPU utilization trap.
import {
  COSMOS,
  aura,
  cachedBlockRelease,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  rule,
  runPhase,
  txt,
} from '../parts.mjs';

export default function allocatorLedger(s, c) {
  const phase = s.value(0);
  const showCounts = s.value(0);
  const releaseProg = s.value(0);
  const idleProg = s.value(0);

  const bgAura = aura(0, 20, 560, '#60a5fa20', '#ffd16614');

  const title = heroTitle(['Allocated, Reserved,', 'and Driver Memory'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.blue,
    eyebrow: 'PYTORCH CACHING ALLOCATOR · nvidia-smi · empty_cache()',
  });

  const live = guardedDynamic(1, () => {
    const rel = releaseProg.value;
    const idl = idleProg.value;
    const sc = showCounts.value;
    const acc = cachedBlockRelease(Math.min(1, Math.max(0, rel)));

    const nodes = [
      txt('11 GiB VRAM LEDGER · 1 BLOCK = 1 GiB', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),
    ];

    for (let i = 0; i < 11; i++) {
      const cx = -750 + i * 150;
      const isLive = i < 8;
      const isCached = i >= 8 && i < 10;
      const motion = isCached ? acc.blocks[i - 8].motion : 0;
      const cy = isCached ? -40 - motion * 120 : -40;
      const op = isCached && idl > 0.1 ? 0 : isCached ? Math.max(0.25, 1 - motion * 0.65) : 1;
      const col = isLive ? COSMOS.blue : isCached ? COSMOS.gold : COSMOS.violet;

      if (op > 0.05) {
        nodes.push(
          glassCell(cx, cy, 134, 152, col, {
            fill: isLive ? '#101d38' : isCached ? '#241e12' : '#1b1432',
            glow: isCached && motion > 0.05 ? 10 : 6,
            dash: isCached ? [8, 5] : undefined,
            opacity: op,
          }),
          txt(
            isLive ? `live ${i}` : isCached ? `free ${i - 8}` : 'ctx',
            cx,
            cy - 10,
            26,
            col,
            'mono',
          ).opacity(op),
          txt(
            isCached && motion > 0.85 ? 'freed' : '1 GiB',
            cx,
            cy + 34,
            26,
            isCached && motion > 0.85 ? COSMOS.gold : COSMOS.muted,
            'mono',
          ).opacity(op),
        );
      }
    }

    // Three counter readouts
    const counters = [
      { label: 'ALLOCATED (LIVE)', val: `${acc.allocated} GiB`, color: COSMOS.blue, x: -550 },
      { label: 'RESERVED (POOL)', val: `${acc.reserved} GiB`, color: COSMOS.gold, x: 0 },
      { label: 'MODELED DRIVER', val: `${acc.modeledDriver} GiB`, color: COSMOS.violet, x: 550 },
    ];
    counters.forEach((cnt) => {
      nodes.push(
        glassCell(cnt.x, 145, 480, 124, sc > 0.5 ? cnt.color : COSMOS.rule, {
          fill: '#0e1628',
          glow: sc > 0.5 ? 8 : 0,
        }),
        txt(cnt.label, cnt.x, 114, 26, COSMOS.muted, 'mono'),
        txt(sc > 0.5 ? cnt.val : '? GiB', cnt.x, 168, 42, cnt.color, 'mono').glow(7, cnt.color),
      );
    });

    // Bottom section: either empty_cache status or Beat 2 GPU compute idle trace
    if (idl > 0.05) {
      const barX0 = -740;
      const barW = 1480;
      const burst = Math.max(0, Math.min(1, (idl - 0.65) / 0.3));
      nodes.push(
        txt(
          'MEMORY STAYS AT 9 GiB WHILE GPU COMPUTE WAITS FOR CPU BATCH',
          -855,
          275,
          26,
          COSMOS.cyan,
          'mono',
          'left',
        ).opacity(idl),
        rule(barX0, 345, barX0 + barW, 345, '#253252', 18).opacity(idl),
      );
      if (burst > 0.02) {
        const bw = 260 * burst;
        nodes.push(
          rect(bw, 26, { fill: COSMOS.emerald, stroke: null, radius: 5 })
            .at(barX0 + 1040 + bw * 0.5, 345)
            .glow(10, COSMOS.emerald)
            .opacity(idl),
        );
      }
      nodes.push(
        txt(
          'GPU compute idle waiting on CPU -> short compute burst',
          0,
          405,
          30,
          burst > 0.1 ? COSMOS.emerald : COSMOS.gold,
          'mono',
        ).opacity(idl),
      );
    } else {
      nodes.push(
        txt(
          rel > 0.5
            ? 'empty_cache() returns unused cache only · live tensors stay allocated'
            : '8 live + 2 cached = 10 reserved · +1 GiB CUDA context outside pool = 11 GiB driver',
          0,
          355,
          28,
          rel > 0.5 ? COSMOS.gold : COSMOS.muted,
          'sans',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('allocator-counts', () => s.play(showCounts.to(1, { duration: 0.45 })));
  c.on('allocator-return', () => s.play(releaseProg.to(1, { duration: 1.0 })));
  c.on('allocator-idle', () =>
    s.play(idleProg.to(1, { duration: remainDuration(c, 'allocator-idle', 1.6) })),
  );
}
