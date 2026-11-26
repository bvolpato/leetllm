// Scene 20: Compress named subvector owners and retain the approximation (Product Quantization)
import {
  COSMOS,
  PQ_CODE_BYTES,
  PQ_FLOAT_BYTES,
  PQ_ORIG,
  PQ_RECON,
  PQ_SAVING_PCT,
  PQ_SQ_ERRORS,
  PQ_TOTAL_SQ_ERR,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  meterBar,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function pqCode(s, c) {
  const phase = s.value(0);
  const showSplit = s.value(0);
  const showRecon = s.value(0);
  const showErr = s.value(0);
  const showPayload = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Product Quantization:', 'Subvector Codebooks'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'PQ COMPRESSION · M SUBSPACES x 8-BIT CODEWORDS · 98.44% PAYLOAD SAVING',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const ss = showSplit.value;
    const sr = showRecon.value;
    const se = showErr.value;
    const sp = showPayload.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Left: Concrete 2-subspace example [1.1, 0.9 | -0.8, -1.2] -> [1, 1 | -1, -1]
      txt('2-SUBSPACE WORKED EXAMPLE (4D -> 2 CODES)', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),

      glassCell(-640, -108, 410, 134, ss > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10213b',
        glow: ss > 0.3 ? 8 : 3,
      }),
      txt('SUBSPACE 1 (dims 0..1)', -640, -144, 26, COSMOS.cyan, 'mono'),
      txt(`orig:  [${PQ_ORIG[0]}, ${PQ_ORIG[1]}]`, -640, -102, 27, COSMOS.ink, 'mono'),
      txt(
        `code -> [${PQ_RECON[0].toFixed(1)}, ${PQ_RECON[1].toFixed(1)}]`,
        -640,
        -66,
        26,
        COSMOS.emerald,
        'mono',
      ),

      glassCell(-200, -108, 420, 134, ss > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: '#231e10',
        glow: ss > 0.3 ? 8 : 3,
      }),
      txt('SUBSPACE 2 (dims 2..3)', -200, -144, 26, COSMOS.gold, 'mono'),
      txt(`orig:  [${PQ_ORIG[2]}, ${PQ_ORIG[3]}]`, -200, -102, 27, COSMOS.ink, 'mono'),
      txt(
        `code -> [${PQ_RECON[2].toFixed(1)}, ${PQ_RECON[3].toFixed(1)}]`,
        -200,
        -66,
        26,
        COSMOS.emerald,
        'mono',
      ),

      // Squared reconstruction error breakdown
      glassCell(-420, 64, 850, 144, se > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: se > 0.3 ? '#29111a' : '#12182b',
        glow: se > 0.3 ? 9 * pulse : 2,
      }),
      txt('SQUARED RECONSTRUCTION ERROR', -815, 22, 26, COSMOS.rose, 'mono', 'left'),
      txt(
        `${PQ_SQ_ERRORS.map((e) => e.toFixed(2)).join(' + ')} = ${PQ_TOTAL_SQ_ERR.toFixed(2)}`,
        -815,
        66,
        29,
        COSMOS.ink,
        'mono',
        'left',
      ),
      txt(
        'Quantization error can reorder close neighbors',
        -815,
        108,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glassCell(-420, 224, 850, 118, sr > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10182d',
        glow: 3,
      }),
      txt('SHARED CODEBOOK ARCHITECTURE', -815, 196, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        '8 bits / subspace -> 256 centroids per subspace; M must divide d',
        -815,
        240,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      // Right: 1536D FP32 (6144 B) vs 96 x 8-bit PQ (96 B) -> 98.44% reduction
      txt('1,536-D VECTOR PAYLOAD (M = 96, 8-BIT)', 110, -205, 26, COSMOS.emerald, 'mono', 'left'),

      glassCell(495, -90, 750, 138, sp > 0.3 ? COSMOS.amber : COSMOS.muted, {
        fill: '#231b10',
        glow: sp > 0.3 ? 7 : 2,
      }),
      txt('UNCOMPRESSED FP32 (1,536 x 4 B)', 150, -128, 26, COSMOS.amber, 'mono', 'left'),
      txt(`${PQ_FLOAT_BYTES} bytes / vector`, 150, -86, 32, COSMOS.ink, 'mono', 'left'),
      meterBar(150, -42, 670, 24, 1.0, COSMOS.amber),

      glassCell(495, 86, 750, 138, sp > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: sp > 0.3 ? '#0e2824' : '#12182b',
        glow: sp > 0.3 ? 10 * pulse : 2,
      }),
      txt('PQ CODE (96 SUBVECTORS x 16 DIMS x 1 B)', 150, 48, 26, COSMOS.emerald, 'mono', 'left'),
      txt(
        `${PQ_CODE_BYTES} bytes / vector  (-${PQ_SAVING_PCT.toFixed(2)}%!)`,
        150,
        90,
        32,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      meterBar(150, 134, 670, 24, PQ_CODE_BYTES / PQ_FLOAT_BYTES, COSMOS.emerald),

      glassCell(495, 242, 750, 102, COSMOS.muted, { fill: '#10182d', glow: 2 }),
      txt(
        'Excludes codebooks, IDs, graph links & retained originals',
        495,
        244,
        26,
        COSMOS.muted,
        'sans',
      ),

      glowDot(-840, 358, { radius: 6, color: COSMOS.emerald }),
      txt(
        'Train and evaluate PQ codebooks on the exact distribution of vectors stored in the index',
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

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('pq-split', () => s.play(showSplit.to(0.4, { duration: 0.35 })));
  c.on('pq-index', () => s.play(showSplit.to(0.7, { duration: 0.35 })));
  c.on('pq-choices', () => s.play(showSplit.to(1, { duration: 0.35 })));
  c.on('pq-original', () => s.play(showRecon.to(0.5, { duration: 0.35 })));
  c.on('pq-codewords', () => s.play(showRecon.to(1, { duration: 0.35 })));
  c.on('pq-error', () => s.play(showErr.to(1, { duration: 0.45 })));
  c.on('pq-code-bytes', () => s.play(showPayload.to(0.4, { duration: 0.35 })));
  c.on('pq-float-bytes', () => s.play(showPayload.to(0.75, { duration: 0.35 })));
  c.on('pq-saving', () =>
    s.play(showPayload.to(1, { duration: remainDuration(c, 'pq-saving', 0.45) })),
  );
}
