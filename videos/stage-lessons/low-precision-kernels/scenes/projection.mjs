// Scene 13: Which products changed? Cancellation hides +12/-6 errors inside 7.75 dot product; one-hot selector exposes 500 vs 512!
import {
  COSMOS,
  PROJ_MIXED,
  PROJ_ONEHOT,
  afterDuration,
  aura,
  glassCell,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function projection(s, c) {
  const showOrigPair = s.value(0);
  const showErr1 = s.value(0);
  const showErr2 = s.value(0);
  const revealEqual = s.value(0);
  const toOneHot = s.value(0);
  const revealSelected = s.value(0);

  const bgAura = aura(120, 20, 620, '#5ce1e620', '#ff6b8b1a');
  const title = heroTitle(['Which Products Changed?'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 62,
    accent: COSMOS.cyan,
    eyebrow: 'CANCELLATION TRAP · ONE-HOT PROJECTION TEST',
  });

  // Precompute cumulative error trajectory across the 32 elements of PROJ_MIXED
  const cumErr = PROJ_MIXED.reconstructed.map((v, i) => v - PROJ_MIXED.original[i]);

  const live = guardedDynamic(1, () => {
    const op = showOrigPair.value;
    const e1 = showErr1.value;
    const e2 = showErr2.value;
    const eq = revealEqual.value;
    const oh = toOneHot.value;
    const sel = revealSelected.value;
    const isOneHot = oh > 0.5;

    const nodes = [];

    // Top 32-position weight strip (4 repeats of 8, or one-hot at index 3)
    const sx0 = -810;
    const sw = 1620;
    const cw = sw / 32;
    const wy = -195;

    nodes.push(
      txt(
        isOneHot
          ? 'ONE-HOT SELECTOR WEIGHTS (w[3] = 1, ALL OTHERS = 0)'
          : '32-WEIGHT STRIP (4 REPEATS OF 8 · POS 3 & 7 HIGHLIGHTED)',
        sx0,
        wy - 56,
        26,
        isOneHot ? COSMOS.gold : COSMOS.cyan,
        'mono',
        'left',
      ),
    );
    for (let k = 0; k < 32; k++) {
      const cx = sx0 + k * cw + cw * 0.5;
      const isHot = isOneHot ? k === 3 : k % 8 === 3 || k % 8 === 7;
      const isPos3 = k % 8 === 3;
      const col = isOneHot
        ? k === 3
          ? COSMOS.gold
          : '#253152'
        : isPos3
          ? COSMOS.rose
          : k % 8 === 7
            ? COSMOS.emerald
            : '#2a3a5e';
      const barH = isOneHot ? (k === 3 ? 52 : 12) : isHot ? 46 : 26;
      nodes.push(
        rect(cw - 4, barH, {
          fill: isHot ? (isOneHot ? '#332610' : isPos3 ? '#2c1222' : '#0f2822') : '#0f172a',
          stroke: col,
          width: isHot ? 2.6 : 1.2,
          radius: 4,
        })
          .at(cx, wy)
          .glow(isHot ? 7 : 0, col),
      );
    }

    // Middle left: First-repeat product pair (pos 3 & pos 7) OR One-hot focus
    const midY = 55;
    if (!isOneHot) {
      nodes.push(
        glassCell(-435, midY, 790, 290, COSMOS.blue, { fill: '#0e1628', glow: 7 }),
        txt('FIRST REPEAT: POSITIONS 3 AND 7', -800, midY - 108, 26, COSMOS.cyan, 'mono', 'left'),
        txt('Original products (sum = 0):', -800, midY - 56, 26, COSMOS.muted, 'sans', 'left'),
        txt(
          'pos 3:  500 × (-1/16) = -31.25',
          -800,
          midY - 12,
          26,
          op > 0.3 ? COSMOS.blue : COSMOS.dim,
          'mono',
          'left',
        ),
        txt(
          'pos 7: -250 × (-1/8)  = +31.25',
          -800,
          midY + 30,
          26,
          op > 0.3 ? COSMOS.blue : COSMOS.dim,
          'mono',
          'left',
        ),
        txt(
          e1 > 0.5 ? 'FP8 pos 3:  512 × (-1/16) = -32.00  (Δ = -0.75)' : 'Reconstructed pos 3: ...',
          -800,
          midY + 78,
          26,
          e1 > 0.5 ? COSMOS.rose : COSMOS.dim,
          'mono',
          'left',
        ),
        txt(
          e2 > 0.5 ? 'FP8 pos 7: -256 × (-1/8)  = +32.00  (Δ = +0.75)' : 'Reconstructed pos 7: ...',
          -800,
          midY + 118,
          26,
          e2 > 0.5 ? COSMOS.emerald : COSMOS.dim,
          'mono',
          'left',
        ),
      );

      // Middle right: Glowing cumulative error oscilloscope across 32 steps (stays at 0 after each 8-repeat!)
      const gx0 = 165;
      const gx1 = 805;
      const gy0 = midY - 22;
      const mapGX = (i) => gx0 + (i / 32) * (gx1 - gx0);
      const mapGY = (err) => gy0 - err * 82;
      const visSteps = e2 > 0.5 ? 32 : e1 > 0.5 ? 5 : 1;
      const pts = [];
      for (let i = 0; i <= visSteps; i++) {
        pts.push([mapGX(i), mapGY(cumErr[i])]);
      }

      nodes.push(
        glassCell(435, midY, 790, 290, COSMOS.rose, { fill: '#0e1628', glow: 7 }),
        txt('CUMULATIVE ERROR TRACE (4 REPEATS)', 435, midY - 108, 26, COSMOS.rose, 'mono'),
        line([gx0, gy0], [gx1, gy0], { stroke: '#3c4e75', width: 2, dash: [6, 6] }),
        txt('0.00', gx0 - 16, gy0, 26, COSMOS.muted, 'mono', 'right'),
        txt('-0.75', gx0 - 16, mapGY(-0.75), 26, COSMOS.rose, 'mono', 'right'),
        ...(pts.length >= 2
          ? [
              glowingTrail(pts, {
                gradientColors: [COSMOS.rose, COSMOS.gold, COSMOS.emerald],
                width: 4.4,
                glow: 10,
              }),
              glowDot(pts.at(-1)[0], pts.at(-1)[1], {
                radius: 8,
                color: e2 > 0.5 ? COSMOS.emerald : COSMOS.rose,
              }),
            ]
          : []),
        txt(
          e2 > 0.5 ? 'Every repeat: -0.75 + 0.75 = 0 net change' : 'Errors dip -0.75 at index 3',
          435,
          midY + 114,
          26,
          e2 > 0.5 ? COSMOS.emerald : COSMOS.rose,
          'mono',
        ),
      );
    } else {
      // One-hot mode middle display (withholds 500 and 512 until revealSelected!)
      nodes.push(
        glassCell(0, midY, 1580, 250, sel > 0.5 ? COSMOS.rose : COSMOS.gold, {
          fill: '#131626',
          glow: 9,
        }),
        txt(
          'ONE-HOT SELECTOR AT INDEX 3 (w_3 = 1, ALL OTHER w_i = 0)',
          0,
          midY - 76,
          26,
          COSMOS.gold,
          'mono',
        ),
        txt(
          sel > 0.5
            ? `Original dot = ${PROJ_ONEHOT.original.at(-1)}   ·   Reconstructed dot = ${PROJ_ONEHOT.reconstructed.at(-1)}   ·   Exposed gap = +12`
            : 'Original dot = ?   ·   Reconstructed dot = ?   (What will each read?)',
          0,
          midY + 8,
          34,
          sel > 0.5 ? COSMOS.rose : COSMOS.gold,
          'mono',
        ).glow(7, sel > 0.5 ? COSMOS.rose : COSMOS.gold),
        txt(
          sel > 0.5
            ? 'A matching mixed output can hide cancelling errors: probe individual activations with weight 1'
            : 'Same FP8 encoded activations, new one-hot weight vector',
          0,
          midY + 82,
          26,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    // Bottom twin output readouts (STRICT PREDICTION WITHHOLDING!)
    const botY = 355;
    const origOutText = !isOneHot
      ? `${PROJ_MIXED.original.at(-1).toFixed(2)}`
      : sel > 0.5
        ? `${PROJ_ONEHOT.original.at(-1)}`
        : '?';
    const reconOutText = !isOneHot
      ? eq > 0.5
        ? `${PROJ_MIXED.reconstructed.at(-1).toFixed(2)}`
        : '?'
      : sel > 0.5
        ? `${PROJ_ONEHOT.reconstructed.at(-1)}`
        : '?';
    const reconCol = !isOneHot
      ? eq > 0.5
        ? COSMOS.emerald
        : COSMOS.gold
      : sel > 0.5
        ? COSMOS.rose
        : COSMOS.gold;

    nodes.push(
      glassCell(-435, botY, 760, 146, COSMOS.blue, { fill: '#10182e', glow: 8 }),
      txt('ORIGINAL DOT PRODUCT', -435, botY - 38, 26, COSMOS.muted, 'mono'),
      txt(origOutText, -435, botY + 22, 48, COSMOS.blue, 'mono').glow(7, COSMOS.blue),

      glassCell(435, botY, 760, 146, reconCol, { fill: '#141729', glow: 9 }),
      txt('RECONSTRUCTED DOT PRODUCT', 435, botY - 38, 26, COSMOS.muted, 'mono'),
      txt(reconOutText, 435, botY + 22, 48, reconCol, 'mono').glow(8, reconCol),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('projection-original-pair', () =>
    s.play(showOrigPair.to(1, { duration: remainDuration(c, 'projection-original-pair', 0.45) })),
  );
  c.on('projection-first-error', () =>
    s.play(showErr1.to(1, { duration: remainDuration(c, 'projection-first-error', 0.45) })),
  );
  c.on('projection-second-error', () =>
    s.play(showErr2.to(1, { duration: remainDuration(c, 'projection-second-error', 0.5) })),
  );
  c.after('projection-equal', () =>
    s.play(revealEqual.to(1, { duration: afterDuration(c, 'projection-equal', 0.45) })),
  );
  c.on('projection-one-hot', () =>
    s.play(toOneHot.to(1, { duration: remainDuration(c, 'projection-one-hot', 0.45) })),
  );
  c.after('projection-selected', () =>
    s.play(revealSelected.to(1, { duration: afterDuration(c, 'projection-selected', 0.45) })),
  );
}
