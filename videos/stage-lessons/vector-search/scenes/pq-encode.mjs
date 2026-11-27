// Scene 10: What gets stored in place of a vector? (PQ split subvectors -> code [1,2] -> [2,0,0,2], 32x 96B compression, OPQ rotation)
import {
  COMP_FIX,
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  meterBar,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function pqEncode(s, c) {
  const showSplit = s.value(0);
  const showCode = s.value(0);
  const showBudget = s.value(0);
  const showOpq = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['What Gets Stored in', 'Place of a Vector?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'PRODUCT QUANTIZATION · SUBSPACE CODEBOOKS · 32X COMPRESSION · OPQ',
  });

  const live = guardedDynamic(s.value(1), () => {
    const ss = showSplit.value;
    const sc = showCode.value;
    const sb = showBudget.value;
    const so = showOpq.value;

    const rotAngle = so * 0.52;
    const rx = 595;
    const ry = 135;
    const a1 = [rx + Math.cos(rotAngle) * 110, ry - Math.sin(rotAngle) * 110];
    const a2 = [rx + Math.cos(rotAngle + 0.8) * 110, ry - Math.sin(rotAngle + 0.8) * 110];

    const nodes = [
      // Left: Subvector split -> Codebook lookup -> Code [1, 2] -> Reconstruction [2, 0, 0, 2]
      txt('1. SUBSPACE CODEBOOK ENCODING', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),

      glassCell(-465, -94, 780, 146, ss > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: ss > 0.3 ? 8 : 2,
      }),
      txt(
        'Subvector 0 -> nearest center ID = 1  (2, 0)',
        -825,
        -130,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt(
        'Subvector 1 -> nearest center ID = 2  (0, 2)',
        -825,
        -86,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        'Stored code: [ 1, 2 ]  ->  Approx [ 2, 0, 0, 2 ]',
        -825,
        -46,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),

      // Left bottom: 768-dim x 4B = 3,072B -> 96 subvectors x 1B = 96B (32x smaller!)
      txt('2. 768-DIM MEMORY BUDGET (32x SMALLER)', -855, 18, 26, COSMOS.gold, 'mono', 'left'),

      glassCell(-465, 146, 780, 198, sb > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: '#231c10',
        glow: sb > 0.3 ? 9 : 2,
      }),
      txt(
        `Raw fp32: 768 x 4B = ${COMP_FIX.rawBytes} bytes / vector`,
        -825,
        78,
        26,
        COSMOS.rose,
        'mono',
        'left',
      ),
      meterBar(-825, 114, 690, 16, 1.0, COSMOS.rose),
      txt(
        `PQ code:  96 chunks x 1B = ${COMP_FIX.codeBytes} bytes (32x!)`,
        -825,
        144,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      meterBar(-825, 180, 690, 16, 1 / 32, COSMOS.emerald),
      txt(
        `Shared codebooks: ${COMP_FIX.codebookBytes / 1024} KiB (96 x 256 x 8 x 4B)`,
        -825,
        214,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),

      // Right: OPQ orthogonal rotation preserving pairwise distance
      txt('3. OPQ: ORTHOGONAL ROTATION', 110, -205, 26, COSMOS.emerald, 'mono', 'left'),

      glassCell(495, 22, 750, 404, so > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e182e',
        glow: so > 0.3 ? 8 : 2,
      }),
      txt(
        'Square orthogonal R preserves ||Rx - Ry||',
        145,
        -138,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt('Learns rotation + codebooks together to cut', 145, -94, 26, COSMOS.ink, 'sans', 'left'),
      txt('quantization error along subspace cuts', 145, -58, 26, COSMOS.ink, 'sans', 'left'),

      // Rotating axes & pair of arrows
      line([rx - 150, ry], [rx + 150, ry], { stroke: COSMOS.muted, width: 1.8, dash: [6, 6] }),
      line([rx, ry - 125], [rx, ry + 75], { stroke: COSMOS.muted, width: 1.8, dash: [6, 6] }),
      line([rx, ry], a1, { stroke: COSMOS.cyan, width: 4.0 }).glow(8, COSMOS.cyan),
      line([rx, ry], a2, { stroke: COSMOS.gold, width: 4.0 }).glow(8, COSMOS.gold),
      line(a1, a2, { stroke: COSMOS.emerald, width: 3.0, dash: [6, 5] }).glow(7, COSMOS.emerald),
      glowDot(a1[0], a1[1], { radius: 8, color: COSMOS.cyan }),
      glowDot(a2[0], a2[1], { radius: 8, color: COSMOS.gold }),
      txt('Same tip distance!', 145, 130, 26, COSMOS.gold, 'mono', 'left'),
      txt('Transform query & DB identically', 145, 180, 26, COSMOS.muted, 'sans', 'left'),

      glowDot(-840, 358, { radius: 6, color: sc > 0.3 ? COSMOS.emerald : COSMOS.cyan }),
      txt(
        'PQ stores tiny centroid IDs per subspace; OPQ aligns axes before coding to lower error',
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

  c.on('pq-split-chunks', () => s.play(showSplit.to(0.5, { duration: 0.35 })));
  c.on('pq-codebooks', () => s.play(showSplit.to(1, { duration: 0.35 })));
  c.on('pq-left-link', () => s.play(showCode.to(0.35, { duration: 0.3 })));
  c.on('pq-left-id', () => s.play(showCode.to(0.6, { duration: 0.3 })));
  c.on('pq-selected-ids', () => s.play(showCode.to(0.8, { duration: 0.3 })));
  c.on('pq-reconstruct', () => s.play(showCode.to(1, { duration: 0.35 })));
  c.on('pq-encode-b2', () => s.play(showBudget.to(0.3, { duration: 0.3 })));
  c.on('pq-eight-coordinates', () => s.play(showBudget.to(0.5, { duration: 0.3 })));
  c.on('pq-byte-index', () => s.play(showBudget.to(0.7, { duration: 0.3 })));
  c.on('pq-code-budget', () => s.play(showBudget.to(0.85, { duration: 0.3 })));
  c.on('pq-shared-books', () => s.play(showBudget.to(1, { duration: 0.35 })));
  c.on('pq-encode-b3', () =>
    s.play(showOpq.to(1, { duration: remainDuration(c, 'pq-encode-b3', 0.45) })),
  );
}
