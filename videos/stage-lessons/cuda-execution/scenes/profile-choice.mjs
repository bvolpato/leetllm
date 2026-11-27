// Scene 21: Where would you look first? Nsight Systems vs Nsight Compute, correctness + Compute Sanitizer, and APOD one-variable layout test.
import { delay, par } from 'vizmatic/stage';
import {
  COALESCED_REQ,
  COSMOS,
  STRIDED_REQ,
  TOKEN_VALUES,
  afterDuration,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  rule,
  txt,
} from '../parts.mjs';

export default function profileChoice(s, c) {
  const showPart1 = s.value(1); // Beat 0: Nsight Systems timeline -> zoom kernel for Nsight Compute
  const zoomKernel = s.value(0);

  const showPart2 = s.value(0); // Beat 1: Correctness check (21 vs 22) + Compute Sanitizer
  const showBug = s.value(0);

  const showPart3 = s.value(0); // Beats 2 & 3: One-variable layout change (strided vs packed) with prediction withholding
  const packedProg = s.value(0);
  const segTraceProg = s.value(0);
  const footprintAnswer = s.value(0);

  const bgAura = aura(0, 20, 560, '#5ce1e622', '#ffd16616');

  const title = heroTitle(['Nsight Systems, Compute,', 'and Correctness First'], {
    x: -855,
    y: -415,
    size: 50,
    lineHeight: 60,
    accent: COSMOS.gold,
    eyebrow: 'APOD WORKFLOW · ASSESS · PARALLELIZE · OPTIMIZE · DEPLOY',
  });

  // Part 1: Host/copy/kernel step timeline (nsys) -> kernel focus (ncu)
  const part1 = guardedDynamic(showPart1, (a) => {
    const zk = zoomKernel.value;
    const x0 = -500;
    const px = 80; // 16 units -> 1280 px
    const sx = (t) => x0 + t * px;

    const lanes = [
      { label: 'CPU prepare', start: 0, end: 6, y: -90, col: COSMOS.blue },
      { label: 'GPU copy', start: 6, end: 9, y: 45, col: COSMOS.cyan },
      { label: 'GPU kernel', start: 9, end: 16, y: 180, col: COSMOS.gold },
    ];

    const nodes = [
      txt(
        'NSIGHT SYSTEMS: FULL STEP TIMELINE (HOST · COPIES · STREAMS)',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
    ];

    lanes.forEach((ln) => {
      const w = (ln.end - ln.start) * px;
      nodes.push(
        txt(ln.label, -855, ln.y + 4, 30, ln.col, 'sans', 'left').opacity(a),
        rule(sx(0), ln.y, sx(16), ln.y, COSMOS.rule, 2).opacity(a),
        rect(w, 46, { fill: ln.col, stroke: null, radius: 6 })
          .at(sx(ln.start) + w * 0.5, ln.y)
          .glow(8, ln.col)
          .opacity(0.92 * a),
      );
    });

    for (let t = 0; t <= 16; t += 4) {
      nodes.push(txt(`${t}`, sx(t), 265, 26, COSMOS.muted, 'mono').opacity(a));
    }

    if (zk > 0.05) {
      const kw = (16 - 9) * px + 28;
      nodes.push(
        glassCell(sx(12.5), 180, kw, 102, COSMOS.gold, {
          fill: '#00000000',
          glow: 12,
          width: 3.5,
          opacity: zk * a,
        }),
        glassCell(0, 355, 1660, 102, COSMOS.gold, { fill: '#181613', glow: 8, opacity: zk * a }),
        txt(
          'Nsight Compute (ncu): warp stalls · resident warps · device bytes beyond cache -> Roofline',
          0,
          358,
          28,
          COSMOS.gold,
          'mono',
        ).opacity(zk * a),
      );
    }
    return group(...nodes);
  });

  // Part 2: In-bounds wrong sum (22 vs trusted 21) + Compute Sanitizer
  const part2 = guardedDynamic(showPart2, (a) => {
    const sb = showBug.value;
    const nodes = [
      txt(
        'ALL 8 LOADS ARE IN BOUNDS · STILL CHECK AGAINST TRUSTED REFERENCE',
        -855,
        -205,
        26,
        COSMOS.rose,
        'mono',
        'left',
      ).opacity(a),
    ];
    TOKEN_VALUES.forEach((v, i) => {
      const cx = -735 + i * 210;
      nodes.push(
        txt(`T${i}`, cx, -130, 26, COSMOS.muted, 'mono').opacity(a),
        glassCell(cx, -62, 174, 86, COSMOS.blue, { fill: '#0f182e', glow: 6, opacity: a }),
        txt(String(v), cx, -58, 38, COSMOS.ink, 'mono').opacity(a),
      );
    });

    nodes.push(
      glassCell(-440, 145, 760, 175, COSMOS.emerald, { fill: '#0e2422', glow: 8, opacity: a }),
      txt('TRUSTED REFERENCE SUM', -440, 96, 26, COSMOS.muted, 'mono').opacity(a),
      txt('21', -440, 166, 64, COSMOS.emerald, 'mono').glow(8, COSMOS.emerald).opacity(a),

      glassCell(440, 145, 760, 175, sb > 0.5 ? COSMOS.rose : COSMOS.rule, {
        fill: '#24111c',
        glow: sb > 0.5 ? 10 : 0,
        opacity: a,
      }),
      txt('BUGGY KERNEL OUTPUT (+1 DOUBLE-ADDED)', 440, 96, 26, COSMOS.muted, 'mono').opacity(a),
      txt(
        sb > 0.5 ? '22  (WRONG!)' : '?',
        440,
        166,
        56,
        sb > 0.5 ? COSMOS.rose : COSMOS.dim,
        'mono',
      )
        .glow(8, COSMOS.rose)
        .opacity(a),

      txt(
        'Pair reference tests with Compute Sanitizer (memcheck, racecheck, synccheck) before timing',
        0,
        345,
        28,
        COSMOS.gold,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Part 3: One-variable layout change (strided 256 B vs packed 32 B) with strict prediction withholding
  const part3 = guardedDynamic(showPart3, (a) => {
    const pk = packedProg.value;
    const st = segTraceProg.value;
    const ans = footprintAnswer.value;
    const xStart = -575;
    const stepX = 186;

    const nodes = [
      txt(
        'CHANGE ONE VARIABLE: STRIDED VS PACKED LAYOUT (32-BYTE ALIGNED BASE)',
        -855,
        -205,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      txt('Values', -855, -108, 28, COSMOS.muted, 'sans', 'left').opacity(a),
      txt('Strided', -855, 18, 28, COSMOS.rose, 'sans', 'left').opacity(a),
      txt('Packed', -855, 168, 28, COSMOS.cyan, 'sans', 'left').opacity(a),
    ];

    TOKEN_VALUES.forEach((val, lane) => {
      const cx = xStart + lane * stepX;
      const wRow = STRIDED_REQ.rows[lane];
      const tRow = COALESCED_REQ.rows[lane];
      const placed = pk * 8 >= lane + 0.4;

      nodes.push(
        txt(`L${lane}: ${val}`, cx, -108, 28, COSMOS.ink, 'mono').opacity(a),
        glassCell(cx, 18, 162, 102, COSMOS.rose, { fill: '#1f121e', glow: 6, opacity: a }),
        txt(`${wRow.address} B`, cx, 0, 28, COSMOS.ink, 'mono').opacity(a),
        txt(`seg ${wRow.segment}`, cx, 42, 26, COSMOS.rose, 'mono').opacity(a),

        glassCell(cx, 168, 162, 86, placed ? COSMOS.cyan : COSMOS.rule, {
          fill: '#0d1f2e',
          glow: placed ? 7 : 0,
          opacity: a,
        }),
        txt(
          placed ? `${tRow.address} B` : '·',
          cx,
          171,
          28,
          placed ? COSMOS.cyan : COSMOS.dim,
          'mono',
        ).opacity(a),
      );
    });

    if (st > 0.05) {
      const leftX = xStart - 81;
      const rightX = xStart + 7 * stepX + 81;
      nodes.push(
        rule(leftX, 238, leftX + (rightX - leftX) * st, 238, COSMOS.emerald, 5)
          .glow(8, COSMOS.emerald)
          .opacity(a),
      );
      if (ans > 0.5) {
        nodes.push(
          txt(
            'All 8 packed words fit inside segment 0',
            (leftX + rightX) * 0.5,
            275,
            28,
            COSMOS.emerald,
            'mono',
          ).opacity(a),
        );
      }
    }

    const footText =
      ans > 0.5
        ? 'Footprint: 8 segments (256 B)  ->  1 segment (32 B) · include any repacking time'
        : 'Strided: 8 segments (256 B)   |   Packed: ? segments (? B)';
    const fCol = ans > 0.5 ? COSMOS.emerald : COSMOS.gold;
    nodes.push(
      glassCell(0, 365, 1660, 96, fCol, { fill: '#101627', glow: 8, opacity: a }),
      txt(footText, 0, 368, 30, fCol, 'mono').glow(6, fCol).opacity(a),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, part1, part2, part3);

  c.on('profile-kernel', () => s.play(zoomKernel.to(1, { duration: 0.55 })));

  c.on('profile-correctness', () => {
    s.play(
      par(
        showPart1.to(0, { duration: 0.2 }),
        delay(showPart2.to(1, { duration: 0.25 }), 0.22),
        delay(showBug.to(1, { duration: 0.55 }), 0.35),
      ),
    );
  });

  c.on('profile-one-variable', () => {
    s.play(
      par(
        showPart2.to(0, { duration: 0.2 }),
        delay(showPart3.to(1, { duration: 0.25 }), 0.22),
        delay(packedProg.to(1, { duration: 0.85 }), 0.25),
      ),
    );
  });
  c.on('profile-segment-count', () => s.play(segTraceProg.to(1, { duration: 0.7 })));
  c.after('profile-segment-count', () =>
    s.play(footprintAnswer.to(1, { duration: afterDuration(c, 'profile-segment-count', 0.4) })),
  );
}
