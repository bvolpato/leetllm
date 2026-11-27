// Scene 04: Where do neighboring lanes land? Strided 16x16 (33 sectors) -> Coalesced 32x8 (9 sectors) + Row/Col layout check.
import { delay, par } from 'vizmatic/stage';
import {
  A,
  COSMOS,
  ROLE,
  WARP_COALESCED,
  WARP_STRIDED,
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

export default function addresses(s, c) {
  const showWarp = s.value(1);
  const stridedFocus = s.value(0);
  const coalesced = s.value(0);
  const showSectors = s.value(0);
  const showTotal = s.value(0);
  const showLayout = s.value(0);

  const bgAura = aura(0, 0, 620, '#5ce1e61e', '#ff6b8b16');
  const title = heroTitle(['Where Do Neighboring', 'Lanes Land?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'WARP COALESCING · 32-BYTE SECTORS',
  });

  const stridedTotal = WARP_STRIDED.sectors.reduce((acc, v) => acc + v, 0); // 33
  const coalTotal = WARP_COALESCED.sectors.reduce((acc, v) => acc + v, 0); // 9
  const flatSix = A.flat(); // [1, 2, 0, -1, 3, 2]

  const warpView = guardedDynamic(showWarp, (a) => {
    const co = coalesced.value > 0.5;
    const ss = showSectors.value;
    const st = showTotal.value;
    const active = co ? WARP_COALESCED : WARP_STRIDED;

    const nodes = [
      txt(
        co ? '32 × 8 BLOCK · threadIdx.x → COLUMN' : '16 × 16 BLOCK · threadIdx.x → ROW',
        -855,
        -195,
        28,
        co ? ROLE.good : ROLE.warn,
        'mono',
        'left',
      )
        .glow(5, co ? ROLE.good : ROLE.warn)
        .opacity(a),
    ];

    // Lane-to-address trace for sample lanes [0, 1, 2, 16, 31]
    const sampleLanes = [0, 1, 2, 16, 31];
    nodes.push(
      txt('LANE', -800, -120, 26, COSMOS.muted, 'mono').opacity(a),
      txt('A BYTE', -620, -120, 26, ROLE.a, 'mono').opacity(a),
      txt('B BYTE', -420, -120, 26, ROLE.b, 'mono').opacity(a),
      txt('C BYTE', -220, -120, 26, ROLE.c, 'mono').opacity(a),
    );
    sampleLanes.forEach((lane, idx) => {
      const y = -58 + idx * 66;
      const rec = active.lanes[lane];
      const highlight = stridedFocus.value > 0.3 && (lane === 0 || lane === 1 || lane === 16);
      const col = co ? ROLE.good : highlight ? COSMOS.gold : COSMOS.ink;
      nodes.push(
        txt(`L${lane}`, -800, y, 28, col, 'mono').opacity(a),
        txt(`${rec.a} B`, -620, y, 28, co ? ROLE.good : ROLE.a, 'mono').opacity(a),
        txt(`${rec.b} B`, -420, y, 28, ROLE.b, 'mono').opacity(a),
        txt(`${rec.c} B`, -220, y, 28, ROLE.c, 'mono').opacity(a),
      );
    });

    // Right side: Visual 32-byte sector bars (A, B, C) + B 4x8 sector ribbon
    const barBaseX = 110;
    const labels = [
      {
        key: 'A load',
        sVal: WARP_STRIDED.sectors[0],
        cVal: WARP_COALESCED.sectors[0],
        col: ROLE.a,
      },
      {
        key: 'B load',
        sVal: WARP_STRIDED.sectors[1],
        cVal: WARP_COALESCED.sectors[1],
        col: ROLE.b,
      },
      {
        key: 'C store',
        sVal: WARP_STRIDED.sectors[2],
        cVal: WARP_COALESCED.sectors[2],
        col: ROLE.c,
      },
    ];
    nodes.push(
      txt('DISTINCT 32-BYTE SECTORS PER WARP', 475, -245, 26, COSMOS.cyan, 'mono').opacity(a),
    );

    labels.forEach((item, idx) => {
      const y = -155 + idx * 96;
      const val = co ? item.cVal : item.sVal;
      const maxW = 540;
      const w = Math.max(36, (val / 16) * maxW);
      nodes.push(
        txt(item.key, barBaseX - 18, y, 28, item.col, 'mono', 'right').opacity(a),
        rect(w, 46, { fill: item.col, stroke: null, radius: 8 })
          .at(barBaseX + w * 0.5, y)
          .opacity(0.84 * a)
          .glow(8, item.col),
        txt(`${val} sec`, barBaseX + w + 24, y, 28, COSMOS.ink, 'mono', 'left').opacity(a),
      );
    });

    // Four contiguous 8-float sectors of B when coalesced
    if (co && ss > 0.02) {
      nodes.push(
        txt(
          '32 CONTIGUOUS FLOATS IN B = 4 × (8 FLOATS / 32B SECTOR)',
          440,
          148,
          26,
          ROLE.b,
          'mono',
        ).opacity(ss * a),
      );
      for (let g = 0; g < 4; g++) {
        const gx = 165 + g * 186;
        nodes.push(
          glassCell(gx, 222, 168, 76, ROLE.b, { fill: '#271222', glow: 8, opacity: ss * a }),
          txt(`Sec ${g} (8f)`, gx, 222, 26, COSMOS.ink, 'mono').opacity(ss * a),
        );
      }
    }

    if (st > 0.02) {
      nodes.push(
        txt(
          `COALESCED: ${coalTotal} SECTORS  vs  STRIDED: ${stridedTotal} SECTORS`,
          0,
          388,
          34,
          ROLE.good,
          'mono',
        )
          .glow(7, ROLE.good)
          .opacity(st * a),
      );
    }

    return group(...nodes);
  });

  // Beat 4: Same 6 words in linear memory read row-major vs col-major -> top-middle flips 2 -> 3!
  const layoutView = guardedDynamic(showLayout, (a) => {
    const nodes = [
      txt('STORAGE ORDER CHECK · SAME 6 WORDS IN MEMORY', 0, -215, 28, COSMOS.gold, 'mono').opacity(
        a,
      ),
    ];
    for (let i = 0; i < 6; i++) {
      const lx = -450 + i * 180;
      const isFlipped = i === 1 || i === 4;
      nodes.push(
        txt(`idx ${i}`, lx, -158, 26, COSMOS.muted, 'mono').opacity(a),
        glassCell(lx, -86, 148, 86, isFlipped ? COSMOS.gold : ROLE.c, {
          fill: isFlipped ? '#292212' : '#101d34',
          glow: isFlipped ? 10 : 5,
          opacity: a,
        }),
        txt(String(flatSix[i]), lx, -86, 38, isFlipped ? COSMOS.gold : COSMOS.ink, 'mono').opacity(
          a,
        ),
      );
    }

    // Row-major 2x3 interpretation
    nodes.push(txt('ROW-MAJOR (2 × 3)', -420, 62, 28, ROLE.a, 'mono').opacity(a));
    for (let r = 0; r < 2; r++) {
      for (let col = 0; col < 3; col++) {
        const val = flatSix[r * 3 + col];
        const cx = -550 + col * 130;
        const cy = 148 + r * 105;
        const topMid = r === 0 && col === 1;
        nodes.push(
          glassCell(cx, cy, 112, 86, topMid ? ROLE.good : ROLE.a, {
            fill: topMid ? '#0f2b27' : '#101d38',
            glow: topMid ? 10 : 4,
            opacity: a,
          }),
          txt(String(val), cx, cy, 38, topMid ? ROLE.good : COSMOS.ink, 'mono').opacity(a),
        );
      }
    }

    // Column-major 2x3 interpretation
    nodes.push(txt('COLUMN-MAJOR (2 × 3)', 420, 62, 28, ROLE.b, 'mono').opacity(a));
    for (let r = 0; r < 2; r++) {
      for (let col = 0; col < 3; col++) {
        const val = flatSix[col * 2 + r];
        const cx = 290 + col * 130;
        const cy = 148 + r * 105;
        const topMid = r === 0 && col === 1;
        nodes.push(
          glassCell(cx, cy, 112, 86, topMid ? ROLE.bad : ROLE.b, {
            fill: topMid ? '#301222' : '#231120',
            glow: topMid ? 10 : 4,
            opacity: a,
          }),
          txt(String(val), cx, cy, 38, topMid ? ROLE.bad : COSMOS.ink, 'mono').opacity(a),
        );
      }
    }

    nodes.push(
      glowingArc([-420, 102], [420, 102], -60, {
        color: COSMOS.gold,
        width: 3.4,
        opacity: 0.85 * a,
      }),
      txt(
        'Top-middle entry flips 2 → 3 without moving a single byte',
        0,
        388,
        30,
        COSMOS.gold,
        'mono',
      )
        .glow(6, COSMOS.gold)
        .opacity(a),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, warpView, layoutView);

  c.on('strided-warp', () =>
    s.play(stridedFocus.to(1, { duration: remainDuration(c, 'strided-warp', 0.4) })),
  );
  c.on('remap-warp', () =>
    s.play(coalesced.to(1, { duration: remainDuration(c, 'remap-warp', 0.5) })),
  );
  c.on('four-sectors', () =>
    s.play(showSectors.to(1, { duration: remainDuration(c, 'four-sectors', 0.45) })),
  );
  c.on('total-sectors', () =>
    s.play(showTotal.to(1, { duration: remainDuration(c, 'total-sectors', 0.45) })),
  );
  c.on('layout-words', () => {
    s.play(
      par(showWarp.to(0, { duration: 0.2 }), delay(showLayout.to(1, { duration: 0.25 }), 0.22)),
    );
  });
}
