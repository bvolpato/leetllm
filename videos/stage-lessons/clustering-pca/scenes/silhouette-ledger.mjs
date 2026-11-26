// Scene 08 (silhouette-ledger): "What does the fourth center buy?"
// Per-point silhouette ledger for A..F + k=2/3/4 means (0.56, 0.76, 0.51) + glowing inertia elbow curve.
import {
  COSMOS,
  DANGER_COLOR,
  GROUP_COLOR,
  LETTERS,
  QUERY_COLOR,
  aura,
  clusterTrials,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lumBar,
  rule,
  runAmbientPhase,
  silhouette,
  tweenCue,
  txt,
  xy,
} from '../parts.mjs';

const K2 = clusterTrials[0];
const K3 = clusterTrials[1];
const K4 = clusterTrials[2];
const SIL_K3 = xy.map((_, i) => silhouette(xy, K3.labels, i));
const SIL_K4 = xy.map((_, i) => silhouette(xy, K4.labels, i));

export default function silhouetteLedger(s, c) {
  const phase = s.value(0);
  const showOwn = s.value(0);
  const showOther = s.value(0);
  const showScore = s.value(0);
  const showSingle = s.value(0);
  const showCollect = s.value(0);
  const showMean = s.value(0);
  const showElbow = s.value(0);
  const showThird = s.value(0);
  const showFourth = s.value(0);
  const showSigns = s.value(0);
  const showRead = s.value(0);

  const bgAura = aura(0, 20, 620, '#133a4a30', '#2a1c4f18');
  const title = heroTitle(['What Does the Fourth', 'Center Actually Buy?'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: QUERY_COLOR,
    eyebrow: 'SILHOUETTE LEDGER & ELBOW CURVE',
  });

  const eqA = glowTex(
    `s(A) = \\frac{${SIL_K3[0].b.toFixed(2)} - ${SIL_K3[0].a.toFixed(2)}}{${SIL_K3[0].b.toFixed(2)}} = ${SIL_K3[0].score.toFixed(2)}`,
    { x: -455, y: -235, size: 34, color: COSMOS.emerald, glow: 7 },
  );

  const live = guardedDynamic(s.value(1), () => {
    const isK4 = showSingle.value > 0.5 && showCollect.value < 0.5;
    const rows = isK4 ? SIL_K4 : SIL_K3;
    const nodes = [
      txt(
        isK4 ? 'PER-POINT SILHOUETTES (k = 4: SINGLETONS = 0)' : 'PER-POINT SILHOUETTES (k = 3)',
        -855,
        -152,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
    ];

    LETTERS.forEach((L, i) => {
      const y = -95 + i * 58;
      const sc = rows[i].score;
      const bw = Math.max(6, sc * 320);
      const col = sc === 0 ? COSMOS.amber : GROUP_COLOR[K3.labels[i]];
      const vis = i === 0 ? 1 : Math.max(0.3, showCollect.value);
      nodes.push(
        txt(L, -855, y, 28, col, 'mono', 'left').opacity(vis),
        lumBar(-795 + bw / 2, y, bw, 34, { color: col, fillOpacity: 0.72, glow: 7, opacity: vis }),
        txt(
          sc === 0
            ? '0.00 (singleton)'
            : `${sc.toFixed(2)}  (a=${rows[i].a.toFixed(2)}, b=${rows[i].b.toFixed(2)})`,
          -775 + bw,
          y,
          26,
          col,
          'mono',
          'left',
        ).opacity(vis),
      );
    });

    // Right side: Inertia elbow curve (k = 2, 3, 4) + mean silhouette badges
    const gx0 = 140;
    const gy0 = 135;
    const gw = 660;
    const gh = 330;
    const kx = (k) => gx0 + ((k - 1.7) / 2.6) * gw;
    const jy = (j) => gy0 - (j / 22) * gh;
    const pts = [K2, K3, K4].map((tr) => [kx(tr.k), jy(tr.inertia)]);

    nodes.push(
      txt('INERTIA ELBOW CURVE', 470, -245, 26, QUERY_COLOR, 'mono'),
      rule(gx0, gy0, gx0 + gw, gy0, COSMOS.muted, 2.5).opacity(0.8),
      rule(gx0, gy0 - gh, gx0, gy0, COSMOS.muted, 2.5).opacity(0.8),
      glowingTrail(pts, {
        gradientColors: [COSMOS.cyan, COSMOS.emerald, COSMOS.amber],
        width: 4.5,
        glow: 10,
        opacity: 0.45 + 0.55 * showElbow.value,
      }),
    );

    [K2, K3, K4].forEach((tr, idx) => {
      const [px, py] = pts[idx];
      const col = tr.k === 3 ? COSMOS.emerald : tr.k === 4 ? COSMOS.amber : COSMOS.cyan;
      nodes.push(
        glowDot(px, py, { radius: tr.k === 3 ? 10 : 8, color: col, glow: 12 }),
        txt(`k=${tr.k}`, px, gy0 + 36, 26, col, 'mono'),
        txt(`J=${tr.inertia.toFixed(2)}`, px + (tr.k === 3 ? 44 : 0), py - 48, 26, col, 'mono'),
      );
    });

    if (showMean.value > 0.02) {
      nodes.push(
        txt(
          `Means:  k=2 (${K2.silhouette.toFixed(2)})  ·  k=3 (${K3.silhouette.toFixed(2)})  ·  k=4 (${K4.silhouette.toFixed(2)})`,
          -855,
          302,
          28,
          COSMOS.emerald,
          'mono',
          'left',
        )
          .glow(6, COSMOS.emerald)
          .opacity(showMean.value),
      );
    }

    const t3Op = showThird.value * Math.max(0, 1 - showFourth.value * 2.6);
    if (t3Op > 0.02) {
      nodes.push(
        txt(
          'k = 3 cuts inertia sharply (the elbow!)',
          140,
          222,
          28,
          COSMOS.emerald,
          'sans',
          'left',
        ).opacity(t3Op),
      );
    }
    const t4Op = Math.max(0, (showFourth.value - 0.45) / 0.55);
    if (t4Op > 0.02) {
      nodes.push(
        txt(
          'k = 4 barely lowers J, hurts silhouette',
          140,
          222,
          28,
          COSMOS.amber,
          'sans',
          'left',
        ).opacity(t4Op),
      );
    }
    if (showSigns.value > 0.02) {
      nodes.push(
        txt(
          's < 0: closer to other group · s = 0: tie/singleton',
          110,
          282,
          26,
          DANGER_COLOR,
          'mono',
          'left',
        ).opacity(showSigns.value),
      );
    }
    if (showRead.value > 0.02) {
      nodes.push(
        txt(
          'Always inspect actual messages to confirm cluster meaning',
          -855,
          372,
          28,
          COSMOS.cyan,
          'sans',
          'left',
        ).opacity(showRead.value),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'own', showOwn, 1, { duration: 0.4 });
  tweenCue(s, c, 'other', showOther, 1, { duration: 0.4 });
  c.show('score', eqA);
  tweenCue(s, c, 'score', showScore, 1, { duration: 0.4 });
  tweenCue(s, c, 'single', showSingle, 1, { duration: 0.45 });
  tweenCue(s, c, 'collect', showCollect, 1, { duration: 0.45 });
  tweenCue(s, c, 'mean', showMean, 1, { duration: 0.45 });
  tweenCue(s, c, 'elbow', showElbow, 1, { duration: 0.45 });
  tweenCue(s, c, 'third', showThird, 1, { duration: 0.4 });
  tweenCue(s, c, 'fourth', showFourth, 1, { duration: 0.4 });
  tweenCue(s, c, 'signs', showSigns, 1, { duration: 0.45 });
  tweenCue(s, c, 'read', showRead, 1, { duration: 0.45 });
}
