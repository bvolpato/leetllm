// Scene 12: Change the block size under the same rows.
// Alignments 64 -> 128 -> 256 on [64,192,32,128]: Token 7 moves 256 -> 384 -> 512; capacity 448 -> 640 -> 1024;
// useful work fixed at 20.94 GFLOPs vs padded 32.21 / 51.54 GFLOPs.
import {
  COSMOS,
  PACK_128,
  PACK_256,
  PACK_64,
  ROLE,
  aura,
  buildMoePackSlabs3d,
  counts,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  packSegments,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function packing(s, c) {
  const phase = s.value(0);
  // mode smoothly interpolates: 0 = unaligned, 1 = align 64, 2 = align 128, 3 = align 256
  const mode = s.value(0);
  const showFlops = s.value(0);

  const interpWidths = () => {
    const m = mode.value;
    const lerpArr = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
    if (m <= 1) return lerpArr(counts, PACK_64.padded, Math.max(0, m));
    if (m <= 2) return lerpArr(PACK_64.padded, PACK_128.padded, m - 1);
    return lerpArr(PACK_128.padded, PACK_256.padded, Math.min(1, m - 2));
  };
  const pinRow = () => {
    const w = interpWidths();
    return w[0] + w[1];
  };

  const bgAura = aura(445, 20, 520, '#5ce1e622', '#fb923c18');
  const { view: pack3d } = buildMoePackSlabs3d(counts, interpWidths, pinRow, 1024, phase, {
    x: 455,
    y: 15,
    unit: 92,
  });

  const title = heroTitle(['Change Block Size,', 'Keep Rows Fixed'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.warn,
    eyebrow: 'CONTIGUOUS PACKING · ALIGN 64 / 128 / 256',
    subtitle: '416 useful assignments stay constant while padding grows',
  });

  const live = guardedDynamic(1, () => {
    const m = mode.value;
    const widths = interpWidths();
    const segs = packSegments(counts, widths);
    const barLeft = -700;
    const pxPerRow = 660 / 1024;
    const toX = (row) => barLeft + row * pxPerRow;
    const rowY = (i) => -110 + i * 86;
    const barH = 38;

    const mSnap = Math.round(m);
    const snapWidths =
      mSnap >= 3
        ? PACK_256.padded
        : mSnap === 2
          ? PACK_128.padded
          : mSnap === 1
            ? PACK_64.padded
            : counts;
    const alignLabel = mSnap >= 3 ? 256 : mSnap === 2 ? 128 : mSnap === 1 ? 64 : 1;
    const capTotal = snapWidths[0] + snapWidths[1] + snapWidths[2] + snapWidths[3];
    const pinVal = snapWidths[0] + snapWidths[1];
    const paddedGflops =
      mSnap >= 3
        ? (PACK_256.paddedFlops / 1e9).toFixed(2)
        : mSnap === 2
          ? (PACK_128.paddedFlops / 1e9).toFixed(2)
          : (PACK_64.paddedFlops / 1e9).toFixed(2);

    const nodes = [
      txt('3D FIXED-RULER M-AXIS EXPANSION', 455, -415, 26, COSMOS.cyan, 'mono').glow(
        5,
        COSMOS.cyan,
      ),
      txt(
        `Active block size: ${alignLabel === 1 ? 'unaligned' : `${alignLabel} rows`}`,
        455,
        435,
        26,
        ROLE.gold,
        'mono',
      ),
      line([toX(0), -162], [toX(1024), -162], { stroke: COSMOS.dim, width: 2 }),
    ];

    for (const tick of [0, 256, 512, 768, 1024]) {
      const tx = toX(tick);
      nodes.push(
        line([tx, -170], [tx, -154], { stroke: COSMOS.dim, width: 2 }),
        txt(String(tick), tx, -194, 26, COSMOS.muted, 'mono'),
      );
    }

    for (let i = 0; i < 4; i++) {
      const seg = segs[i];
      const y = rowY(i);
      const sx = toX(seg.start);
      const uW = Math.max(2, seg.count * pxPerRow);
      const tW = Math.max(2, seg.width * pxPerRow);
      const pW = tW - uW;

      nodes.push(
        txt(`E${i}`, -845, y - 2, 26, COSMOS.ink, 'mono', 'left'),
        txt(`${seg.count}`, -782, y - 2, 26, ROLE.c, 'mono', 'left'),
        rect(uW, barH, { fill: '#104c63', stroke: ROLE.c, width: 2.0, radius: 4 }).at(
          sx + uW * 0.5,
          y,
        ),
      );
      if (pW > 2) {
        nodes.push(
          rect(pW, barH, {
            fill: '#2b1e10',
            stroke: ROLE.warn,
            width: 1.8,
            radius: 4,
            dash: [5, 4],
          }).at(sx + uW + pW * 0.5, y),
        );
      }
    }

    // Token 7 pin
    const px = toX(segs[2].start);
    const py = rowY(2);
    nodes.push(
      line([px, py - 26], [px, py + 28], { stroke: ROLE.gold, width: 4.5 }).glow(8, ROLE.gold),
    );

    // Metric strip
    nodes.push(
      glassCell(-665, 256, 360, 92, ROLE.gold, { fill: '#1f1a10', glow: 8 }),
      txt('TOKEN 7 OFFSET', -665, 236, 26, COSMOS.muted, 'mono'),
      txt(`row ${pinVal}`, -665, 276, 34, ROLE.gold, 'mono').glow(6, ROLE.gold),

      glassCell(-250, 256, 420, 92, ROLE.c, { fill: '#0d2130', glow: 8 }),
      txt('RESERVED CAPACITY', -250, 236, 26, COSMOS.muted, 'mono'),
      txt(`${capTotal} rows (416 useful)`, -250, 276, 26, ROLE.c, 'mono'),
    );

    if (showFlops.value > 0.05) {
      nodes.push(
        txt(
          `Useful: ${(PACK_128.usefulFlops / 1e9).toFixed(2)} GFLOPs (fixed)  ·  Full-pad model: ${paddedGflops} GFLOPs`,
          -860,
          368,
          26,
          ROLE.good,
          'mono',
          'left',
        ).opacity(showFlops.value),
      );
    } else {
      nodes.push(
        txt(
          'Align 64 -> 448   ·   Align 128 -> 640   ·   Align 256 -> 1,024',
          -860,
          368,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, pack3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, pack3d, { theta: -0.2, phi: 0.94 });

  c.on('dg-packing-0-0', () =>
    s.play(mode.to(0, { duration: remainDuration(c, 'dg-packing-0-0', 0.25) })),
  );
  c.on('dg-packing-0-1', () =>
    s.play(mode.to(1, { duration: remainDuration(c, 'dg-packing-0-1', 0.5) })),
  );
  c.on('dg-packing-0-2', () =>
    s.play(mode.to(1, { duration: remainDuration(c, 'dg-packing-0-2', 0.25) })),
  );

  c.on('dg-packing-1-0', () =>
    s.play(mode.to(2, { duration: remainDuration(c, 'dg-packing-1-0', 0.5) })),
  );
  c.on('dg-packing-1-1', () =>
    s.play(mode.to(2, { duration: remainDuration(c, 'dg-packing-1-1', 0.25) })),
  );
  c.on('dg-packing-1-2', () =>
    s.play(mode.to(2, { duration: remainDuration(c, 'dg-packing-1-2', 0.25) })),
  );

  c.on('dg-packing-2-0', () =>
    s.play(mode.to(3, { duration: remainDuration(c, 'dg-packing-2-0', 0.5) })),
  );
  c.on('dg-packing-2-1', () =>
    s.play(mode.to(3, { duration: remainDuration(c, 'dg-packing-2-1', 0.25) })),
  );
  c.on('dg-packing-2-2', () =>
    s.play(showFlops.to(1, { duration: remainDuration(c, 'dg-packing-2-2', 0.45) })),
  );
}
