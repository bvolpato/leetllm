// Scene 09: Build the score, one product at a time: causal prefix -> final real token -> w^T h for A and B.
import {
  COSMOS,
  HEAD_A_PRODS,
  HEAD_A_VEC,
  HEAD_B_PRODS,
  HEAD_B_VEC,
  HEAD_W,
  SCORE_A,
  SCORE_B,
  afterDuration,
  aura,
  circle,
  glowTex,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  tokenCell,
  txt,
} from '../parts.mjs';

export default function transformerScoreHead(s, c) {
  const ctxGrow = s.value(0.25);
  const finalSel = s.value(0);
  const aFirst = s.value(0);
  const aSecond = s.value(0);
  const aSum = s.value(0);
  const aRes = s.value(0);
  const bMode = s.value(0);
  const bSecond = s.value(0);
  const bSum = s.value(0);
  const bRes = s.value(0);

  const bgAura = aura(150, 20, 560, '#5ce1e620', '#ffd16618');
  const title = heroTitle(['Scalar Head:', 'One Dot Product'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.gold,
    eyebrow: 'CAUSAL FINAL TOKEN · LINEAR PROJECTION',
  });

  const eq = glowTex(String.raw`r = w_1 h_1 + w_2 h_2`, {
    x: 470,
    y: -365,
    size: 44,
    color: COSMOS.gold,
  });

  const live = guardedDynamic(1, () => {
    const cg = ctxGrow.value;
    const fs = finalSel.value;
    const isB = bMode.value > 0.5;
    const vec = isB ? HEAD_B_VEC : HEAD_A_VEC;
    const prods = isB ? HEAD_B_PRODS : HEAD_A_PRODS;
    const p1Vis = isB ? bMode.value : aFirst.value;
    const p2Vis = isB ? bSecond.value : aSecond.value;
    const sumVis = isB ? bSum.value : aSum.value;
    const resVis = isB ? bRes.value : aRes.value;
    const activeCol = isB ? COSMOS.rose : COSMOS.emerald;

    const toks = ['prompt', 'tok₁', 'tok₂', 'final', '[PAD]'];
    const tokX = [-730, -560, -390, -220, -50];
    const tokY = -145;

    const nodes = [
      txt('CAUSAL DECODER HIDDEN STATES', -855, -235, 26, COSMOS.cyan, 'mono', 'left'),
    ];

    // Causal token chain + attention arcs into the final real token
    toks.forEach((tk, i) => {
      const isPad = i === 4;
      const isFinal = i === 3;
      const lit = !isPad && cg * 4 >= i;
      const col = isPad
        ? COSMOS.dim
        : isFinal && fs > 0.4
          ? COSMOS.gold
          : lit
            ? COSMOS.cyan
            : '#3a4b73';
      nodes.push(
        tokenCell(tokX[i], tokY, 145, 76, col, {
          fill: isFinal && fs > 0.4 ? '#221d12' : '#0f182c',
          dash: isPad ? [7, 5] : undefined,
          glow: isFinal && fs > 0.4 ? 10 : lit ? 5 : 0,
          opacity: isPad ? 0.5 : 0.95,
        }),
        txt(tk, tokX[i], tokY, 26, col, 'mono').opacity(isPad ? 0.55 : 0.95),
      );
      if (i < 3 && fs > 0.3) {
        nodes.push(
          glowingArc([tokX[i], tokY - 40], [tokX[3], tokY - 40], -35 - i * 12, {
            color: COSMOS.gold,
            width: 2.2,
            opacity: 0.65 * fs,
          }),
        );
      }
    });

    // Dot-product flow diagram in main body
    const hX = -560;
    const wX = -150;
    const prodX = 240;
    const sumX = 650;
    const y1 = 60;
    const y2 = 225;

    nodes.push(
      // Column headers
      txt(isB ? 'HIDDEN h(B)' : 'HIDDEN h(A)', hX, -22, 26, activeCol, 'mono'),
      txt('SHARED WEIGHTS w', wX, -22, 26, COSMOS.violet, 'mono'),
      txt('TERM PRODUCTS', prodX, -22, 26, COSMOS.gold, 'mono'),
      txt('SCALAR SCORE', sumX, -22, 26, activeCol, 'mono'),

      // Component 1 row
      circle(48, { fill: '#10202a', stroke: activeCol, width: 3 }).at(hX, y1).glow(7, activeCol),
      txt(vec[0].toFixed(1), hX, y1 + 2, 34, COSMOS.ink, 'mono'),
      txt('×', (hX + wX) * 0.5, y1, 34, COSMOS.muted, 'mono'),
      circle(48, { fill: '#17142f', stroke: COSMOS.violet, width: 3 })
        .at(wX, y1)
        .glow(7, COSMOS.violet),
      txt(HEAD_W[0].toFixed(1), wX, y1 + 2, 34, COSMOS.violet, 'mono'),
      glowingArc([wX + 52, y1], [prodX - 95, y1], -12, {
        color: COSMOS.gold,
        width: 3.2,
        opacity: Math.max(0.3, p1Vis),
      }),
      tokenCell(prodX, y1, 185, 76, COSMOS.gold, {
        fill: '#1b1812',
        glow: p1Vis > 0.5 ? 8 : 2,
        opacity: Math.max(0.35, p1Vis),
      }),
      txt(
        p1Vis > 0.4 ? prods[0].toFixed(1) : '...',
        prodX,
        y1 + 2,
        34,
        COSMOS.gold,
        'mono',
      ).opacity(Math.max(0.35, p1Vis)),

      // Component 2 row
      circle(48, { fill: '#10202a', stroke: activeCol, width: 3 }).at(hX, y2).glow(7, activeCol),
      txt(vec[1].toFixed(1), hX, y2 + 2, 34, COSMOS.ink, 'mono'),
      txt('×', (hX + wX) * 0.5, y2, 34, COSMOS.muted, 'mono'),
      circle(48, { fill: '#17142f', stroke: COSMOS.violet, width: 3 })
        .at(wX, y2)
        .glow(7, COSMOS.violet),
      txt(HEAD_W[1].toFixed(1), wX, y2 + 2, 34, COSMOS.violet, 'mono'),
      glowingArc([wX + 52, y2], [prodX - 95, y2], 12, {
        color: COSMOS.gold,
        width: 3.2,
        opacity: Math.max(0.3, p2Vis),
      }),
      tokenCell(prodX, y2, 185, 76, COSMOS.gold, {
        fill: '#1b1812',
        glow: p2Vis > 0.5 ? 8 : 2,
        opacity: Math.max(0.35, p2Vis),
      }),
      txt(
        p2Vis > 0.4 ? prods[1].toFixed(1) : '...',
        prodX,
        y2 + 2,
        34,
        COSMOS.gold,
        'mono',
      ).opacity(Math.max(0.35, p2Vis)),

      // Merge arcs into final scalar score orb
      glowingArc([prodX + 98, y1], [sumX - 95, (y1 + y2) * 0.5 - 15], -20, {
        color: activeCol,
        width: 3.6,
        opacity: Math.max(0.3, sumVis),
      }),
      glowingArc([prodX + 98, y2], [sumX - 95, (y1 + y2) * 0.5 + 15], 20, {
        color: activeCol,
        width: 3.6,
        opacity: Math.max(0.3, sumVis),
      }),
      circle(84, { fill: '#111a2c', stroke: activeCol, width: 3.6 })
        .at(sumX, (y1 + y2) * 0.5)
        .glow(resVis > 0.4 ? 12 : 4, activeCol),
      txt(
        resVis > 0.4 ? (isB ? SCORE_B.toFixed(1) : SCORE_A.toFixed(1)) : '∑',
        sumX,
        (y1 + y2) * 0.5 + 4,
        46,
        activeCol,
        'mono',
      ).glow(8, activeCol),
    );

    // Persistent bottom comparison strip (A stays recorded when scoring B)
    line([-855, 340], [810, 340], { stroke: '#253355', width: 2 });
    nodes.push(
      txt(
        aRes.value > 0.4
          ? `Reply A:  ${HEAD_A_PRODS[0].toFixed(1)} + ${HEAD_A_PRODS[1].toFixed(1)} = ${SCORE_A.toFixed(1)}`
          : 'Reply A: waiting for dot product',
        -855,
        395,
        28,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        bRes.value > 0.4
          ? `Reply B:  ${HEAD_B_PRODS[0].toFixed(1)} + ${HEAD_B_PRODS[1].toFixed(1)} = ${SCORE_B.toFixed(1)}   (A > B)`
          : 'Reply B: uses identical weights w = [0.5, 1.0]',
        50,
        395,
        28,
        bRes.value > 0.4 ? COSMOS.rose : COSMOS.muted,
        'mono',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, eq, live);

  c.on('head-context', () => s.play(ctxGrow.to(1, { duration: 0.55 })));
  c.on('head-final', () => s.play(finalSel.to(1, { duration: 0.45 })));
  c.on('head-a-first', () => s.play(aFirst.to(1, { duration: 0.4 })));
  c.on('head-a-second', () => s.play(aSecond.to(1, { duration: 0.4 })));
  c.on('head-a-sum', () => s.play(aSum.to(1, { duration: 0.35 })));
  c.after('head-a-result', () => s.play(aRes.to(1, { duration: 0.35 })));
  c.on('head-b-first', () => s.play(bMode.to(1, { duration: 0.45 })));
  c.on('head-b-second', () => s.play(bSecond.to(1, { duration: 0.4 })));
  c.on('head-b-sum', () => s.play(bSum.to(1, { duration: 0.35 })));
  c.after('head-b-result', () =>
    s.play(bRes.to(1, { duration: afterDuration(c, 'head-b-result', 0.4) })),
  );
}
