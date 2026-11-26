// Scene 09: budget: Fixed 4,096-token ruler; 5 x 576 views overflow (5,380 -> +1,284 over); 5 x 32 views fit (2,660).
import {
  CONTEXT_LIMIT,
  COSMOS,
  FULL_PREFIX,
  OUTPUT_RESERVE,
  REDUCED_PREFIX,
  ROLE,
  TEXT_TOKENS,
  VISUAL_TOKENS_336,
  aura,
  group,
  guardedDynamic,
  heroTitle,
  line,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function budget(s, c) {
  const showText = s.value(0);
  const showReserve = s.value(0);
  const showTwoViews = s.value(0);
  const showThirdView = s.value(0);
  const showFiveViews = s.value(0);
  const showReduced = s.value(0);

  const bgAura = aura(0, 10, 780, '#14325c28', '#2c142824');
  const title = heroTitle(['Will Five Dashboard', 'Views Fit in 4,096 Tokens?'], {
    x: -855,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.gold,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const tVis = showText.value;
    const rVis = showReserve.value;
    const v2 = showTwoViews.value;
    const v3 = showThirdView.value;
    const v5 = showFiveViews.value;
    const red = showReduced.value;

    const x0 = -855;
    const scale = 1620 / 5600; // Fits 5,380 tokens cleanly inside [-855, +765]
    const limitX = x0 + CONTEXT_LIMIT * scale;
    const textW = TEXT_TOKENS * scale * Math.max(0.2, tVis);
    const resW = OUTPUT_RESERVE * scale * Math.max(0.15, rVis);
    const viewW = VISUAL_TOKENS_336 * scale;
    const viewCount = (v2 > 0.4 ? 2 : 0) + (v3 > 0.4 ? 1 : 0) + (v5 > 0.4 ? 2 : 0);
    const curVisTokens = viewCount * VISUAL_TOKENS_336;

    const nodes = [
      // 4,096 token vertical limit segments (cleanly gapped around text rows)
      line([limitX, -162], [limitX, -76], { stroke: ROLE.gold, width: 3.4 })
        .glow(10, ROLE.gold)
        .opacity(alpha),
      line([limitX, 98], [limitX, 184], { stroke: ROLE.gold, width: 3.4 })
        .glow(10, ROLE.gold)
        .opacity(alpha),
      txt('4,096 LIMIT', limitX, -200, 28, ROLE.gold, 'mono', 'center').opacity(alpha),

      // Row 1: Direct 576-patch views on 4,096 ruler
      txt('DIRECT ROUTE (576 PATCHES / VIEW)', x0, -195, 26, ROLE.vision, 'mono', 'left').opacity(
        alpha,
      ),
      rect(CONTEXT_LIMIT * scale, 72, {
        fill: '#0d1529',
        stroke: '#2b3f6b',
        width: 2,
        radius: 8,
      })
        .at(x0 + CONTEXT_LIMIT * scale * 0.5, -120)
        .opacity(alpha * 0.72),

      // Text segment (2,200)
      rect(textW, 64, { fill: ROLE.text, stroke: null, radius: 6 })
        .at(x0 + textW * 0.5, -120)
        .opacity(alpha * (0.45 + 0.55 * tVis)),
      txt('Text 2,200', x0 + textW * 0.5, -120, 26, '#070910', 'mono', 'center').opacity(
        alpha * (tVis > 0.35 ? 1 : 0),
      ),

      // Answer reserve segment (300)
      rect(resW, 64, { fill: ROLE.gold, stroke: null, radius: 6 })
        .at(x0 + textW + resW * 0.5, -120)
        .opacity(alpha * (0.35 + 0.65 * rVis)),
    ];

    // Direct views laid down sequentially
    for (let i = 0; i < viewCount; i++) {
      const vx = x0 + textW + resW + i * viewW;
      const isOver = i >= 2;
      const col = isOver ? ROLE.warn : ROLE.vision;
      nodes.push(
        rect(viewW - 4, 64, { fill: col, stroke: '#070910', width: 2, radius: 6 })
          .at(vx + viewW * 0.5, -120)
          .glow(isOver ? 10 : 6, col)
          .opacity(alpha),
        txt(`V${i + 1}`, vx + viewW * 0.5, -120, 26, '#070910', 'mono', 'center').opacity(alpha),
      );
    }

    // Dynamic readout under Row 1 (strictly withholding answers before cues!)
    let row1Status = '2,000 transcript + 200 prompt + 300 reserve -> ? tokens left for vision';
    let row1Color = ROLE.gold;
    if (v5 > 0.4) {
      row1Status = `5 views = ${FULL_PREFIX.visualTokens} vis | Prefix ${FULL_PREFIX.prefix} | Total ${FULL_PREFIX.total} (+1,284 OVER!)`;
      row1Color = ROLE.warn;
    } else if (v3 > 0.4) {
      row1Status = `3rd view crosses 4,096 limit! (${curVisTokens} vis + 2,500 fixed = ${curVisTokens + 2500})`;
      row1Color = ROLE.warn;
    } else if (v2 > 0.4) {
      row1Status = '1,596 left -> 2 views use 1,152 (444 left). Will a 3rd view fit?';
      row1Color = ROLE.vision;
    }

    nodes.push(
      txt(row1Status, x0, -45, 28, row1Color, 'mono', 'left')
        .glow(v3 > 0.4 ? 8 : 0, ROLE.warn)
        .opacity(alpha),
    );

    // Row 2: Reduced 32-state route on the SAME scale (quiet skeleton from t=0, lights up on budget-reduce)
    const redVisW = REDUCED_PREFIX.visualTokens * scale;
    const fullTextW = TEXT_TOKENS * scale;
    const fullResW = OUTPUT_RESERVE * scale;
    const row2Op = alpha * (0.48 + 0.52 * red);

    nodes.push(
      txt(
        'REDUCED ROUTE (5 VIEWS x 32 STATES = 160 VISUAL TOKENS)',
        x0,
        65,
        26,
        red > 0.3 ? ROLE.ok : COSMOS.muted,
        'mono',
        'left',
      ).opacity(row2Op),
      rect(CONTEXT_LIMIT * scale, 72, {
        fill: '#0d1529',
        stroke: red > 0.3 ? ROLE.ok : '#2b3f6b',
        width: red > 0.3 ? 2.6 : 2,
        radius: 8,
      })
        .at(x0 + CONTEXT_LIMIT * scale * 0.5, 140)
        .opacity(row2Op * 0.8),
      rect(fullTextW, 64, { fill: ROLE.text, stroke: null, radius: 6 })
        .at(x0 + fullTextW * 0.5, 140)
        .opacity(row2Op),
      rect(fullResW, 64, { fill: ROLE.gold, stroke: null, radius: 6 })
        .at(x0 + fullTextW + fullResW * 0.5, 140)
        .opacity(row2Op),
      rect(Math.max(12, redVisW), 64, { fill: ROLE.ok, stroke: null, radius: 6 })
        .at(x0 + fullTextW + fullResW + redVisW * 0.5, 140)
        .glow(red > 0.3 ? 12 : 0, ROLE.ok)
        .opacity(row2Op),
      txt(
        red > 0.4
          ? `Prefix ${REDUCED_PREFIX.prefix} + 300 reserve = ${REDUCED_PREFIX.total} tokens -> FITS 4,096!`
          : 'Compare a 32-state-per-view bridge on the same ruler',
        x0,
        215,
        28,
        red > 0.4 ? ROLE.ok : COSMOS.muted,
        'mono',
        'left',
      )
        .glow(red > 0.4 ? 8 : 0, ROLE.ok)
        .opacity(row2Op),
      txt(
        'Still verify whether the 32-state reader recovers the legend name',
        0,
        325,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'budget-text', (d) => s.play(showText.to(1, { duration: d })));
  playCue(s, c, 'budget-reserve', (d) => s.play(showReserve.to(1, { duration: d })));
  // Strict prediction withholding: reveal 1,596 & 2 views only after budget-two-views!
  playCue(s, c, 'budget-two-views', (d) => s.play(showTwoViews.to(1, { duration: d })), {
    after: true,
  });
  // Strict prediction withholding: reveal overflow only after budget-third-view!
  playCue(s, c, 'budget-third-view', (d) => s.play(showThirdView.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'budget-five-views', (d) => s.play(showFiveViews.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'budget-reduce', (d) => s.play(showReduced.to(1, { duration: d })));
}
