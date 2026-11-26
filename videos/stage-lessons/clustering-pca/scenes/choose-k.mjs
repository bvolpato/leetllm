// Scene 07 (choose-k): "Expose the groups behind the score"
// Live k=2, k=3, k=4 partition switch + own-group a(A) vs competing-group b(A) silhouette construction + mean bars.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  GROUP_COLOR,
  LETTERS,
  QUERY_COLOR,
  aura,
  clusterTrials,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  makePlot,
  runAmbientPhase,
  silhouette,
  tweenCue,
  txt,
  xy,
} from '../parts.mjs';

const K2 = clusterTrials[0];
const K3 = clusterTrials[1];
const K4 = clusterTrials[2];
const SIL_A = silhouette(xy, K3.labels, 0);

export default function chooseK(s, c) {
  const phase = s.value(0);
  const activeK = s.value(2); // 2, 3, or 4
  const showOwn = s.value(0);
  const showOther = s.value(0);
  const showMeans = s.value(0);
  const showSingletons = s.value(0);
  const showClear = s.value(0);

  const bgAura = aura(0, 20, 620, '#133a4a30', '#2a1c4f18');
  const title = heroTitle(['Expose the Groups', 'Behind the Score'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.emerald,
    eyebrow: 'CHOOSING K · SILHOUETTE VS INERTIA',
  });

  const eqSil = glowTex('s(i) = \\frac{b(i) - a(i)}{\\max(a(i),\\, b(i))}', {
    x: 455,
    y: -255,
    size: 40,
    color: QUERY_COLOR,
    glow: 7,
  });

  const live = guardedDynamic(s.value(1), () => {
    const kNow = Math.round(activeK.value);
    const trial = kNow === 2 ? K2 : kNow === 4 ? K4 : K3;
    const plot = makePlot(-820, -235, 760, 460, { x: [0, 10], y: [0, 5.2] });

    const nodes = [
      ...plot.axesNodes(0.85),
      txt(
        `PARTITION  k = ${trial.k}   ·   inertia = ${trial.inertia.toFixed(2)}`,
        -855,
        -275,
        28,
        COSMOS.cyan,
        'mono',
        'left',
      ),
    ];

    // Own-group link A -> B and nearest-competing links A -> C, D
    if (showOwn.value > 0.02 && kNow === 3) {
      nodes.push(
        line(plot.pt(xy[0]), plot.pt(xy[1]), { stroke: COSMOS.emerald, width: 4.5 }).opacity(
          showOwn.value,
        ),
        txt(
          `a(A) = ${SIL_A.a.toFixed(2)} (own pair B)`,
          -855,
          295,
          28,
          COSMOS.emerald,
          'mono',
          'left',
        ).opacity(showOwn.value),
      );
    }
    if (showOther.value > 0.02 && kNow === 3) {
      nodes.push(
        line(plot.pt(xy[0]), plot.pt(xy[2]), {
          stroke: QUERY_COLOR,
          width: 3,
          dash: [8, 6],
        }).opacity(showOther.value),
        line(plot.pt(xy[0]), plot.pt(xy[3]), {
          stroke: QUERY_COLOR,
          width: 3,
          dash: [8, 6],
        }).opacity(showOther.value),
        txt(
          `b(A) = ${SIL_A.b.toFixed(2)} (nearest other group)`,
          -855,
          348,
          28,
          QUERY_COLOR,
          'mono',
          'left',
        ).opacity(showOther.value),
      );
    }

    // Plot points colored by active partition
    xy.forEach((p, i) => {
      const [px, py] = plot.pt(p);
      const col = GROUP_COLOR[trial.labels[i]];
      nodes.push(
        glowDot(px, py, { radius: 8.5, color: col, glow: 10 }),
        txt(LETTERS[i], px + (i === 0 ? -24 : 0), py + (i === 0 ? 32 : -28), 28, col, 'mono'),
      );
    });

    // Right side: mean silhouette comparison bars for k=2, 3, 4
    const rx = 105;
    nodes.push(txt('MEAN SILHOUETTE BY K', rx, -135, 26, COSMOS.cyan, 'mono', 'left'));
    [K2, K3, K4].forEach((tr, idx) => {
      const y = -58 + idx * 96;
      const bw = tr.silhouette * 440;
      const isActive = tr.k === kNow;
      const col = tr.k === 3 ? COSMOS.emerald : isActive ? QUERY_COLOR : COSMOS.muted;
      nodes.push(
        txt(`k = ${tr.k}`, rx, y, 30, col, 'mono', 'left'),
        lumBar(rx + 125 + bw / 2, y, bw, 44, {
          color: col,
          fillOpacity: isActive || showMeans.value > 0.5 ? 0.72 : 0.3,
          glow: isActive ? 10 : 5,
        }),
        txt(
          `${tr.silhouette.toFixed(2)}  (J=${tr.inertia.toFixed(2)})`,
          rx + 145 + bw,
          y,
          26,
          col,
          'mono',
          'left',
        ),
      );
    });

    if (showSingletons.value > 0.02) {
      nodes.push(
        txt(
          'k = 4 lowers inertia, but splits a pair into singletons (s = 0)',
          rx,
          245,
          26,
          COSMOS.amber,
          'sans',
          'left',
        ).opacity(showSingletons.value),
      );
    }
    if (showClear.value > 0.02) {
      nodes.push(
        txt(
          'Scores nominate k = 3; read messages to confirm',
          rx,
          312,
          26,
          COSMOS.cyan,
          'sans',
          'left',
        ).opacity(showClear.value),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  c.on('two', () => s.play(activeK.to(2, { duration: 0.3 })));
  c.on('three', () => s.play(activeK.to(3, { duration: 0.3 })));
  c.on('four', () => s.play(activeK.to(4, { duration: 0.3 })));
  c.on('return', () => s.play(activeK.to(3, { duration: 0.3 })));
  tweenCue(s, c, 'own', showOwn, 1, { duration: 0.45 });
  tweenCue(s, c, 'other', showOther, 1, { duration: 0.45 });
  c.show('formula', eqSil);
  tweenCue(s, c, 'means', showMeans, 1, { duration: 0.45 });
  tweenCue(s, c, 'singletons', showSingletons, 1, { duration: 0.45 });
  tweenCue(s, c, 'clear-search', showClear, 1, { duration: 0.45 });
}
