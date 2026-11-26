// Scene 18: Two four-bit layouts: FP6 (E3M2, E2M3) and FP4 (E2M1), MXFP4 (17 B) vs NVFP4 (22 B) for 32 activation values.
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

const SUB8 = [
  { name: 'MXFP6 · E3M2', s: 1, e: 3, m: 2, max: '28', scale: '1 E8M0 / 32 elems' },
  { name: 'MXFP6 · E2M3', s: 1, e: 2, m: 3, max: '7.5', scale: '1 E8M0 / 32 elems' },
  { name: 'MXFP4 · E2M1', s: 1, e: 2, m: 1, max: '6', scale: '1 E8M0 / 32 elems' },
];

export default function subeightFormats(s, c) {
  const phase = s.value(0);
  const showMX = s.value(0.4);
  const showNV = s.value(0);
  const showPack = s.value(0);
  const show17 = s.value(0);
  const show22 = s.value(0);

  const bgAura = aura(0, 20, 620, '#a78bfa20', '#5ce1e61a');
  const title = heroTitle(['Two Four-Bit', 'Layouts'], {
    x: -855,
    y: -415,
    size: 60,
    lineHeight: 70,
    accent: COSMOS.violet,
    eyebrow: 'SUB-8-BIT MICROSCALING · MXFP6 · MXFP4 · NVFP4',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const mx = showMX.value;
    const nv = showNV.value;
    const pk = showPack.value;
    const s17 = show17.value;
    const s22 = show22.value;

    const nodes = [];

    // Top-right: Compact sub-8-bit bit-field ribbons (FP6 E3M2, FP6 E2M3, FP4 E2M1)
    const unitW = 68;
    const xBar = -260;
    SUB8.forEach((f, idx) => {
      const y = -280 + idx * 82;
      const wS = f.s * unitW;
      const wE = f.e * unitW;
      const wM = f.m * unitW;
      nodes.push(
        txt(
          f.name,
          xBar - 24,
          y,
          26,
          idx === 2 ? COSMOS.gold : COSMOS.ink,
          'mono',
          'right',
        ).opacity(0.4 + 0.6 * mx),
        rect(wS - 4, 48, { fill: COSMOS.rose, stroke: '#ffffff', width: 1.2, radius: 6 })
          .at(xBar + wS * 0.5, y)
          .opacity(0.9),
        txt('S', xBar + wS * 0.5, y, 26, COSMOS.ink, 'mono'),
        rect(wE - 4, 48, { fill: COSMOS.blue, stroke: '#ffffff', width: 1.2, radius: 6 })
          .at(xBar + wS + wE * 0.5, y)
          .opacity(0.92),
        txt(`${f.e}E`, xBar + wS + wE * 0.5, y, 26, COSMOS.ink, 'mono'),
        rect(wM - 4, 48, { fill: COSMOS.cyan, stroke: '#ffffff', width: 1.2, radius: 6 })
          .at(xBar + wS + wE + wM * 0.5, y)
          .opacity(0.92),
        txt(`${f.m}M`, xBar + wS + wE + wM * 0.5, y, 26, COSMOS.ink, 'mono'),
        txt(`max ${f.max}`, 225, y, 28, idx === 2 ? COSMOS.gold : COSMOS.cyan, 'mono', 'left'),
        txt(f.scale, 445, y, 26, COSMOS.muted, 'mono', 'left'),
      );
    });

    // Bottom side-by-side 32-value FP4 activation payload comparison: MXFP4 vs NVFP4
    const yMid = 185;
    // MXFP4 panel (left)
    nodes.push(
      glassCell(-435, yMid, 790, 415, s17 > 0.5 ? COSMOS.cyan : COSMOS.blue, {
        fill: '#0e192c',
        glow: s17 > 0.5 ? 9 : 6,
      }),
      txt('MXFP4 · 32 ACTIVATION VALUES (NO PADDING)', -435, 22, 26, COSMOS.cyan, 'mono'),
      // 32 E2M1 nibbles packed 2 per byte = 16 code bytes
      rect(600, 62, { fill: '#14304c', stroke: COSMOS.cyan, width: 2.2, radius: 8 }).at(-490, 118),
      txt('16 B packed E2M1 codes (2 / byte)', -490, 118, 26, COSMOS.ink, 'mono'),
      rect(94, 62, { fill: '#1a2752', stroke: COSMOS.blue, width: 2.6, radius: 8 })
        .at(-132, 118)
        .glow(7, COSMOS.blue),
      txt('1 B', -132, 118, 26, COSMOS.blue, 'mono'),
      txt('1 E8M0 scale / 32 elements', -435, 198, 26, COSMOS.muted, 'mono'),
      txt(
        s17 > 0.5
          ? '16 B + 1 B = 17 BYTES'
          : pk > 0.5
            ? '16 code B + 1 scale B'
            : 'OCP Microscaling',
        -435,
        282,
        36,
        s17 > 0.5 ? COSMOS.cyan : COSMOS.ink,
        'mono',
      ).glow(s17 > 0.5 ? 7 : 0, COSMOS.cyan),
      txt('4.25 bits / value (unpadded 32-block)', -435, 344, 26, COSMOS.muted, 'mono'),
    );

    // NVFP4 panel (right)
    const opNV = 0.22 + 0.78 * nv;
    nodes.push(
      glassCell(435, yMid, 790, 415, s22 > 0.5 ? COSMOS.gold : COSMOS.violet, {
        fill: '#17122a',
        glow: s22 > 0.5 ? 9 : 6,
        opacity: opNV,
      }),
      txt('NVFP4 · 32 ACTIVATION VALUES (NO PADDING)', 435, 22, 26, COSMOS.violet, 'mono').opacity(
        opNV,
      ),
      // Two 16-element blocks (8 B each) + two E4M3 block scales (1 B each) + 4 B FP32 tensor scale
      rect(188, 62, { fill: '#221840', stroke: COSMOS.violet, width: 2, radius: 8 })
        .at(162, 118)
        .opacity(opNV),
      txt('8 B (16)', 162, 118, 26, COSMOS.ink, 'mono').opacity(opNV),
      rect(72, 62, { fill: '#332610', stroke: COSMOS.gold, width: 2.4, radius: 8 })
        .at(302, 118)
        .opacity(opNV),
      txt('1B', 302, 118, 26, COSMOS.gold, 'mono').opacity(opNV),
      rect(188, 62, { fill: '#221840', stroke: COSMOS.violet, width: 2, radius: 8 })
        .at(442, 118)
        .opacity(opNV),
      txt('8 B (16)', 442, 118, 26, COSMOS.ink, 'mono').opacity(opNV),
      rect(72, 62, { fill: '#332610', stroke: COSMOS.gold, width: 2.4, radius: 8 })
        .at(582, 118)
        .opacity(opNV),
      txt('1B', 582, 118, 26, COSMOS.gold, 'mono').opacity(opNV),
      rect(144, 62, { fill: '#2c1428', stroke: COSMOS.rose, width: 2.6, radius: 8 })
        .at(702, 118)
        .glow(7, COSMOS.rose)
        .opacity(opNV),
      txt('4B FP32', 702, 118, 26, COSMOS.rose, 'mono').opacity(opNV),
      txt('1 E4M3 / 16 elems + FP32 tensor scale', 435, 198, 26, COSMOS.muted, 'mono').opacity(
        opNV,
      ),
      txt(
        s22 > 0.5
          ? '16 B + 2 B + 4 B = 22 BYTES'
          : pk > 0.5
            ? '16 code B + 2 E4M3 + 4 FP32'
            : 'Two-level scaling',
        435,
        282,
        34,
        s22 > 0.5 ? COSMOS.gold : COSMOS.ink,
        'mono',
      )
        .glow(s22 > 0.5 ? 7 : 0, COSMOS.gold)
        .opacity(opNV),
      txt(
        'Count KV cache separately if format differs',
        435,
        344,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(opNV),
      glowDot(-790 + ((p * 0.45) % 1) * 1580, -56, {
        radius: 5,
        color: COSMOS.violet,
        opacity: 0.7,
      }),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('lp-subeight-formats-build-0', () =>
    s.play(showMX.to(1, { duration: remainDuration(c, 'lp-subeight-formats-build-0', 0.45) })),
  );
  c.on('lp-subeight-formats-build-1', () =>
    s.play(showNV.to(1, { duration: remainDuration(c, 'lp-subeight-formats-build-1', 0.5) })),
  );
  c.on('lp-subeight-formats-build-2', () =>
    s.play(showPack.to(1, { duration: remainDuration(c, 'lp-subeight-formats-build-2', 0.45) })),
  );
  c.on('lp-subeight-formats-mx', () =>
    s.play(show17.to(1, { duration: remainDuration(c, 'lp-subeight-formats-mx', 0.45) })),
  );
  c.on('lp-subeight-formats-nv', () =>
    s.play(show22.to(1, { duration: remainDuration(c, 'lp-subeight-formats-nv', 0.45) })),
  );
}
