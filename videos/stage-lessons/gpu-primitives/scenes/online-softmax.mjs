// Scene 16: Online softmax rescales its running sum. Animated exponential mass compression + MathJax glowTex.
import {
  ALL,
  COSMOS,
  FIRST,
  SOFTMAX_RESCALE_FINAL,
  aura,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function onlineSoftmaxScene(s, c) {
  const showChunk1 = s.value(1);
  const showChunk2 = s.value(0);
  const showNewMax = s.value(0);
  const rescaleFrac = s.value(0);
  const showIncomingExp = s.value(0);
  const showCombined = s.value(0);
  const showSummary = s.value(0);

  const bgAura = aura(160, 20, 620, '#5ce1e622', '#ffd16618');
  const title = heroTitle(['Online Softmax:', 'Rescaled Running Sum'], {
    x: -855,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'SINGLE-PASS NORMALIZER · CARRY (m, ℓ)',
  });

  // Glowing MathJax equations on the right column
  const eqChunk1 = glowTex('m = 2, \\quad \\ell = 1 + e^{-1} \\approx 1.368', {
    x: 420,
    y: -215,
    size: 38,
    color: COSMOS.gold,
    glow: 7,
  });

  const eqNewMax = glowTex('m^{\\prime} = \\max(2, 4) = 4', {
    x: 420,
    y: -115,
    size: 38,
    color: COSMOS.rose,
    glow: 7,
  });

  const eqRescale = glowTex(
    `e^{2-4} \\cdot 1.368 \\approx ${SOFTMAX_RESCALE_FINAL.oldContribution.toFixed(3)}`,
    {
      x: 420,
      y: -10,
      size: 38,
      color: COSMOS.cyan,
      glow: 7,
    },
  );

  const eqIncoming = glowTex(
    `e^{4-4} + e^{0-4} \\approx ${SOFTMAX_RESCALE_FINAL.newContribution.toFixed(3)}`,
    {
      x: 420,
      y: 95,
      size: 38,
      color: COSMOS.gold,
      glow: 7,
    },
  );

  const eqCombined = glowTex(
    `\\ell^{\\prime} = ${SOFTMAX_RESCALE_FINAL.oldContribution.toFixed(3)} + ${SOFTMAX_RESCALE_FINAL.newContribution.toFixed(3)} \\approx ${ALL.denominator.toFixed(3)}`,
    {
      x: 420,
      y: 215,
      size: 40,
      color: COSMOS.emerald,
      glow: 8,
    },
  );

  const live = guardedDynamic(showChunk1, () => {
    const c2 = showChunk2.value;
    const nm = showNewMax.value;
    const rs = rescaleFrac.value;
    const inc = showIncomingExp.value;
    const cmb = showCombined.value;
    const sum = showSummary.value;

    const barLeft = -830;
    const maxW = 720;
    const scalePx = maxW / 1.5; // maps 1.368 -> ~656px, 1.203 -> ~577px
    const curOldVal = FIRST.denominator * (1 + (Math.exp(-2) - 1) * rs);
    const oldPx = curOldVal * scalePx;
    const newPx = SOFTMAX_RESCALE_FINAL.newContribution * scalePx * inc;

    const nodes = [
      // Left-side chunk state cards
      glassCell(-470, -190, 720, 92, COSMOS.blue, { fill: '#101d38', glow: 8 }),
      txt(
        `Chunk 1: [2, 1]   →   m = ${FIRST.maximum},  ℓ ≈ ${FIRST.denominator.toFixed(3)}`,
        -470,
        -190,
        29,
        COSMOS.blue,
        'mono',
      ),

      // Animated exponential mass bar for Chunk 1 (smoothly compresses from 1.368 -> 0.185!)
      txt(
        rs > 0.5
          ? `RESCALED OLD MASS (× e⁻²):  ${curOldVal.toFixed(3)}`
          : `CHUNK 1 EXPONENTIAL MASS:  ${curOldVal.toFixed(3)}`,
        barLeft,
        -98,
        26,
        rs > 0.5 ? COSMOS.cyan : COSMOS.blue,
        'mono',
        'left',
      ),
      line([barLeft, -10], [barLeft + maxW, -10], { stroke: '#253355', width: 2.2 }),
      // Ghost outline of original 1.368 bar once rescaling begins
      ...(rs > 0.04
        ? [
            rect(FIRST.denominator * scalePx, 58, {
              fill: null,
              stroke: COSMOS.dim,
              width: 2,
              dash: [7, 5],
              radius: 6,
            })
              .at(barLeft + FIRST.denominator * scalePx * 0.5, -45)
              .opacity(0.6),
          ]
        : []),
      rect(Math.max(12, oldPx), 58, {
        fill: rs > 0.5 ? COSMOS.cyan : COSMOS.blue,
        stroke: '#ffffff',
        width: 1.2,
        radius: 6,
      })
        .at(barLeft + Math.max(12, oldPx) * 0.5, -45)
        .glow(8, rs > 0.5 ? COSMOS.cyan : COSMOS.blue)
        .opacity(0.92),
    ];

    // Incoming Chunk 2 card + new mass bar
    if (c2 > 0.02) {
      nodes.push(
        glassCell(-470, 72, 720, 92, nm > 0.5 ? COSMOS.rose : COSMOS.gold, {
          fill: '#22121d',
          glow: 8,
          opacity: c2,
        }),
        txt(
          nm > 0.5 ? 'Chunk 2: [4, 0]   →   new max m′ = 4' : 'Incoming Chunk 2:  [4, 0]',
          -470,
          72,
          29,
          nm > 0.5 ? COSMOS.rose : COSMOS.gold,
          'mono',
        ).opacity(c2),
      );
    }

    if (inc > 0.02) {
      nodes.push(
        txt(
          `NEW MASS AT m′ = 4:  ${SOFTMAX_RESCALE_FINAL.newContribution.toFixed(3)}`,
          barLeft,
          164,
          26,
          COSMOS.gold,
          'mono',
          'left',
        ).opacity(inc),
        line([barLeft, 252], [barLeft + maxW, 252], { stroke: '#253355', width: 2.2 }).opacity(inc),
        rect(Math.max(12, newPx), 58, {
          fill: COSMOS.gold,
          stroke: '#ffffff',
          width: 1.2,
          radius: 6,
        })
          .at(barLeft + Math.max(12, newPx) * 0.5, 217)
          .glow(8, COSMOS.gold)
          .opacity(0.92 * inc),
      );
    }

    // Bottom equivalence banner
    const footCol = sum > 0.5 || cmb > 0.5 ? COSMOS.emerald : COSMOS.cyan;
    const footMsg =
      sum > 0.5
        ? 'Equivalent to processing [2, 1, 4, 0] together  ·  zero overflow on large logits'
        : cmb > 0.5
          ? `Combined normalizer:  m′ = 4,  ℓ′ ≈ ${ALL.denominator.toFixed(3)}`
          : 'Subtracting max keeps every exponential ≤ 1';

    nodes.push(
      glassCell(0, 385, 1520, 82, footCol, { fill: '#101829', glow: 9 }),
      txt(footMsg, 0, 385, 28, footCol, 'sans'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, eqChunk1, live);

  c.on('online-softmax-beat-1-focus-1', () => s.play(showChunk1.to(1, { duration: 0.35 })));
  c.on('online-softmax-beat-2-focus-1', () => s.play(showChunk2.to(1, { duration: 0.45 })));
  c.show('online-new-maximum', eqNewMax, { fade: 0.35 });
  c.on('online-new-maximum', () => {
    s.play(showNewMax.to(1, { duration: 0.4 }));
  });
  c.show('online-rescale-prior', eqRescale, { fade: 0.35 });
  c.on('online-rescale-prior', () => {
    s.play(rescaleFrac.to(1, { duration: 0.65 }));
  });
  c.show('online-add-incoming', eqIncoming, { fade: 0.35 });
  c.on('online-add-incoming', () => {
    s.play(showIncomingExp.to(1, { duration: 0.5 }));
  });
  c.show('online-combined-result', eqCombined, { after: true, fade: 0.35 });
  c.after('online-combined-result', () => {
    s.play(showCombined.to(1, { duration: 0.4 }));
  });
  c.on('online-softmax-beat-3-focus-1', () =>
    s.play(
      showSummary.to(1, {
        duration: remainDuration(c, 'online-softmax-beat-3-focus-1', 0.45),
      }),
    ),
  );
}
