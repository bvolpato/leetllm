// Scene 12: Separate direction from magnitude (Dot product vs cosine similarity contract)
import {
  COSMOS,
  CRED_QUERY_VEC,
  aura,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  meterBar,
  remainDuration,
  txt,
  vectorCosine,
  vectorDot,
} from '../parts.mjs';

export default function similarityContract(s, c) {
  const showDenom = s.value(0);
  const showUnit = s.value(0);
  const showZero = s.value(0);
  const showA = s.value(0);
  const showB = s.value(0);
  const showDirScale = s.value(0);
  const showContract = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2e1a4e16');
  const title = heroTitle(['Separate Direction', 'from Magnitude'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'METRIC CONTRACT · DOT PRODUCT vs COSINE · NORMALIZATION POLICY',
  });

  const eq = glowTex('\\cos(q, d) = \\frac{q \\cdot d}{\\|q\\|_2 \\, \\|d\\|_2}', {
    size: 38,
    color: COSMOS.cyan,
  }).at(465, -365);

  const candA = [1, 0.8, 0];
  const candB = [6, 0, 0];
  const dotA = vectorDot(CRED_QUERY_VEC, candA);
  const cosA = vectorCosine(CRED_QUERY_VEC, candA);
  const dotB = vectorDot(CRED_QUERY_VEC, candB);
  const cosB = vectorCosine(CRED_QUERY_VEC, candB);

  const live = guardedDynamic(s.value(1), () => {
    const sd = showDenom.value;
    const su = showUnit.value;
    const sz = showZero.value;
    const sa = showA.value;
    const sb = showB.value;
    const sds = showDirScale.value;
    const sc = showContract.value;

    const nodes = [
      // Left: Candidate A vs Candidate B magnitude flip
      txt('FIXED QUERY q = [1.0, 0.8, 0]', -855, -205, 26, COSMOS.gold, 'mono', 'left'),

      glassCell(-455, -75, 820, 168, sa > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2624',
        glow: sa > 0.3 ? 9 : 3,
      }),
      txt('CANDIDATE A = [1.0, 0.8, 0]  (ALIGNED)', -840, -124, 26, COSMOS.emerald, 'mono', 'left'),
      txt(`dot = ${dotA.toFixed(2)}`, -840, -72, 27, COSMOS.cyan, 'mono', 'left'),
      meterBar(-645, -72, 360, 28, dotA / 6.2, COSMOS.cyan),
      txt(`cos = ${cosA.toFixed(3)}`, -840, -24, 27, COSMOS.emerald, 'mono', 'left'),
      meterBar(-645, -24, 360, 28, cosA, COSMOS.emerald),
      txt('COSINE WINS', -265, -24, 26, COSMOS.emerald, 'mono', 'left'),

      glassCell(-455, 132, 820, 168, sb > 0.3 ? COSMOS.amber : COSMOS.muted, {
        fill: sb > 0.3 ? '#261b10' : '#12182b',
        glow: sb > 0.3 ? 9 : 3,
      }),
      txt('CANDIDATE B = [6.0, 0.0, 0]  (SCALED 6x)', -840, 84, 26, COSMOS.amber, 'mono', 'left'),
      txt(`dot = ${dotB.toFixed(2)}`, -840, 134, 27, COSMOS.amber, 'mono', 'left'),
      meterBar(-645, 134, 360, 28, dotB / 6.2, COSMOS.amber),
      txt('DOT WINS!', -265, 134, 26, COSMOS.amber, 'mono', 'left'),
      txt(`cos = ${cosB.toFixed(3)}`, -840, 182, 27, COSMOS.rose, 'mono', 'left'),
      meterBar(-645, 182, 360, 28, cosB, COSMOS.rose),

      // Right: Metric & normalization contract rules
      txt('METRIC & NORMALIZATION RULES', 120, -205, 26, COSMOS.cyan, 'mono', 'left'),
      glassCell(495, -92, 750, 128, su > 0.3 || sd > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: su > 0.3 ? 8 : 2,
      }),
      txt('UNIT VECTORS: dot(q, d) == cos(q, d)', 150, -122, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        'Unit-normalizing docs keeps ranking invariant',
        150,
        -78,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        'Zero vector has no direction -> define fallback',
        150,
        -44,
        26,
        sz > 0.3 ? COSMOS.rose : COSMOS.muted,
        'sans',
        'left',
      ),

      glassCell(495, 76, 750, 134, sds > 0.3 ? COSMOS.amber : COSMOS.muted, {
        fill: sds > 0.3 ? '#241c10' : '#12182b',
        glow: sds > 0.3 ? 8 : 2,
      }),
      txt('MODEL DECISION, NOT AUTO-REPAIR', 150, 42, 26, COSMOS.amber, 'mono', 'left'),
      txt('DPR / MIPS models can encode signal in norm', 150, 84, 26, COSMOS.ink, 'sans', 'left'),
      txt(
        'Switching to cosine alters what the model learned',
        150,
        120,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glassCell(495, 240, 750, 118, sc > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: sc > 0.3 ? '#0e2824' : '#12182b',
        glow: sc > 0.3 ? 8 : 2,
      }),
      txt('LOCK INDEX + QUERY CONTRACT', 150, 210, 26, COSMOS.emerald, 'mono', 'left'),
      txt(
        'Match metric, norm, model version & preprocessing',
        150,
        254,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: COSMOS.cyan }),
      txt(
        'Multiplying a vector by a positive scalar changes raw dot product without rotating direction',
        -812,
        360,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, eq, live);

  c.on('cosine-denominator', () => s.play(showDenom.to(1, { duration: 0.4 })));
  c.on('unit-dot', () => s.play(showUnit.to(1, { duration: 0.4 })));
  c.on('zero-vector', () => s.play(showZero.to(1, { duration: 0.4 })));
  c.on('aligned-a', () => s.play(showA.to(1, { duration: 0.45 })));
  c.on('scaled-b', () => s.play(showB.to(1, { duration: 0.45 })));
  c.on('direction-scale', () => s.play(showDirScale.to(1, { duration: 0.45 })));
  c.on('metric-contract', () =>
    s.play(showContract.to(1, { duration: remainDuration(c, 'metric-contract', 0.45) })),
  );
}
