// Scene 25: Would you start the support trial? Prediction transfer with 24-pair grid, [5,5,5] ensemble, Section 4 check.
import {
  COSMOS,
  SCREEN_AGREE,
  SCREEN_ENS,
  SCREEN_RATE,
  SCREEN_TOTAL,
  SUPPORT_SCREEN,
  afterDuration,
  aura,
  circle,
  group,
  guardedDynamic,
  heroTitle,
  line,
  radialDial,
  remainDuration,
  runPhase,
  tokenCell,
  txt,
} from '../parts.mjs';

export default function freshScorerScreen(s, c) {
  const phase = s.value(0);
  const showPairs = s.value(0.45);
  const showEns = s.value(0.45);
  const showSource = s.value(0.45);
  // STRICT PREDICTION WITHHOLDING: all 4 verdict flags stay 0 through Beat 0 (hold 2.8s)!
  const revPair = s.value(0);
  const revEns = s.value(0);
  const revSource = s.value(0);
  const revDecision = s.value(0);

  const bgAura = aura(150, 15, 580, '#5ce1e61c', '#ff6b8b16');
  const title = heroTitle(['Would You Start', 'the Support Trial?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'FRESH TRANSFER CHECK · TWO INDEPENDENT GATES',
  });

  const live = guardedDynamic(1, () => {
    const sp = showPairs.value;
    const se = showEns.value;
    const ss = showSource.value;
    const rp = revPair.value;
    const re = revEns.value;
    const rs = revSource.value;
    const rd = revDecision.value;

    const nodes = [
      // Left zone: 24-pair agreement grid (6 cols x 4 rows)
      txt(`FRESH PAIRS (${SCREEN_AGREE} / ${SCREEN_TOTAL})`, -585, -205, 28, COSMOS.cyan, 'mono'),
      txt('Team floor: ≥ 80%', -585, -162, 26, COSMOS.gold, 'mono'),
    ];

    const gx0 = -785;
    const gy0 = -90;
    const cellW = 72;
    const cellH = 54;
    const gap = 10;
    SUPPORT_SCREEN.agreements.forEach((agree, idx) => {
      const col = idx % 6;
      const row = Math.floor(idx / 6);
      const cx = gx0 + col * (cellW + gap);
      const cy = gy0 + row * (cellH + gap);
      // Neutral cyan/slate before reveal; switches to rose border on misses once revPair > 0.5
      const stroke = agree ? COSMOS.cyan : rp > 0.5 ? COSMOS.rose : COSMOS.dim;
      const fill = agree ? '#102438' : rp > 0.5 ? '#261120' : '#111524';
      nodes.push(
        tokenCell(cx, cy, cellW, cellH, stroke, {
          fill,
          glow: agree ? 4 : rp > 0.5 ? 7 : 0,
          opacity: Math.max(0.55, sp),
          radius: 7,
        }),
        txt(
          `P${idx + 1}`,
          cx,
          cy + 2,
          26,
          agree ? COSMOS.ink : rp > 0.5 ? COSMOS.rose : COSMOS.muted,
          'mono',
        ).opacity(Math.max(0.55, sp)),
      );
    });

    nodes.push(
      txt(
        rp > 0.5 ? `${(SCREEN_RATE * 100).toFixed(0)}% < 80%  →  FAIL` : 'Pair screen verdict: ?',
        -585,
        205,
        30,
        rp > 0.5 ? COSMOS.rose : COSMOS.gold,
        'mono',
      ).glow(rp > 0.5 ? 8 : 4, rp > 0.5 ? COSMOS.rose : COSMOS.gold),

      // Middle zone: 3 Aligned Ensemble Scorers [5, 5, 5]
      txt('3 ALIGNED SCORERS', 35, -205, 28, COSMOS.violet, 'mono'),
      ...SUPPORT_SCREEN.memberScores.map((score, i) => {
        const mx = -95 + i * 130;
        return group(
          circle(48, { fill: '#17142e', stroke: COSMOS.violet, width: 3 })
            .at(mx, -72)
            .glow(7, COSMOS.violet)
            .opacity(Math.max(0.55, se)),
          txt(String(score), mx, -68, 38, COSMOS.ink, 'mono').opacity(Math.max(0.55, se)),
          txt(`RM${i + 1}`, mx, 4, 26, COSMOS.muted, 'mono').opacity(Math.max(0.55, se)),
        );
      }),
      radialDial(35, 115, 68, re > 0.5 ? 0.72 : 0.1, {
        color: re > 0.5 ? COSMOS.amber : COSMOS.violet,
        width: 9,
      }),
      txt(re > 0.5 ? `${SCREEN_ENS.aggregate}` : '?', 35, 118, 36, COSMOS.gold, 'mono'),
      txt(
        re > 0.5
          ? `μ=${SCREEN_ENS.mean}, σ=${SCREEN_ENS.sd} → LCB=${SCREEN_ENS.aggregate}`
          : 'LCB aggregate: ?',
        35,
        215,
        26,
        re > 0.5 ? COSMOS.amber : COSMOS.muted,
        'mono',
      ),

      // Right zone: Support Guide Edition & Citation Check
      txt('SOURCE EDITION CHECK', 575, -205, 28, COSMOS.cyan, 'mono'),
      tokenCell(575, -92, 420, 96, COSMOS.amber, {
        fill: '#201812',
        glow: 7,
        opacity: Math.max(0.55, ss),
      }),
      txt('Answer cites:', 575, -114, 26, COSMOS.muted, 'sans').opacity(Math.max(0.55, ss)),
      txt(`Section ${SUPPORT_SCREEN.citedSection}`, 575, -68, 34, COSMOS.amber, 'mono').opacity(
        Math.max(0.55, ss),
      ),

      txt('COMPLETE CONTENTS', 575, 22, 26, COSMOS.muted, 'mono'),
      ...SUPPORT_SCREEN.sections.map((sec, i) =>
        tokenCell(455 + i * 120, 92, 102, 68, COSMOS.cyan, {
          fill: '#0f1c2e',
          opacity: Math.max(0.55, ss),
        }),
      ),
      ...SUPPORT_SCREEN.sections.map((sec, i) =>
        txt(`Sec ${sec}`, 455 + i * 120, 94, 26, COSMOS.cyan, 'mono').opacity(Math.max(0.55, ss)),
      ),
      txt(
        rs > 0.5 ? 'Ends at Sec 3  →  FAIL' : 'Citation check: ?',
        575,
        205,
        30,
        rs > 0.5 ? COSMOS.rose : COSMOS.gold,
        'mono',
      ).glow(rs > 0.5 ? 8 : 4, rs > 0.5 ? COSMOS.rose : COSMOS.gold),

      // Bottom Decision Bar (strictly withheld until screen-decision!)
      line([-855, 285], [810, 285], { stroke: '#253355', width: 2 }),
      txt(
        rd > 0.5
          ? 'DECISION:  HOLD THE TRIAL  ·  Keep pair IDs & edition · retest on reserved pairs'
          : 'Do the fresh pair results and the source citation permit starting the trial?',
        0,
        365,
        rd > 0.5 ? 30 : 28,
        rd > 0.5 ? COSMOS.rose : COSMOS.gold,
        rd > 0.5 ? 'mono' : 'sans',
      ).glow(rd > 0.5 ? 9 : 4, rd > 0.5 ? COSMOS.rose : COSMOS.gold),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('screen-pairs', () => s.play(showPairs.to(1, { duration: 0.4 })));
  c.on('screen-members', () => s.play(showEns.to(1, { duration: 0.4 })));
  c.on('screen-source', () => s.play(showSource.to(1, { duration: 0.4 })));
  c.after('fresh-pair-result', () =>
    s.play(revPair.to(1, { duration: afterDuration(c, 'fresh-pair-result', 0.4) })),
  );
  c.after('fresh-ensemble-result', () =>
    s.play(revEns.to(1, { duration: afterDuration(c, 'fresh-ensemble-result', 0.4) })),
  );
  c.after('fresh-source-result', () =>
    s.play(revSource.to(1, { duration: afterDuration(c, 'fresh-source-result', 0.4) })),
  );
  c.on('screen-decision', () =>
    s.play(revDecision.to(1, { duration: remainDuration(c, 'screen-decision', 0.5) })),
  );
}
