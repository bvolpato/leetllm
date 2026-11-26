// Scene 4: BM25 turns matches into a score (IDF, length norm, saturating TF)
import {
  AVERAGE_LENGTH,
  COSMOS,
  DOC_FREQUENCY,
  TOKENS,
  aura,
  bm25,
  glassCell,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  idf,
  line,
  meterBar,
  remainDuration,
  runPhase,
  termFrequencyScore,
  txt,
} from '../parts.mjs';

export default function bm25Scene(s, c) {
  const phase = s.value(0);
  const showFactors = s.value(0);
  const showRarity = s.value(0);
  const showIdf = s.value(0);
  const showLen = s.value(0);
  const showContrib = s.value(0);
  const showSat = s.value(0);

  const bgAura = aura(0, 10, 680, '#13356026', '#291b5014');
  const title = heroTitle(['BM25 Turns Matches', 'into a Score'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'SPARSE SCORING · IDF x SATURATING TF / LENGTH NORM',
  });

  const eq = glowTex(
    '\\text{BM25}(d,q)=\\sum_{t \\in q} \\text{IDF}(t)\\,\\frac{f(t,d)(k_1+1)}{f(t,d)+k_1(1-b+b\\,|d|/\\text{avgdl})}',
    { size: 32, color: COSMOS.gold },
  ).at(-140, -238);

  const d1 = bm25('d1');
  const soupIdf = idf('soup');
  const makeIdf = idf('make');
  const lenFactor = 1 - 0.75 + (0.75 * TOKENS.d1.length) / AVERAGE_LENGTH;

  // Build real saturating TF curve path on right side
  const gx0 = 165;
  const gy0 = 245;
  const gw = 640;
  const gh = 330;
  const maxY = 2.0;
  const curvePts = [];
  for (let f = 0; f <= 8; f += 0.25) {
    const score = f === 0 ? 0 : termFrequencyScore(f, TOKENS.d4.length);
    const x = gx0 + (f / 8) * gw;
    const y = gy0 - (score / maxY) * gh;
    curvePts.push([x, y]);
  }

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sf = showFactors.value;
    const sr = showRarity.value;
    const si = showIdf.value;
    const sl = showLen.value;
    const sc = showContrib.value;
    const ss = showSat.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const f1Score = termFrequencyScore(1, TOKENS.d4.length);
    const f2Score = termFrequencyScore(2, TOKENS.d4.length);
    const pt1X = gx0 + (1 / 8) * gw;
    const pt1Y = gy0 - (f1Score / maxY) * gh;
    const pt2X = gx0 + (2 / 8) * gw;
    const pt2Y = gy0 - (f2Score / maxY) * gh;

    const nodes = [
      // Left side: d1 BM25 decomposition
      txt(
        'RECIPE d1 DECOMPOSITION (k1 = 1.2, b = 0.75)',
        -855,
        -135,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),

      glassCell(-445, -45, 810, 108, si > 0.3 || sr > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: si > 0.3 ? 8 * pulse : 3,
      }),
      txt(
        `soup: df=${DOC_FREQUENCY.soup}/4 -> IDF = ${soupIdf.toFixed(3)}`,
        -820,
        -68,
        28,
        COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        `make: df=${DOC_FREQUENCY.make}/4 -> IDF = ${makeIdf.toFixed(3)}  (rarer!)`,
        -820,
        -24,
        28,
        COSMOS.emerald,
        'mono',
        'left',
      ),

      glassCell(-445, 92, 810, 108, sl > 0.3 ? COSMOS.amber : COSMOS.muted, {
        fill: sl > 0.3 ? '#241c10' : '#12182b',
        glow: sl > 0.3 ? 8 * pulse : 3,
      }),
      txt(
        `Length: |d1| = ${TOKENS.d1.length} vs avgdl = ${AVERAGE_LENGTH.toFixed(2)}`,
        -820,
        69,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ),
      txt(
        `Length factor = 0.25 + 0.75*(11/8.25) = ${lenFactor.toFixed(2)}`,
        -820,
        114,
        28,
        COSMOS.amber,
        'mono',
        'left',
      ),

      // Term contributions to d1
      txt('make', -855, 200, 28, COSMOS.emerald, 'mono', 'left'),
      meterBar(-725, 200, 480, 34, d1.contributions.make / 1.8, COSMOS.emerald, {
        opacity: Math.max(0.6, sc),
      }),
      txt(`+${d1.contributions.make.toFixed(3)}`, -220, 200, 28, COSMOS.emerald, 'mono', 'left'),

      txt('soup', -855, 256, 28, COSMOS.gold, 'mono', 'left'),
      meterBar(-725, 256, 480, 34, d1.contributions.soup / 1.8, COSMOS.gold, {
        opacity: Math.max(0.6, sc),
      }),
      txt(`+${d1.contributions.soup.toFixed(3)}`, -220, 256, 28, COSMOS.gold, 'mono', 'left'),

      txt(
        `Total BM25(d1) = ${d1.score.toFixed(3)}`,
        -855,
        322,
        32,
        COSMOS.cyan,
        'mono',
        'left',
      ).glow(sc > 0.4 ? 8 : 3, COSMOS.cyan),

      // Right side: Saturating TF curve plot
      txt('DIMINISHING RETURNS ON REPEATED "soup"', gx0, -135, 26, COSMOS.gold, 'mono', 'left'),
      line([gx0, gy0], [gx0 + gw, gy0], { stroke: COSMOS.muted, width: 2.2 }),
      line([gx0, gy0], [gx0, gy0 - gh], { stroke: COSMOS.muted, width: 2.2 }),
      txt('tf (term count)', gx0 + gw - 110, gy0 + 42, 26, COSMOS.muted, 'mono'),
      txt('score', gx0 - 10, gy0 - gh - 30, 26, COSMOS.muted, 'mono', 'left'),

      glowingTrail(curvePts, {
        color: COSMOS.cyan,
        width: 4.4,
        glow: ss > 0.3 ? 10 * pulse : 4,
        opacity: Math.max(0.75, sf),
      }),

      // Points at tf=1 and tf=2
      glowDot(pt1X, pt1Y, { radius: 8, color: COSMOS.emerald, opacity: Math.max(0.7, ss) }),
      txt(`tf=1: ${f1Score.toFixed(2)}`, pt1X + 28, pt1Y + 42, 26, COSMOS.emerald, 'mono', 'left'),
      glowDot(pt2X, pt2Y, { radius: 9, color: COSMOS.amber, opacity: Math.max(0.7, ss) }),
      txt(
        `tf=2: ${f2Score.toFixed(2)} (< 2x!)`,
        pt2X - 40,
        pt2Y - 82,
        26,
        COSMOS.amber,
        'mono',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, eq, live);
  runPhase(s, c, phase, 14);

  c.on('bm25-beat-1-focus-1', () => s.play(showFactors.to(1, { duration: 0.45 })));
  c.on('bm25-beat-1-focus-2', () => s.play(showRarity.to(1, { duration: 0.45 })));
  c.on('bm25-beat-2-focus-1', () => s.play(showIdf.to(0.5, { duration: 0.35 })));
  c.on('bm25-numeric-idf', () => s.play(showIdf.to(1, { duration: 0.45 })));
  c.on('bm25-length-factor', () => s.play(showLen.to(1, { duration: 0.45 })));
  c.on('bm25-beat-3-focus-1', () => s.play(showContrib.to(1, { duration: 0.45 })));
  c.on('bm25-saturation', () =>
    s.play(showSat.to(1, { duration: remainDuration(c, 'bm25-saturation', 0.45) })),
  );
}
