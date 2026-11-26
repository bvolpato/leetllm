// Scene 15: top-k: "Retain a fixed number of candidates"
// Luminous 5-token probability bars with a glowing top-k = 2 truncation curtain slicing
// away played, barked, waited -> renormalizing ran (0.45 -> 0.643) and slept (0.25 -> 0.357)
// while preserving their exact 1.80:1 ratio, then contrasting fixed k on sharp vs flat shapes.
import { line } from 'vizmatic/stage';
import { COSMOS, glowDot, glowTex, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import { BASE, ROLE, WORDS, cinemaAtmosphere, fmt, lumBar, playCue } from '../parts.mjs';

export default function topK(s, c) {
  const title = heroTitle(['Retain a fixed number', 'of candidates (top-k)'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.valid,
  });

  const cutProgress = s.value(0); // 0 -> 1 drops curtain & fades tail tokens
  const normProgress = s.value(0); // 0 -> 1 renormalizes ran & slept to sum = 1.00
  const showRatio = s.value(0);
  const showShapeNote = s.value(0);
  const stageVis = s.value(1);

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const cut = cutProgress.value;
    const norm = normProgress.value;
    const rat = showRatio.value;
    const shp = showShapeNote.value;

    const baseY = 200;
    const maxH = 385;
    const xs = [-560, -280, 0, 280, 560];
    const barW = 148;

    // Baseline rail
    nodes.push(line([-700, baseY], [700, baseY], { stroke: '#4c6294', width: 2.6 }).opacity(alpha));

    const vals = BASE.map((v, i) => (i < 2 ? v * (1 + norm * (1 / 0.7 - 1)) : v * (1 - cut)));
    const totalMass = vals.reduce((a, b) => a + b, 0);

    vals.forEach((v, i) => {
      const isKept = i < 2;
      const col = isKept ? ROLE.valid : ROLE.pruned;
      const h = Math.max(4, v * maxH);
      const itemA = isKept ? alpha : Math.max(0.18, 1 - 0.82 * cut) * alpha;

      if (v > 0.004) {
        nodes.push(
          lumBar(xs[i], baseY - h / 2, barW, h, {
            color: col,
            fillOpacity: isKept ? 0.46 : 0.22,
            strokeWidth: isKept ? 2.8 : 1.8,
            glow: isKept ? 11 : 3,
            radius: 8,
            opacity: itemA,
          }),
        );
      }

      nodes.push(
        txt(
          fmt(v, 3),
          xs[i],
          baseY - h - 34,
          30,
          isKept ? col : COSMOS.muted,
          'mono',
          'center',
        ).opacity(itemA),
        txt(
          WORDS[i],
          xs[i],
          baseY + 42,
          30,
          isKept ? COSMOS.ink : COSMOS.dim,
          'serif',
          'center',
        ).opacity(itemA),
      );
    });

    // Luminous top-k = 2 vertical truncation curtain between index 1 and 2
    const curtainX = -140;
    const curtainTop = baseY - maxH - 20;
    const curtainEnd = curtainTop + (maxH + 34) * Math.max(0.15, cut);
    nodes.push(
      line([curtainX, curtainTop], [curtainX, curtainEnd], {
        stroke: ROLE.winner,
        width: 4,
        dash: [9, 6],
      })
        .glow(10, ROLE.winner)
        .opacity(alpha),
      glowDot(curtainX, curtainEnd, { radius: 8, color: ROLE.winner, glow: 14, opacity: alpha }),
      txt('top-k = 2 cutoff', curtainX, curtainTop - 32, 28, ROLE.winner, 'mono', 'center')
        .glow(6, ROLE.winner)
        .opacity(alpha),
    );

    // Mass & invariant ratio readouts cleanly along bottom
    nodes.push(
      txt(
        `Retained mass: ${fmt(totalMass, 3)}${norm > 0.85 ? '  (renormalized to 1.000)' : cut > 0.85 ? '  (0.45 + 0.25 = 0.70)' : '  (full row)'}`,
        0,
        320,
        32,
        norm > 0.85 ? ROLE.valid : ROLE.active,
        'mono',
        'center',
      )
        .glow(6, norm > 0.85 ? ROLE.valid : ROLE.active)
        .opacity(alpha),
    );

    if (rat > 0.15) {
      nodes.push(
        txt(
          'Ratio preserved: 0.45 / 0.25 = 0.643 / 0.357 = 1.80',
          0,
          388,
          28,
          ROLE.winner,
          'mono',
          'center',
        ).opacity(rat * alpha),
      );
    }

    if (shp > 0.2) {
      nodes.push(
        txt(
          'Fixed k = 2 ignores confidence: sharp vs flat rows keep the same count.',
          410,
          -145,
          26,
          ROLE.heat,
          'serif',
          'center',
        ).opacity(shp * alpha),
      );
    }

    return nodes;
  });

  const kEq = glowTex('\\tilde{p}_i = \\frac{p_i}{\\sum_{j \\in S_k} p_j}', {
    x: 495,
    y: -380,
    size: 40,
    color: ROLE.valid,
  });

  s.add(cinemaAtmosphere(ROLE.valid, ROLE.winner), title, kEq, mainLayer);

  playCue(s, c, 'top-k-b1-1', (d) => s.play(cutProgress.to(1, { duration: d })), { dur: 0.9 });
  playCue(s, c, 'top-k-b2-1', (d) => s.play(normProgress.to(1, { duration: d })), { dur: 1.0 });
  playCue(s, c, 'top-k-b2-2', (d) => s.play(showRatio.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'top-k-b3-1', (d) => s.play(showShapeNote.to(1, { duration: d })), { dur: 0.65 });
}
