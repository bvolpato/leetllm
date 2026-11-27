// Scene 09: Give a loaded value sixteen columns: 16x16 shared panel fan-out, 2-row warp band, 4 FLOP/B.
import {
  COSMOS,
  REG_16X16,
  ROLE,
  aura,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function hierarchy(s, c) {
  const fanOut = s.value(0);
  const showWarp = s.value(0);
  const showIntensity = s.value(0);

  const bgAura = aura(180, 10, 620, '#60a5fa1e', '#5ce1e618');
  const title = heroTitle(['Give One Word', 'Sixteen Columns'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.c,
    eyebrow: '16 × 16 SHARED BLOCK TILE',
  });

  const formula = glowTex('\\frac{8{,}192\\text{ FLOPs}}{2{,}048\\text{ B}} = 4\\text{ FLOP/B}', {
    x: -555,
    y: 280,
    size: 40,
    color: ROLE.good,
  });

  const live = guardedDynamic(1, () => {
    const fo = fanOut.value;
    const sw = showWarp.value;
    const si = showIntensity.value;
    const cell = 38;
    const gap = 5;
    const stride = cell + gap;
    const gx0 = 20;
    const gy0 = -250;
    const activeRow = 3;

    const nodes = [
      txt('16 × 16 OUTPUT TILE C (256 THREADS)', gx0 + 8 * stride, gy0 - 115, 26, ROLE.c, 'mono'),
    ];

    // Pink B row across top (16 entries)
    for (let col = 0; col < 16; col++) {
      const cx = gx0 + col * stride;
      nodes.push(
        rect(cell, 32, {
          fill: fo > 0.3 ? '#3b152a' : '#1b1020',
          stroke: ROLE.b,
          width: fo > 0.3 ? 2.2 : 1.2,
          radius: 5,
        })
          .at(cx, gy0 - 54)
          .opacity(0.92),
      );
    }

    // Blue A column down left (16 entries)
    for (let r = 0; r < 16; r++) {
      const cy = gy0 + r * stride;
      const isHero = r === activeRow && fo > 0.3;
      nodes.push(
        rect(32, cell, {
          fill: isHero ? '#1a427a' : '#101d35',
          stroke: isHero ? COSMOS.gold : ROLE.a,
          width: isHero ? 3.0 : 1.2,
          radius: 5,
        })
          .at(gx0 - 54, cy)
          .glow(isHero ? 10 : 0, COSMOS.gold),
      );
    }

    // 16x16 C grid
    for (let r = 0; r < 16; r++) {
      for (let col = 0; col < 16; col++) {
        const cx = gx0 + col * stride;
        const cy = gy0 + r * stride;
        const inFan = fo > 0.3 && r === activeRow;
        const inWarp = sw > 0.3 && (r === 0 || r === 1);
        const fill = inFan ? '#103c4d' : inWarp ? '#2c2410' : '#0b1424';
        const stroke = inFan ? ROLE.c : inWarp ? COSMOS.gold : '#233252';
        nodes.push(
          rect(cell, cell, { fill, stroke, width: inFan || inWarp ? 2.2 : 1.0, radius: 5 }).at(
            cx,
            cy,
          ),
        );
      }
    }

    // Warp highlight frame over rows 0..1 (32 threads = 1 warp)
    if (sw > 0.02) {
      const wBoxW = 16 * stride + 6;
      const wBoxH = 2 * stride + 4;
      nodes.push(
        rect(wBoxW, wBoxH, { fill: null, stroke: COSMOS.gold, width: 3.2, radius: 8 })
          .at(gx0 + 7.5 * stride, gy0 + 0.5 * stride)
          .glow(9, COSMOS.gold)
          .opacity(sw),
      );
    }

    // Left-side clean floating metrics (zero bullet cards)
    nodes.push(
      txt('PANEL REUSE', -855, -185, 26, COSMOS.muted, 'mono', 'left'),
      txt(
        fo > 0.3 ? '1 blue A word → 16 cyan C sums' : '16 × 16 shared A & B panels',
        -855,
        -132,
        30,
        ROLE.a,
        'sans',
        'left',
      ),
    );
    if (sw > 0.02) {
      nodes.push(
        txt('WARP FOOTPRINT', -855, -35, 26, COSMOS.muted, 'mono', 'left').opacity(sw),
        txt('32 lanes = 2 full rows (16 cols/row)', -855, 18, 30, COSMOS.gold, 'sans', 'left')
          .glow(5, COSMOS.gold)
          .opacity(sw),
        txt(
          'Sums stay in registers across all panels',
          -855,
          66,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(sw),
      );
    }
    if (si > 0.02) {
      nodes.push(
        txt(
          `${REG_16X16.flops} FLOPs / ${REG_16X16.bytes} B = ${REG_16X16.ratio.toFixed(0)} FLOP/B`,
          -855,
          172,
          30,
          ROLE.good,
          'mono',
          'left',
        )
          .glow(6, ROLE.good)
          .opacity(si),
        txt(
          'Larger tiles raise reuse, but SMEM caps occupancy',
          -855,
          400,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(si),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('fan-sixteen', () =>
    s.play(fanOut.to(1, { duration: remainDuration(c, 'fan-sixteen', 0.45) })),
  );
  c.on('one-warp', () => s.play(showWarp.to(1, { duration: remainDuration(c, 'one-warp', 0.45) })));
  c.on('block-bytes', () => {
    const dur = remainDuration(c, 'block-bytes', 0.5);
    s.play(showIntensity.to(1, { duration: dur }));
  });
  c.show('block-bytes', [formula]);
}
