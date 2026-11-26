// Scene 10: Which edge belongs to the replay? Full 8-lane Play / Before (Exclusive) / After (Inclusive) alignment.
import {
  ARTICLE_INCLUSIVE,
  ARTICLE_INPUT,
  ARTICLE_PREFIX,
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  number,
  remainDuration,
  runPhase,
  signed,
  txt,
} from '../parts.mjs';

export default function prefixContract(s, c) {
  const phase = s.value(0);
  const showInputs = s.value(1);
  const showBefore = s.value(0);
  const showAfter = s.value(0);
  const highlightPenalty = s.value(0);
  const highlightChain = s.value(0);
  const showIdentity = s.value(0);

  const bgAura = aura(0, 15, 620, '#5ce1e61e', '#6ee7b716');
  const title = heroTitle(['Exclusive vs Inclusive', 'Prefix Alignment'], {
    x: -855,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'ORDER-PRESERVING SCAN · IDENTITY ELEMENT',
  });

  const colX = (i) => -515 + i * 182;

  const live = guardedDynamic(showInputs, () => {
    const p = phase.value;
    const bef = showBefore.value;
    const aft = showAfter.value;
    const pen = highlightPenalty.value;
    const chn = highlightChain.value;
    const idn = showIdentity.value;
    const u = (p * 0.85) % 1;

    const yPlay = -160;
    const yBefore = 0;
    const yAfter = 160;

    const nodes = [
      // Index headers
      ...ARTICLE_INPUT.map((_, i) =>
        txt(
          `i=${i}`,
          colX(i),
          yPlay - 66,
          26,
          pen > 0.5 && i === 5 ? COSMOS.gold : COSMOS.dim,
          'mono',
        ),
      ),
      txt('PLAY x[i]', -845, yPlay, 27, COSMOS.blue, 'mono', 'left'),
      txt('BEFORE (EXC)', -845, yBefore, 27, COSMOS.cyan, 'mono', 'left'),
      txt('AFTER (INC)', -845, yAfter, 27, COSMOS.emerald, 'mono', 'left'),
    ];

    ARTICLE_INPUT.forEach((v, i) => {
      const cx = colX(i);
      const isPen = pen > 0.5 && i === 5;
      const isNextStart = chn > 0.5 && i === 6;

      // Play row
      const pCol = isPen ? COSMOS.gold : COSMOS.blue;
      nodes.push(
        glassCell(cx, yPlay, 146, 78, pCol, {
          fill: isPen ? '#261e10' : '#101d38',
          glow: isPen ? 10 : 4,
        }),
        txt(signed(v), cx, yPlay, 36, pCol, 'mono'),
      );

      // Exclusive / Before row
      const bCol = isPen || isNextStart ? COSMOS.gold : COSMOS.cyan;
      nodes.push(
        glassCell(cx, yBefore, 146, 78, bef > 0.5 ? bCol : COSMOS.dim, {
          fill: isPen || isNextStart ? '#261e10' : '#0e2234',
          glow: bef > 0.5 && (isPen || isNextStart) ? 10 : 4,
        }),
        txt(
          bef > 0.5 ? number(ARTICLE_PREFIX[i]) : '·',
          cx,
          yBefore,
          36,
          bef > 0.5 ? bCol : COSMOS.dim,
          'mono',
        ),
      );

      // Inclusive / After row
      const aCol = isPen ? COSMOS.gold : COSMOS.emerald;
      nodes.push(
        glassCell(cx, yAfter, 146, 78, aft > 0.5 ? aCol : COSMOS.dim, {
          fill: isPen ? '#261e10' : '#0d2624',
          glow: aft > 0.5 && isPen ? 10 : 4,
        }),
        txt(
          aft > 0.5 ? number(ARTICLE_INCLUSIVE[i]) : '·',
          cx,
          yAfter,
          36,
          aft > 0.5 ? aCol : COSMOS.dim,
          'mono',
        ),
      );
    });

    // Glowing diagonal handoff arc: After[5] (3) -> Before[6] (3)
    if (chn > 0.02) {
      const x5 = colX(5);
      const x6 = colX(6);
      nodes.push(
        glowingArc([x5 + 54, yAfter - 44], [x6 - 54, yBefore + 44], 0, {
          color: COSMOS.gold,
          width: 4.2,
          opacity: chn,
          core: false,
        }),
      );
      const px = x5 + 54 + u * (x6 - 54 - (x5 + 54));
      const py = yAfter - 44 + u * (yBefore + 44 - (yAfter - 44));
      nodes.push(glowDot(px, py, { radius: 7, color: COSMOS.gold, opacity: chn }));
    }

    // Bottom banner
    const footCol = idn > 0.5 ? COSMOS.cyan : pen > 0.5 ? COSMOS.gold : COSMOS.emerald;
    const footMsg =
      idn > 0.5
        ? 'Identity = 0 (padding & empty sum)  ·  Empty argmax needs its own policy (no index)'
        : pen > 0.5
          ? 'Penalty column i=5:   12 before   +   (−9) play   =   3 after   →   next column starts at 3'
          : 'inclusive[i] = exclusive[i] + x[i]  ·  scan preserves exact lane order';

    nodes.push(
      glassCell(0, 355, 1580, 88, footCol, { fill: '#101829', glow: 9 }),
      txt(footMsg, 0, 355, 28, footCol, 'sans'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('prefix-inputs', () => s.play(showInputs.to(1, { duration: 0.3 })));
  c.on('prefix-contract-step-1', () => s.play(showBefore.to(1, { duration: 0.45 })));
  c.on('prefix-inclusive', () => s.play(showAfter.to(1, { duration: 0.45 })));
  c.on('prefix-contract-step-2', () => s.play(highlightPenalty.to(1, { duration: 0.4 })));
  c.on('prefix-full', () => s.play(highlightChain.to(1, { duration: 0.45 })));
  c.on('prefix-contract-step-3', () =>
    s.play(showIdentity.to(1, { duration: remainDuration(c, 'prefix-contract-step-3', 0.45) })),
  );
}
