// Scene 9: From a possible answer to a search vector (HyDE embedding average + 3D projection)
import {
  COSMOS,
  HYDE_MEAN,
  HYDE_PROXIES,
  aura,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  makeHyde3D,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function hydeVectors(s, c) {
  const phase = s.value(0);
  const showEncode = s.value(0);
  const showAverage = s.value(0);
  const showMean = s.value(0);
  const showCompat = s.value(0);

  const bgAura = aura(0, 10, 700, '#10345e26', '#211c5218');
  const title = heroTitle(['From a Possible Answer', 'to a Search Vector'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'HyDE · HYPOTHETICAL DOCUMENT EMBEDDINGS · CENTROID VECTOR',
  });

  const formula = glowTex('\\hat{\\mathbf{v}}_q = \\frac{1}{N}\\sum_{k=1}^{N} f(\\hat{d}_k)', {
    x: 520,
    y: -365,
    size: 38,
    color: COSMOS.emerald,
    glow: 8,
  });

  const { view: stage3d, orbit: orbit3d } = makeHyde3D(590, 25, phase, {
    meanProgress: () => Math.max(0.2, showAverage.value),
  });

  const live = guardedDynamic(s.value(1), () => {
    const se = showEncode.value;
    const sa = showAverage.value;
    const sm = showMean.value;
    const sc = showCompat.value;
    const encoded = se > 0.35;
    const averaging = sa > 0.35;
    const ready = sm > 0.5;

    const colXs = [-255, -75, 105];
    const nodes = [
      txt('3D CORPUS EMBEDDING SPACE', 590, -278, 26, COSMOS.cyan, 'mono'),
      txt(
        ready ? 'Centroid [0.30, 0.70, 0.30] searches corpus' : 'Two hypothetical passage vectors',
        590,
        360,
        26,
        ready ? COSMOS.emerald : COSMOS.muted,
        'sans',
      ),

      // Question + column headers
      txt(
        'Q: "Can we increase throughput for launch week?"',
        -855,
        -210,
        27,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt('HYPOTHETICAL PASSAGE', -835, -146, 26, COSMOS.muted, 'mono', 'left'),
      txt('d1', colXs[0], -146, 26, COSMOS.muted, 'mono'),
      txt('d2', colXs[1], -146, 26, COSMOS.muted, 'mono'),
      txt('d3', colXs[2], -146, 26, COSMOS.muted, 'mono'),

      // Draft 1
      glassCell(-335, -70, 1040, 96, encoded ? COSMOS.blue : COSMOS.dim, {
        fill: '#10203a',
        glow: encoded ? 7 : 2,
      }),
      txt('Draft 1: "Temporary quota increase."', -835, -68, 26, COSMOS.blue, 'sans', 'left'),
      ...HYDE_PROXIES[0].map((v, j) =>
        txt(encoded ? v.toFixed(1) : '...', colXs[j], -68, 34, COSMOS.blue, 'mono'),
      ),

      // Draft 2
      glassCell(-335, 44, 1040, 96, encoded ? COSMOS.cyan : COSMOS.dim, {
        fill: '#0e2438',
        glow: encoded ? 7 : 2,
      }),
      txt('Draft 2: "Offline jobs in batches."', -835, 46, 26, COSMOS.cyan, 'sans', 'left'),
      ...HYDE_PROXIES[1].map((v, j) =>
        txt(encoded ? v.toFixed(1) : '...', colXs[j], 46, 34, COSMOS.cyan, 'mono'),
      ),

      // Mean row (strictly withheld until c.after('qx-mean-result'))
      glassCell(
        -335,
        184,
        1040,
        132,
        ready ? COSMOS.emerald : averaging ? COSMOS.gold : COSMOS.dim,
        {
          fill: ready ? '#0d2723' : '#11182c',
          glow: ready ? 10 : 3,
        },
      ),
      txt('COLUMN MEAN  (pair / 2)', -835, 152, 26, COSMOS.emerald, 'mono', 'left'),
      txt(
        sc > 0.4 ? 'Normalize for cosine; match encoder' : 'Discard drafts; cite real docs',
        -835,
        208,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
      ...HYDE_MEAN.map((v, j) =>
        txt(
          averaging ? `${HYDE_PROXIES[0][j].toFixed(1)}+${HYDE_PROXIES[1][j].toFixed(1)}` : '...',
          colXs[j],
          152,
          26,
          COSMOS.muted,
          'mono',
        ),
      ),
      ...HYDE_MEAN.map((v, j) =>
        txt(
          ready ? v.toFixed(2) : '?',
          colXs[j],
          208,
          36,
          ready ? COSMOS.emerald : COSMOS.gold,
          'mono',
        ),
      ),

      glowDot(-840, 368, { radius: 6, color: ready ? COSMOS.emerald : COSMOS.gold }),
      txt(
        ready
          ? 'Mean vector [0.30, 0.70, 0.30] searches the index · keep encoder & metric aligned'
          : 'Encode hypothetical passages with the corpus document encoder, then average',
        -812,
        370,
        28,
        ready ? COSMOS.emerald : COSMOS.gold,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, formula, stage3d, live);
  runPhase(s, c, phase, 12);
  orbit3d(s, c);

  c.on('hyde-encode', () => s.play(showEncode.to(1, { duration: 0.45 })));
  c.on('hyde-average', () => s.play(showAverage.to(1, { duration: 0.5 })));
  c.after('qx-mean-result', () => s.play(showMean.to(1, { duration: 0.45 })));
  c.on('hyde-compatible', () =>
    s.play(showCompat.to(1, { duration: remainDuration(c, 'hyde-compatible', 0.45) })),
  );
}
