// Scene 18: Choose the owner of an actual data movement or layout: CUDA C++, Triton, CuTe/CUTLASS, CUDA Tile 13.3+, Pallas, Neuron NKI.
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function controlSurfaces(s, c) {
  // focus: 0=cuda/triton, 1=cute, 2=cuda-tile, 3=tile-13.3, 4=pallas, 5=nki-move, 6=nki-store
  const focus = s.value(0);

  const bgAura = aura(0, 20, 640, '#60a5fa1c', '#a78bfa18');
  const title = heroTitle(['Choose Who Owns', 'Layout & Movement'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.host,
    eyebrow: 'KERNEL LANGUAGES · CONTROL SURFACES',
  });

  const live = guardedDynamic(1, () => {
    const fc = Math.round(focus.value);

    const nodes = [];

    // Left: 4x4 16-value tensor grid showing ownership models (CUDA -> CuTe 4 yellow groups -> CUDA Tile)
    const gx0 = -730;
    const gy0 = -155;
    const cell = 78;
    const gap = 10;
    const stride = cell + gap;

    nodes.push(
      txt(
        fc === 0
          ? 'CUDA C++ (per-thread) vs TRITON (block)'
          : fc === 1
            ? 'CuTe / CUTLASS: 4 HIERARCHICAL GROUPS'
            : fc <= 3
              ? 'CUDA TILE (immutable 4×4, pow-2)'
              : 'PALLAS GRID: PROGRAM 0 → TOP-LEFT',
        -595,
        -222,
        26,
        fc === 1 ? COSMOS.gold : fc <= 3 ? ROLE.ir : ROLE.triton,
        'mono',
      ),
    );

    for (let r = 0; r < 4; r++) {
      for (let col = 0; col < 4; col++) {
        const cx = gx0 + col * stride;
        const cy = gy0 + r * stride;
        const val = r * 4 + col;
        const topLeft = r < 2 && col < 2;
        const groupColor =
          fc === 1
            ? COSMOS.gold
            : fc >= 4 && topLeft
              ? ROLE.triton
              : fc === 2 || fc === 3
                ? ROLE.cubin
                : ROLE.host;
        const disp = fc === 2 || fc === 3 ? val + 1 : val;
        nodes.push(
          rect(cell, cell, {
            fill: fc >= 4 && topLeft ? '#271947' : '#101d36',
            stroke: groupColor,
            width: fc === 1 || (fc >= 4 && topLeft) ? 2.8 : 1.8,
            radius: 8,
          })
            .at(cx, cy)
            .glow(fc === 1 || (fc >= 4 && topLeft) ? 7 : 0, groupColor),
          txt(String(disp), cx, cy, 30, COSMOS.ink, 'mono'),
        );
      }
    }

    // CuTe 2x2 quadrant frames when fc === 1
    if (fc === 1) {
      for (let qr = 0; qr < 2; qr++) {
        for (let qc = 0; qc < 2; qc++) {
          nodes.push(
            rect(2 * stride - 2, 2 * stride - 2, {
              fill: null,
              stroke: COSMOS.gold,
              width: 3.2,
              radius: 10,
            })
              .at(gx0 + (qc * 2 + 0.5) * stride, gy0 + (qr * 2 + 0.5) * stride)
              .glow(8, COSMOS.gold),
          );
        }
      }
    }

    // Right top: Language spectrum strip (clean floating nodes connected by spectrum bar)
    const langs = [
      { name: 'CUDA C++', sub: 'threads & sync', x: -110, col: ROLE.host, on: fc === 0 },
      { name: 'CuTe/CUTLASS', sub: 'layouts & MMA', x: 185, col: COSMOS.gold, on: fc === 1 },
      { name: 'CUDA Tile', sub: 'CUDA 13.3+ pow2', x: 480, col: ROLE.ir, on: fc === 2 || fc === 3 },
      { name: 'Pallas / JAX', sub: 'grids & specs', x: 755, col: ROLE.triton, on: fc === 4 },
    ];
    for (const lg of langs) {
      nodes.push(
        glassCell(lg.x, -125, 258, 122, lg.on ? lg.col : COSMOS.dim, {
          fill: lg.on ? '#142038' : '#0b101d',
          glow: lg.on ? 10 : 0,
        }),
        txt(lg.name, lg.x, -150, 26, lg.on ? lg.col : COSMOS.muted, 'mono'),
        txt(lg.sub, lg.x, -100, 26, COSMOS.ink, 'sans'),
      );
    }

    // Right bottom: AWS Neuron NKI explicit HBM -> SBUF -> +1 -> HBM data movement
    const nkiOn = fc >= 5;
    const nkiStored = fc >= 6;
    nodes.push(
      txt(
        'AWS NEURON NKI · EXPLICIT DATA MOVEMENT',
        320,
        12,
        26,
        nkiOn ? ROLE.cubin : COSMOS.muted,
        'mono',
      ),
      glassCell(-90, 130, 240, 118, nkiOn ? ROLE.host : COSMOS.dim, {
        fill: '#101f3b',
        glow: nkiOn ? 7 : 0,
      }),
      txt('HBM IN', -90, 102, 26, ROLE.host, 'mono'),
      txt('[1, 2, 3, 4]', -90, 152, 26, COSMOS.ink, 'mono'),

      glassCell(320, 130, 360, 118, nkiOn ? COSMOS.gold : COSMOS.dim, {
        fill: '#241e11',
        glow: nkiOn ? 10 : 0,
      }),
      txt('SBUF + ENGINE', 320, 102, 26, COSMOS.gold, 'mono'),
      txt('+1 → 2 becomes 3', 320, 152, 26, COSMOS.gold, 'mono'),

      glassCell(730, 130, 240, 118, nkiStored ? ROLE.cubin : COSMOS.dim, {
        fill: '#0d2924',
        glow: nkiStored ? 10 : 0,
      }),
      txt('HBM OUT', 730, 102, 26, ROLE.cubin, 'mono'),
      txt(
        nkiStored ? '[2, 3, 4, 5]' : 'waiting...',
        730,
        152,
        26,
        nkiStored ? ROLE.cubin : COSMOS.dim,
        'mono',
      ),

      glowingArc([34, 130], [136, 130], -18, {
        color: COSMOS.gold,
        width: 3.4,
        opacity: nkiOn ? 0.9 : 0.3,
      }),
      glowingArc([504, 130], [606, 130], -18, {
        color: ROLE.cubin,
        width: 3.4,
        opacity: nkiStored ? 0.95 : 0.3,
      }),
    );

    nodes.push(
      txt(
        'Start with tuned libraries · drop down only when you need control over layout or movement',
        0,
        378,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('thread-addresses', () => s.play(focus.to(0, { duration: 0.35 })));
  c.on('cute-layout', () => s.play(focus.to(1, { duration: 0.4 })));
  c.on('tile-collective', () => s.play(focus.to(2, { duration: 0.4 })));
  c.on('tile-version', () => s.play(focus.to(3, { duration: 0.35 })));
  c.on('pallas-grid', () => s.play(focus.to(4, { duration: 0.4 })));
  c.on('neuron-move', () => s.play(focus.to(5, { duration: 0.4 })));
  c.on('neuron-store', () => s.play(focus.to(6, { duration: 0.4 })));
}
