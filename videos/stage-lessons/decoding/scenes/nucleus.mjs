// Scene 17: nucleus: "Retain enough candidates to reach a mass target"
// Accumulates sorted probabilities toward top-p = 0.80: first two reach 0.70 < 0.80,
// third ("played") crosses to 0.85 >= 0.80 -> renormalizes survivors -> heats T = 1.0 -> 1.7
// to demonstrate why temperature-before-top-p changes the nucleus count.
import { line } from 'vizmatic/stage';
import { COSMOS, glowDot, glowTex, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  BASE,
  ROLE,
  WORDS,
  cinemaAtmosphere,
  decodeSoftmax,
  fmt,
  lumBar,
  nucleus,
  playCue,
} from '../parts.mjs';

export default function nucleusScene(s, c) {
  const title = heroTitle(['Nucleus (top-p):', 'reach the mass target'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.active,
  });

  const accumCount = s.value(1); // 1 -> 2 -> 3
  const showSubtotal = s.value(0);
  const normFrac = s.value(0); // 0 -> 1 renormalizes retained set
  const tempVal = s.value(1.0); // 1.0 -> 1.75 in Beat 2
  const inHeatMode = s.value(0);
  const stageVis = s.value(1);

  const baseLogits = BASE.map(Math.log);

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const T = Math.max(1.0, Math.min(1.8, tempVal.value));
    const probs = decodeSoftmax(baseLogits, T);
    const fullIds = nucleus(probs, 0.8);
    const kShown =
      T > 1.05
        ? fullIds.length
        : Math.min(fullIds.length, Math.round(Math.max(1, accumCount.value)));
    const ids = fullIds.slice(0, kShown);
    const rawSum = ids.reduce((a, id) => a + probs[id], 0);
    const nf = normFrac.value;

    const vals = probs.map((p, i) =>
      nf > 0.02 ? (ids.includes(i) ? p * (1 + nf * (1 / rawSum - 1)) : p * (1 - nf)) : p,
    );

    // Status banner centered cleanly above cumulative gauge (zero overlap with top-right equation!)
    nodes.push(
      txt(
        `T = ${fmt(T, 2)}  ·  top-p = 0.80  ·  ${ids.length} kept`,
        0,
        -292,
        32,
        T > 1.1 ? ROLE.heat : ROLE.active,
        'mono',
        'center',
      )
        .glow(6, T > 1.1 ? ROLE.heat : ROLE.active)
        .opacity(alpha),
    );

    // Cumulative mass gauge bar above the 5 columns
    const gaugeL = -680;
    const gaugeW = 1360;
    const gaugeY = -180;
    const p80X = gaugeL + gaugeW * 0.8;

    nodes.push(
      lumBar(gaugeL + gaugeW / 2, gaugeY, gaugeW, 40, {
        color: '#2b395e',
        fillOpacity: 0.16,
        strokeWidth: 1.6,
        glow: 2,
        radius: 8,
        opacity: alpha,
      }),
      lumBar(
        gaugeL + (gaugeW * Math.min(1, rawSum)) / 2,
        gaugeY,
        Math.max(10, gaugeW * Math.min(1, rawSum)),
        34,
        {
          color: rawSum >= 0.8 ? ROLE.valid : ROLE.active,
          fillOpacity: 0.52,
          strokeWidth: 2.5,
          glow: 11,
          radius: 6,
          opacity: alpha,
        },
      ),
      line([p80X, gaugeY - 34], [p80X, gaugeY + 34], {
        stroke: ROLE.winner,
        width: 4,
        dash: [7, 5],
      })
        .glow(10, ROLE.winner)
        .opacity(alpha),
      glowDot(p80X, gaugeY - 34, { radius: 7, color: ROLE.winner, glow: 12, opacity: alpha }),
      txt('p = 0.80 target', p80X, gaugeY - 62, 26, ROLE.winner, 'mono', 'center').opacity(alpha),
      txt(
        `cumulative mass = ${fmt(rawSum, 3)}${rawSum >= 0.8 ? ' >= 0.80' : ' < 0.80'}`,
        gaugeL,
        gaugeY - 62,
        28,
        rawSum >= 0.8 ? ROLE.valid : ROLE.active,
        'mono',
        'left',
      ).opacity(alpha),
    );

    // 5 luminous vertical bars below
    const baseY = 235;
    const maxH = 330;
    const xs = [-560, -280, 0, 280, 560];
    const barW = 148;
    nodes.push(line([-700, baseY], [700, baseY], { stroke: '#4c6294', width: 2.6 }).opacity(alpha));

    vals.forEach((v, i) => {
      const kept = ids.includes(i);
      const isCross = i === ids.at(-1) && rawSum >= 0.8;
      const col = isCross ? ROLE.winner : kept ? ROLE.valid : COSMOS.dim;
      const h = Math.max(4, v * maxH);
      const itemA = kept ? alpha : Math.max(0.22, 1 - 0.78 * nf) * alpha;

      if (v > 0.004) {
        nodes.push(
          lumBar(xs[i], baseY - h / 2, barW, h, {
            color: col,
            fillOpacity: kept ? 0.46 : 0.16,
            strokeWidth: isCross ? 3.2 : kept ? 2.5 : 1.6,
            glow: isCross ? 13 : kept ? 9 : 2,
            radius: 8,
            opacity: itemA,
          }),
        );
      }
      nodes.push(
        txt(
          fmt(v, 3),
          xs[i],
          baseY - h - 32,
          28,
          kept ? col : COSMOS.muted,
          'mono',
          'center',
        ).opacity(itemA),
        txt(
          WORDS[i],
          xs[i],
          baseY + 42,
          30,
          kept ? COSMOS.ink : COSMOS.dim,
          'serif',
          'center',
        ).opacity(itemA),
      );
    });

    // Bottom informative caption
    let note = 'Sort descending and accumulate until reaching p = 0.80.';
    let noteCol = COSMOS.muted;
    if (inHeatMode.value > 0.2 || T > 1.05) {
      note = 'Heating shifts cumulative sums -> nucleus expands to 4 tokens';
      noteCol = ROLE.heat;
    } else if (showSubtotal.value > 0.4 && nf < 0.5) {
      note = 'First two: 0.45 + 0.25 = 0.70 < 0.80  |  with played: 0.85 >= 0.80';
      noteCol = ROLE.winner;
    } else if (nf >= 0.5) {
      note = 'Renormalize the 3 survivors to unit mass (1.000) before sampling.';
      noteCol = ROLE.valid;
    }

    nodes.push(
      txt(note, 0, 388, 30, noteCol, 'serif', 'center')
        .glow(nf >= 0.5 || T > 1.15 ? 6 : 0, noteCol)
        .opacity(alpha),
    );

    return nodes;
  });

  const nucEq = glowTex('m = \\min\\Big\\{j : \\sum_{i=1}^j P(w_{(i)}) \\ge p\\Big\\}', {
    x: 470,
    y: -385,
    size: 32,
    color: ROLE.winner,
  });

  s.add(cinemaAtmosphere(ROLE.active, ROLE.valid), title, nucEq, mainLayer);

  playCue(s, c, 'nucleus-b1-1', (d) => s.play(accumCount.to(2, { duration: d })), { dur: 0.9 });
  playCue(s, c, 'nucleus-prefix-subtotal', (d) => s.play(showSubtotal.to(1, { duration: d })), {
    dur: 0.55,
  });
  playCue(
    s,
    c,
    'nucleus-b2-1',
    (d) =>
      s.play(accumCount.to(3, { duration: Math.min(0.45, d) }), normFrac.to(1, { duration: d })),
    { after: true, dur: 0.9 },
  );
  playCue(
    s,
    c,
    'nucleus-b3-1',
    (d) =>
      s.play(
        inHeatMode.to(1, { duration: Math.min(0.15, d) }),
        normFrac.to(0, { duration: Math.min(0.3, d) }),
        tempVal.to(1.75, { duration: d }),
      ),
    { dur: 1.2 },
  );
}
